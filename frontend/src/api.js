// Frontend API Client for Mario Bros Backend

const API_BASE = 'http://localhost:7001/api';
const LOCAL_STORAGE_KEY = 'mario_bros_local_leaderboard';

// Local storage fallback helper
function getLocalScores() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [
        { id: 'local-1', playerName: 'Mario', score: 12500, coins: 24, world: '1-1', timeRemaining: 215 },
        { id: 'local-2', playerName: 'Luigi', score: 9800, coins: 18, world: '1-1', timeRemaining: 180 },
        { id: 'local-3', playerName: 'Peach', score: 8400, coins: 15, world: '1-1', timeRemaining: 195 }
      ];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveLocalScore(entry) {
  const scores = getLocalScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scores.slice(0, 50)));
  const rank = scores.findIndex(s => s.id === entry.id) + 1;
  return { rank, topLeaderboard: scores.slice(0, 10) };
}

export async function checkBackendStatus() {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function getLeaderboard(limit = 10) {
  try {
    const res = await fetch(`${API_BASE}/leaderboard?limit=${limit}`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    return { isOnline: true, list: data.leaderboard };
  } catch (err) {
    console.warn('Backend unavailable, using local scores:', err.message);
    const local = getLocalScores().slice(0, limit);
    return { isOnline: false, list: local };
  }
}

export async function submitLeaderboardScore(payload) {
  try {
    const res = await fetch(`${API_BASE}/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) throw new Error('Failed to submit score to server');
    const data = await res.json();
    return { success: true, rank: data.rank, top: data.topLeaderboard };
  } catch (err) {
    console.warn('Failed to submit to server, storing locally:', err.message);
    const localEntry = {
      id: `local-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString()
    };
    const { rank, topLeaderboard } = saveLocalScore(localEntry);
    return { success: true, rank, top: topLeaderboard, offline: true };
  }
}
