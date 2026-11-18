const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 7001;

// Allowed origins for CORS (frontend running on port 7000, 3000, 5173, etc.)
const allowedOrigins = [
  'http://localhost:7000',
  'http://127.0.0.1:7000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, server-to-server, unit tests)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Dev-friendly fallback
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '1mb' }));

const DATA_DIR = path.join(__dirname, 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const LEVELS_FILE = path.join(DATA_DIR, 'levels.json');

// Helper to safely read JSON
function readJsonFile(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return defaultValue;
  }
}

// Helper to safely write JSON
function writeJsonFile(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
    return false;
  }
}

// Sort comparator: score DESC, coins DESC, timeRemaining DESC
function scoreComparator(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (b.coins !== a.coins) return b.coins - a.coins;
  return (b.timeRemaining || 0) - (a.timeRemaining || 0);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'mario-bros-backend',
    version: '1.0.0',
    port: Number(PORT),
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// GET /api/leaderboard
app.get('/api/leaderboard', (req, res) => {
  let limit = parseInt(req.query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = 10;
  } else if (limit > 100) {
    limit = 100;
  }

  const scores = readJsonFile(LEADERBOARD_FILE, []);
  scores.sort(scoreComparator);

  const worldFilter = req.query.world;
  const filtered = worldFilter
    ? scores.filter(s => s.world === worldFilter)
    : scores;

  const topScores = filtered.slice(0, limit);
  res.json({
    total: filtered.length,
    leaderboard: topScores
  });
});

// POST /api/leaderboard
app.post('/api/leaderboard', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Request body must be a JSON object.' });
  }

  const { playerName, score, coins, world, timeRemaining } = req.body;

  // Validation: playerName
  if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
    return res.status(400).json({ error: 'Player name is required.' });
  }

  const cleanName = playerName.trim().replace(/[<>]/g, '').slice(0, 30);
  if (cleanName.length === 0) {
    return res.status(400).json({ error: 'Player name is invalid.' });
  }

  // Validation: score
  const parsedScore = parseInt(score, 10);
  if (isNaN(parsedScore) || parsedScore < 0) {
    return res.status(400).json({ error: 'Score must be a non-negative number.' });
  }

  // Parse optional numeric fields
  const numericCoins = typeof coins !== 'undefined' ? Math.max(0, parseInt(coins, 10) || 0) : 0;
  const cleanWorld = typeof world === 'string' && world.trim().length > 0 ? world.trim().slice(0, 15) : '1-1';
  const numericTime = typeof timeRemaining !== 'undefined' ? Math.max(0, parseInt(timeRemaining, 10) || 0) : 0;

  const scores = readJsonFile(LEADERBOARD_FILE, []);

  const newEntry = {
    id: `score-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    playerName: cleanName,
    score: parsedScore,
    coins: numericCoins,
    world: cleanWorld,
    timeRemaining: numericTime,
    createdAt: new Date().toISOString()
  };

  scores.push(newEntry);
  scores.sort(scoreComparator);

  // Calculate 1-based rank
  const rank = scores.findIndex(entry => entry.id === newEntry.id) + 1;

  // Persist top 100 scores
  const saved = writeJsonFile(LEADERBOARD_FILE, scores.slice(0, 100));
  if (!saved) {
    return res.status(500).json({ error: 'Failed to persist leaderboard score.' });
  }

  res.status(201).json({
    message: 'Score submitted successfully!',
    entry: newEntry,
    rank,
    topLeaderboard: scores.slice(0, 10)
  });
});

// GET /api/levels
app.get('/api/levels', (req, res) => {
  const data = readJsonFile(LEVELS_FILE, { levels: [] });
  res.json(data);
});

// GET /api/levels/:id
app.get('/api/levels/:id', (req, res) => {
  const data = readJsonFile(LEVELS_FILE, { levels: [] });
  const levels = Array.isArray(data.levels) ? data.levels : [];
  const level = levels.find(l => l.id.toLowerCase() === req.params.id.toLowerCase());
  if (!level) {
    return res.status(404).json({ error: `Level '${req.params.id}' not found.` });
  }
  res.json(level);
});

// Optional static serve if frontend build is copied into public
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint '${req.method} ${req.originalUrl}' not found.` });
});

// Global error handling middleware (handles malformed JSON payloads, etc.)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload received.' });
  }
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Start server when executed directly
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` Mario Bros Backend API running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` Leaderboard:  http://localhost:${PORT}/api/leaderboard`);
    console.log(` Levels:       http://localhost:${PORT}/api/levels`);
    console.log(`===============================================`);
  });

  // Graceful shutdown
  const shutdown = () => {
    server.close(() => {
      console.log('Mario Bros Backend API stopped.');
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = app;
