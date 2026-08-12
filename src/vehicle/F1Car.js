import * as THREE from 'three';

/**
 * Formula 1 Low-Poly 3D Car Model Generator (Matching Reference Image 1)
 * Sleek aerodynamic geometry with clean chamfers, driver helmet with visor,
 * titanium halo, coke-bottle sidepods, 6-spoke racing rims, and multi-tier wings.
 */
export class F1Car {
  constructor(team) {
    this.team = team;
    this.group = new THREE.Group();
    this.wheels = [];
    this.steerWheels = [];

    // Steering and Cockpit
    this.steeringWheel = null;
    this.steeringDisplayCanvas = null;
    this.steeringDisplayCtx = null;
    this.steeringDisplayTextures = null;
    this.haloMesh = null;
    this.driverHead = null;

    this.materials = {};
    this.initMaterials();
    this.buildCar();
    this.buildCockpitViewElements();
  }

  initMaterials() {
    this.materials.carbon = new THREE.MeshStandardMaterial({
      color: 0x181A20,
      roughness: 0.5,
      metalness: 0.7,
      flatShading: true
    });

    this.materials.floorDark = new THREE.MeshStandardMaterial({
      color: 0x22262E,
      roughness: 0.6,
      metalness: 0.4,
      flatShading: true
    });

    this.materials.body = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.team.color),
      roughness: 0.3,
      metalness: 0.45,
      flatShading: true
    });

    this.materials.accent = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.team.accentColor),
      roughness: 0.35,
      metalness: 0.4,
      flatShading: true
    });

    this.materials.subAccent = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.team.subAccent || '#2C3539'),
      roughness: 0.4,
      metalness: 0.5,
      flatShading: true
    });

    this.materials.tireRubber = new THREE.MeshStandardMaterial({
      color: 0x141619,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });

    this.materials.rims = new THREE.MeshStandardMaterial({
      color: 0xEDEDED, // Clean white/silver rims matching image
      roughness: 0.25,
      metalness: 0.85,
      flatShading: true
    });

    this.materials.wheelNut = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.2
    });

    this.materials.helmet = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.team.helmetColor || this.team.color),
      roughness: 0.25,
      metalness: 0.5,
      flatShading: true
    });

    this.materials.visor = new THREE.MeshStandardMaterial({
      color: 0x76E4F7, // Bright cyan/blue visor reflection matching image
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x1A4050,
      emissiveIntensity: 0.6
    });

    this.materials.gloves = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.team.suitColor || '#FFFFFF'),
      roughness: 0.6,
      metalness: 0.2
    });

    this.materials.gloveAccent = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.team.suitAccent || this.team.color),
      roughness: 0.5,
      metalness: 0.2
    });

    this.materials.rainLight = new THREE.MeshStandardMaterial({
      color: 0xFF1A1A,
      emissive: 0xFF0000,
      emissiveIntensity: 2.5
    });
  }

  buildCar() {
    // 1. UNDERFLOOR & DIFFUSER (Dark grey carbon aero floor)
    const floorGeo = new THREE.BoxGeometry(1.4, 0.08, 3.4);
    const floorMesh = new THREE.Mesh(floorGeo, this.materials.floorDark);
    floorMesh.position.set(0, 0.12, 0.1);
    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // 2. MAIN MONOCOQUE CHASSIS
    const monocoqueGeo = new THREE.BoxGeometry(0.72, 0.38, 2.4);
    const monocoque = new THREE.Mesh(monocoqueGeo, this.materials.body);
    monocoque.position.set(0, 0.32, 0.1);
    monocoque.castShadow = true;
    this.group.add(monocoque);

    // 3. SHARP TAPERING NOSE CONE (Matching Reference Image 1)
    const noseGeo = new THREE.CylinderGeometry(0.12, 0.36, 1.8, 6);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, this.materials.body);
    nose.position.set(0, 0.28, 2.1);
    nose.scale.set(1, 0.65, 1);
    nose.castShadow = true;
    this.group.add(nose);

    // Nose Accent Stripe
    const noseStripeGeo = new THREE.BoxGeometry(0.16, 0.04, 1.7);
    const noseStripe = new THREE.Mesh(noseStripeGeo, this.materials.accent);
    noseStripe.position.set(0, 0.38, 2.1);
    this.group.add(noseStripe);

    // 4. FRONT WING (Multi-tier with endplates & accent flaps)
    const frontWingMainGeo = new THREE.BoxGeometry(2.1, 0.06, 0.6);
    const frontWingMain = new THREE.Mesh(frontWingMainGeo, this.materials.floorDark);
    frontWingMain.position.set(0, 0.10, 2.9);
    frontWingMain.castShadow = true;
    this.group.add(frontWingMain);

    // Left & Right Upper Flaps (Team colored)
    const flapGeo = new THREE.BoxGeometry(0.9, 0.04, 0.35);
    const leftFlap = new THREE.Mesh(flapGeo, this.materials.accent);
    leftFlap.position.set(-0.52, 0.15, 2.88);
    leftFlap.rotation.x = -0.15;
    this.group.add(leftFlap);

    const rightFlap = new THREE.Mesh(flapGeo, this.materials.accent);
    rightFlap.position.set(0.52, 0.15, 2.88);
    rightFlap.rotation.x = -0.15;
    this.group.add(rightFlap);

    // Endplates
    const endplateGeo = new THREE.BoxGeometry(0.04, 0.28, 0.7);
    const leftEndplate = new THREE.Mesh(endplateGeo, this.materials.carbon);
    leftEndplate.position.set(-1.05, 0.18, 2.9);
    this.group.add(leftEndplate);

    const rightEndplate = new THREE.Mesh(endplateGeo, this.materials.carbon);
    rightEndplate.position.set(1.05, 0.18, 2.9);
    this.group.add(rightEndplate);

    // 5. SCULPTED SIDEPODS (Coke-bottle packaging)
    const sidepodGeo = new THREE.BoxGeometry(0.44, 0.36, 1.6);
    
    // Left Sidepod
    const leftSidepod = new THREE.Mesh(sidepodGeo, this.materials.body);
    leftSidepod.position.set(-0.56, 0.28, -0.1);
    leftSidepod.rotation.y = 0.06;
    leftSidepod.castShadow = true;
    this.group.add(leftSidepod);

    // Left Undercut Accent
    const undercutGeo = new THREE.BoxGeometry(0.38, 0.12, 1.4);
    const leftUndercut = new THREE.Mesh(undercutGeo, this.materials.accent);
    leftUndercut.position.set(-0.58, 0.18, -0.05);
    this.group.add(leftUndercut);

    // Right Sidepod
    const rightSidepod = new THREE.Mesh(sidepodGeo, this.materials.body);
    rightSidepod.position.set(0.56, 0.28, -0.1);
    rightSidepod.rotation.y = -0.06;
    rightSidepod.castShadow = true;
    this.group.add(rightSidepod);

    // Right Undercut Accent
    const rightUndercut = new THREE.Mesh(undercutGeo, this.materials.accent);
    rightUndercut.position.set(0.58, 0.18, -0.05);
    this.group.add(rightUndercut);

    // 6. ENGINE AIRBOX & SHARK FIN WITH T-CAM
    const airboxGeo = new THREE.BoxGeometry(0.36, 0.45, 1.2);
    const airbox = new THREE.Mesh(airboxGeo, this.materials.body);
    airbox.position.set(0, 0.62, -0.35);
    airbox.castShadow = true;
    this.group.add(airbox);

    // Air Intake Scoop (Cyan / Accent colored)
    const intakeGeo = new THREE.BoxGeometry(0.24, 0.12, 0.2);
    const intake = new THREE.Mesh(intakeGeo, this.materials.accent);
    intake.position.set(0, 0.76, 0.1);
    this.group.add(intake);

    // T-Cam on top
    const tCamGeo = new THREE.BoxGeometry(0.18, 0.04, 0.06);
    const tCam = new THREE.Mesh(tCamGeo, this.materials.carbon);
    tCam.position.set(0, 0.88, -0.15);
    this.group.add(tCam);

    // 7. DRIVER IN COCKPIT (Helmet with Visor)
    const headGeo = new THREE.SphereGeometry(0.14, 12, 10);
    this.driverHead = new THREE.Mesh(headGeo, this.materials.helmet);
    this.driverHead.position.set(0, 0.52, 0.25);
    this.group.add(this.driverHead);

    const visorGeo = new THREE.BoxGeometry(0.18, 0.05, 0.08);
    const visor = new THREE.Mesh(visorGeo, this.materials.visor);
    visor.position.set(0, 0.53, 0.35);
    this.group.add(visor);

    // 8. TITANIUM HALO
    const haloCenterGeo = new THREE.CylinderGeometry(0.022, 0.024, 0.38, 8);
    const haloCenter = new THREE.Mesh(haloCenterGeo, this.materials.carbon);
    haloCenter.position.set(0, 0.62, 0.55);
    haloCenter.rotation.x = -0.12;
    this.group.add(haloCenter);

    const haloRingGeo = new THREE.TorusGeometry(0.24, 0.024, 8, 16, Math.PI);
    haloRingGeo.rotateX(Math.PI / 2);
    this.haloMesh = new THREE.Mesh(haloRingGeo, this.materials.carbon);
    this.haloMesh.position.set(0, 0.74, 0.32);
    this.haloMesh.scale.set(1.1, 1, 1.4);
    this.group.add(this.haloMesh);

    // 9. REAR WING
    const rearPillarGeo = new THREE.BoxGeometry(0.05, 0.55, 0.18);
    const leftPillar = new THREE.Mesh(rearPillarGeo, this.materials.carbon);
    leftPillar.position.set(-0.25, 0.65, -1.55);
    this.group.add(leftPillar);

    const rightPillar = new THREE.Mesh(rearPillarGeo, this.materials.carbon);
    rightPillar.position.set(0.25, 0.65, -1.55);
    this.group.add(rightPillar);

    const rearWingGeo = new THREE.BoxGeometry(1.5, 0.06, 0.4);
    const rearWing = new THREE.Mesh(rearWingGeo, this.materials.accent);
    rearWing.position.set(0, 0.88, -1.6);
    this.group.add(rearWing);

    const rearUpperFlapGeo = new THREE.BoxGeometry(1.48, 0.04, 0.25);
    const rearUpperFlap = new THREE.Mesh(rearUpperFlapGeo, this.materials.body);
    rearUpperFlap.position.set(0, 0.98, -1.65);
    this.group.add(rearUpperFlap);

    const rearEndplateGeo = new THREE.BoxGeometry(0.04, 0.5, 0.55);
    const leftRearEndplate = new THREE.Mesh(rearEndplateGeo, this.materials.carbon);
    leftRearEndplate.position.set(-0.75, 0.8, -1.6);
    this.group.add(leftRearEndplate);

    const rightRearEndplate = new THREE.Mesh(rearEndplateGeo, this.materials.carbon);
    rightRearEndplate.position.set(0.75, 0.8, -1.6);
    this.group.add(rightRearEndplate);

    // Rear Rain Light
    const rainLightGeo = new THREE.BoxGeometry(0.12, 0.08, 0.05);
    const rainLight = new THREE.Mesh(rainLightGeo, this.materials.rainLight);
    rainLight.position.set(0, 0.25, -1.72);
    this.group.add(rainLight);

    // 10. WHEELS & SUSPENSION (Low-poly styled with silver/white 6-spoke rims)
    this.buildWheels();
    this.buildSuspension();
  }

  buildWheels() {
    const tireRadius = 0.38;
    const tireWidthFront = 0.34;
    const tireWidthRear = 0.42;

    const wheelPositions = [
      { name: 'FL', x: -0.96, y: 0.38, z: 1.8, isFront: true, width: tireWidthFront },
      { name: 'FR', x: 0.96, y: 0.38, z: 1.8, isFront: true, width: tireWidthFront },
      { name: 'RL', x: -1.0, y: 0.38, z: -1.2, isFront: false, width: tireWidthRear },
      { name: 'RR', x: 1.0, y: 0.38, z: -1.2, isFront: false, width: tireWidthRear }
    ];

    wheelPositions.forEach((pos) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, pos.y, pos.z);

      // Low-poly tire rubber
      const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, pos.width, 16);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, this.materials.tireRubber);
      tireMesh.castShadow = true;
      wheelGroup.add(tireMesh);

      // Clean White/Silver Rim Hub (Matching Image 1)
      const rimGeo = new THREE.CylinderGeometry(tireRadius * 0.62, tireRadius * 0.62, pos.width + 0.01, 8);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, this.materials.rims);
      wheelGroup.add(rimMesh);

      // 6-Spoke Hub center
      const nutGeo = new THREE.CylinderGeometry(0.08, 0.08, pos.width + 0.03, 6);
      nutGeo.rotateZ(Math.PI / 2);
      const nutMesh = new THREE.Mesh(nutGeo, this.materials.wheelNut);
      wheelGroup.add(nutMesh);

      this.group.add(wheelGroup);
      this.wheels.push(wheelGroup);

      if (pos.isFront) {
        this.steerWheels.push(wheelGroup);
      }
    });
  }

  buildSuspension() {
    const wishboneMat = this.materials.carbon;
    const wishboneGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.75, 6);
    wishboneGeo.rotateZ(Math.PI / 2);

    const flWishbone = new THREE.Mesh(wishboneGeo, wishboneMat);
    flWishbone.position.set(-0.58, 0.36, 1.8);
    this.group.add(flWishbone);

    const frWishbone = new THREE.Mesh(wishboneGeo, wishboneMat);
    frWishbone.position.set(0.58, 0.36, 1.8);
    this.group.add(frWishbone);

    const rlWishbone = new THREE.Mesh(wishboneGeo, wishboneMat);
    rlWishbone.position.set(-0.62, 0.36, -1.2);
    this.group.add(rlWishbone);

    const rrWishbone = new THREE.Mesh(wishboneGeo, wishboneMat);
    rrWishbone.position.set(0.62, 0.36, -1.2);
    this.group.add(rrWishbone);
  }

  buildCockpitViewElements() {
    // F1 Steering Wheel
    this.steeringWheel = new THREE.Group();
    this.steeringWheel.position.set(0, 0.52, 0.55);

    const wheelBaseGeo = new THREE.BoxGeometry(0.38, 0.24, 0.04);
    const wheelBase = new THREE.Mesh(wheelBaseGeo, this.materials.carbon);
    this.steeringWheel.add(wheelBase);

    const gripGeo = new THREE.CylinderGeometry(0.025, 0.028, 0.22, 10);
    const leftGrip = new THREE.Mesh(gripGeo, this.materials.tireRubber);
    leftGrip.position.set(-0.18, 0, 0.01);
    this.steeringWheel.add(leftGrip);

    const rightGrip = new THREE.Mesh(gripGeo, this.materials.tireRubber);
    rightGrip.position.set(0.18, 0, 0.01);
    this.steeringWheel.add(rightGrip);

    this.steeringDisplayCanvas = document.createElement('canvas');
    this.steeringDisplayCanvas.width = 512;
    this.steeringDisplayCanvas.height = 280;
    this.steeringDisplayCtx = this.steeringDisplayCanvas.getContext('2d');
    this.updateSteeringScreen(0, 'N', 100, 0, 'HARVESTING');

    this.steeringDisplayTextures = new THREE.CanvasTexture(this.steeringDisplayCanvas);
    this.steeringDisplayTextures.minFilter = THREE.LinearFilter;

    const screenMat = new THREE.MeshBasicMaterial({
      map: this.steeringDisplayTextures
    });

    const screenGeo = new THREE.PlaneGeometry(0.20, 0.11);
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0.01, 0.022);
    this.steeringWheel.add(screenMesh);

    // Steering Paddock Quick Button
    const paddockBtnGeo = new THREE.BoxGeometry(0.06, 0.022, 0.015);
    const paddockBtnMat = new THREE.MeshStandardMaterial({
      color: 0x00D2BE,
      emissive: 0x00665E,
      roughness: 0.2
    });
    const paddockBtn = new THREE.Mesh(paddockBtnGeo, paddockBtnMat);
    paddockBtn.position.set(0, -0.08, 0.022);
    paddockBtn.name = 'STEERING_PADDOCK_BTN';
    this.steeringWheel.add(paddockBtn);

    // Driver Hands & Gloves
    const handGeo = new THREE.SphereGeometry(0.038, 8, 8);
    handGeo.scale(1, 1.4, 1.1);

    const leftHand = new THREE.Group();
    leftHand.position.set(-0.19, -0.01, 0.02);
    const leftGloveMesh = new THREE.Mesh(handGeo, this.materials.gloves);
    leftHand.add(leftGloveMesh);

    const armGeo = new THREE.CylinderGeometry(0.036, 0.042, 0.25, 8);
    armGeo.rotateX(-Math.PI / 4);
    const leftArm = new THREE.Mesh(armGeo, this.materials.gloveAccent);
    leftArm.position.set(-0.03, -0.12, -0.08);
    leftHand.add(leftArm);
    this.steeringWheel.add(leftHand);

    const rightHand = new THREE.Group();
    rightHand.position.set(0.19, -0.01, 0.02);
    const rightGloveMesh = new THREE.Mesh(handGeo, this.materials.gloves);
    rightHand.add(rightGloveMesh);

    const rightArm = new THREE.Mesh(armGeo, this.materials.gloveAccent);
    rightArm.position.set(0.03, -0.12, -0.08);
    rightHand.add(rightArm);
    this.steeringWheel.add(rightHand);

    this.group.add(this.steeringWheel);
  }

  repairAllDamage() {
    // Damage-free model
  }

  updateSteeringScreen(speedKmH, gear, batteryPercent, rpmRatio, mode = 'HARVESTING') {
    if (!this.steeringDisplayCtx) return;
    const ctx = this.steeringDisplayCtx;
    const w = this.steeringDisplayCanvas.width;
    const h = this.steeringDisplayCanvas.height;

    ctx.fillStyle = '#06090E';
    ctx.fillRect(0, 0, w, h);

    const ledCount = 15;
    const ledWidth = 24;
    const startX = (w - (ledCount * (ledWidth + 4))) / 2;
    for (let i = 0; i < ledCount; i++) {
      const active = (i / ledCount) <= rpmRatio;
      if (i < 5) {
        ctx.fillStyle = active ? '#34C759' : '#0B2612';
      } else if (i < 10) {
        ctx.fillStyle = active ? '#FF3B30' : '#2A0B08';
      } else {
        ctx.fillStyle = active ? '#007AFF' : '#06172A';
      }
      ctx.fillRect(startX + i * (ledWidth + 4), 10, ledWidth, 12);
    }

    ctx.fillStyle = '#8E9BAE';
    ctx.font = 'bold 18px "Orbitron", monospace';
    ctx.fillText('DRS K2', 30, 48);
    ctx.fillText('+0.183 ▲', w - 130, 48);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 82px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${gear}`, w / 2, 135);

    ctx.fillStyle = '#00D2BE';
    ctx.font = 'bold 28px "Orbitron", monospace';
    ctx.fillText(`${Math.round(speedKmH)} KM/H`, w / 2, 175);

    ctx.fillStyle = '#1A2333';
    ctx.fillRect(40, 195, w - 80, 18);
    ctx.fillStyle = '#00D2BE';
    ctx.fillRect(40, 195, (w - 80) * (batteryPercent / 100), 18);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px "Orbitron", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`BATT: ${Math.round(batteryPercent)}%`, 40, 240);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFC800';
    ctx.fillText(mode, w - 40, 240);

    if (this.steeringDisplayTextures) {
      this.steeringDisplayTextures.needsUpdate = true;
    }
  }

  updateTeam(team) {
    this.team = team;
    this.materials.body.color.set(team.color);
    this.materials.body.needsUpdate = true;

    this.materials.accent.color.set(team.accentColor);
    this.materials.accent.needsUpdate = true;

    if (this.materials.subAccent) {
      this.materials.subAccent.color.set(team.subAccent || '#2C3539');
      this.materials.subAccent.needsUpdate = true;
    }

    if (this.materials.helmet) {
      this.materials.helmet.color.set(team.helmetColor || team.color);
      this.materials.helmet.needsUpdate = true;
    }

    if (this.materials.gloves) {
      this.materials.gloves.color.set(team.suitColor || '#FFFFFF');
      this.materials.gloves.needsUpdate = true;
    }
    if (this.materials.gloveAccent) {
      this.materials.gloveAccent.color.set(team.suitAccent || team.color);
      this.materials.gloveAccent.needsUpdate = true;
    }
  }

  update(steeringAngle, speedRatio, isDrsOpen) {
    this.steerWheels.forEach(wheel => {
      wheel.rotation.y = steeringAngle * 0.5;
    });

    if (this.steeringWheel) {
      this.steeringWheel.rotation.z = -steeringAngle * 1.5;
    }

    this.wheels.forEach(wheel => {
      wheel.children[0].rotation.x += speedRatio * 0.4;
    });
  }
}
