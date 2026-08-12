import * as THREE from 'three';

/**
 * 3D Stylized F1 Driver Character in Official Team Racing Overalls & Helmet
 */
export class DriverCharacter {
  constructor(driverData, teamData, isForeground = true) {
    this.driver = driverData;
    this.team = teamData;
    this.isForeground = isForeground;
    this.group = new THREE.Group();

    this.initMaterials();
    this.buildCharacter();
  }

  initMaterials() {
    // Suit Primary Color
    const suitColor = this.team.suitColor || '#FFFFFF';
    this.suitMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(suitColor),
      roughness: 0.6,
      metalness: 0.15
    });

    // Suit Accents / Stripes
    const accentColor = this.team.suitAccent || this.team.color;
    this.accentMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentColor),
      roughness: 0.5,
      metalness: 0.2
    });

    // Belt
    this.beltMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.7
    });

    // Skin Tone
    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xE0AC69,
      roughness: 0.8
    });

    // Hair
    this.hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x1F1A17,
      roughness: 0.9
    });

    // Racing Helmet
    const helmetColor = this.team.helmetColor || this.team.accentColor || this.team.color;
    this.helmetMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(helmetColor),
      roughness: 0.2,
      metalness: 0.6
    });

    // Helmet Visor
    this.visorMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.1,
      metalness: 0.95
    });

    // Boots
    this.bootsMaterial = new THREE.MeshStandardMaterial({
      color: 0x181818,
      roughness: 0.8
    });
  }

  buildCharacter() {
    const characterRoot = new THREE.Group();

    // 1. TORSO (Racing Suit Monocoque)
    const torsoGeo = new THREE.BoxGeometry(0.38, 0.58, 0.22);
    const torso = new THREE.Mesh(torsoGeo, this.suitMaterial);
    torso.position.y = 1.15;
    torso.castShadow = true;
    characterRoot.add(torso);

    // Torso Team Stripe
    const stripeGeo = new THREE.BoxGeometry(0.12, 0.58, 0.225);
    const stripe = new THREE.Mesh(stripeGeo, this.accentMaterial);
    stripe.position.set(0.08, 1.15, 0);
    characterRoot.add(stripe);

    // Belt
    const beltGeo = new THREE.BoxGeometry(0.39, 0.07, 0.23);
    const belt = new THREE.Mesh(beltGeo, this.beltMaterial);
    belt.position.y = 0.88;
    characterRoot.add(belt);

    // 2. LEGS & RACING PANTS
    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.8, 12);
    const leftLeg = new THREE.Mesh(legGeo, this.suitMaterial);
    leftLeg.position.set(-0.11, 0.45, 0);
    leftLeg.castShadow = true;
    characterRoot.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, this.suitMaterial);
    rightLeg.position.set(0.11, 0.45, 0);
    rightLeg.castShadow = true;
    characterRoot.add(rightLeg);

    // Boots
    const bootGeo = new THREE.BoxGeometry(0.11, 0.1, 0.22);
    const leftBoot = new THREE.Mesh(bootGeo, this.bootsMaterial);
    leftBoot.position.set(-0.11, 0.05, 0.04);
    characterRoot.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, this.bootsMaterial);
    rightBoot.position.set(0.11, 0.05, 0.04);
    characterRoot.add(rightBoot);

    // 3. HEAD, NECK & FACE
    const neckGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10);
    const neck = new THREE.Mesh(neckGeo, this.skinMaterial);
    neck.position.y = 1.48;
    characterRoot.add(neck);

    const headGeo = new THREE.SphereGeometry(0.11, 16, 16);
    headGeo.scale(1, 1.15, 1.05);
    const head = new THREE.Mesh(headGeo, this.skinMaterial);
    head.position.y = 1.62;
    head.castShadow = true;
    characterRoot.add(head);

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.115, 14, 14);
    hairGeo.scale(1.02, 1.0, 1.05);
    const hair = new THREE.Mesh(hairGeo, this.hairMaterial);
    hair.position.set(0, 1.66, -0.02);
    characterRoot.add(hair);

    // 4. ARMS & HANDS
    const armGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.6, 10);
    const rightArm = new THREE.Mesh(armGeo, this.suitMaterial);
    rightArm.position.set(0.25, 1.15, 0);
    rightArm.rotation.z = -0.15;
    characterRoot.add(rightArm);

    const rightHandGeo = new THREE.SphereGeometry(0.045, 10, 10);
    const rightHand = new THREE.Mesh(rightHandGeo, this.skinMaterial);
    rightHand.position.set(0.31, 0.82, 0);
    characterRoot.add(rightHand);

    // Left Arm holding Helmet at hip
    const upperArmGeo = new THREE.CylinderGeometry(0.065, 0.06, 0.32, 10);
    const leftUpperArm = new THREE.Mesh(upperArmGeo, this.suitMaterial);
    leftUpperArm.position.set(-0.25, 1.25, 0.06);
    leftUpperArm.rotation.set(0.3, 0, 0.25);
    characterRoot.add(leftUpperArm);

    const forearmGeo = new THREE.CylinderGeometry(0.06, 0.055, 0.32, 10);
    const leftForearm = new THREE.Mesh(forearmGeo, this.suitMaterial);
    leftForearm.position.set(-0.24, 1.05, 0.18);
    leftForearm.rotation.set(-0.6, 0.3, 0);
    characterRoot.add(leftForearm);

    // 5. RACING HELMET
    const helmetGroup = new THREE.Group();
    helmetGroup.position.set(-0.28, 1.05, 0.22);
    helmetGroup.rotation.set(0.2, -0.4, 0.3);

    const helmetDomeGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const helmetDome = new THREE.Mesh(helmetDomeGeo, this.helmetMaterial);
    helmetGroup.add(helmetDome);

    const visorGeo = new THREE.BoxGeometry(0.13, 0.05, 0.12);
    const visor = new THREE.Mesh(visorGeo, this.visorMaterial);
    visor.position.set(0, 0, 0.06);
    helmetGroup.add(visor);

    characterRoot.add(helmetGroup);

    this.group.add(characterRoot);
  }

  updateTeamAndDriver(driverData, teamData) {
    this.driver = driverData;
    this.team = teamData;

    const suitColor = this.team.suitColor || '#FFFFFF';
    const accentColor = this.team.suitAccent || this.team.color;
    const helmetColor = this.team.helmetColor || this.team.accentColor || this.team.color;

    this.suitMaterial.color.set(suitColor);
    this.suitMaterial.needsUpdate = true;

    this.accentMaterial.color.set(accentColor);
    this.accentMaterial.needsUpdate = true;

    this.helmetMaterial.color.set(helmetColor);
    this.helmetMaterial.needsUpdate = true;
  }
}
