# Mario Bros 3D - Backend API Server

REST API server built with Express.js for the Super Mario Bros 3D game. Manages player leaderboards, score persistence, level configuration, and server health.

## Port Configuration
- **Default Port**: `7001` (can be overridden via `PORT` environment variable)
- **Frontend Origin**: Supports `http://localhost:7000`, `http://127.0.0.1:7000` with CORS enabled.

## API Endpoints

### 1. Health Check
- **`GET /api/health`**
- Returns server status, version, uptime, and active port.

### 2. Leaderboard
- **`GET /api/leaderboard?limit=10&world=1-1`**
  - Fetches top scores sorted by score DESC, coins DESC, timeRemaining DESC.
  - Query parameter `limit`: number of results (1-100, default 10).
  - Query parameter `world`: optional filter by world.
- **`POST /api/leaderboard`**
  - Submits a new player score.
  - **Body (JSON)**:
    ```json
    {
      "playerName": "Mario",
      "score": 12500,
      "coins": 24,
      "world": "1-1",
      "timeRemaining": 215
    }
    ```
  - **Response (201)**: Returns the saved entry, player's calculated leaderboard rank, and top 10 leaderboard entries.

### 3. Levels
- **`GET /api/levels`**
  - Returns array of all available game levels and their configurations.
- **`GET /api/levels/:id`**
  - Returns level data for a specific level ID (e.g., `1-1`, `1-2`).

## Running the Server

```bash
# Install dependencies
npm install

# Start production server (Port 7001)
npm start

# Start development mode with hot-reload
npm run dev

# Run automated test suite
npm test
```
