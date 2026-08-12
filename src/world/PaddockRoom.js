import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Full 3D Paddock Hospitality Truck & Workstation (Pixel-Perfect Match to User Images 2 & 3)
 * 
 * Two Interactive Stages:
 * - Stage 1 (Image 2): Cutaway View of the Red Hospitality Transporter Truck with top "aramco" banner,
 *   floating 3D '@' icon, white 5-tire rack, red tool drawers, and a 3D engineer/driver sitting on a swivel stool.
 * - Stage 2 (Image 3): Direct First-Person Zoom into the engineering desk with top angled monitor,
 *   bottom CRT monitor showing 3D diorama and interactive links, left tool rack, desk props, and framed wall portraits.
 */
export class PaddockRoom {
  constructor(scene, cameraController, onExitPaddock) {
    this.scene = scene;
    this.cameraController = cameraController;
    this.onExitPaddock = onExitPaddock;

    this.group = new THREE.Group();
    this.group.position.set(0, 100, 0); // Isolated studio coordinate space
    this.scene.add(this.group);

    this.stage = 'overview'; // 'overview' (Image 2) or 'desk' (Image 3)
    this.interactiveObjects = [];

    // Projects list
    this.currentProjectIndex = 0;
    this.projects = [
      {
        title: "F1 Monza 3D Experience",
        category: "3D WEBGL / THREE.JS",
        subtitle: "Full Formula 1 Monza Experience with 20 Cars",
        desc: "Interactive 3D Grand Prix experience built with Three.js, featuring 20 cars on the grid, 5-lap sprint race, real-time start gantry, and paddock engineering workstation.",
        techs: "Three.js • WebGL • GSAP • Web Audio API",
        web: "https://github.com/Aryan-Shrivastva/CrazyHead",
        github: "https://github.com/Aryan-Shrivastva/CrazyHead"
      },
      {
        title: "Real-Time Telemetry Pipeline",
        category: "FULL-STACK / STREAMING",
        subtitle: "High-Frequency WebSocket Engine",
        desc: "High-throughput 60Hz telemetry streaming pipeline with distributed message queues, apex delta analytics, and real-time dashboard telemetry.",
        techs: "Node.js • WebSockets • Redis • React",
        web: "https://github.com/Aryan-Shrivastva",
        github: "https://github.com/Aryan-Shrivastva"
      },
      {
        title: "Neural Apex & Vision Tracker",
        category: "AI & COMPUTER VISION",
        subtitle: "Deep Learning Racing Analytics",
        desc: "Computer vision and neural forecasting model for automated apex tracking, telemetry anomaly detection, and aerodynamic drag prediction.",
        techs: "Python • PyTorch • FastAPI • OpenCV",
        web: "https://github.com/Aryan-Shrivastva",
        github: "https://github.com/Aryan-Shrivastva"
      },
      {
        title: "Cloud Microservices Orchestrator",
        category: "CLOUD ARCHITECTURE",
        subtitle: "Zero-Downtime Deployment Engine",
        desc: "Container orchestration platform with automated auto-scaling, latency-based health routing, and Prometheus cluster monitoring.",
        techs: "Go • Docker • Kubernetes • Prometheus",
        web: "https://github.com/Aryan-Shrivastva",
        github: "https://github.com/Aryan-Shrivastva"
      }
    ];

    // Canvas Textures
    this.topMonitorCanvas = null;
    this.topMonitorCtx = null;
    this.topMonitorTexture = null;

    this.crtCanvas = null;
    this.crtCtx = null;
    this.crtTexture = null;

    this.engineerMesh = null;
    this.engineerGroup = null;

    this.buildTruckEnvironment();
    this.buildInterior();
    this.buildEngineerCharacter();
    this.buildTopMonitor();
    this.buildBottomCRT();
    this.buildLighting();
  }

