import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

const container = `sase-chapter-digests-${process.pid}`;
const migration = readFileSync(new URL('../changes/add-chapter-event-digests.sql', import.meta.url), 'utf8');
const first = '00000000-0000-4000-8000-000000000001';
const second = '00000000-0000-4000-8000-000000000002';
const empty = '00000000-0000-4000-8000-000000000003';
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
function claim(group, kind = 'weekly', from = start, until = end) {
    const index = [first, second, empty].indexOf(group) * 2;
    return `public.claim_chapter_digest('${group}', '${kind}', '${from}', '${until}', '1000000000000000${index + 1}', '1000000000000000${index + 2}')`;
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
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, event_type text,
            location text, start_time timestamptz NOT NULL, status text NOT NULL,
            reminded boolean NOT NULL DEFAULT false
        );
        INSERT INTO public.events (title, start_time, status, reminded)
            VALUES ('Existing event', '2026-12-02 05:00+00', 'published', true);
    `);
    sql(migration);
    sql(`
        INSERT INTO public.event_groups VALUES
          ('${first}', 'Tech', '10000000000000001', '10000000000000002'),
          ('${second}', 'General', '10000000000000003', '10000000000000004'),
          ('${empty}', 'Pre-Health', '10000000000000005', '10000000000000006');
        INSERT INTO public.events (id, title, location, start_time, status, event_type) VALUES
          ('00000000-0000-4000-8000-000000000010', 'Second same-start event', 'UCF', '${start}', 'published', 'Workshop - Tech'),
          ('00000000-0000-4000-8000-000000000009', 'First same-start event', 'UCF', '${start}', 'published', 'Workshop - Tech'),
          ('00000000-0000-4000-8000-000000000011', 'Draft', NULL, '2026-12-01 06:00+00', 'draft', 'Workshop - Tech'),
          ('00000000-0000-4000-8000-000000000012', 'Cancelled', NULL, '2026-12-01 06:00+00', 'cancelled', 'Workshop - Tech'),
          ('00000000-0000-4000-8000-000000000013', 'At end boundary', NULL, '${end}', 'published', 'Workshop - Tech'),
          ('00000000-0000-4000-8000-000000000014', 'Before start', NULL, '2026-11-30 04:59:59+00', 'published', 'Workshop - Tech'),
          ('00000000-0000-4000-8000-000000000015', 'Other group', NULL, '2026-12-02 05:00+00', 'published', 'Workshop');
    `);
});

after(() => { if (started) docker(['rm', '-f', container]); });

test(`published groups and chronological half-open windows`, () => {
    assert.deepEqual(JSON.parse(sql('SET ROLE service_role; SELECT public.list_chapter_digest_groups();')).map(group => group.id), [first, second, empty]);
    const stale = claim(first).replace('10000000000000001', '99999999999999999');
    assert.equal(sql(`SET ROLE service_role; SELECT ${stale} IS NULL;`), 't');
    const digest = JSON.parse(sql(`SET ROLE service_role; SELECT ${claim(first)};`));
    assert.deepEqual(digest.events.map(event => event.title), ['First same-start event', 'Second same-start event']);
    assert.equal(digest.discord_channel_id, '10000000000000001');
    assert.equal(digest.discord_role_id, '10000000000000002');
    assert.equal(sql(`SET ROLE service_role; SELECT ${claim(empty)} IS NULL;`), 't');
    assert.equal(sql(`SELECT count(*) FROM public.chapter_digest_deliveries WHERE event_group_id = '${empty}';`), '0');
    assert.equal(sql("SELECT reminded FROM public.events WHERE title = 'Existing event';"), 't');
});

test('two workers claim once, including after acknowledgement and restart', async () => {
    const results = await Promise.all([
        parallelSql(`BEGIN; SET ROLE service_role; SELECT ${claim(second)} IS NOT NULL; SELECT pg_sleep(1); COMMIT;`),
        parallelSql(`SET ROLE service_role; SELECT ${claim(second)} IS NOT NULL;`),
    ]);
    assert.deepEqual(results.sort(), ['f', 't']);
    assert.equal(sql(`SET ROLE service_role; SELECT ${claim(second)} IS NULL;`), 't');
    assert.equal(sql(`SET ROLE service_role; SELECT public.finish_chapter_digest('${second}', 'weekly', '${start}');`), 't');
    assert.equal(sql(`SET ROLE service_role; SELECT ${claim(second)} IS NULL;`), 't');
    assert.equal(sql(`SELECT delivered_at IS NOT NULL FROM public.chapter_digest_deliveries WHERE event_group_id = '${second}';`), 't');
});

test('separate digest kinds and start dates have independent delivery records', () => {
    assert.equal(sql(`SET ROLE service_role; SELECT ${claim(first, 'daily', start, '2026-12-01 05:00+00')} IS NOT NULL;`), 't');
    assert.equal(sql(`SET ROLE service_role; SELECT ${claim(first, 'daily', end, '2026-12-08 05:00+00')} IS NOT NULL;`), 't');
});

test('group configuration is admin-only and delivery state is service-RPC-only', () => {
    assert.throws(() => sql('SET ROLE anon; SELECT * FROM public.event_groups;'), /permission denied/);
    assert.equal(sql('SET ROLE authenticated; SELECT count(*) FROM public.event_groups;'), '0');
    assert.throws(() => sql("SET ROLE authenticated; INSERT INTO public.event_groups (name, discord_channel_id, discord_role_id) VALUES ('X', '10000000000000001', '10000000000000002');"), /row-level security/);
    assert.equal(sql(`SET ROLE authenticated; SET test.admin = 'true'; UPDATE public.event_groups SET discord_role_id = '10000000000000002' WHERE id = '${first}' RETURNING name;`), 'Tech');
    assert.throws(() => sql(`SET ROLE authenticated; SET test.admin = 'true'; SELECT ${claim(first)};`), /permission denied/);
    assert.throws(() => sql('SET ROLE service_role; SELECT * FROM public.chapter_digest_deliveries;'), /permission denied/);
});

test('routes every workshop subcategory and sends other event types to General', () => {
    const pro = '00000000-0000-4000-8000-000000000004';
    sql(`INSERT INTO public.event_groups VALUES ('${pro}', 'Pro-Dev', '10000000000000007', '10000000000000008');
        INSERT INTO public.events (title, event_type, status, start_time)
        SELECT t, t, 'published', '2027-01-05 15:00+00' FROM unnest(ARRAY[
          'Workshop - Tech', 'Workshop - Pro-Dev', 'Workshop - Pre-Health', 'Workshop', 'General Body Meeting'
        ]) AS t;`);
    for (const [group, channel, role, expected] of [
        [first, 1, 2, ['Workshop - Tech']], [pro, 7, 8, ['Workshop - Pro-Dev']],
        [empty, 5, 6, ['Workshop - Pre-Health']], [second, 3, 4, ['General Body Meeting', 'Workshop']],
    ]) {
        const digest = JSON.parse(sql(`SELECT public.claim_chapter_digest('${group}', 'daily',
          '2027-01-05 05:00+00', '2027-01-06 05:00+00', '1000000000000000${channel}', '1000000000000000${role}');`));
        assert.deepEqual(digest.events.map(event => event.title).sort(), expected);
    }
});

test('service, social and fundraiser event types use their own channel', () => {
    const routes = [['Service', 'Service'], ['Social', 'Socials'], ['Fundraiser', 'Fundraisers']];
    for (const [eventType, audience] of routes) {
        sql(`INSERT INTO public.events (title, event_type, status, start_time)
            VALUES ('${eventType} event', '${eventType}', 'published', '2027-02-01 15:00+00');`);
        sql(`INSERT INTO public.event_groups (name, discord_channel_id, discord_role_id)
            VALUES ('${audience}', '10000000000000011', '10000000000000012');`);
    }
    for (const [eventType, audience] of routes) {
        const digest = JSON.parse(sql(`SELECT public.claim_chapter_digest(id, 'daily',
            '2027-02-01 05:00+00', '2027-02-02 05:00+00', discord_channel_id, discord_role_id)
            FROM public.event_groups WHERE name = '${audience}';`));
        assert.deepEqual(digest.events.map(event => event.title), [eventType + ' event']);
    }
});
