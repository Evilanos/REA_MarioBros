import * as THREE from 'three';
import { audio } from './audio.js';

export class Goomba {
  constructor(scene, x, y = 0.5, z = 0, range = 5) {
    this.scene = scene;
    this.startX = x;
    this.range = range;
    this.minX = x - range;
    this.maxX = x + range;
    this.speed = 2.0;
    this.direction = -1; // Moving left first
    this.isAlive = true;
    this.isSquashed = false;
    this.squashTimer = 0;
    this.walkTimer = 0;

    this.group = new THREE.Group();
    this.group.position.set(x, y, z);

    this.buildModel();
    this.scene.add(this.group);
  }

  buildModel() {
    // Materials
    const capMat = new THREE.MeshLambertMaterial({ color: 0x964316 }); // Goomba Brown
    const stemMat = new THREE.MeshLambertMaterial({ color: 0xffe6b0 }); // Cream stem/face
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const footMat = new THREE.MeshLambertMaterial({ color: 0x4a1f06 }); // Dark brown feet

    // Mushroom Cap
    const capGeo = new THREE.CylinderGeometry(0.55, 0.45, 0.55, 8);
    this.cap = new THREE.Mesh(capGeo, capMat);
    this.cap.position.y = 0.65;
    this.cap.castShadow = true;
    this.group.add(this.cap);

    // Stem / Face
    const stemGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.4, 8);
    this.stem = new THREE.Mesh(stemGeo, stemMat);
    this.stem.position.y = 0.35;
    this.group.add(this.stem);

    // Angry eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.18, 0.05);
    const pupilGeo = new THREE.BoxGeometry(0.04, 0.1, 0.06);

    // Left eye (tilted inward)
    const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    leftEye.position.set(-0.16, 0.45, 0.42);
    leftEye.rotation.z = -0.3;
    const leftPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
    leftPupil.position.set(-0.16, 0.45, 0.43);
    this.group.add(leftEye, leftPupil);

    // Right eye (tilted inward)
    const rightEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    rightEye.position.set(0.16, 0.45, 0.42);
    rightEye.rotation.z = 0.3;
    const rightPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
    rightPupil.position.set(0.16, 0.45, 0.43);
    this.group.add(rightEye, rightPupil);

    // Feet
    const footGeo = new THREE.BoxGeometry(0.24, 0.15, 0.36);
    this.leftFoot = new THREE.Mesh(footGeo, footMat);
    this.leftFoot.position.set(-0.24, 0.08, 0);
    this.rightFoot = new THREE.Mesh(footGeo, footMat);
    this.rightFoot.position.set(0.24, 0.08, 0);
    this.group.add(this.leftFoot, this.rightFoot);
  }

  update(dt, colliders) {
    if (!this.isAlive) return;

    if (this.isSquashed) {
      this.squashTimer -= dt;
      if (this.squashTimer <= 0) {
        this.isAlive = false;
        this.scene.remove(this.group);
      }
      return;
    }

    // Patrol movement
    const moveAmount = this.direction * this.speed * dt;
    const nextX = this.group.position.x + moveAmount;

    // Boundary bounce
    if (nextX <= this.minX) {
      this.group.position.x = this.minX;
      this.direction = 1;
    } else if (nextX >= this.maxX) {
      this.group.position.x = this.maxX;
      this.direction = -1;
    } else {
      this.group.position.x = nextX;
    }

    // Waddling foot animation
    this.walkTimer += dt * 8;
    const footWaddle = Math.sin(this.walkTimer) * 0.1;
    this.leftFoot.position.y = 0.08 + Math.max(0, footWaddle);
    this.rightFoot.position.y = 0.08 + Math.max(0, -footWaddle);
  }

  squash() {
    if (this.isSquashed) return;
    this.isSquashed = true;
    this.squashTimer = 0.4;
    audio.playStomp();

    // Flatten model visually
    this.group.scale.set(1.3, 0.2, 1.3);
    this.group.position.y -= 0.3;
  }

  getBoundingBox() {
    if (!this.isAlive || this.isSquashed) return null;
    const pos = this.group.position;
    return new THREE.Box3(
      new THREE.Vector3(pos.x - 0.45, pos.y, -0.45),
      new THREE.Vector3(pos.x + 0.45, pos.y + 0.9, 0.45)
    );
  }
}
