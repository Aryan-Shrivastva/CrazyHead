import * as THREE from 'three';
import gsap from 'gsap';
import { F1_TEAMS } from './data/teams.js';
import { MonzaTrack } from './world/MonzaTrack.js';
import { F1Car } from './vehicle/F1Car.js';
import { DriverCharacter } from './vehicle/DriverCharacter.js';
import { GridManager } from './world/GridManager.js';
import { VehiclePhysics } from './vehicle/VehiclePhysics.js';
import { CameraController } from './vehicle/CameraController.js';
import { SoundManager } from './audio/SoundManager.js';
import { LobbyUI } from './ui/LobbyUI.js';
import { TelemetryHUD } from './ui/TelemetryHUD.js';
import { PaddockHUD } from './ui/PaddockHUD.js';

/**
 * Formula 1 Grand Prix Portfolio - Main Application Controller
 */
class F1PortfolioApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.gameState = 'lobby'; // 'lobby', 'racing', 'paddock'
    this.lobbyPage = 1; // 1 = Team Select, 2 = Driver Select

    this.selectedTeam = F1_TEAMS[0]; // Ferrari default
    this.selectedDriver = this.selectedTeam.drivers[0]; // Leclerc default

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Studio & Showroom Lighting
    this.dirLight = null;
    this.hemiLight = null;
    this.showroomSpotlight = null;
    this.showroomFillLight = null;
    this.showroomRimLight = null;

    // Showroom Stage Elements
    this.showroomPodium = null;
    this.podiumRingMaterial = null;

    // Subsystems
    this.soundManager = new SoundManager();
    this.monzaTrack = null;
    this.f1Car = null;
    this.driver1Char = null; // 3D Driver 1
    this.driver2Char = null; // 3D Driver 2 (Teammate)
    this.gridManager = null; // 20-car starting grid
    this.physics = new VehiclePhysics();
    this.cameraController = null;

    // UI Modules
    this.lobbyUI = null;
    this.telemetryHUD = null;
    this.paddockHUD = null;

    // Raycaster for 3D Interactions
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Controls Input State
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      boost: false
    };

    this.init();
  }

  init() {
    this.setupThreeScene();
    this.setupLighting();
    this.buildWorld();
    this.setupUI();
    this.setupInputListeners();
    this.setupSoundToggle();

    // Apply initial team styling
    this.onTeamChange(this.selectedTeam, this.selectedDriver, 1);

    // Start Animation Loop
    this.animate();
  }

  setupThreeScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06080C);
    this.scene.fog = new THREE.FogExp2(0x06080C, 0.0012);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      2500
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.cameraController = new CameraController(this.camera, this.renderer.domElement);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupLighting() {
    // Ambient / Hemisphere Light
    this.hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0x1A2030, 1.2);
    this.scene.add(this.hemiLight);

    // Primary Sunlight for Monza Track
    this.dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.8);
    this.dirLight.position.set(80, 160, 80);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 500;
    this.dirLight.shadow.camera.left = -150;
    this.dirLight.shadow.camera.right = 150;
    this.dirLight.shadow.camera.top = 150;
    this.dirLight.shadow.camera.bottom = -150;
    this.scene.add(this.dirLight);

    // Showroom Overhead High-Intensity Key Spotlight
    this.showroomSpotlight = new THREE.SpotLight(0xFFFFFF, 5.0, 30, Math.PI / 3, 0.3, 1.0);
    this.showroomSpotlight.position.set(0, 7.5, 2.0);
    this.showroomSpotlight.castShadow = true;
    this.scene.add(this.showroomSpotlight);

    // Showroom Front 3/4 Fill Light
    this.showroomFillLight = new THREE.DirectionalLight(0xFFFFFF, 1.8);
    this.showroomFillLight.position.set(5, 4, 8);
    this.scene.add(this.showroomFillLight);

    // Showroom Rear Rim Light (Highlights rear wing & diffuser)
    this.showroomRimLight = new THREE.DirectionalLight(0x64C4FF, 2.0);
    this.showroomRimLight.position.set(-6, 3, -6);
    this.scene.add(this.showroomRimLight);
  }

  buildWorld() {
    // 1. Build 3D Monza Circuit
    this.monzaTrack = new MonzaTrack(this.scene);

    // 2. Build 20-Car Grid Manager
    this.gridManager = new GridManager(this.scene, this.monzaTrack);

    // 3. Build Showroom Podium Turntable (Elevated circular platform with LED Neon ring)
    this.buildShowroomPodium();

    // 4. Build Player 3D F1 Car
    this.f1Car = new F1Car(this.selectedTeam);
    this.scene.add(this.f1Car.group);
    this.f1Car.group.position.set(0, 0, 0);

    // Set spotlight target directly to car
    this.showroomSpotlight.target = this.f1Car.group;

    // 5. Build 3D Drivers for Page 2 (Driver Selection)
    const d1 = this.selectedTeam.drivers[0];
    const d2 = this.selectedTeam.drivers[1];

    this.driver1Char = new DriverCharacter(d1, this.selectedTeam, true);
    this.driver1Char.group.position.set(-0.65, 0, 2.1); // Foreground front
    this.driver1Char.group.rotation.y = 0.15;
    this.driver1Char.group.visible = false; // Hidden on Page 1 (Team select)
    this.scene.add(this.driver1Char.group);

    this.driver2Char = new DriverCharacter(d2, this.selectedTeam, false);
    this.driver2Char.group.position.set(1.9, 0, 0.6); // Midground right
    this.driver2Char.group.rotation.y = -0.25;
    this.driver2Char.group.visible = false; // Hidden on Page 1
    this.scene.add(this.driver2Char.group);
  }

  buildShowroomPodium() {
    this.showroomPodium = new THREE.Group();

    // Cylindrical Turntable Base
    const baseGeo = new THREE.CylinderGeometry(4.2, 4.5, 0.25, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x141824,
      roughness: 0.3,
      metalness: 0.8
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.125;
    baseMesh.receiveShadow = true;
    this.showroomPodium.add(baseMesh);

    // Carbon fiber top plate
    const topGeo = new THREE.CylinderGeometry(4.0, 4.0, 0.04, 48);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x0E1118,
      roughness: 0.2,
      metalness: 0.9
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = 0.01;
    topMesh.receiveShadow = true;
    this.showroomPodium.add(topMesh);

    // Glowing LED Neon Edge Ring
    const ringGeo = new THREE.TorusGeometry(4.05, 0.04, 16, 64);
    ringGeo.rotateX(Math.PI / 2);
    this.podiumRingMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.selectedTeam.color),
      emissive: new THREE.Color(this.selectedTeam.color),
      emissiveIntensity: 3.5,
      roughness: 0.1
    });
    const ringMesh = new THREE.Mesh(ringGeo, this.podiumRingMaterial);
    ringMesh.position.y = 0.02;
    this.showroomPodium.add(ringMesh);

    this.scene.add(this.showroomPodium);
  }

  setupUI() {
    this.lobbyUI = new LobbyUI(
      (team, driver) => this.startRace(team, driver),
      (team, driver, pageNum) => this.onTeamChange(team, driver, pageNum),
      (driver) => this.onDriverChange(driver),
      this.soundManager
    );

    this.telemetryHUD = new TelemetryHUD({
      onOpenPaddock: () => this.openPaddock(),
      onToggleCamera: () => this.cameraController.toggleCameraMode(),
      onResetCar: () => this.resetCarToTrack(),
      onReturnLobby: () => this.returnToLobby()
    });

    this.paddockHUD = new PaddockHUD(() => this.returnToCockpit());
  }

  setupSoundToggle() {
    const soundToggle = document.getElementById('sound-toggle');
    const soundIcon = document.getElementById('sound-icon');
    const soundText = document.getElementById('sound-text');

    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        this.soundManager.init();
        this.soundManager.resume();
        const isMuted = this.soundManager.toggleMute();
        if (soundIcon) soundIcon.textContent = isMuted ? '🔇' : '🔊';
        if (soundText) soundText.textContent = isMuted ? 'AUDIO OFF' : 'AUDIO ON';
      });
    }
  }

  onTeamChange(team, driver, pageNum = 1) {
    this.selectedTeam = team;
    this.selectedDriver = driver || team.drivers[0];
    this.lobbyPage = pageNum;

    // 1. Update 3D Car Livery & Finishes
    if (this.f1Car) {
      this.f1Car.updateTeam(team);
    }
    if (this.paddockHUD) {
      this.paddockHUD.updateTeam(team);
    }

    // 2. Update Showroom Lights & Glowing Podium Ring
    if (this.showroomSpotlight) {
      this.showroomSpotlight.color.set(0xFFFFFF);
    }
    if (this.podiumRingMaterial) {
      this.podiumRingMaterial.color.set(team.color);
      this.podiumRingMaterial.emissive.set(team.color);
      this.podiumRingMaterial.needsUpdate = true;
    }

    // 3. Update 3D Drivers
    const d1 = team.drivers[0];
    const d2 = team.drivers[1];
    if (this.driver1Char) this.driver1Char.updateTeamAndDriver(d1, team);
    if (this.driver2Char) this.driver2Char.updateTeamAndDriver(d2, team);

    // Page 1 vs Page 2 Visibility
    const isDriverPage = (pageNum === 2 && this.gameState === 'lobby');
    if (this.driver1Char) this.driver1Char.group.visible = isDriverPage;
    if (this.driver2Char) this.driver2Char.group.visible = isDriverPage;

    if (isDriverPage) {
      this.syncDriverPositions();
    }
  }

  onDriverChange(driver) {
    this.selectedDriver = driver;
    this.syncDriverPositions();
  }

  syncDriverPositions() {
    if (!this.driver1Char || !this.driver2Char) return;

    const isDriver1Lead = this.selectedDriver.id === this.selectedTeam.drivers[0].id;

    // Foreground Lead Position: (x: -0.65, y: 0, z: 2.1)
    // Midground Teammate Position: (x: 1.9, y: 0, z: 0.6)
    const posFront = { x: -0.65, y: 0, z: 2.1, rotY: 0.15 };
    const posBack = { x: 1.9, y: 0, z: 0.6, rotY: -0.25 };

    if (isDriver1Lead) {
      gsap.to(this.driver1Char.group.position, { ...posFront, duration: 0.5, ease: 'power2.out' });
      gsap.to(this.driver1Char.group.rotation, { y: posFront.rotY, duration: 0.5 });

      gsap.to(this.driver2Char.group.position, { ...posBack, duration: 0.5, ease: 'power2.out' });
      gsap.to(this.driver2Char.group.rotation, { y: posBack.rotY, duration: 0.5 });
    } else {
      gsap.to(this.driver2Char.group.position, { ...posFront, duration: 0.5, ease: 'power2.out' });
      gsap.to(this.driver2Char.group.rotation, { y: posFront.rotY, duration: 0.5 });

      gsap.to(this.driver1Char.group.position, { ...posBack, duration: 0.5, ease: 'power2.out' });
      gsap.to(this.driver1Char.group.rotation, { y: posBack.rotY, duration: 0.5 });
    }
  }

  startRace(team, driver) {
    this.selectedTeam = team;
    this.selectedDriver = driver;
    this.gameState = 'racing';

    // Hide showroom elements during race
    if (this.driver1Char) this.driver1Char.group.visible = false;
    if (this.driver2Char) this.driver2Char.group.visible = false;
    if (this.showroomPodium) this.showroomPodium.visible = false;

    // 1. Build the full 20-car starting grid on Monza!
    const playerSlotIndex = 2; // P3 Grid Box
    this.gridManager.buildGrid(team, driver, playerSlotIndex);

    // 2. Position Player Car in designated grid box
    const slot = this.gridManager.getPlayerGridSlot(playerSlotIndex);
    this.physics.resetPosition(slot.x, slot.y, slot.z, slot.heading);
    this.f1Car.group.position.copy(this.physics.position);
    this.f1Car.group.rotation.y = this.physics.heading;

    // 3. Switch camera to first-person Cockpit Halo view (Matching reference photo!)
    this.cameraController.setMode('cockpit');

    // 4. Initialize HUD and audio
    this.telemetryHUD.initRace(team, driver);
    this.telemetryHUD.show();
    this.soundManager.init();
    this.soundManager.resume();

    // Launch AI cars
    this.gridManager.startRace();
    this.telemetryHUD.showRadioMessage(`"20 cars on the grid! Lights out, push to pass, ${driver.name}!"`);
  }

  openPaddock() {
    if (this.gameState !== 'racing') return;
    this.gameState = 'paddock';

    this.soundManager.playRadioChime();
    this.telemetryHUD.hide();

    this.cameraController.transitionToPaddock(() => {
      this.paddockHUD.show();
    });
  }

  returnToCockpit() {
    if (this.gameState !== 'paddock') return;
    this.paddockHUD.hide();

    this.cameraController.transitionToCockpit(
      this.physics.position,
      this.physics.heading,
      () => {
        this.gameState = 'racing';
        this.telemetryHUD.show();
        this.telemetryHUD.showRadioMessage('"Back on track! All systems nominal."');
      }
    );
  }

  returnToLobby() {
    this.gameState = 'lobby';
    this.telemetryHUD.hide();
    this.paddockHUD.hide();
    this.gridManager.clearGrid();

    if (this.showroomPodium) this.showroomPodium.visible = true;

    this.lobbyUI.show();
    this.cameraController.setMode('showroom');
    this.physics.resetPosition(0, 0, 0, 0);
    this.f1Car.group.position.set(0, 0, 0);
    this.f1Car.group.rotation.set(0, 0, 0);
    this.onTeamChange(this.selectedTeam, this.selectedDriver, 1);
  }

  resetCarToTrack() {
    const nearest = this.monzaTrack.getNearestTrackPoint(this.physics.position);
    if (nearest && nearest.point) {
      const heading = Math.atan2(nearest.tangent.x, nearest.tangent.z);
      this.physics.resetPosition(nearest.point.x, 0.05, nearest.point.z, heading);
      this.telemetryHUD.showRadioMessage('"Car reset to track limits."');
    }
  }

  setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(key)) this.keys.forward = true;
      if (['s', 'arrowdown'].includes(key)) this.keys.backward = true;
      if (['a', 'arrowleft'].includes(key)) this.keys.left = true;
      if (['d', 'arrowright'].includes(key)) this.keys.right = true;
      if (e.code === 'Space') this.keys.boost = true;

      if (key === 'c' && this.gameState === 'racing') {
        const mode = this.cameraController.toggleCameraMode();
        if (this.telemetryHUD.camNameText) this.telemetryHUD.camNameText.textContent = mode;
      }
      if ((key === 'p' || key === 'tab') && this.gameState === 'racing') {
        e.preventDefault();
        this.openPaddock();
      }
      if (key === 'r' && this.gameState === 'racing') {
        this.resetCarToTrack();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(key)) this.keys.forward = false;
      if (['s', 'arrowdown'].includes(key)) this.keys.backward = false;
      if (['a', 'arrowleft'].includes(key)) this.keys.left = false;
      if (['d', 'arrowright'].includes(key)) this.keys.right = false;
      if (e.code === 'Space') this.keys.boost = false;
    });

    // Mobile touch controls
    const bindTouch = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(); });
      el.addEventListener('touchend', (e) => { e.preventDefault(); onUp(); });
      el.addEventListener('mousedown', () => onDown());
      el.addEventListener('mouseup', () => onUp());
    };

    bindTouch('touch-gas', () => this.keys.forward = true, () => this.keys.forward = false);
    bindTouch('touch-brake', () => this.keys.backward = true, () => this.keys.backward = false);
    bindTouch('touch-left', () => this.keys.left = true, () => this.keys.left = false);
    bindTouch('touch-right', () => this.keys.right = true, () => this.keys.right = false);
    bindTouch('touch-drs', () => this.keys.boost = true, () => this.keys.boost = false);

    // Click on 3D Objects
    window.addEventListener('click', (e) => {
      if (e.target.tagName !== 'CANVAS') return;

      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      if (this.gameState === 'racing') {
        const intersects = this.raycaster.intersectObjects(this.f1Car.group.children, true);
        for (let hit of intersects) {
          if (hit.object.name === 'STEERING_PADDOCK_BTN' || hit.object.parent?.name === 'STEERING_PADDOCK_BTN') {
            this.openPaddock();
            break;
          }
        }
      } else if (this.gameState === 'lobby' && this.lobbyPage === 2) {
        if (this.driver1Char && this.driver2Char) {
          const hitD1 = this.raycaster.intersectObjects(this.driver1Char.group.children, true);
          const hitD2 = this.raycaster.intersectObjects(this.driver2Char.group.children, true);
          if (hitD1.length > 0) {
            this.lobbyUI.selectDriver(this.selectedTeam.drivers[0]);
          } else if (hitD2.length > 0) {
            this.lobbyUI.selectDriver(this.selectedTeam.drivers[1]);
          }
        }
      }
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = this.clock.getDelta();

    if (this.gameState === 'racing') {
      let throttle = this.keys.forward ? 1 : 0;
      let brake = this.keys.backward ? 1 : 0;
      let steer = 0;
      if (this.keys.left) steer += 1;
      if (this.keys.right) steer -= 1;

      this.physics.setInputs(throttle, brake, steer, this.keys.boost);
      this.physics.update(dt, this.soundManager);

      this.f1Car.group.position.copy(this.physics.position);
      this.f1Car.group.rotation.y = this.physics.heading;

      const speedKmH = this.physics.velocity.length() * 3.6;
      const rpmRatio = (this.physics.rpm - this.physics.idleRpm) / (this.physics.maxRpm - this.physics.idleRpm);
      this.f1Car.update(this.physics.currentSteer, speedKmH / 300, this.physics.isDrsOpen);
      this.f1Car.updateSteeringScreen(
        speedKmH,
        this.physics.gear === 0 ? 'N' : this.physics.gear,
        this.physics.battery,
        rpmRatio,
        this.physics.engineMode
      );

      this.gridManager.update(dt, this.physics.position);
      this.telemetryHUD.update(this.physics, this.monzaTrack);

      this.dirLight.position.set(
        this.physics.position.x + 80,
        150,
        this.physics.position.z + 60
      );
      this.dirLight.target = this.f1Car.group;
    }

    this.cameraController.update(this.f1Car.group, this.physics, dt);
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new F1PortfolioApp();
});