  buildTruckEnvironment() {
    // Red F1 Transporter Truck Materials
    const truckRedMat = new THREE.MeshStandardMaterial({ color: 0xD32F2F, roughness: 0.35, metalness: 0.15 });
    const truckDarkRedMat = new THREE.MeshStandardMaterial({ color: 0x991B1B, roughness: 0.4 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, metalness: 0.85, roughness: 0.2 });
    const tireBlackMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.7 });

    // 1. HOSPITALITY TRAILER OUTER SHELL (Red frame with cutaway opening)
    // Floor
    const trailerFloorGeo = new THREE.BoxGeometry(10.5, 0.4, 6.0);
    const trailerFloor = new THREE.Mesh(trailerFloorGeo, truckDarkRedMat);
    trailerFloor.position.set(0, 0.2, -1.5);
    trailerFloor.receiveShadow = true;
    this.group.add(trailerFloor);

    // Roof Frame
    const trailerRoofGeo = new THREE.BoxGeometry(10.5, 0.4, 6.0);
    const trailerRoof = new THREE.Mesh(trailerRoofGeo, truckRedMat);
    trailerRoof.position.set(0, 7.8, -1.5);
    this.group.add(trailerRoof);

    // Left outer trailer wall
    const trailerLeftGeo = new THREE.BoxGeometry(0.4, 7.6, 6.0);
    const trailerLeft = new THREE.Mesh(trailerLeftGeo, truckRedMat);
    trailerLeft.position.set(-5.15, 4.0, -1.5);
    this.group.add(trailerLeft);

    // Right outer trailer wall
    const trailerRightGeo = new THREE.BoxGeometry(0.4, 7.6, 6.0);
    const trailerRight = new THREE.Mesh(trailerRightGeo, truckRedMat);
    trailerRight.position.set(5.15, 4.0, -1.5);
    this.group.add(trailerRight);

    // 2. TOP ROOF SIGNAGE BANNER ("aramco" / "FERRARI" header matching Image 2)
    const bannerW = 9.8;
    const bannerH = 1.1;
    const bannerGeo = new THREE.BoxGeometry(bannerW, bannerH, 0.15);
    const bannerMat = new THREE.MeshBasicMaterial({ map: this.createTopBannerTexture() });
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.set(0, 7.25, 1.45);
    this.group.add(bannerMesh);

    // 3. FLOATING 3D '@' / WEB ICON ON TOP RIGHT (Matching Image 2)
    const atGroup = new THREE.Group();
    atGroup.position.set(4.6, 7.1, 1.6);

    const torusGeo = new THREE.TorusGeometry(0.55, 0.12, 16, 32);
    const atMat = new THREE.MeshStandardMaterial({
      color: 0x00A8E8,
      roughness: 0.2,
      metalness: 0.6,
      emissive: 0x005588,
      emissiveIntensity: 0.6
    });
    const atMesh = new THREE.Mesh(torusGeo, atMat);
    atGroup.add(atMesh);

    // Inner stem of @
    const atStemGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 16);
    const atStem = new THREE.Mesh(atStemGeo, atMat);
    atStem.position.set(0.18, -0.1, 0);
    atGroup.add(atStem);

    this.group.add(atGroup);
    this.floatingAtGroup = atGroup;

    // 4. FRONT TRUCK CAB (Visible on left side of Image 2)
    const cabGroup = new THREE.Group();
    cabGroup.position.set(-6.6, 2.5, 0.2);

    const cabGeo = new THREE.BoxGeometry(2.4, 4.5, 4.0);
    const cabMesh = new THREE.Mesh(cabGeo, truckRedMat);
    cabGroup.add(cabMesh);

    // Cab windscreen
    const windowGeo = new THREE.BoxGeometry(0.1, 1.6, 3.2);
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.1, metalness: 0.9 });
    const windowMesh = new THREE.Mesh(windowGeo, windowMat);
    windowMesh.position.set(-1.21, 0.6, 0);
    cabGroup.add(windowMesh);

    // Truck Wheel underneath
    const wheelGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.6, 24);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMesh = new THREE.Mesh(wheelGeo, tireBlackMat);
    wheelMesh.position.set(0, -2.1, 0);

    const hubGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.65, 16);
    hubGeo.rotateZ(Math.PI / 2);
    const hubMesh = new THREE.Mesh(hubGeo, chromeMat);
    hubMesh.position.set(0, -2.1, 0);

    cabGroup.add(wheelMesh);
    cabGroup.add(hubMesh);
    this.group.add(cabGroup);
  }

  createTopBannerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Left Pirelli/Ille Red Bar
    ctx.fillStyle = '#D62828';
    ctx.fillRect(0, 0, 260, 128);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 64px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ILLE', 130, 64);

    // Center Aramco Blue/Cyan Panel
    const grad = ctx.createLinearGradient(260, 0, 800, 128);
    grad.addColorStop(0, '#00A8E8');
    grad.addColorStop(0.5, '#70D6FF');
    grad.addColorStop(1, '#A0E426');
    ctx.fillStyle = grad;
    ctx.fillRect(260, 0, 560, 128);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px "Titillium Web", sans-serif';
    ctx.fillText('aramco', 540, 64);

    // Right Dark Accent
    ctx.fillStyle = '#222222';
    ctx.fillRect(820, 0, 204, 128);
    ctx.fillStyle = '#FFD166';
    ctx.font = 'bold 50px "Orbitron", sans-serif';
    ctx.fillText('▲ F1', 920, 64);

    return new THREE.CanvasTexture(canvas);
  }

  buildInterior() {
    const wallBackMat = new THREE.MeshStandardMaterial({ color: 0x275D51, roughness: 0.45 });
    const wallLeftMat = new THREE.MeshStandardMaterial({ color: 0x204C42, roughness: 0.5 });
    const wallRightMat = new THREE.MeshStandardMaterial({ color: 0x235247, roughness: 0.5 });
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x2E695D, roughness: 0.4 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xF0F7F4, roughness: 0.3 });
    const redCabinetMat = new THREE.MeshStandardMaterial({ color: 0xD32F2F, roughness: 0.35 });
    const darkHandleMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    const darkFrameMat = new THREE.MeshStandardMaterial({ color: 0x0E211D, roughness: 0.4 });
    const tireBlackMat = new THREE.MeshStandardMaterial({ color: 0x1D2220, roughness: 0.8 });

    // 1. BACK WALL & PERSPECTIVE WALLS
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 7.4), wallBackMat);
    backWall.position.set(0, 4.0, -3.9);
    backWall.receiveShadow = true;
    this.group.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 7.4), wallLeftMat);
    leftWall.position.set(-4.95, 4.0, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.group.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 7.4), wallRightMat);
    rightWall.position.set(4.75, 4.0, 0);
    rightWall.rotation.y = -Math.PI / 2 + 0.12;
    this.group.add(rightWall);

    // 2. WHITE 3-TIER TIRE RACK ON LEFT (Holding 5 F1 tires matching Image 2)
    const rackGroup = new THREE.Group();
    rackGroup.position.set(-3.7, 1.8, -2.4);

    // Vertical Frame Posts (4 posts)
    for (let x of [-0.6, 0.6]) {
      for (let z of [-0.45, 0.45]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.2, 0.1), whiteMat);
        post.position.set(x, 1.9, z);
        post.castShadow = true;
        rackGroup.add(post);
      }
    }

    // 3 Shelves
    for (let y of [0.0, 1.4, 2.8]) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.08, 1.0), whiteMat);
      shelf.position.set(0, y, 0);
      rackGroup.add(shelf);
    }

    // 5 F1 Slick Tires in the Rack
    const addTire = (x, y, z) => {
      const tireGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.38, 20);
      tireGeo.rotateX(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireBlackMat);
      tire.position.set(x, y, z);
      tire.castShadow = true;
      rackGroup.add(tire);
    };

    addTire(-0.25, 0.6, 0); // Bottom tier tire 1
    addTire(0.25, 0.6, 0);  // Bottom tier tire 2
    addTire(-0.25, 2.0, 0); // Middle tier tire 1
    addTire(0.25, 2.0, 0);  // Middle tier tire 2
    addTire(0.0, 3.4, 0);   // Top tier tire 1

    this.group.add(rackGroup);

    // 3. GREEN TOOLBOARD (Mounted on Back Wall matching Image 2)
    const toolboardGroup = new THREE.Group();
    toolboardGroup.position.set(-2.0, 4.4, -3.75);

    const boardMat = new THREE.MeshStandardMaterial({ color: 0x337A6C, roughness: 0.4 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.2, 0.12), boardMat);
    toolboardGroup.add(board);

    // 4 White Screwdrivers on Top of Toolboard
    for (let i = 0; i < 4; i++) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), whiteMat);
      handle.position.set(-0.55 + i * 0.36, 0.9, 0.1);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8), whiteMat);
      shaft.position.set(-0.55 + i * 0.36, 0.35, 0.1);
      toolboardGroup.add(handle);
      toolboardGroup.add(shaft);
    }

    // 3 White Wrenches / Spanners on Bottom of Toolboard
    for (let j = 0; j < 3; j++) {
      const wrenchBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.06), whiteMat);
      wrenchBody.position.set(0, -0.4 - j * 0.34, 0.1);
      const headL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.07), whiteMat);
      headL.position.set(-0.6, -0.4 - j * 0.34, 0.1);
      const headR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.07), whiteMat);
      headR.position.set(0.6, -0.4 - j * 0.34, 0.1);
      toolboardGroup.add(wrenchBody);
      toolboardGroup.add(headL);
      toolboardGroup.add(headR);
    }
    this.group.add(toolboardGroup);

    // 4. RED TOOL CABINET & DRAWERS UNDER DESK (Matching Image 2)
    const cabinetGroup = new THREE.Group();
    cabinetGroup.position.set(0.7, 1.0, -2.6);

    const cabinetBody = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.8, 2.0), redCabinetMat);
    cabinetBody.receiveShadow = true;
    cabinetGroup.add(cabinetBody);

    // 6 Red Drawers with Black Horizontal Handles
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const drawerX = -1.25 + col * 2.5;
        const drawerY = 0.55 - row * 0.55;

        const drawerFront = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.45, 0.05), redCabinetMat);
        drawerFront.position.set(drawerX, drawerY, 1.03);
        cabinetGroup.add(drawerFront);

        const handle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.08), darkHandleMat);
        handle.position.set(drawerX, drawerY, 1.08);
        cabinetGroup.add(handle);
      }
    }

    // Open pulled-out drawer with tools on left side (Matching Image 2)
    const openDrawer = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.38, 1.2), redCabinetMat);
    openDrawer.position.set(-1.25, 0.55, 1.5);
    cabinetGroup.add(openDrawer);

    this.group.add(cabinetGroup);

    // 5. WORKBENCH DESKTOP
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.25, 2.8), deskMat);
    deskTop.position.set(0.2, 1.95, -2.4);
    deskTop.receiveShadow = true;
    this.group.add(deskTop);

    // Keyboard & Mouse in center of desk
    const kb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.85), whiteMat);
    kb.position.set(-0.05, 2.12, -1.9);
    kb.castShadow = true;
    this.group.add(kb);

    const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.45), whiteMat);
    mouse.position.set(1.4, 2.1, -1.9);
    this.group.add(mouse);

    // Stacked Technical Note Papers on right of desk
    const paperMat1 = new THREE.MeshStandardMaterial({ color: 0x88BCB2, roughness: 0.6 });
    const paperMat2 = new THREE.MeshStandardMaterial({ color: 0xB6DDD5, roughness: 0.6 });
    const paperMat3 = new THREE.MeshStandardMaterial({ color: 0xEDF6F2, roughness: 0.6 });

    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 1.05), paperMat1);
    p1.position.set(2.2, 2.08, -1.8);
    p1.rotation.y = 0.15;
    this.group.add(p1);

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.02, 0.95), paperMat2);
    p2.position.set(2.3, 2.1, -1.9);
    p2.rotation.y = -0.1;
    this.group.add(p2);

    const p3 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.85), paperMat3);
    p3.position.set(2.4, 2.12, -1.85);
    p3.rotation.y = 0.05;
    this.group.add(p3);

    // Angled Wrench lying flat on left side of desk
    const deskWrench = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.12), whiteMat);
    deskWrench.position.set(-1.8, 2.09, -1.6);
    deskWrench.rotation.y = -0.3;
    this.group.add(deskWrench);

    // 2 Metal Garage Cans / Flasks on left
    const canGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.45, 12);
    const canMat = new THREE.MeshStandardMaterial({ color: 0x1E463D, roughness: 0.4 });
    const can1 = new THREE.Mesh(canGeo, canMat);
    can1.position.set(-1.6, 2.3, -2.2);
    this.group.add(can1);

    const can2 = new THREE.Mesh(canGeo, canMat);
    can2.position.set(-1.25, 2.3, -2.4);
    this.group.add(can2);

    // 6. RIGHT WALL FRAMED PORTRAITS (Matching Images 2 & 3)
    // Top Wide Picture Frame (Podium photo)
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 3.4), darkFrameMat);
    topFrame.position.set(4.3, 5.4, -1.6);
    topFrame.rotation.y = -Math.PI / 2 + 0.12;
    this.group.add(topFrame);

    const topPicMat = new THREE.MeshBasicMaterial({ map: this.createPodiumTexture() });
    const topPic = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), topPicMat);
    topPic.position.set(4.23, 5.4, -1.6);
    topPic.rotation.y = -Math.PI / 2 + 0.12;
    this.group.add(topPic);

    // Bottom Portrait Picture Frame (Driver with GOAT silhouette)
    const btmFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 1.8), darkFrameMat);
    btmFrame.position.set(4.3, 3.2, -1.6);
    btmFrame.rotation.y = -Math.PI / 2 + 0.12;
    this.group.add(btmFrame);

    const btmPicMat = new THREE.MeshBasicMaterial({ map: this.createDriverPortraitTexture() });
    const btmPic = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), btmPicMat);
    btmPic.position.set(4.23, 3.2, -1.6);
    btmPic.rotation.y = -Math.PI / 2 + 0.12;
    this.group.add(btmPic);
  }

  buildEngineerCharacter() {
    // 3D Guy Sitting in the Paddock (Red suit + Red Helmet on Swivel Stool matching Image 2)
    this.engineerGroup = new THREE.Group();
    this.engineerGroup.position.set(0.6, 0.4, -1.4);

    const redSuitMat = new THREE.MeshStandardMaterial({ color: 0xD32F2F, roughness: 0.4 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xC62828, roughness: 0.3 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.9, roughness: 0.2 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x7E9E97, roughness: 0.5 });

    // 1. Swivel Stool (Round seat + chrome stem + base)
    const stoolSeatGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.14, 16);
    const stoolSeat = new THREE.Mesh(stoolSeatGeo, seatMat);
    stoolSeat.position.set(0, 1.3, 0);
    this.engineerGroup.add(stoolSeat);

    const stoolStemGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.3, 12);
    const stoolStem = new THREE.Mesh(stoolStemGeo, chromeMat);
    stoolStem.position.set(0, 0.65, 0);
    this.engineerGroup.add(stoolStem);

    const stoolFootRingGeo = new THREE.TorusGeometry(0.28, 0.03, 12, 24);
    stoolFootRingGeo.rotateX(Math.PI / 2);
    const stoolFootRing = new THREE.Mesh(stoolFootRingGeo, chromeMat);
    stoolFootRing.position.set(0, 0.4, 0);
    this.engineerGroup.add(stoolFootRing);

    // 2. Character Torso (Leaning slightly forward towards keyboard)
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.85, 0.45);
    const torso = new THREE.Mesh(torsoGeo, redSuitMat);
    torso.position.set(0, 2.0, 0);
    torso.rotation.x = 0.15; // Leaning into desk
    torso.castShadow = true;
    this.engineerGroup.add(torso);

    // 3. Faceted Red Racing Helmet (Matching exact low-poly shape of Image 2)
    const helmetGeo = new THREE.DodecahedronGeometry(0.38, 1);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.set(0, 2.7, -0.05);
    helmet.castShadow = true;
    this.engineerGroup.add(helmet);

    // Visor
    const visorGeo = new THREE.BoxGeometry(0.34, 0.12, 0.2);
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 2.7, -0.32);
    this.engineerGroup.add(visor);

    // 4. Arms Posed Typing on Keyboard
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), redSuitMat);
    armL.position.set(-0.45, 1.9, -0.25);
    armL.rotation.x = -Math.PI / 4;
    armL.rotation.z = -0.15;
    this.engineerGroup.add(armL);

    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), redSuitMat);
    armR.position.set(0.45, 1.9, -0.25);
    armR.rotation.x = -Math.PI / 4;
    armR.rotation.z = 0.15;
    this.engineerGroup.add(armR);

    this.group.add(this.engineerGroup);

    // Interactive Raycast Click Target for Character / Workstation
    const hitBoxGeo = new THREE.BoxGeometry(1.6, 2.8, 1.6);
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
    this.engineerMesh = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    this.engineerMesh.position.set(0, 1.8, 0);
    this.engineerMesh.name = 'PADDOCK_ENGINEER_CLICK';
    this.engineerGroup.add(this.engineerMesh);

    this.interactiveObjects.push(this.engineerMesh);
  }

  buildTopMonitor() {
    const monW = 4.8;
    const monH = 2.0;
    const monDepth = 0.25;

    const topMonGroup = new THREE.Group();
    topMonGroup.position.set(-0.05, 5.7, -3.6);
    topMonGroup.rotation.x = 0.16; // Angled down towards driver camera

    const monFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1B443B,
      roughness: 0.3,
      metalness: 0.2
    });
    const monFrame = new THREE.Mesh(new THREE.BoxGeometry(monW, monH, monDepth), monFrameMat);
    topMonGroup.add(monFrame);

    // Monitor Canvas
    this.topMonitorCanvas = document.createElement('canvas');
    this.topMonitorCanvas.width = 1024;
    this.topMonitorCanvas.height = 426;
    this.topMonitorCtx = this.topMonitorCanvas.getContext('2d');
    this.topMonitorTexture = new THREE.CanvasTexture(this.topMonitorCanvas);
    this.topMonitorTexture.minFilter = THREE.LinearFilter;

    this.renderTopMonitor();

    const screenGeo = new THREE.PlaneGeometry(monW - 0.14, monH - 0.14);
    const screenMat = new THREE.MeshBasicMaterial({ map: this.topMonitorTexture });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0, monDepth / 2 + 0.01);
    topMonGroup.add(screenMesh);

    this.group.add(topMonGroup);

    screenMesh.name = 'PADDOCK_TOP_SCREEN';
    this.interactiveObjects.push(screenMesh);
  }

  renderTopMonitor() {
    if (!this.topMonitorCtx) return;
    const ctx = this.topMonitorCtx;
    const w = this.topMonitorCanvas.width;
    const h = this.topMonitorCanvas.height;

    // Dark charcoal screen background matching Image 3
    ctx.fillStyle = '#1B2428';
    ctx.fillRect(0, 0, w, h);

    // Inner subtle border
    ctx.strokeStyle = '#2B3B40';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // [ PREVIOUS ] Button
    ctx.fillStyle = '#121A1E';
    ctx.fillRect(36, 26, 170, 52);
    ctx.strokeStyle = '#718D9A';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 26, 170, 52);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Titillium Web", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PREVIOUS', 121, 60);

    // Center Title: Aryan's paddock (matching Mike's paddock in Image 3)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Titillium Web", sans-serif';
    ctx.fillText("Aryan's paddock", w / 2, 62);

    // [ NEXT ] Button
    ctx.fillStyle = '#121A1E';
    ctx.fillRect(w - 206, 26, 170, 52);
    ctx.strokeStyle = '#718D9A';
    ctx.lineWidth = 2;
    ctx.strokeRect(w - 206, 26, 170, 52);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Titillium Web", sans-serif';
    ctx.fillText('NEXT', w - 121, 60);

    // Body Text (Exact copy from reference Image 3)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#EFF5F4';
    ctx.font = '22px "Titillium Web", sans-serif';

    ctx.fillText('As Web developers, we have the opportunity to showcase our', 40, 140);
    ctx.fillText('work in creative ways.', 40, 172);

    ctx.fillText('Since my first contact with 3D websites, I always wanted to', 40, 224);
    ctx.fillText('create my portfolio as an interactive 3D experience.', 40, 256);

    ctx.fillText('I am glad I finally came around to do it and hope you enjoy the', 40, 310);
    ctx.fillText('result as much as I did creating it!', 40, 342);

    // [ GO BACK ] Bright Red Button (Bottom Right)
    ctx.fillStyle = '#E61E1A';
    ctx.fillRect(w - 230, h - 72, 190, 48);
    ctx.strokeStyle = '#FF4D4A';
    ctx.lineWidth = 2;
    ctx.strokeRect(w - 230, h - 72, 190, 48);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GO BACK', w - 135, h - 40);

    if (this.topMonitorTexture) this.topMonitorTexture.needsUpdate = true;
  }

  buildBottomCRT() {
    const crtW = 4.6;
    const crtH = 2.4;
    const crtDepth = 0.35;

    const crtGroup = new THREE.Group();
    crtGroup.position.set(-0.05, 3.4, -3.7);

    const crtFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1B443B,
      roughness: 0.3,
      metalness: 0.2
    });
    const crtFrame = new THREE.Mesh(new THREE.BoxGeometry(crtW, crtH, crtDepth), crtFrameMat);
    crtGroup.add(crtFrame);

    // CRT Canvas Texture
    this.crtCanvas = document.createElement('canvas');
    this.crtCanvas.width = 1024;
    this.crtCanvas.height = 534;
    this.crtCtx = this.crtCanvas.getContext('2d');
    this.crtTexture = new THREE.CanvasTexture(this.crtCanvas);
    this.crtTexture.minFilter = THREE.LinearFilter;

    this.renderCRTDisplay();

    const screenGeo = new THREE.PlaneGeometry(crtW - 0.14, crtH - 0.14);
    const screenMat = new THREE.MeshBasicMaterial({ map: this.crtTexture });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0, crtDepth / 2 + 0.01);
    crtGroup.add(screenMesh);

    this.group.add(crtGroup);

    screenMesh.name = 'PADDOCK_CRT_SCREEN';
    this.interactiveObjects.push(screenMesh);
  }

  renderCRTDisplay() {
    if (!this.crtCtx) return;
    const ctx = this.crtCtx;
    const w = this.crtCanvas.width;
    const h = this.crtCanvas.height;

    // 1. Dark Outer Bezel
    ctx.fillStyle = '#0D1A17';
    ctx.fillRect(0, 0, w, h);

    // 2. Left Vertical Action Panel (Globe & GitHub icons)
    const sideW = 120;
    ctx.fillStyle = '#091311';
    ctx.fillRect(0, 0, sideW, h);
    ctx.strokeStyle = '#18342E';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, sideW, h);

    // 🌐 Web Live Icon Button
    ctx.fillStyle = '#17332C';
    ctx.beginPath();
    ctx.arc(60, 110, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00D2BE';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌐', 60, 110);

    // 🐙 GitHub Octocat Icon Button
    ctx.fillStyle = '#17332C';
    ctx.beginPath();
    ctx.arc(60, 230, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillText('🐙', 60, 230);

    // 3. Central CRT Phosphor Screen (Pale Pistachio Yellow-Green from Image 3)
    const crtX = 140;
    const crtY = 24;
    const crtW = w - crtX - 24;
    const crtH = h - 48;

    ctx.fillStyle = '#D9EBC2';
    ctx.fillRect(crtX, crtY, crtW, crtH);
    ctx.strokeStyle = '#1E3B33';
    ctx.lineWidth = 4;
    ctx.strokeRect(crtX, crtY, crtW, crtH);

    // Horizontal Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    for (let y = crtY; y < crtY + crtH; y += 4) {
      ctx.fillRect(crtX, y, crtW, 2);
    }

    // 4. Draw 3D Isometric F1 Transporter Diorama Graphic (Matching Image 3 Screen Art)
    const proj = this.projects[this.currentProjectIndex];

    const dioramaCenterX = crtX + 180;
    const dioramaCenterY = crtY + 280;

    // Isometric Green Base
    ctx.fillStyle = '#8AB89A';
    ctx.beginPath();
    ctx.ellipse(dioramaCenterX, dioramaCenterY, 150, 65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6E987C';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Red F1 Transporter Truck & Structure
    ctx.fillStyle = '#D62828';
    ctx.fillRect(dioramaCenterX - 80, dioramaCenterY - 160, 110, 140);
    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 2;
    ctx.strokeRect(dioramaCenterX - 80, dioramaCenterY - 160, 110, 140);

    // Truck Cab Front
    ctx.fillStyle = '#E63946';
    ctx.fillRect(dioramaCenterX - 140, dioramaCenterY - 70, 70, 70);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(dioramaCenterX - 135, dioramaCenterY - 60, 30, 25);

    // Miniature F1 Race Car in front of Truck
    ctx.fillStyle = '#E63946';
    ctx.fillRect(dioramaCenterX + 10, dioramaCenterY - 20, 85, 22);
    ctx.fillStyle = '#111111';
    ctx.fillRect(dioramaCenterX + 5, dioramaCenterY - 10, 20, 12);
    ctx.fillRect(dioramaCenterX + 70, dioramaCenterY - 10, 20, 12);
    ctx.fillRect(dioramaCenterX + 85, dioramaCenterY - 32, 8, 22);

    // Interactive Project Telemetry & Spec Details
    const infoX = crtX + 380;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Category Pill
    ctx.fillStyle = '#194A3D';
    ctx.fillRect(infoX, crtY + 36, 260, 32);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Orbitron", sans-serif';
    ctx.fillText(proj.category, infoX + 16, crtY + 44);

    // Title
    ctx.fillStyle = '#12261F';
    ctx.font = '900 32px "Titillium Web", sans-serif';
    ctx.fillText(proj.title, infoX, crtY + 84);

    // Subtitle
    ctx.fillStyle = '#234E41';
    ctx.font = 'bold 18px "Titillium Web", sans-serif';
    ctx.fillText(proj.subtitle, infoX, crtY + 128);

    // Description
    ctx.fillStyle = '#1E3E34';
    ctx.font = '17px "Titillium Web", sans-serif';
    ctx.fillText(proj.desc.slice(0, 48), infoX, crtY + 175);
    if (proj.desc.length > 48) {
      ctx.fillText(proj.desc.slice(48, 105), infoX, crtY + 202);
    }
    if (proj.desc.length > 105) {
      ctx.fillText(proj.desc.slice(105, 160), infoX, crtY + 229);
    }

    // Tech Stack
    ctx.fillStyle = '#0F2B23';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillText(`TECH: ${proj.techs}`, infoX, crtY + 285);

    // CTA
    ctx.fillStyle = '#0A211B';
    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.fillText('➔ CLICK ICONS ON LEFT (🌐 / 🐙) TO LAUNCH', infoX, crtY + 380);

    // Project Counter
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px "Orbitron", sans-serif';
    ctx.fillStyle = '#2B5749';
    ctx.fillText(`PROJECT ${this.currentProjectIndex + 1} / ${this.projects.length}`, crtX + crtW - 30, crtY + 44);

    if (this.crtTexture) this.crtTexture.needsUpdate = true;
  }

  createPodiumTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, '#1E584D');
    grad.addColorStop(0.5, '#358A7A');
    grad.addColorStop(1, '#8AD5C7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 MONZA GP CHAMPION', 256, 115);

    ctx.font = '20px "Titillium Web", sans-serif';
    ctx.fillStyle = '#E4F5F0';
    ctx.fillText('Aryan Shrivastva • Scuderia Ferrari', 256, 160);

    return new THREE.CanvasTexture(canvas);
  }

  createDriverPortraitTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1D453D';
    ctx.fillRect(0, 0, 256, 320);

    // GOAT Horns / Silhouette backdrop
    ctx.fillStyle = '#102B25';
    ctx.beginPath();
    ctx.moveTo(70, 180);
    ctx.lineTo(40, 100);
    ctx.lineTo(80, 120);
    ctx.lineTo(128, 70);
    ctx.lineTo(180, 120);
    ctx.lineTo(220, 100);
    ctx.lineTo(190, 180);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2F685C';
    ctx.beginPath();
    ctx.arc(128, 150, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏎️', 128, 155);

    ctx.font = 'bold 18px "Orbitron", sans-serif';
    ctx.fillText('LEAD DRIVER', 128, 245);

    ctx.font = '14px "Titillium Web", sans-serif';
    ctx.fillStyle = '#9FE0D3';
    ctx.fillText('Aryan Shrivastva', 128, 275);

    return new THREE.CanvasTexture(canvas);
  }

  buildLighting() {
    // Room Ambient Light
    const roomAmbient = new THREE.AmbientLight(0xEFFDF8, 2.2);
    this.group.add(roomAmbient);

    // Main workshop ceiling light
    const workPoint = new THREE.PointLight(0xFFFFFF, 3.5, 30);
    workPoint.position.set(0, 6.2, -1.5);
    this.group.add(workPoint);

    // Desk spotlight
    const deskSpot = new THREE.SpotLight(0xE0FFF4, 4.2, 18, Math.PI / 3, 0.3);
    deskSpot.position.set(0, 6.5, -2.0);
    deskSpot.target.position.set(0, 2.0, -2.0);
    this.group.add(deskSpot);
    this.group.add(deskSpot.target);

    // Truck exterior fill light
    const truckFill = new THREE.DirectionalLight(0xE5F5FF, 1.8);
    truckFill.position.set(3, 108, 6);
    this.group.add(truckFill);
  }

  enterPaddockOverview() {
    this.stage = 'overview';
    // Position camera for Stage 1: Truck Cutaway Overview with Guy on Stool (Image 2)
    if (this.cameraController) {
      this.cameraController.transitionToPaddockOverview();
    }
  }

  zoomIntoDesk() {
    this.stage = 'desk';
    // Position camera for Stage 2: Direct First-Person Desk View (Image 3)
    if (this.cameraController) {
      this.cameraController.transitionToPaddockDesk();
    }
  }

  handleScreenClick(intersect) {
    if (!intersect || !intersect.object) return;
    const objName = intersect.object.name;
    const uv = intersect.uv;

    // 1. Click on Engineer / Workstation in Stage 1 -> Zooms into Desk (Image 3)
    if (objName === 'PADDOCK_ENGINEER_CLICK' || this.stage === 'overview') {
      this.zoomIntoDesk();
      return;
    }

    if (!uv) return;

    // 2. Top Monitor Clicks (PREVIOUS, NEXT, GO BACK)
    if (objName === 'PADDOCK_TOP_SCREEN') {
      const u = uv.x;
      const v = uv.y;

      // [ PREVIOUS ]
      if (u < 0.22 && v > 0.80) {
        this.currentProjectIndex = (this.currentProjectIndex - 1 + this.projects.length) % this.projects.length;
        this.renderCRTDisplay();
        return;
      }

      // [ NEXT ]
      if (u > 0.78 && v > 0.80) {
        this.currentProjectIndex = (this.currentProjectIndex + 1) % this.projects.length;
        this.renderCRTDisplay();
        return;
      }

      // [ GO BACK ]
      if (u > 0.72 && v < 0.28) {
        // Zoom back out to Stage 1 Truck Overview or exit
        if (this.stage === 'desk') {
          this.enterPaddockOverview();
        } else {
          if (this.onExitPaddock) this.onExitPaddock();
        }
        return;
      }
    }

    // 3. Bottom CRT Screen Clicks (🌐 Web & 🐙 GitHub)
    if (objName === 'PADDOCK_CRT_SCREEN') {
      const u = uv.x;
      const v = uv.y;
      const proj = this.projects[this.currentProjectIndex];

      if (u < 0.14) {
        if (v >= 0.60 && v <= 0.95) {
          window.open(proj.web, '_blank');
          return;
        }
        if (v >= 0.30 && v < 0.60) {
          window.open(proj.github, '_blank');
          return;
        }
      }
    }
  }
}
