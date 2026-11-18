const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server');

let server;
let baseUrl;
const TEST_PORT = 7001;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      baseUrl = `http://localhost:${TEST_PORT}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => {
    if (server) {
      server.close(resolve);
    } else {
      resolve();
    }
  });
});

describe('Mario Bros 3D Backend API Tests', () => {

  test('GET /api/health should return 200 with ok status and port 7001', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'mario-bros-backend');
    assert.equal(body.port, 7001);
    assert.equal(typeof body.uptimeSeconds, 'number');
    assert.ok(body.timestamp);
  });

  test('CORS: should allow requests from frontend on http://localhost:7000', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: {
        Origin: 'http://localhost:7000'
      }
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:7000');
  });

  test('CORS: should allow requests from frontend on http://127.0.0.1:7000', async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: {
        Origin: 'http://127.0.0.1:7000'
      }
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://127.0.0.1:7000');
  });

  test('GET /api/leaderboard should return sorted scores and total count', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.ok(Array.isArray(body.leaderboard));
    assert.equal(typeof body.total, 'number');

    // Verify descending order
    for (let i = 1; i < body.leaderboard.length; i++) {
      assert.ok(body.leaderboard[i - 1].score >= body.leaderboard[i].score);
    }
  });

  test('GET /api/leaderboard should respect limit parameter', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard?limit=2`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.ok(body.leaderboard.length <= 2);
  });

  test('GET /api/leaderboard should gracefully handle invalid limit parameter', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard?limit=notanumber`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.ok(Array.isArray(body.leaderboard));
    assert.ok(body.leaderboard.length <= 10);
  });

  test('POST /api/leaderboard should submit score successfully with valid data', async () => {
    const payload = {
      playerName: 'PeachTester',
      score: 99999,
      coins: 50,
      world: '1-1',
      timeRemaining: 280
    };

    const res = await fetch(`${baseUrl}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.message, 'Score submitted successfully!');
    assert.ok(body.entry);
    assert.equal(body.entry.playerName, 'PeachTester');
    assert.equal(body.entry.score, 99999);
    assert.equal(body.entry.coins, 50);
    assert.equal(body.rank, 1); // Highest score should be rank 1
    assert.ok(Array.isArray(body.topLeaderboard));
  });

  test('POST /api/leaderboard should reject empty or missing playerName', async () => {
    const payload = {
      playerName: '   ',
      score: 1000
    };

    const res = await fetch(`${baseUrl}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('Player name is required'));
  });

  test('POST /api/leaderboard should sanitize playerName with HTML tags', async () => {
    const payload = {
      playerName: '<script>alert(1)</script>MarioFan',
      score: 500
    };

    const res = await fetch(`${baseUrl}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(!body.entry.playerName.includes('<'));
    assert.ok(!body.entry.playerName.includes('>'));
  });

  test('POST /api/leaderboard should reject negative score', async () => {
    const payload = {
      playerName: 'Bowser',
      score: -50
    };

    const res = await fetch(`${baseUrl}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('Score must be a non-negative number'));
  });

  test('POST /api/leaderboard should reject non-numeric score', async () => {
    const payload = {
      playerName: 'Bowser',
      score: 'infinite'
    };

    const res = await fetch(`${baseUrl}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('Score must be a non-negative number'));
  });

  test('GET /api/levels should return list of levels', async () => {
    const res = await fetch(`${baseUrl}/api/levels`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.ok(Array.isArray(body.levels));
    assert.ok(body.levels.length >= 1);
    const l1 = body.levels.find(l => l.id === '1-1');
    assert.ok(l1);
    assert.equal(l1.theme, 'overworld');
  });

  test('GET /api/levels/1-1 should return level details', async () => {
    const res = await fetch(`${baseUrl}/api/levels/1-1`);
    assert.equal(res.status, 200);

    const level = await res.json();
    assert.equal(level.id, '1-1');
    assert.ok(level.marioStart);
    assert.ok(level.flagPosition);
    assert.ok(level.castlePosition);
  });

  test('GET /api/levels/9-9 should return 404 for nonexistent level', async () => {
    const res = await fetch(`${baseUrl}/api/levels/9-9`);
    assert.equal(res.status, 404);

    const body = await res.json();
    assert.ok(body.error.includes('not found'));
  });

  test('GET /api/unknown-endpoint should return 404', async () => {
    const res = await fetch(`${baseUrl}/api/unknown-endpoint`);
    assert.equal(res.status, 404);

    const body = await res.json();
    assert.ok(body.error);
  });

  test('POST with malformed JSON should return 400 JSON error', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ malformed json: true '
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'Invalid JSON payload received.');
  });
});
