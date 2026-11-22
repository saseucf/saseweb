import test from 'node:test';
import assert from 'node:assert/strict';
import { applicationWindow, countdown, qrToken, webUrl, dateOnly, dateRange } from '../lib/hackathon/portal';

test('applications open only in the published window, including the final instant',()=>{
  const event={is_published:true,applications_open_at:'2027-01-01T00:00:00Z',applications_close_at:'2027-01-02T00:00:00Z'};
  assert.equal(applicationWindow(event,Date.parse('2026-12-31T23:59:59Z')),'upcoming');
  assert.equal(applicationWindow(event,Date.parse(event.applications_open_at)),'open');
  assert.equal(applicationWindow(event,Date.parse(event.applications_close_at)),'open');
  assert.equal(applicationWindow(event,Date.parse(event.applications_close_at)+1),'closed');
  assert.equal(applicationWindow({...event,is_published:false},Date.parse(event.applications_open_at)),'upcoming');
});
test('countdown transitions from upcoming to hacking to ended without negative times',()=>{
  const event={hacking_starts_at:'2027-01-01T00:00:00Z',hacking_ends_at:'2027-01-02T12:00:00Z'};
  assert.deepEqual(countdown(event,Date.parse('2026-12-31T00:00:00Z')),{label:'Hacking starts in',value:'1d 00:00:00'});
  assert.deepEqual(countdown(event,Date.parse(event.hacking_starts_at)),{label:'Time left to build',value:'1d 12:00:00'});
  assert.deepEqual(countdown(event,Date.parse(event.hacking_ends_at)+1000),{label:'Hacking has ended',value:'00:00:00'});
});
test('organizer links cannot execute scripts or access local files',()=>{
  for(const url of ['javascript:alert(1)','data:text/html,hi','file:///etc/passwd','//evil.example',null,''])assert.equal(webUrl(url),undefined);
  assert.equal(webUrl('https://example.com/guide'),'https://example.com/guide');
});
test('scanner accepts only UUID tokens and never a URL or serialized personal data',()=>{
  const token='10000000-0000-0000-0000-000000000001';
  assert.equal(qrToken(` ${token} `),token);
  for(const value of ['https://example.com/'+token,'{"email":"hacker@example.com"}','',token+'x'])assert.equal(qrToken(value),null);
});
test('date-only announcements preserve the confirmed calendar date without inventing a time',()=>{
  assert.equal(dateOnly('2027-02-15'),'February 15, 2027');
  assert.match(dateRange('2027-03-06','2027-03-07'),/March 6.*7, 2027/);
  assert.equal(dateRange('invalid','2027-03-07'),'Dates announced soon');
});
