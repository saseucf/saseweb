import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

// Disposable local Postgres only. No connection strings or production credentials.
const container = `sase-reminder-tests-${process.pid}`;
function docker(args, input) {
    const result = spawnSync('docker', args, { input, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout);
    return result.stdout.trim();
}
function sql(input) { return docker(['exec', '-i', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-Atq'], input); }
const now = '2027-03-06 12:00:00+00';
const h = '00000000-0000-4000-8000-000000000001';
const e = '00000000-0000-4000-8000-000000000002';
const claim = `public.claim_hackathon_reminder('${now}')`;
function reset() {
    sql(`TRUNCATE public.events CASCADE; UPDATE hackathons SET discord_channel_id='12345678901234567', discord_role_id='12345678901234568';
    INSERT INTO events(id,title,description,event_type,location,start_time,end_time,status,hackathon_id)
    VALUES('${e}','Workshop','Build','Workshop','UCF','2027-03-06 13:00+00','2027-03-06 14:00+00','published','${h}');`);
}
before(async () => {
    docker(['run', '--rm', '-d', '--name', container, '-e', 'POSTGRES_PASSWORD=disposable-test-only', 'postgres:18']);
    for (let attempt = 0; attempt < 40; attempt++) {
        const ready = spawnSync('docker', ['exec', container, 'pg_isready', '-U', 'postgres']);
        if (ready.status === 0) break;
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    sql(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql AS 'SELECT current_setting(''test.admin'',true) = ''true''';
    CREATE TABLE public.events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),title text NOT NULL,description text,event_type text,
        location text,start_time timestamptz NOT NULL,end_time timestamptz NOT NULL,status text NOT NULL,reminded boolean DEFAULT false);
    GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;`);
    sql(readFileSync(new URL('../changes/add-hackathon-reminders.sql', import.meta.url), 'utf8'));
    sql(`UPDATE hackathons SET id='${h}' WHERE slug='lumahacks-2027';`);
});
after(() => { docker(['rm', '-f', container]); });

test('one-hour boundary and late catch-up; exclude started, drafts, cancelled, and chapter events', () => {
    for (const [change, eligible] of [
        ['', true], ["start_time='2027-03-06 13:00:01+00'", false],
        ["start_time='2027-03-06 12:01+00'", true], ["start_time='2027-03-06 12:00+00'", false],
        ["status='draft'", false], ["status='cancelled'", false], ['hackathon_id=NULL', false],
    ]) {
        reset(); if (change) sql(`UPDATE events SET ${change};`);
        assert.equal(sql(`SELECT ${claim} IS NOT NULL;`), eligible ? 't' : 'f', change);
    }
});
test('missing channel or role skips without creating a delivery', () => {
    for (const field of ['discord_channel_id', 'discord_role_id']) {
        reset(); sql(`UPDATE hackathons SET ${field}=NULL;`);
        assert.equal(sql(`SELECT ${claim} IS NULL;`), 't');
        assert.equal(sql('SELECT count(*) FROM event_reminder_deliveries;'), '0');
    }
});
test('delivered and unknown reminders never resend, including after reschedule', () => {
    for (const state of ['delivered','unknown']) {
        reset(); sql(`SELECT ${claim}; UPDATE event_reminder_deliveries SET state='${state}';
            UPDATE events SET start_time='2027-03-06 12:30+00',title='Edited';`);
        assert.equal(sql(`SELECT ${claim} IS NULL;`), 't');
        assert.equal(sql('SELECT attempt_count FROM event_reminder_deliveries;'), '1');
    }
});
test('expired claims become unknown; active claims cannot be reclaimed', () => {
    reset(); sql(`SELECT ${claim};`);
    assert.equal(sql(`SELECT ${claim} IS NULL; SELECT state FROM event_reminder_deliveries;`), 't\ndelivering');
    sql(`SELECT public.claim_hackathon_reminder('2027-03-06 12:00:30+00');`);
    assert.equal(sql('SELECT state FROM event_reminder_deliveries;'), 'unknown');
});
test('pending snapshots follow edits and configuration changes before first attempt', () => {
    reset(); sql(`SELECT ${claim}; UPDATE event_reminder_deliveries SET state='pending',attempt_count=0,locked_at=NULL;
        UPDATE events SET title='New title',start_time='2027-03-06 12:45+00';
        UPDATE hackathons SET discord_channel_id='22345678901234567';`);
    const row=JSON.parse(sql(`SELECT ${claim};`));
    assert.equal(row.content_snapshot.title,'New title');
    assert.equal(row.channel_id_snapshot,'22345678901234567');
    assert.equal(row.attempt_count,1);
});
test('failed deliveries wait five minutes, retry only while eligible, and revalidate cancellation', () => {
    reset(); sql(`SELECT ${claim};
        SELECT finish_hackathon_reminder(id,'failed','discord_403') FROM event_reminder_deliveries;`);
    assert.equal(sql("SELECT next_attempt_at BETWEEN now()+interval '4 minutes 55 seconds' AND now()+interval '5 minutes 5 seconds' FROM event_reminder_deliveries;"),'t');
    sql("UPDATE event_reminder_deliveries SET next_attempt_at='2027-03-06 12:05+00';");
    assert.equal(sql(`SELECT ${claim} IS NULL;`),'t');
    assert.equal(sql("SELECT public.claim_hackathon_reminder('2027-03-06 12:05+00') IS NOT NULL;"),'t');
    sql("UPDATE event_reminder_deliveries SET state='failed',next_attempt_at='2027-03-06 12:06+00'; UPDATE events SET status='cancelled';");
    assert.equal(sql("SELECT public.claim_hackathon_reminder('2027-03-06 12:07+00') IS NULL;"),'t');
    sql("UPDATE events SET status='published';");
    assert.equal(sql("SELECT public.claim_hackathon_reminder('2027-03-06 13:00+00') IS NULL;"),'t');
});
test('edits after failed attempt require operator review rather than sending stale content', () => {
    reset();sql(`SELECT ${claim}; UPDATE event_reminder_deliveries SET state='failed',next_attempt_at='2027-03-06 11:59+00'; UPDATE events SET title='Changed';`);
    assert.equal(sql(`SELECT ${claim} IS NULL; SELECT state FROM event_reminder_deliveries;`),'t\nunknown');
});
test('late completion cannot overwrite quarantined state', () => {
    reset();sql(`SELECT ${claim}; UPDATE event_reminder_deliveries SET state='unknown';`);
    assert.equal(sql("SELECT finish_hackathon_reminder(id,'delivered',NULL,'message-id') FROM event_reminder_deliveries;"),'f');
});
test('anonymous and authenticated users have no delivery or RPC access; admin-only hackathon access', () => {
    reset();
    for (const role of ['anon','authenticated']) {
        for (const query of ['SELECT * FROM event_reminder_deliveries', "UPDATE event_reminder_deliveries SET state='pending'", `SELECT ${claim}`, "SELECT finish_hackathon_reminder(gen_random_uuid(),'delivered')"]) {
            assert.throws(() => sql(`SET ROLE ${role}; ${query};`), /permission denied/);
        }
    }
    assert.throws(() => sql('SET ROLE anon; SELECT * FROM hackathons;'), /permission denied/);
    assert.equal(sql('SET ROLE authenticated; SELECT count(*) FROM hackathons;'),'0');
    assert.equal(sql("SET ROLE authenticated; SET test.admin='true'; SELECT count(*) FROM hackathons;"),'1');
    assert.equal(sql(`SET ROLE service_role; SELECT ${claim} IS NOT NULL;`),'t');
});
test('two concurrent transactions cannot claim the same event', async () => {
    reset();
    const run = input => new Promise((resolve,reject) => {
        const child=spawn('docker',['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1']);
        let out='',err='';child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>err+=d);
        child.on('error',reject);child.on('close',code=>code ? reject(new Error(err)) : resolve(out.trim()));
        child.stdin.end(input);
    });
    const results=await Promise.all([run(`BEGIN; SELECT ${claim} IS NOT NULL; SELECT pg_sleep(1); COMMIT;`),run(`BEGIN; SELECT ${claim} IS NOT NULL; SELECT pg_sleep(1); COMMIT;`)]);
    assert.deepEqual(results.sort(),['f','t']);
    assert.equal(sql('SELECT count(*),max(attempt_count) FROM event_reminder_deliveries;'),'1|1');
});
