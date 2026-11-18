import * as THREE from 'three';
import { audio } from './audio.js';

// Procedural Canvas Textures for Authentic Retro Look
function createQuestionBlockTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Outer border
  ctx.fillStyle = '#f89800';
  ctx.fillRect(0, 0, 128, 128);

  // Inner face
  ctx.fillStyle = '#fcb01c';
  ctx.fillRect(8, 8, 112, 112);

  // Border bevels
  ctx.fillStyle = '#ffe080';
  ctx.fillRect(8, 8, 112, 6);
  ctx.fillRect(8, 8, 6, 112);
  ctx.fillStyle = '#c07000';
  ctx.fillRect(114, 8, 6, 112);
  ctx.fillRect(8, 114, 112, 6);

  // Corner rivets
  ctx.fillStyle = '#502000';
  const rivet = (x, y) => {
    ctx.fillRect(x, y, 6, 6);
  };
  rivet(12, 12);
  rivet(110, 12);
  rivet(12, 110);
  rivet(110, 110);

  // The '?' Mark
  ctx.fillStyle = '#502000';
  ctx.font = 'bold 72px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 64, 66);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

function createEmptyBlockTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#7a4210';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#9e5a20';
  ctx.fillRect(8, 8, 112, 112);

  // Dark rivets
  ctx.fillStyle = '#3a1e05';
  ctx.fillRect(12, 12, 8, 8);
  ctx.fillRect(108, 12, 8, 8);
  ctx.fillRect(12, 108, 8, 8);
  ctx.fillRect(108, 108, 8, 8);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

function createBrickTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Mortar background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 128, 128);

  // Brick color
  ctx.fillStyle = '#b84418';

  // Row 1
  ctx.fillRect(2, 2, 60, 28);
  ctx.fillRect(66, 2, 60, 28);

  // Row 2
  ctx.fillRect(2, 34, 28, 28);
  ctx.fillRect(34, 34, 60, 28);
  ctx.fillRect(98, 34, 28, 28);

  // Row 3
  ctx.fillRect(2, 66, 60, 28);
  ctx.fillRect(66, 66, 60, 28);

  // Row 4
  ctx.fillRect(2, 98, 28, 28);
  ctx.fillRect(34, 98, 60, 28);
  ctx.fillRect(98, 98, 28, 28);

  // Highlights on bricks
  ctx.fillStyle = '#d86838';
  ctx.fillRect(2, 2, 60, 4);
  ctx.fillRect(66, 2, 60, 4);
  ctx.fillRect(34, 34, 60, 4);
  ctx.fillRect(2, 66, 60, 4);
  ctx.fillRect(66, 66, 60, 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

export class Level {
  constructor(scene) {
    this.scene = scene;
    this.colliders = []; // Solid objects for collisions
    this.interactiveBlocks = []; // Question / Brick blocks
    this.coins = []; // Collectible coins
    this.scenery = [];
    this.flagpole = null;
    this.flagMesh = null;
    this.flagDropped = false;

    // Materials
    this.questionTex = createQuestionBlockTexture();
    this.emptyTex = createEmptyBlockTexture();
    this.brickTex = createBrickTexture();

    this.questionMat = new THREE.MeshLambertMaterial({ map: this.questionTex });
    this.emptyMat = new THREE.MeshLambertMaterial({ map: this.emptyTex });
    this.brickMat = new THREE.MeshLambertMaterial({ map: this.brickTex });
    this.pipeMat = new THREE.MeshLambertMaterial({ color: 0x009a00 });
    this.pipeLipMat = new THREE.MeshLambertMaterial({ color: 0x00b800 });
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x553300
    });

    this.buildLevel();
  }

  buildLevel() {
    this.buildGroundSegments();
    this.buildBlocks();
    this.buildPipes();
    this.buildCoins();
    this.buildStaircases();
    this.buildFlagpoleAndCastle();
    this.buildScenery();
  }

  buildGroundSegments() {
    const grassTopMat = new THREE.MeshLambertMaterial({ color: 0x61a029 });
    const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8a4513 });

    // Ground segments (with gaps/pits)
    const segments = [
      { start: -10, end: 32 },
      { start: 36, end: 72 },
      { start: 76, end: 118 },
      { start: 122, end: 185 }
    ];

    segments.forEach(seg => {
      const length = seg.end - seg.start;
      const centerX = seg.start + length / 2;
      const height = 4;
      const depth = 6;

      // Dirt base
      const dirtGeo = new THREE.BoxGeometry(length, height, depth);
      const dirt = new THREE.Mesh(dirtGeo, dirtMat);
      dirt.position.set(centerX, -height / 2, 0);
      dirt.receiveShadow = true;
      this.scene.add(dirt);

      // Grass top layer
      const grassGeo = new THREE.BoxGeometry(length, 0.4, depth + 0.1);
      const grass = new THREE.Mesh(grassGeo, grassTopMat);
      grass.position.set(centerX, 0.2, 0);
      grass.receiveShadow = true;
      this.scene.add(grass);

      // Collider
      const box = new THREE.Box3(
        new THREE.Vector3(seg.start, -height, -depth / 2),
        new THREE.Vector3(seg.end, 0.4, depth / 2)
      );
      this.colliders.push({ type: 'ground', box, active: true });
    });
  }

  buildBlocks() {
    // [?] blocks and Brick configurations
    const blockList = [
      // Early warm up
      { x: 10, y: 3.5, type: 'question', content: 'coin' },
      { x: 16, y: 3.5, type: 'brick' },
      { x: 18, y: 3.5, type: 'question', content: 'coin' },
      { x: 20, y: 3.5, type: 'brick' },
      { x: 22, y: 3.5, type: 'question', content: 'coin' },
      { x: 24, y: 3.5, type: 'brick' },
      { x: 20, y: 6.5, type: 'question', content: 'coin' },

      // Middle section
      { x: 44, y: 3.5, type: 'brick' },
      { x: 45, y: 3.5, type: 'question', content: 'coin' },
      { x: 46, y: 3.5, type: 'brick' },
      { x: 52, y: 6.5, type: 'question', content: 'coin' },
      { x: 53, y: 6.5, type: 'question', content: 'coin' },
      { x: 54, y: 6.5, type: 'brick' },

      // Upper platform section
      { x: 84, y: 3.5, type: 'brick' },
      { x: 86, y: 3.5, type: 'question', content: 'coin' },
      { x: 88, y: 3.5, type: 'brick' },
      { x: 90, y: 6.5, type: 'question', content: 'coin' },
      { x: 92, y: 6.5, type: 'brick' },
      { x: 94, y: 6.5, type: 'brick' },
      { x: 96, y: 6.5, type: 'question', content: 'coin' },
    ];

    blockList.forEach(b => {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mat = b.type === 'question' ? this.questionMat : this.brickMat;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.y, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      const blockObj = {
        mesh,
        type: b.type,
        content: b.content || null,
        initialY: b.y,
        isBouncing: false,
        bounceTimer: 0,
        hit: false,
        box: new THREE.Box3().setFromObject(mesh),
        active: true
      };

      this.interactiveBlocks.push(blockObj);
      this.colliders.push(blockObj);
    });
  }

  buildPipes() {
    const pipeList = [
      { x: 28, height: 2 },
      { x: 40, height: 3 },
      { x: 62, height: 4 },
      { x: 104, height: 3 }
    ];

    pipeList.forEach(p => {
      const group = new THREE.Group();
      const radius = 0.85;

      // Pipe main body
      const bodyGeo = new THREE.CylinderGeometry(radius, radius, p.height, 16);
      const body = new THREE.Mesh(bodyGeo, this.pipeMat);
      body.position.y = p.height / 2 + 0.4;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Pipe top rim / lip
      const rimGeo = new THREE.CylinderGeometry(radius * 1.15, radius * 1.15, 0.5, 16);
      const rim = new THREE.Mesh(rimGeo, this.pipeLipMat);
      rim.position.y = p.height + 0.4 - 0.25;
      rim.castShadow = true;
      group.add(rim);

      group.position.set(p.x, 0, 0);
      this.scene.add(group);

      const halfW = radius * 1.15;
      const topY = p.height + 0.4;
      const box = new THREE.Box3(
        new THREE.Vector3(p.x - halfW, 0.4, -halfW),
        new THREE.Vector3(p.x + halfW, topY, halfW)
      );

      this.colliders.push({ type: 'pipe', box, active: true });
    });
  }

  buildStaircases() {
    // Stepped pyramid blocks before the flagpole
    const stepMat = this.brickMat;
    const startX = 132;
    const numSteps = 7;

    for (let step = 1; step <= numSteps; step++) {
      for (let y = 1; y <= step; y++) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), stepMat);
        const xPos = startX + step;
        const yPos = y - 0.1;
        mesh.position.set(xPos, yPos, 0);
        mesh.castShadow = true;
        this.scene.add(mesh);

        this.colliders.push({
          type: 'solid',
          box: new THREE.Box3().setFromObject(mesh),
          active: true
        });
      }
    }
  }

  buildCoins() {
    const coinPositions = [
      // Early coins
      { x: 6, y: 1.5 }, { x: 7, y: 1.5 }, { x: 8, y: 1.5 },
      // Pipe jumps
      { x: 28, y: 3.5 },
      { x: 33, y: 2.0 }, { x: 34, y: 2.8 }, { x: 35, y: 2.0 },
      // Floating arcs
      { x: 65, y: 2.0 }, { x: 67, y: 3.2 }, { x: 69, y: 4.0 }, { x: 71, y: 3.2 }, { x: 73, y: 2.0 },
      // High reward coins
      { x: 90, y: 8.0 }, { x: 92, y: 8.0 }, { x: 94, y: 8.0 }, { x: 96, y: 8.0 }
    ];

    coinPositions.forEach(pos => {
      const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
      coinGeo.rotateX(Math.PI / 2);
      const mesh = new THREE.Mesh(coinGeo, this.coinMat);
      mesh.position.set(pos.x, pos.y, 0);
      mesh.castShadow = true;
      this.scene.add(mesh);

      this.coins.push({
        mesh,
        baseY: pos.y,
        collected: false,
        animTimer: Math.random() * Math.PI
      });
    });
  }

  buildFlagpoleAndCastle() {
    const flagX = 150;
    const poleHeight = 12;

    // Green base
    const baseGeo = new THREE.BoxGeometry(1.4, 0.8, 1.4);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x009a00 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(flagX, 0.8, 0);
    this.scene.add(baseMesh);

    // Silver Pole
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, poleHeight, 16);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    const poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleMesh.position.set(flagX, poleHeight / 2 + 0.8, 0);
    this.scene.add(poleMesh);

    // Gold Finial ball
    const ballGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.set(flagX, poleHeight + 0.9, 0);
    this.scene.add(ballMesh);

    // Red triangular Flag
    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0);
    flagShape.lineTo(1.8, -0.6);
    flagShape.lineTo(0, -1.2);
    flagShape.closePath();

    const flagGeo = new THREE.ShapeGeometry(flagShape);
    const flagMat = new THREE.MeshBasicMaterial({ color: 0xe52521, side: THREE.DoubleSide });
    this.flagMesh = new THREE.Mesh(flagGeo, flagMat);
    this.flagMesh.position.set(flagX + 0.12, poleHeight + 0.4, 0);
    this.scene.add(this.flagMesh);

    this.flagpole = {
      x: flagX,
      topY: poleHeight + 0.8,
      bottomY: 1.2,
      hitBox: new THREE.Box3(
        new THREE.Vector3(flagX - 0.4, 0.4, -0.8),
        new THREE.Vector3(flagX + 0.4, poleHeight + 1.2, 0.8)
      )
    };

    // Castle at finish line
    const castleX = 162;
    const castleMat = new THREE.MeshLambertMaterial({ color: 0xbcbcbc });
    const darkMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // Main Keep
    const keep = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 4), castleMat);
    keep.position.set(castleX, 2.9, 0);
    this.scene.add(keep);

    // Battlements
    for (let bx = -3; bx <= 3; bx += 1.5) {
      const bat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 4.2), castleMat);
      bat.position.set(castleX + bx, 5.8, 0);
      this.scene.add(bat);
    }

    // Doorway arch
    const door = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.2), darkMat);
    door.position.set(castleX, 1.9, 2.05);
    this.scene.add(door);
  }

  buildScenery() {
    // 3D Fluffy Clouds
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    for (let x = 0; x < 200; x += 30) {
      const cloudGroup = new THREE.Group();
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), cloudMat);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), cloudMat);
      s2.position.set(1.5, 0.3, 0);
      const s3 = new THREE.Mesh(new THREE.SphereGeometry(1.7, 8, 8), cloudMat);
      s3.position.set(3.0, 0, 0);

      cloudGroup.add(s1, s2, s3);
      cloudGroup.position.set(x + Math.random() * 10, 12 + Math.random() * 4, -8 - Math.random() * 5);
      this.scene.add(cloudGroup);
      this.scenery.push({ group: cloudGroup, speed: 0.2 + Math.random() * 0.1 });
    }

    // Distant Green Hills
    const hillMat = new THREE.MeshLambertMaterial({ color: 0x3d7e17 });
    for (let x = 5; x < 190; x += 45) {
      const hillGeo = new THREE.SphereGeometry(6, 16, 16);
      hillGeo.scale(1.5, 0.7, 0.8);
      const hill = new THREE.Mesh(hillGeo, hillMat);
      hill.position.set(x, 1, -12);
      this.scene.add(hill);
    }
  }

  update(dt, onScoreAdd) {
    // Animate scenery / clouds drifting
    this.scenery.forEach(s => {
      s.group.position.x += s.speed * dt;
      if (s.group.position.x > 210) s.group.position.x = -20;
    });

    // Animate interactive blocks bounce
    this.interactiveBlocks.forEach(b => {
      if (b.isBouncing) {
        b.bounceTimer += dt * 18;
        const offset = Math.sin(b.bounceTimer) * 0.35;
        b.mesh.position.y = b.initialY + Math.max(0, offset);

        if (b.bounceTimer >= Math.PI) {
          b.isBouncing = false;
          b.mesh.position.y = b.initialY;
          b.box.setFromObject(b.mesh);
        }
      }
    });

    // Animate collectible coins (rotation + gentle float)
    this.coins.forEach(c => {
      if (c.collected) return;
      c.animTimer += dt * 4;
      c.mesh.rotation.z += dt * 3;
      c.mesh.position.y = c.baseY + Math.sin(c.animTimer) * 0.12;
    });

    // Animate flag sliding down if triggered
    if (this.flagDropped && this.flagMesh) {
      if (this.flagMesh.position.y > this.flagpole.bottomY + 1.2) {
        this.flagMesh.position.y -= dt * 6;
      }
    }
  }

  triggerBlockHit(blockObj, onScoreAdd) {
    if (blockObj.hit && blockObj.type === 'question') return;

    blockObj.isBouncing = true;
    blockObj.bounceTimer = 0;

    if (blockObj.type === 'question') {
      blockObj.hit = true;
      blockObj.mesh.material = this.emptyMat;
      audio.playCoin();

      // Spawn pop-up coin
      this.spawnPoppingCoin(blockObj.mesh.position);

      if (onScoreAdd) {
        onScoreAdd(200, 1, blockObj.mesh.position);
      }
    } else {
      audio.playBump();
    }
  }

  spawnPoppingCoin(pos) {
    const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    coinGeo.rotateX(Math.PI / 2);
    const coinMesh = new THREE.Mesh(coinGeo, this.coinMat);
    coinMesh.position.set(pos.x, pos.y + 0.8, pos.z);
    this.scene.add(coinMesh);

    let t = 0;
    const anim = () => {
      t += 0.04;
      coinMesh.position.y += Math.cos(t * 3) * 0.15;
      coinMesh.rotation.z += 0.3;
      coinMesh.scale.multiplyScalar(0.97);

      if (t < 0.6) {
        requestAnimationFrame(anim);
      } else {
        this.scene.remove(coinMesh);
      }
    };
    anim();
  }

  checkCoinCollisions(marioBox, onCoinCollect) {
    for (const c of this.coins) {
      if (c.collected) continue;
      const coinBox = new THREE.Box3().setFromObject(c.mesh);
      if (marioBox.intersectsBox(coinBox)) {
        c.collected = true;
        this.scene.remove(c.mesh);
        audio.playCoin();
        if (onCoinCollect) {
          onCoinCollect(100, 1, c.mesh.position);
        }
      }
    }
  }

  checkFlagpoleCollision(marioBox) {
    if (this.flagDropped || !this.flagpole) return false;
    if (marioBox.intersectsBox(this.flagpole.hitBox)) {
      this.flagDropped = true;
      audio.playVictory();
      return true;
    }
    return false;
  }
}
