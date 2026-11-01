/**
 * Standalone API Test Runner for Vercel Serverless Functions.
 * Tests:
 * 1. Time Capsule (F2): locked text refusal, test-override unlock, input validation, duplicate seal rejection.
 * 2. Constellation Stars (F3): 1 star per day rate limit, 90 char limit, auth checks.
 * 3. Reasons Jar (F13): locked vs unlocked filter, owner auth check.
 */

import http from 'node:http';
import capsuleHandler from '../api/capsule.ts';
import starsHandler from '../api/stars.ts';
import reasonsHandler from '../api/reasons.ts';

// Mock request / response helpers
function createMockReq(method, path, body = null, headers = {}) {
  const req = new http.IncomingMessage(null);
  req.method = method;
  req.url = path;
  req.headers = { 'content-type': 'application/json', ...headers };
  req.body = body;
  req.socket = { remoteAddress: '127.0.0.1' };
  return req;
}

function createMockRes() {
  const res = new http.ServerResponse({ method: 'GET' });
  let statusCode = 200;
  let responseData = null;

  res.status = (code) => {
    statusCode = code;
    return res;
  };
  res.json = (data) => {
    responseData = data;
    return res;
  };

  return {
    res,
    getStatusCode: () => statusCode,
    getData: () => responseData,
  };
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('--- RUNNING API SECURITY & FUNCTIONALITY TESTS ---');
  process.env.NAZ_KEY = 'test_naz_key';
  process.env.OWNER_KEY = 'test_owner_key';

  // TEST 1: Capsule validation - reject empty text
  {
    const { res, getStatusCode, getData } = createMockRes();
    const req = createMockReq('POST', '/api/capsule', { author: 'naz', text: '   ' }, { 'x-naz-key': 'test_naz_key' });
    await capsuleHandler(req, res);
    assert(getStatusCode() === 400, 'POST /api/capsule rejects empty message (400)');
  }

  // TEST 2: Capsule validation - reject > 1000 characters
  {
    const { res, getStatusCode } = createMockRes();
    const longText = 'a'.repeat(1005);
    const req = createMockReq('POST', '/api/capsule', { author: 'naz', text: longText }, { 'x-naz-key': 'test_naz_key' });
    await capsuleHandler(req, res);
    assert(getStatusCode() === 400, 'POST /api/capsule rejects > 1000 chars (400)');
  }

  // TEST 3: Capsule auth - wrong key
  {
    const { res, getStatusCode } = createMockRes();
    const req = createMockReq('POST', '/api/capsule', { author: 'naz', text: 'hello future' }, { 'x-naz-key': 'wrong_key' });
    await capsuleHandler(req, res);
    assert(getStatusCode() === 401, 'POST /api/capsule rejects wrong key (401)');
  }

  // TEST 4: Capsule seal - valid seal
  {
    const { res, getStatusCode, getData } = createMockRes();
    const req = createMockReq('POST', '/api/capsule', { author: 'naz', text: 'dear 19-year-old me, be happy!' }, { 'x-naz-key': 'test_naz_key' });
    await capsuleHandler(req, res);
    assert(getStatusCode() === 200 && getData().locked === true, 'POST /api/capsule seals message successfully');
  }

  // TEST 5: Capsule - reject second write (cannot be rewritten)
  {
    const { res, getStatusCode } = createMockRes();
    const req = createMockReq('POST', '/api/capsule', { author: 'naz', text: 'trying to overwrite!' }, { 'x-naz-key': 'test_naz_key' });
    await capsuleHandler(req, res);
    assert(getStatusCode() === 409, 'POST /api/capsule rejects second seal (409 conflict)');
  }

  // TEST 6: Capsule GET before unlock time MUST NOT return sealed text!
  {
    process.env.TEST_UNLOCK_OVERRIDE = 'false';
    const { res, getStatusCode, getData } = createMockRes();
    const req = createMockReq('GET', '/api/capsule');
    await capsuleHandler(req, res);
    const nazCapsule = getData().capsules?.naz;
    assert(
      getStatusCode() === 200 &&
      nazCapsule.locked === true &&
      nazCapsule.text === undefined,
      'GET /api/capsule REFUSES to return sealed text before unlock time (locked: true, text: undefined)'
    );
  }

  // TEST 7: Capsule GET with TEST_UNLOCK_OVERRIDE returns text for testing
  {
    process.env.TEST_UNLOCK_OVERRIDE = 'true';
    const { res, getStatusCode, getData } = createMockRes();
    const req = createMockReq('GET', '/api/capsule');
    await capsuleHandler(req, res);
    const nazCapsule = getData().capsules?.naz;
    assert(
      getStatusCode() === 200 &&
      nazCapsule.locked === false &&
      nazCapsule.text === 'dear 19-year-old me, be happy!',
      'GET /api/capsule with TEST_UNLOCK_OVERRIDE successfully reveals text'
    );
    process.env.TEST_UNLOCK_OVERRIDE = 'false';
  }

  // TEST 8: Constellation Stars - add a star
  {
    const { res, getStatusCode, getData } = createMockRes();
    const req = createMockReq('POST', '/api/stars', { author: 'naz', text: 'dancing in the kitchen' }, { 'x-naz-key': 'test_naz_key' });
    await starsHandler(req, res);
    assert(getStatusCode() === 200 && getData().success === true, 'POST /api/stars adds a star');
  }

  // TEST 9: Constellation Stars - enforce 1 star per author per day
  {
    const { res, getStatusCode } = createMockRes();
    const req = createMockReq('POST', '/api/stars', { author: 'naz', text: 'another star today' }, { 'x-naz-key': 'test_naz_key' });
    await starsHandler(req, res);
    assert(getStatusCode() === 429, 'POST /api/stars enforces 1 star per author per day (429)');
  }

  // TEST 10: Constellation Stars - reject > 90 chars
  {
    const { res, getStatusCode } = createMockRes();
    const longText = 'x'.repeat(95);
    const req = createMockReq('POST', '/api/stars', { author: 'mr. naz', text: longText }, { 'x-owner-key': 'test_owner_key' });
    await starsHandler(req, res);
    assert(getStatusCode() === 400, 'POST /api/stars rejects text > 90 chars (400)');
  }

  // TEST 11: Reasons Jar - GET returns list
  {
    const { res, getStatusCode, getData } = createMockRes();
    const req = createMockReq('GET', '/api/reasons');
    await reasonsHandler(req, res);
    assert(getStatusCode() === 200 && Array.isArray(getData().unlocked), 'GET /api/reasons returns reasons list');
  }

  // TEST 12: Reasons Jar - POST requires owner key
  {
    const { res, getStatusCode } = createMockRes();
    const req = createMockReq('POST', '/api/reasons', { text: 'new secret', unlockAt: '2027-01-01T00:00:00Z' }, { 'x-owner-key': 'wrong_key' });
    await reasonsHandler(req, res);
    assert(getStatusCode() === 401, 'POST /api/reasons rejects non-owner write (401)');
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runTests();
