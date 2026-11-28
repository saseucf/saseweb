import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

const container = `sase-chapter-digests-${process.pid}`;
const migration = readFileSync(new URL('../changes/add-chapter-event-digests.sql', import.meta.url), 'utf8');
const start = '2026-11-30 05:00+00';
const end = '2026-12-07 05:00+00';

let started = false;
function docker(args, input) {
    const result = spawnSync('docker', args, { input, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.error?.message || result.stderr || result.stdout);
    return result.stdout.trim();
}
function psqlArgs(database) {
    return ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1', '-Atq'];
}
function sql(input, database = 'postgres') {
    return docker(psqlArgs(database), input);
}
function service(input) {
    return sql(`SET ROLE service_role; ${input}`);
}
function parallelSql(input) {
    return new Promise((resolve, reject) => {
        const child = spawn('docker', psqlArgs('postgres'));
        let stdout = '', stderr = '';
        child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
        child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
        child.on('error', reject);
        child.on('exit', code => {
            if (code === 0) resolve(stdout.trim());
            else reject(new Error(stderr));
        });
        child.stdin.end(input);
    });
}
function claim(kind = 'weekly', from = start, until = end) {
    return `public.claim_chapter_digest('${kind}', '${from}', '${until}')`;
}
function finish(kind = 'weekly', from = start) {
    return `public.finish_chapter_digest('${kind}', '${from}')`;
}

before(async () => {
    docker(['run', '--rm', '-d', '--name', container, '-e', 'POSTGRES_PASSWORD=disposable-test-only', 'postgres:18']);
    started = true;
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
        const result = spawnSync('docker', ['exec', container, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres']);
        if (result.status === 0) { ready = true; break; }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    assert.ok(ready, 'disposable Postgres started');
    sql(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;`);
    sql(`
        CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql AS $$
            SELECT current_setting('test.admin', true) = 'true';
        $$;
        GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
        CREATE TABLE public.events (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, event_type text NOT NULL,
            location text, start_time timestamptz NOT NULL, status text NOT NULL,
            reminded boolean NOT NULL DEFAULT false
        );
        INSERT INTO public.events (title, event_type, start_time, status, reminded)
            VALUES ('Existing event', 'GBM', '2026-12-02 05:00+00', 'published', true);
    `);
    sql(migration);
    // One event of every type in the week, plus rows that must be excluded.
    sql(`
        INSERT INTO public.events (id, title, event_type, location, start_time, status) VALUES
          ('00000000-0000-4000-8000-000000000010', 'Second same-start event', 'Workshop - Tech', 'UCF', '${start}', 'published'),
          ('00000000-0000-4000-8000-000000000009', 'First same-start event', 'Service', 'UCF', '${start}', 'published'),
          ('00000000-0000-4000-8000-000000000020', 'Pre-Health workshop', 'Workshop - Pre-Health', NULL, '2026-12-03 15:00+00', 'published'),
          ('00000000-0000-4000-8000-000000000021', 'Social night', 'Social', NULL, '2026-12-01 23:00+00', 'published'),
          ('00000000-0000-4000-8000-000000000022', 'Fundraiser', 'Fundraiser', NULL, '2026-12-04 23:00+00', 'published'),
          ('00000000-0000-4000-8000-000000000023', 'Pro-Dev workshop', 'Workshop - Pro-Dev', NULL, '2026-12-05 15:00+00', 'published'),
          ('00000000-0000-4000-8000-000000000024', 'Last minute of week', 'Workshop', NULL, '2026-12-07 04:59:59+00', 'published'),
          ('00000000-0000-4000-8000-000000000011', 'Draft', 'GBM', NULL, '2026-12-01 06:00+00', 'draft'),
          ('00000000-0000-4000-8000-000000000012', 'Cancelled', 'GBM', NULL, '2026-12-01 06:00+00', 'cancelled'),
          ('00000000-0000-4000-8000-000000000013', 'At end boundary', 'GBM', NULL, '${end}', 'published'),
          ('00000000-0000-4000-8000-000000000014', 'Before start', 'GBM', NULL, '2026-11-30 04:59:59+00', 'published');
    `);
});

after(() => { if (started) docker(['rm', '-f', container]); });

test('the migration replaces per-audience routing with one kind/window digest', () => {
    assert.equal(sql(`SELECT to_regprocedure('public.claim_chapter_digest(text, timestamptz, timestamptz)') IS NOT NULL;`), 't');
    assert.equal(sql(`SELECT to_regprocedure('public.finish_chapter_digest(text, timestamptz)') IS NOT NULL;`), 't');
    assert.equal(sql(`SELECT count(*) FROM pg_proc WHERE proname IN ('claim_chapter_digest', 'finish_chapter_digest');`), '2');
    assert.equal(sql(`SELECT count(*) FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'chapter_digest_deliveries' AND column_name = 'audience';`), '0');
    assert.equal(sql(`SELECT string_agg(a.attname, ',' ORDER BY array_position(i.indkey, a.attnum))
        FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = 'public.chapter_digest_deliveries'::regclass AND i.indisprimary;`), 'kind,window_start');
});

test('one combined digest holds every published event type, sorted, in a half-open window', () => {
    const digest = JSON.parse(service(`SELECT ${claim()};`));
    assert.deepEqual(digest.map(event => event.title), [
        'First same-start event', 'Second same-start event', 'Social night', 'Existing event',
        'Pre-Health workshop', 'Fundraiser', 'Pro-Dev workshop', 'Last minute of week',
    ]);
    assert.deepEqual(Object.keys(digest[0]).sort(), ['id', 'location', 'start_time', 'title']);
    assert.equal(sql(`SELECT count(*) FROM public.chapter_digest_deliveries;`), '1');
    assert.equal(sql("SELECT reminded FROM public.events WHERE title = 'Existing event';"), 't');
});

test('an empty window claims nothing so a later event can still be announced', () => {
    const from = '2028-01-03 05:00+00', until = '2028-01-04 05:00+00';
    assert.equal(service(`SELECT ${claim('daily', from, until)} IS NULL;`), 't');
    assert.equal(sql(`SELECT count(*) FROM public.chapter_digest_deliveries WHERE window_start = '${from}';`), '0');
    sql(`INSERT INTO public.events (title, event_type, status, start_time) VALUES ('Late add', 'GBM', 'published', '2028-01-03 15:00+00');`);
    assert.deepEqual(JSON.parse(service(`SELECT ${claim('daily', from, until)};`)).map(e => e.title), ['Late add']);
});

test('two workers claim a window once, including after acknowledgement and restart', async () => {
    const from = '2027-01-05 05:00+00', until = '2027-01-06 05:00+00';
    sql(`INSERT INTO public.events (title, event_type, status, start_time) VALUES ('Race', 'Social', 'published', '2027-01-05 15:00+00');`);
    const results = await Promise.all([
        parallelSql(`BEGIN; SET ROLE service_role; SELECT ${claim('daily', from, until)} IS NOT NULL; SELECT pg_sleep(1); COMMIT;`),
        parallelSql(`SET ROLE service_role; SELECT ${claim('daily', from, until)} IS NOT NULL;`),
    ]);
    assert.deepEqual(results.sort(), ['f', 't']);
    assert.equal(service(`SELECT ${claim('daily', from, until)} IS NULL;`), 't');
    assert.equal(service(`SELECT ${finish('daily', from)};`), 't');
    assert.equal(service(`SELECT ${finish('daily', from)};`), 't');
    assert.equal(service(`SELECT ${claim('daily', from, until)} IS NULL;`), 't');
    assert.equal(sql(`SELECT count(*) FROM public.chapter_digest_deliveries WHERE window_start = '${from}' AND delivered_at IS NOT NULL;`), '1');
});

test('finishing an unclaimed window reports no match', () => {
    assert.equal(service(`SELECT ${finish('weekly', '2030-01-07 05:00+00')};`), 'f');
});

test('daily and weekly digests over the same start are independent claims', () => {
    // The weekly window at ${start} is already claimed above; the daily one is not.
    assert.equal(service(`SELECT ${claim('weekly')} IS NULL;`), 't');
    const daily = JSON.parse(service(`SELECT ${claim('daily', start, '2026-12-01 05:00+00')};`));
    assert.deepEqual(daily.map(e => e.title), ['First same-start event', 'Second same-start event']);
    assert.equal(service(`SELECT ${claim('daily', '2026-12-01 05:00+00', '2026-12-02 05:00+00')} IS NOT NULL;`), 't');
});

test('only daily and weekly are accepted', () => {
    assert.throws(() => service(`SELECT ${claim('monthly')};`), /check constraint/);
});

test('delivery claims are service-only', () => {
    for (const role of ['anon', 'authenticated']) {
        assert.throws(() => sql(`SET ROLE ${role}; SET test.admin = 'true'; SELECT ${claim('weekly', '2031-01-06 05:00+00', '2031-01-13 05:00+00')};`), /permission denied/);
        assert.throws(() => sql(`SET ROLE ${role}; SELECT ${finish()};`), /permission denied/);
    }
    assert.throws(() => service('SELECT * FROM public.chapter_digest_deliveries;'), /permission denied/);
    assert.throws(() => service(`DELETE FROM public.chapter_digest_deliveries;`), /permission denied/);
});
