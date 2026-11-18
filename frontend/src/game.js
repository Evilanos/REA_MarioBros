import * as THREE from 'three';
import { Mario } from './mario.js';
import { Level } from './level.js';
import { Goomba } from './enemies.js';
import { audio } from './audio.js';
import { getLeaderboard, submitLeaderboardScore, checkBackendStatus } from './api.js';

export class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    
    // Game Stats
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.time = 300;
    this.world = '1-1';
    this.state = 'PLAYING'; // PLAYING, VICTORY, GAMEOVER
    this.timeTimer = 0;

    // Inputs
    this.input = {
      left: false,
      right: false,
      jump: false,
      run: false
    };

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Entities
    this.mario = null;
    this.level = null;
    this.enemies = [];
    this.floatingTexts = [];

    this.startPosition = { x: 0, y: 3, z: 0 };

    this.initThree();
    this.initLevel();
    this.initEnemies();
    this.initMario();
    this.initInputs();
    this.initUI();

    // Start loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x5c94fc);
    this.scene.fog = new THREE.Fog(0x5c94fc, 40, 120);

    // Camera (Isometric side-scroller angle)
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.camera.position.set(0, 7, 18);
    this.camera.lookAt(0, 3, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    this.scene.add(dirLight);

    // Resize handling
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initLevel() {
    this.level = new Level(this.scene);
  }

  initEnemies() {
    // Spawn Goombas across the stage
    const enemySpawns = [
      { x: 14, range: 4 },
      { x: 25, range: 3 },
      { x: 38, range: 3 },
      { x: 50, range: 5 },
      { x: 57, range: 4 },
      { x: 82, range: 4 },
      { x: 92, range: 5 },
      { x: 110, range: 6 }
    ];

    enemySpawns.forEach(s => {
      const g = new Goomba(this.scene, s.x, 0.4, 0, s.range);
      this.enemies.push(g);
    });
  }

  initMario() {
    this.mario = new Mario(this.scene, this.startPosition);
  }

  initInputs() {
    // Unlock Web Audio context on first user gesture
    const unlockAudio = () => {
      audio.ensureContext();
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('mousedown', unlockAudio);
    };
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('mousedown', unlockAudio);

    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      this.handleKey(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.handleKey(e.code, false);
    });

    // Touch & On-screen buttons
    const bindBtn = (id, key) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const down = (e) => { e.preventDefault(); this.input[key] = true; };
      const up = (e) => { e.preventDefault(); this.input[key] = false; };
      btn.addEventListener('touchstart', down, { passive: false });
      btn.addEventListener('touchend', up, { passive: false });
      btn.addEventListener('mousedown', down);
      btn.addEventListener('mouseup', up);
      btn.addEventListener('mouseleave', up);
    };

    bindBtn('btn-left', 'left');
    bindBtn('btn-right', 'right');
    bindBtn('btn-jump', 'jump');
    bindBtn('btn-run', 'run');
  }

  handleKey(code, isDown) {
    if (code === 'ArrowLeft' || code === 'KeyA') this.input.left = isDown;
    if (code === 'ArrowRight' || code === 'KeyD') this.input.right = isDown;
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') this.input.jump = isDown;
    if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyJ') this.input.run = isDown;
  }

  initUI() {
    // Sound & BGM toggles
    const audioBtn = document.getElementById('btn-sound-toggle');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const muted = audio.toggleMute();
        audioBtn.textContent = muted ? '🔇 Muted' : '🔊 Sound: ON';
      });
    }

    const bgmBtn = document.getElementById('btn-bgm-toggle');
    if (bgmBtn) {
      bgmBtn.addEventListener('click', () => {
        const playing = audio.toggleBgm();
        bgmBtn.textContent = playing ? '🎵 Music: ON' : '🎵 Music: OFF';
      });
    }

    // Leaderboard Modal
    const lbBtn = document.getElementById('btn-leaderboard');
    const lbModal = document.getElementById('modal-leaderboard');
    const lbClose = document.getElementById('btn-close-leaderboard');
    if (lbBtn && lbModal && lbClose) {
      lbBtn.addEventListener('click', async () => {
        lbModal.classList.remove('hidden');
        await this.refreshLeaderboardUI();
      });
      lbClose.addEventListener('click', () => {
        lbModal.classList.add('hidden');
      });
    }

    // Submit Victory Score
    const victoryForm = document.getElementById('victory-form');
    if (victoryForm) {
      victoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('victory-player-name');
        const name = input ? input.value.trim() : 'Player';
        await this.submitFinalScore(name);
      });
    }

    // Submit Game Over Score
    const gameoverForm = document.getElementById('gameover-form');
    if (gameoverForm) {
      gameoverForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('gameover-player-name');
        const name = input ? input.value.trim() : 'Player';
        await this.submitFinalScore(name);
      });
    }

    // Restart Buttons
    const restartBtns = document.querySelectorAll('.btn-restart-game');
    restartBtns.forEach(b => {
      b.addEventListener('click', () => {
        this.restartGame();
      });
    });

    // Check backend status badge
    checkBackendStatus().then(online => {
      const badge = document.getElementById('backend-status-badge');
      if (badge) {
        badge.textContent = online ? '🟢 API Online' : '🟡 API Offline (Local Mode)';
        badge.className = online ? 'status-online' : 'status-offline';
      }
    });
  }

  async refreshLeaderboardUI() {
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;
    listEl.innerHTML = '<div class="loading-spinner">Loading high scores...</div>';

    const { isOnline, list } = await getLeaderboard(10);

    // Update status badge dynamically
    const badge = document.getElementById('backend-status-badge');
    if (badge) {
      badge.textContent = isOnline ? '🟢 API Online' : '🟡 API Offline (Local Mode)';
      badge.className = isOnline ? 'status-online' : 'status-offline';
    }

    if (!list || list.length === 0) {
      listEl.innerHTML = '<div class="empty-list">No scores yet. Be the first!</div>';
      return;
    }

    let html = '<table class="lb-table"><thead><tr><th>#</th><th>Player</th><th>Score</th><th>Coins</th><th>Time</th></tr></thead><tbody>';
    list.forEach((entry, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
      html += `
        <tr>
          <td>${medal}</td>
          <td class="player-col">${entry.playerName || 'Anonymous'}</td>
          <td class="score-col">${(entry.score || 0).toLocaleString()}</td>
          <td>🪙 ${entry.coins || 0}</td>
          <td>${entry.timeRemaining || 0}s</td>
        </tr>
      `;
    });
    html += '</tbody></table>';
    listEl.innerHTML = html;
  }

  async submitFinalScore(playerName) {
    const result = await submitLeaderboardScore({
      playerName,
      score: this.score,
      coins: this.coins,
      world: this.world,
      timeRemaining: this.time
    });

    const msg = `Score saved! Rank: #${result.rank}${result.offline ? ' (Saved locally)' : ''}`;
    const submitMsg = document.getElementById('score-submit-msg');
    if (submitMsg) {
      submitMsg.textContent = msg;
      submitMsg.classList.remove('hidden');
    }
    const goSubmitMsg = document.getElementById('gameover-submit-msg');
    if (goSubmitMsg) {
      goSubmitMsg.textContent = msg;
      goSubmitMsg.classList.remove('hidden');
    }

    setTimeout(() => {
      this.refreshLeaderboardUI();
      const lbModal = document.getElementById('modal-leaderboard');
      if (lbModal) lbModal.classList.remove('hidden');
    }, 800);
  }

  addScore(points, coinsCount = 0, worldPos = null) {
    this.score += points;
    this.coins += coinsCount;
    this.updateHUD();

    if (worldPos) {
      this.createFloatingText(`+${points}`, worldPos);
    }
  }

  createFloatingText(text, pos) {
    const el = document.createElement('div');
    el.className = 'floating-score';
    el.textContent = text;
    this.container.appendChild(el);

    this.floatingTexts.push({
      el,
      pos: pos.clone ? pos.clone() : new THREE.Vector3(pos.x, pos.y, pos.z),
      timer: 0
    });
  }

  updateFloatingTexts(dt) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const item = this.floatingTexts[i];
      item.timer += dt;
      item.pos.y += dt * 1.5;

      // Project 3D position to 2D screen
      const vector = item.pos.clone().project(this.camera);
      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

      item.el.style.left = `${x}px`;
      item.el.style.top = `${y}px`;
      item.el.style.opacity = `${Math.max(0, 1 - item.timer / 1.0)}`;

      if (item.timer >= 1.0) {
        item.el.remove();
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const coinsEl = document.getElementById('hud-coins');
    const livesEl = document.getElementById('hud-lives');
    const timeEl = document.getElementById('hud-time');
    const worldEl = document.getElementById('hud-world');

    if (scoreEl) scoreEl.textContent = String(this.score).padStart(6, '0');
    if (coinsEl) coinsEl.textContent = `x${String(this.coins).padStart(2, '0')}`;
    if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, this.lives));
    if (timeEl) timeEl.textContent = String(this.time).padStart(3, '0');
    if (worldEl) worldEl.textContent = this.world;
  }

  handlePlayerHurt() {
    if (this.mario.isInvulnerable || this.state !== 'PLAYING') return;

    this.lives -= 1;
    this.updateHUD();

    if (this.lives <= 0) {
      this.triggerGameOver();
    } else {
      audio.playHurt();
      this.mario.bounce(8);
      this.mario.isInvulnerable = true;
      this.mario.invulnerableTimer = 2.0;
    }
  }

  triggerVictory() {
    if (this.state === 'VICTORY') return;
    this.state = 'VICTORY';

    // Calculate time bonus
    const timeBonus = this.time * 50;
    const coinBonus = this.coins * 100;
    this.score += timeBonus + coinBonus;
    this.updateHUD();

    const victoryModal = document.getElementById('modal-victory');
    const finalScoreEl = document.getElementById('victory-final-score');
    const bonusDetailsEl = document.getElementById('victory-bonus-details');

    if (finalScoreEl) finalScoreEl.textContent = this.score.toLocaleString();
    if (bonusDetailsEl) {
      bonusDetailsEl.textContent = `Time Remaining (${this.time}s x 50) + Coins (${this.coins} x 100)`;
    }
    if (victoryModal) victoryModal.classList.remove('hidden');
  }

  triggerGameOver() {
    if (this.state === 'GAMEOVER') return;
    this.state = 'GAMEOVER';
    this.mario.triggerDeath();
    audio.playGameOver();

    setTimeout(() => {
      const modal = document.getElementById('modal-gameover');
      const scoreEl = document.getElementById('gameover-final-score');
      if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
      if (modal) modal.classList.remove('hidden');
    }, 1500);
  }

  restartGame() {
    // Reset Stats
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.time = 300;
    this.state = 'PLAYING';

    // Hide Modals
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));

    // Reset Mario
    this.mario.respawn(this.startPosition);

    // Reset Level coins & flag
    this.level.coins.forEach(c => {
      c.collected = false;
      this.scene.add(c.mesh);
    });
    this.level.flagDropped = false;
    if (this.level.flagMesh) {
      this.level.flagMesh.position.y = this.level.flagpole.topY - 0.4;
    }

    // Reset Enemies
    this.enemies.forEach(e => {
      e.group.position.set(e.startX, 0.4, 0);
      e.group.scale.set(1, 1, 1);
      e.isAlive = true;
      e.isSquashed = false;
      this.scene.add(e.group);
    });

    this.updateHUD();
  }

  animate() {
    requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.1);

    if (this.state === 'PLAYING') {
      // Countdown timer
      this.timeTimer += dt;
      if (this.timeTimer >= 1.0) {
        this.timeTimer -= 1.0;
        this.time = Math.max(0, this.time - 1);
        this.updateHUD();
        if (this.time === 0) {
          this.triggerGameOver();
        }
      }

      // Mario update
      this.mario.update(
        dt,
        this.input,
        this.level.colliders,
        (hitBlock) => {
          this.level.triggerBlockHit(hitBlock, (pts, coins, pos) => {
            this.addScore(pts, coins, pos);
          });
        }
      );

      // Pit check
      if (this.mario.position.y < -3.5) {
        this.handlePlayerHurt();
        if (this.lives > 0) {
          this.mario.respawn({ x: Math.max(0, this.mario.position.x - 8), y: 4, z: 0 });
        }
      }

      // Enemies update & collisions
      const marioBox = this.mario.getBoundingBox();
      this.enemies.forEach(goomba => {
        goomba.update(dt, this.level.colliders);

        if (!goomba.isAlive || goomba.isSquashed) return;
        const gBox = goomba.getBoundingBox();
        if (gBox && marioBox.intersectsBox(gBox)) {
          // Stomp detection: Mario is falling downward and Mario's feet are above Goomba midpoint
          const marioFeet = this.mario.position.y;
          const goombaTop = goomba.group.position.y + 0.6;

          if (this.mario.velocity.y < 0 && marioFeet >= goombaTop - 0.25) {
            goomba.squash();
            this.mario.bounce(10);
            this.addScore(200, 0, goomba.group.position);
          } else {
            this.handlePlayerHurt();
          }
        }
      });

      // Coin pickups
      this.level.checkCoinCollisions(marioBox, (pts, cCount, pos) => {
        this.addScore(pts, cCount, pos);
      });

      // Flagpole check
      if (this.level.checkFlagpoleCollision(marioBox)) {
        this.triggerVictory();
      }
    }

    // Level updates
    this.level.update(dt);

    // Floating text particles
    this.updateFloatingTexts(dt);

    // Camera follow Mario (smooth dampening)
    if (this.mario && this.camera) {
      const targetX = Math.max(0, this.mario.position.x + 4);
      const targetY = Math.max(5, this.mario.position.y + 3);
      this.camera.position.x += (targetX - this.camera.position.x) * 0.08;
      this.camera.position.y += (targetY - this.camera.position.y) * 0.05;
      this.camera.lookAt(this.camera.position.x - 2, this.camera.position.y - 2, 0);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
