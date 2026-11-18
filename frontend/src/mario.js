import * as THREE from 'three';
import { audio } from './audio.js';

export class Mario {
  constructor(scene, startPos = { x: 0, y: 3, z: 0 }) {
    this.scene = scene;
    this.group = new THREE.Group();
    
    // Physical attributes
    this.width = 0.8;
    this.height = 1.7;
    this.depth = 0.8;

    this.position = this.group.position;
    this.position.set(startPos.x, startPos.y, startPos.z);

    this.velocity = new THREE.Vector3(0, 0, 0);
    this.moveSpeed = 8.0;
    this.runSpeed = 12.0;
    this.jumpForce = 13.5;
    this.gravity = 32.0;
    
    this.isGrounded = false;
    this.isJumping = false;
    this.facing = 1; // 1 = right (+X), -1 = left (-X)
    this.isDead = false;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    
    this.animTime = 0;

    this.buildModel();
    this.scene.add(this.group);
  }

  buildModel() {
    // Materials
    const redMat = new THREE.MeshLambertMaterial({ color: 0xdd1111 }); // Shirt & Cap
    const blueMat = new THREE.MeshLambertMaterial({ color: 0x0033aa }); // Overalls
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffcca4 }); // Face & Nose
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x221100 }); // Mustache & Hair
    const yellowMat = new THREE.MeshLambertMaterial({ color: 0xffd700 }); // Overall buttons
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff }); // Gloves
    const brownMat = new THREE.MeshLambertMaterial({ color: 0x552200 }); // Shoes

    // Main torso
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.5), redMat);
    this.torso.position.y = 0.9;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    // Overalls body
    const overalls = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.45, 0.52), blueMat);
    overalls.position.y = -0.1;
    this.torso.add(overalls);

    // Yellow buttons
    const buttonGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 8);
    buttonGeo.rotateX(Math.PI / 2);
    const leftBtn = new THREE.Mesh(buttonGeo, yellowMat);
    leftBtn.position.set(-0.2, 0.08, 0.27);
    const rightBtn = new THREE.Mesh(buttonGeo, yellowMat);
    rightBtn.position.set(0.2, 0.08, 0.27);
    this.torso.add(leftBtn, rightBtn);

    // Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.5), skinMat);
    this.head.position.y = 0.55;
    this.torso.add(this.head);

    // Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), skinMat);
    nose.position.set(0, 0, 0.3);
    this.head.add(nose);

    // Mustache
    const stache = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.12), hairMat);
    stache.position.set(0, -0.12, 0.3);
    this.head.add(stache);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.04), eyeMat);
    leftEye.position.set(-0.14, 0.08, 0.27);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.04), eyeMat);
    rightEye.position.set(0.14, 0.08, 0.27);
    this.head.add(leftEye, rightEye);

    // Cap crown & visor
    const capCrown = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.25, 0.58), redMat);
    capCrown.position.y = 0.32;
    this.head.add(capCrown);

    const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.32), redMat);
    capVisor.position.set(0, 0.22, 0.36);
    this.head.add(capVisor);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.45, 0.2);
    const gloveGeo = new THREE.SphereGeometry(0.13, 8, 8);

    // Left Arm Pivot
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.46, 0.2, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, redMat);
    leftArmMesh.position.y = -0.2;
    const leftGlove = new THREE.Mesh(gloveGeo, whiteMat);
    leftGlove.position.y = -0.42;
    this.leftArmPivot.add(leftArmMesh, leftGlove);
    this.torso.add(this.leftArmPivot);

    // Right Arm Pivot
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.46, 0.2, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, redMat);
    rightArmMesh.position.y = -0.2;
    const rightGlove = new THREE.Mesh(gloveGeo, whiteMat);
    rightGlove.position.y = -0.42;
    this.rightArmPivot.add(rightArmMesh, rightGlove);
    this.torso.add(this.rightArmPivot);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.25, 0.45, 0.25);
    const shoeGeo = new THREE.BoxGeometry(0.28, 0.18, 0.4);

    // Left Leg Pivot
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.2, 0.55, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, blueMat);
    leftLegMesh.position.y = -0.2;
    const leftShoe = new THREE.Mesh(shoeGeo, brownMat);
    leftShoe.position.set(0, -0.45, 0.06);
    this.leftLegPivot.add(leftLegMesh, leftShoe);
    this.group.add(this.leftLegPivot);

    // Right Leg Pivot
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.2, 0.55, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, blueMat);
    rightLegMesh.position.y = -0.2;
    const rightShoe = new THREE.Mesh(shoeGeo, brownMat);
    rightShoe.position.set(0, -0.45, 0.06);
    this.rightLegPivot.add(rightLegMesh, rightShoe);
    this.group.add(this.rightLegPivot);
  }

  update(dt, input, colliders, onHeadHit) {
    if (this.isDead) {
      // Death bounce animation
      this.velocity.y -= this.gravity * dt;
      this.position.y += this.velocity.y * dt;
      return;
    }

    // Invulnerability timer
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      this.group.visible = Math.floor(this.invulnerableTimer * 12) % 2 === 0;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
        this.group.visible = true;
      }
    }

    // Movement inputs
    let moveX = 0;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    const currentSpeed = input.run ? this.runSpeed : this.moveSpeed;
    this.velocity.x = moveX * currentSpeed;

    // Facing direction
    if (moveX !== 0) {
      this.facing = moveX > 0 ? 1 : -1;
      this.torso.rotation.y = this.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
    }

    // Jump
    if (input.jump && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.isJumping = true;
      audio.playJump();
    }

    // Gravity
    this.velocity.y -= this.gravity * dt;
    if (this.velocity.y < -25) this.velocity.y = -25;

    // Collision X
    const newX = this.position.x + this.velocity.x * dt;
    if (!this.checkHorizontalCollision(newX, this.position.y, colliders)) {
      this.position.x = newX;
    } else {
      this.velocity.x = 0;
    }

    // Collision Y
    const newY = this.position.y + this.velocity.y * dt;
    this.handleVerticalCollision(newY, colliders, onHeadHit);

    // Animations
    this.animate(dt, moveX);
  }

  checkHorizontalCollision(x, y, colliders) {
    const halfW = this.width / 2;
    // Raise bottom of horizontal box by 0.15 so Mario standing on a block
    // doesn't falsely collide with the side of that same block.
    const box = new THREE.Box3(
      new THREE.Vector3(x - halfW, y + 0.15, -0.4),
      new THREE.Vector3(x + halfW, y + this.height - 0.2, 0.4)
    );

    for (const c of colliders) {
      if (!c.active) continue;
      if (box.intersectsBox(c.box)) {
        return true;
      }
    }
    return false;
  }

  handleVerticalCollision(newY, colliders, onHeadHit) {
    const halfW = this.width / 2;
    const testBox = new THREE.Box3(
      new THREE.Vector3(this.position.x - halfW + 0.1, newY, -0.4),
      new THREE.Vector3(this.position.x + halfW - 0.1, newY + this.height, 0.4)
    );

    let landed = false;

    for (const c of colliders) {
      if (!c.active) continue;
      if (testBox.intersectsBox(c.box)) {
        // Falling down -> land on top
        if (this.velocity.y <= 0 && this.position.y >= c.box.max.y - 0.3) {
          this.position.y = c.box.max.y;
          this.velocity.y = 0;
          this.isGrounded = true;
          this.isJumping = false;
          landed = true;
          break;
        } 
        // Jumping up -> hit head on bottom of block
        else if (this.velocity.y > 0 && this.position.y + this.height <= c.box.min.y + 0.3) {
          this.position.y = c.box.min.y - this.height;
          this.velocity.y = 0;
          if (onHeadHit) {
            onHeadHit(c);
          }
          break;
        }
      }
    }

    if (!landed) {
      this.position.y = newY;
      if (this.velocity.y < -0.1) {
        this.isGrounded = false;
      }
    }
  }

  animate(dt, moveX) {
    if (!this.isGrounded) {
      // Jump pose
      this.leftArmPivot.rotation.x = -Math.PI * 0.75;
      this.rightArmPivot.rotation.x = Math.PI * 0.2;
      this.leftLegPivot.rotation.x = Math.PI * 0.3;
      this.rightLegPivot.rotation.x = -Math.PI * 0.3;
      return;
    }

    if (moveX !== 0) {
      // Running cycle
      this.animTime += dt * (Math.abs(this.velocity.x) * 1.5);
      const angle = Math.sin(this.animTime) * 0.8;

      this.leftArmPivot.rotation.x = -angle;
      this.rightArmPivot.rotation.x = angle;
      this.leftLegPivot.rotation.x = angle;
      this.rightLegPivot.rotation.x = -angle;
    } else {
      // Idle pose
      this.leftArmPivot.rotation.x = 0;
      this.rightArmPivot.rotation.x = 0;
      this.leftLegPivot.rotation.x = 0;
      this.rightLegPivot.rotation.x = 0;
    }
  }

  bounce(force = 10) {
    this.velocity.y = force;
    this.isGrounded = false;
  }

  triggerDeath() {
    this.isDead = true;
    this.velocity.set(0, 12, 0);
    this.group.visible = true;
    audio.playHurt();
  }

  respawn(startPos = { x: 0, y: 3, z: 0 }) {
    this.isDead = false;
    this.position.set(startPos.x, startPos.y, startPos.z);
    this.velocity.set(0, 0, 0);
    this.isGrounded = false;
    this.isJumping = false;
    this.isInvulnerable = true;
    this.invulnerableTimer = 2.0;
    this.group.visible = true;
  }

  getBoundingBox() {
    return new THREE.Box3().setFromObject(this.group);
  }
}
