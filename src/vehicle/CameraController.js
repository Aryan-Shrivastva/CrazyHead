import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Multi-Mode Camera Controller with Cockpit Halo View, T-Cam, Chase Cam & Cinematic Transitions
 */
export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Camera Modes: 'cockpit', 'tcam', 'chase', 'showroom', 'paddock'
    this.mode = 'showroom';
    this.modesList = ['cockpit', 'tcam', 'chase'];
    this.modeIndex = 0;

    // Showroom Camera Settings
    this.orbitRadius = 4.8;
    this.orbitAngle = 0.45; // Heroic 3/4 angle
    this.orbitHeight = 1.1;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };

    // Chase Camera Smoothing
    this.chaseTargetPos = new THREE.Vector3();
    this.chaseTargetLookAt = new THREE.Vector3();

    this.setupOrbitListeners();
  }

  setupOrbitListeners() {
    const onPointerDown = (e) => {
      if (this.mode !== 'showroom') return;
      // Only drag if clicking on canvas
      if (e.target.tagName !== 'CANVAS') return;
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (!this.isDragging || this.mode !== 'showroom') return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.orbitAngle -= deltaX * 0.006;
      this.orbitHeight = Math.max(0.4, Math.min(2.5, this.orbitHeight + deltaY * 0.006));
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  toggleCameraMode() {
    this.modeIndex = (this.modeIndex + 1) % this.modesList.length;
    this.mode = this.modesList[this.modeIndex];
    return this.mode.toUpperCase();
  }

  setMode(mode) {
    this.mode = mode;
    if (this.modesList.includes(mode)) {
      this.modeIndex = this.modesList.indexOf(mode);
    }
  }

  update(carGroup, physics, dt) {
    if (!carGroup) return;

    if (this.mode === 'showroom') {
      if (!this.isDragging) {
        // Slow gentle studio orbit
        const t = Date.now() * 0.0004;
        const currentAngle = this.orbitAngle + Math.sin(t) * 0.05;
        const x = Math.sin(currentAngle) * this.orbitRadius;
        const z = Math.cos(currentAngle) * this.orbitRadius;
        this.camera.position.set(x, this.orbitHeight, z);
      } else {
        const x = Math.sin(this.orbitAngle) * this.orbitRadius;
        const z = Math.cos(this.orbitAngle) * this.orbitRadius;
        this.camera.position.set(x, this.orbitHeight, z);
      }
      this.camera.lookAt(0, 0.45, 0.2);
      this.camera.fov = 42;
      this.camera.updateProjectionMatrix();
      return;
    }

    const carPos = physics.position;
    const heading = physics.heading;
    const currentSpeed = physics.velocity.length();

    if (this.mode === 'cockpit') {
      // 1. COCKPIT / DRIVER EYE VIEW (UNOBSTRUCTED FORWARD VISION)
      const forward = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
      const eyeOffset = new THREE.Vector3(0, 0.92, 0.30);
      eyeOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);

      const targetPos = carPos.clone().add(eyeOffset);
      this.camera.position.copy(targetPos);

      // Look straight ahead down the track towards the horizon
      const lookTarget = carPos.clone().add(forward.clone().multiplyScalar(35.0)).add(new THREE.Vector3(0, 0.85, 0));
      this.camera.lookAt(lookTarget);

      // Dynamic High-Speed FOV Expansion
      const speedKmH = currentSpeed * 3.6;
      this.camera.fov = 68 + Math.min(speedKmH / 350, 1.0) * 14;
      this.camera.updateProjectionMatrix();
    } 
    else if (this.mode === 'tcam') {
      // 2. T-CAM BROADCAST VIEW (ABOVE AIRBOX)
      const forward = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
      const tCamOffset = new THREE.Vector3(0, 1.28, -0.25);
      tCamOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);

      const targetPos = carPos.clone().add(tCamOffset);
      this.camera.position.copy(targetPos);

      const lookTarget = carPos.clone().add(forward.clone().multiplyScalar(30.0)).add(new THREE.Vector3(0, 0.7, 0));
      this.camera.lookAt(lookTarget);
      this.camera.fov = 60;
      this.camera.updateProjectionMatrix();
    } 
    else if (this.mode === 'chase') {
      // 3. THIRD-PERSON CHASE CAMERA
      const forward = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
      const chaseOffset = new THREE.Vector3(0, 1.8, -4.6);
      chaseOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);

      const idealPos = carPos.clone().add(chaseOffset);
      const idealLook = carPos.clone().add(forward.clone().multiplyScalar(10.0)).add(new THREE.Vector3(0, 0.5, 0));

      this.camera.position.lerp(idealPos, dt * 10.0);
      this.chaseTargetLookAt.lerp(idealLook, dt * 10.0);
      this.camera.lookAt(this.chaseTargetLookAt);
      this.camera.fov = 55 + Math.min((currentSpeed * 3.6) / 350, 1.0) * 12;
      this.camera.updateProjectionMatrix();
    }
  }

  transitionToPaddock(callback) {
    this.mode = 'paddock';
    gsap.to(this.camera.position, {
      x: 0,
      y: 1.5,
      z: -2.5,
      duration: 1.2,
      ease: 'power3.inOut',
      onComplete: () => {
        if (callback) callback();
      }
    });
  }

  transitionToCockpit(carPos, heading, callback) {
    const eyeOffset = new THREE.Vector3(0, 0.72, 0.15);
    eyeOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);
    const targetPos = carPos.clone().add(eyeOffset);

    gsap.to(this.camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.0,
      ease: 'power3.out',
      onComplete: () => {
        this.mode = 'cockpit';
        if (callback) callback();
      }
    });
  }
}
