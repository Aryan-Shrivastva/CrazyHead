import * as THREE from 'three';

/**
 * 3D Formula 1 Car Model Generator with Realistic Cockpit, Halo, Steering Wheel Display, & Driver Hands
 */
export class F1Car {
  constructor(team) {
    this.team = team;
    this.group = new THREE.Group();
    this.wheels = [];
    this.steerWheels = [];
    this.drsFlap = null;
    this.steeringWheel = null;
    this.steeringDisplayCanvas = null;
    this.steeringDisplayCtx = null;
    this.steeringDisplayTextures = null;
    this.haloMesh = null;
    this.cockpitCameraPosition = new THREE.Vector3(0, 0.72, 0.15); // Cockpit eye point behind halo
    this.tCamPosition = new THREE.Vector3(0, 1.25, -0.2); // T-Cam over airbox
    this.chaseCamPosition = new THREE.Vector3(0, 1.8, -4.5); // Chase camera behind car

    this.materials = {};
    this.initMaterials();
    this.buildCar();
    this.buildCockpitViewElements();
  }

  initMaterials() {
    // Carbon Fiber Material
    this.materials.carbon = new THREE.MeshStandardMaterial({
      color: 0x141414,
      roughness: 0.4,
      metalness: 0.8
    });

    // Dark Carbon for Halo & Splitters
    this.materials.darkCarbon = new THREE.MeshStandardMaterial({
      color: 0x0D0D0D,
      roughness: 0.35,
      metalness: 0.75
    });

    // Team Primary Livery (Car Body, Nose Cone, Sidepods)
    this.materials.body = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.team.color),
      roughness: this.team.bodyRoughness !== undefined ? this.team.bodyRoughness : 0.25,
      metalness: this.team.bodyMetalness !== undefined ? this.team.bodyMetalness : 0.55
    });

    // Team Accent Livery (Front Flaps, Rear Wing, Accents)
    this.materials.accent = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.team.accentColor),
      roughness: 0.3,
      metalness: 0.5
    });

    // Team Sub-Accent
    this.materials.subAccent = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.team.subAccent || '#111111'),
      roughness: 0.35,
      metalness: 0.6
    });

    // Pirelli Tire Rubber
    this.materials.tireRubber = new THREE.MeshStandardMaterial({
      color: 0x151515,
      roughness: 0.85,
      metalness: 0.1
    });

    // Wheel Rims
    this.materials.rims = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.3,
      metalness: 0.9
    });

    // Wheel Center Nut
    this.materials.wheelNut = new THREE.MeshStandardMaterial({
      color: 0xE80020,
      metalness: 0.9,
      roughness: 0.2
    });

    // Driver Gloves
    this.materials.gloves = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.team.suitColor || '#FFFFFF'),
      roughness: 0.7,
      metalness: 0.1
    });

    this.materials.gloveAccent = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.team.suitAccent || this.team.color),
      roughness: 0.6,
      metalness: 0.2
    });

    // Rear Rain Light (Red Emissive)
    this.materials.rainLight = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 2.0
    });
  }

  buildCar() {
    // 1. MAIN CHASSIS MONOCOQUE
    const chassisGeo = new THREE.BoxGeometry(0.75, 0.45, 3.2);
    const chassis = new THREE.Mesh(chassisGeo, this.materials.body);
    chassis.position.set(0, 0.32, 0.2);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.group.add(chassis);

    // 2. NOSE CONE (Tapering to the front)
    const noseGeo = new THREE.ConeGeometry(0.38, 1.8, 8);
    const nose = new THREE.Mesh(noseGeo, this.materials.body);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.26, 2.4);
    nose.scale.set(1, 0.55, 1);
    nose.castShadow = true;
    this.group.add(nose);

    // 3. ENGINE AIRBOX & SHARK FIN
    const airboxGeo = new THREE.BoxGeometry(0.4, 0.5, 1.4);
    const airbox = new THREE.Mesh(airboxGeo, this.materials.body);
    airbox.position.set(0, 0.65, -0.4);
    airbox.castShadow = true;
    this.group.add(airbox);

    // Shark Fin
    const sharkFinShape = new THREE.Shape();
    sharkFinShape.moveTo(0, 0);
    sharkFinShape.lineTo(0, 0.45);
    sharkFinShape.lineTo(-1.2, 0.15);
    sharkFinShape.lineTo(-1.2, 0);
    sharkFinShape.closePath();

    const extrudeSettings = { depth: 0.03, bevelEnabled: false };
    const sharkFinGeo = new THREE.ExtrudeGeometry(sharkFinShape, extrudeSettings);
    const sharkFin = new THREE.Mesh(sharkFinGeo, this.materials.accent);
    sharkFin.position.set(-0.015, 0.6, -0.2);
    this.group.add(sharkFin);

    // 4. SIDEPODS (Left and Right)
    const sidepodGeo = new THREE.BoxGeometry(0.42, 0.4, 1.6);
    const leftSidepod = new THREE.Mesh(sidepodGeo, this.materials.body);
    leftSidepod.position.set(-0.55, 0.3, -0.1);
    leftSidepod.rotation.y = 0.05;
    leftSidepod.castShadow = true;
    this.group.add(leftSidepod);

    const rightSidepod = new THREE.Mesh(sidepodGeo, this.materials.body);
    rightSidepod.position.set(0.55, 0.3, -0.1);
    rightSidepod.rotation.y = -0.05;
    rightSidepod.castShadow = true;
    this.group.add(rightSidepod);

    // Sidepod air intakes
    const intakeGeo = new THREE.BoxGeometry(0.35, 0.28, 0.1);
    const leftIntake = new THREE.Mesh(intakeGeo, this.materials.darkCarbon);
    leftIntake.position.set(-0.55, 0.32, 0.72);
    this.group.add(leftIntake);

    const rightIntake = new THREE.Mesh(intakeGeo, this.materials.darkCarbon);
    rightIntake.position.set(0.55, 0.32, 0.72);
    this.group.add(rightIntake);

    // 5. FRONT WING ASSEMBLY
    const frontWingMainGeo = new THREE.BoxGeometry(1.9, 0.06, 0.55);
    const frontWing = new THREE.Mesh(frontWingMainGeo, this.materials.accent);
    frontWing.position.set(0, 0.12, 3.1);
    frontWing.castShadow = true;
    this.group.add(frontWing);

    // Front Wing Endplates
    const endplateGeo = new THREE.BoxGeometry(0.04, 0.24, 0.65);
    const leftEndplate = new THREE.Mesh(endplateGeo, this.materials.darkCarbon);
    leftEndplate.position.set(-0.95, 0.2, 3.1);
    this.group.add(leftEndplate);

    const rightEndplate = new THREE.Mesh(endplateGeo, this.materials.darkCarbon);
    rightEndplate.position.set(0.95, 0.2, 3.1);
    this.group.add(rightEndplate);

    // 6. REAR WING & DRS ASSEMBLY
    const rearPillarGeo = new THREE.BoxGeometry(0.06, 0.5, 0.2);
    const leftRearPillar = new THREE.Mesh(rearPillarGeo, this.materials.darkCarbon);
    leftRearPillar.position.set(-0.25, 0.65, -1.6);
    this.group.add(leftRearPillar);

    const rightRearPillar = new THREE.Mesh(rearPillarGeo, this.materials.darkCarbon);
    rightRearPillar.position.set(0.25, 0.65, -1.6);
    this.group.add(rightRearPillar);

    const rearWingLowerGeo = new THREE.BoxGeometry(1.4, 0.06, 0.35);
    const rearWingLower = new THREE.Mesh(rearWingLowerGeo, this.materials.accent);
    rearWingLower.position.set(0, 0.85, -1.65);
    this.group.add(rearWingLower);

    // Active DRS Flap
    const drsFlapGeo = new THREE.BoxGeometry(1.38, 0.04, 0.22);
    this.drsFlap = new THREE.Mesh(drsFlapGeo, this.materials.body);
    this.drsFlap.position.set(0, 0.95, -1.68);
    this.group.add(this.drsFlap);

    // Rear Wing Endplates
    const rearEndplateGeo = new THREE.BoxGeometry(0.04, 0.45, 0.5);
    const leftRearEndplate = new THREE.Mesh(rearEndplateGeo, this.materials.darkCarbon);
    leftRearEndplate.position.set(-0.7, 0.8, -1.65);
    this.group.add(leftRearEndplate);

    const rightRearEndplate = new THREE.Mesh(rearEndplateGeo, this.materials.darkCarbon);
    rightRearEndplate.position.set(0.7, 0.8, -1.65);
    this.group.add(rightRearEndplate);

    // Rear Blinking Rain Light
    const rainLightGeo = new THREE.BoxGeometry(0.12, 0.08, 0.05);
    const rainLight = new THREE.Mesh(rainLightGeo, this.materials.rainLight);
    rainLight.position.set(0, 0.25, -1.72);
    this.group.add(rainLight);

    // 7. WHEELS & SUSPENSION WISHBONES
    this.buildWheels();
    this.buildSuspension();
  }

  buildWheels() {
    const tireRadius = 0.36;
    const tireWidthFront = 0.32;
    const tireWidthRear = 0.40;

    const wheelPositions = [
      { name: 'FL', x: -0.92, y: 0.36, z: 1.8, isFront: true, width: tireWidthFront },
      { name: 'FR', x: 0.92, y: 0.36, z: 1.8, isFront: true, width: tireWidthFront },
      { name: 'RL', x: -0.95, y: 0.36, z: -1.2, isFront: false, width: tireWidthRear },
      { name: 'RR', x: 0.95, y: 0.36, z: -1.2, isFront: false, width: tireWidthRear }
    ];

    wheelPositions.forEach((pos) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, pos.y, pos.z);

      // Tire cylinder
      const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, pos.width, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, this.materials.tireRubber);
      tireMesh.castShadow = true;
      wheelGroup.add(tireMesh);

      // Rim cylinder
      const rimGeo = new THREE.CylinderGeometry(tireRadius * 0.65, tireRadius * 0.65, pos.width + 0.01, 16);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, this.materials.rims);
      wheelGroup.add(rimMesh);

      // Center Wheel Nut
      const nutGeo = new THREE.CylinderGeometry(0.05, 0.05, pos.width + 0.03, 8);
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
    const wishboneMat = this.materials.darkCarbon;
    const wishboneGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6);
    wishboneGeo.rotateZ(Math.PI / 2);

    // Front left wishbones
    const flWishbone = new THREE.Mesh(wishboneGeo, wishboneMat);
    flWishbone.position.set(-0.55, 0.36, 1.8);
    this.group.add(flWishbone);

    // Front right wishbones
    const frWishbone = new THREE.Mesh(wishboneGeo, wishboneMat);
    frWishbone.position.set(0.55, 0.36, 1.8);
    this.group.add(frWishbone);

    // Rear wishbones
    const rlWishbone = new THREE.Mesh(wishboneGeo, wishboneMat);
    rlWishbone.position.set(-0.58, 0.36, -1.2);
    this.group.add(rlWishbone);

    const rrWishbone = new THREE.Mesh(wishboneGeo, wishboneMat);
    rrWishbone.position.set(0.58, 0.36, -1.2);
    this.group.add(rrWishbone);
  }

  buildCockpitViewElements() {
    // 1. TITANIUM / CARBON FIBER HALO (MATCHING REFERENCE IMAGE)
    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, 0.65, 0.45);

    const centerStrutGeo = new THREE.CylinderGeometry(0.024, 0.028, 0.42, 12);
    const centerStrut = new THREE.Mesh(centerStrutGeo, this.materials.darkCarbon);
    centerStrut.position.set(0, 0.05, 0.45);
    centerStrut.rotation.x = -0.15;
    haloGroup.add(centerStrut);

    const haloCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.32, 0.22, -0.4),
      new THREE.Vector3(-0.34, 0.24, 0.0),
      new THREE.Vector3(-0.25, 0.25, 0.35),
      new THREE.Vector3(0.0, 0.26, 0.48),
      new THREE.Vector3(0.25, 0.25, 0.35),
      new THREE.Vector3(0.34, 0.24, 0.0),
      new THREE.Vector3(0.32, 0.22, -0.4)
    ]);

    const haloTubeGeo = new THREE.TubeGeometry(haloCurve, 32, 0.032, 12, false);
    this.haloMesh = new THREE.Mesh(haloTubeGeo, this.materials.darkCarbon);
    haloGroup.add(this.haloMesh);

    const mountGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.25, 8);
    const leftMount = new THREE.Mesh(mountGeo, this.materials.darkCarbon);
    leftMount.position.set(-0.32, 0.12, -0.4);
    leftMount.rotation.z = 0.2;
    haloGroup.add(leftMount);

    const rightMount = new THREE.Mesh(mountGeo, this.materials.darkCarbon);
    rightMount.position.set(0.32, 0.12, -0.4);
    rightMount.rotation.z = -0.2;
    haloGroup.add(rightMount);

    this.group.add(haloGroup);

    // 2. F1 MULTI-FUNCTION STEERING WHEEL & DIGITAL LCD TELEMETRY SCREEN
    this.steeringWheel = new THREE.Group();
    this.steeringWheel.position.set(0, 0.52, 0.55);

    const wheelBaseGeo = new THREE.BoxGeometry(0.38, 0.24, 0.04);
    const wheelBase = new THREE.Mesh(wheelBaseGeo, this.materials.darkCarbon);
    this.steeringWheel.add(wheelBase);

    const gripGeo = new THREE.CylinderGeometry(0.025, 0.028, 0.22, 12);
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

    const buttonColors = [0xE80020, 0x00D2BE, 0xFFC800, 0x34C759, 0x007AFF, 0xAF52DE];
    const buttonPositions = [
      [-0.12, 0.07], [0.12, 0.07],
      [-0.12, -0.05], [0.12, -0.05],
      [-0.06, -0.08], [0.06, -0.08]
    ];

    buttonPositions.forEach((pos, idx) => {
      const btnGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.015, 8);
      btnGeo.rotateX(Math.PI / 2);
      const btnMat = new THREE.MeshStandardMaterial({
        color: buttonColors[idx % buttonColors.length],
        roughness: 0.3
      });
      const btn = new THREE.Mesh(btnGeo, btnMat);
      btn.position.set(pos[0], pos[1], 0.022);
      this.steeringWheel.add(btn);
    });

    const paddockBtnGeo = new THREE.BoxGeometry(0.06, 0.022, 0.015);
    const paddockBtnMat = new THREE.MeshStandardMaterial({
      color: 0xE80020,
      emissive: 0x550000,
      roughness: 0.2
    });
    const paddockBtn = new THREE.Mesh(paddockBtnGeo, paddockBtnMat);
    paddockBtn.position.set(0, -0.08, 0.022);
    paddockBtn.name = 'STEERING_PADDOCK_BTN';
    this.steeringWheel.add(paddockBtn);

    // 3. DRIVER HANDS & GLOVES
    const leftHand = new THREE.Group();
    leftHand.position.set(-0.19, -0.01, 0.02);

    const handGeo = new THREE.SphereGeometry(0.038, 12, 12);
    handGeo.scale(1, 1.4, 1.1);
    const leftGloveMesh = new THREE.Mesh(handGeo, this.materials.gloves);
    leftHand.add(leftGloveMesh);

    const armGeo = new THREE.CylinderGeometry(0.036, 0.042, 0.25, 12);
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

    // Side Mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.16, 0.08, 0.06);
    const leftMirror = new THREE.Mesh(mirrorGeo, this.materials.body);
    leftMirror.position.set(-0.48, 0.54, 0.6);
    leftMirror.rotation.y = 0.2;
    this.group.add(leftMirror);

    const rightMirror = new THREE.Mesh(mirrorGeo, this.materials.body);
    rightMirror.position.set(0.48, 0.54, 0.6);
    rightMirror.rotation.y = -0.2;
    this.group.add(rightMirror);

    this.group.add(this.steeringWheel);
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

    ctx.fillStyle = '#34C759';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('FL: 98°C', 40, 85);
    ctx.fillText('RL: 102°C', 40, 115);

    ctx.textAlign = 'right';
    ctx.fillText('FR: 99°C', w - 40, 85);
    ctx.fillText('RR: 104°C', w - 40, 115);

    if (this.steeringDisplayTextures) {
      this.steeringDisplayTextures.needsUpdate = true;
    }
  }

  updateTeam(team) {
    this.team = team;
    this.materials.body.color.set(team.color);
    if (team.bodyRoughness !== undefined) this.materials.body.roughness = team.bodyRoughness;
    if (team.bodyMetalness !== undefined) this.materials.body.metalness = team.bodyMetalness;
    this.materials.body.needsUpdate = true;

    this.materials.accent.color.set(team.accentColor);
    this.materials.accent.needsUpdate = true;

    if (this.materials.subAccent) {
      this.materials.subAccent.color.set(team.subAccent || '#111111');
      this.materials.subAccent.needsUpdate = true;
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
      this.steeringWheel.rotation.z = -steeringAngle * 1.6;
    }

    this.wheels.forEach(wheel => {
      wheel.children[0].rotation.x += speedRatio * 0.4;
    });

    if (this.drsFlap) {
      this.drsFlap.rotation.x = isDrsOpen ? -0.35 : 0;
    }
  }
}
