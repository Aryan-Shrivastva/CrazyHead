import * as THREE from 'three';

/**
 * 3D Paddock Garage Workstation Room (Pixel-Perfect Match to Miguel Iranzo Portfolio)
 * Features:
 * - Authentic 3D teal/sage workshop geometry with shadows and directional workshop lighting
 * - Left wall 3D toolboard with screwdrivers, spanners & wrenches
 * - Angled top 3D monitor with PREVIOUS / NEXT / GO BACK buttons
 * - Bottom 3D CRT television with left 🌐/🐙 icons and glowing pistachio phosphor screen showing 3D F1 truck diorama
 * - Right angled wall with 3D framed champion celebration and driver GOAT silhouette portraits
 * - Foreground 3D workbench with white keyboard, papers, and canisters
 */
export class PaddockRoom {
  constructor(scene, onReturnToCockpit) {
    this.scene = scene;
    this.onReturnToCockpit = onReturnToCockpit;
    this.group = new THREE.Group();
    this.group.position.set(0, 100, 0); // Positioned in dedicated studio coordinate space
    this.scene.add(this.group);

    // Interactive raycast targets
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

    this.buildRoom();
    this.buildLighting();
  }

  buildRoom() {
    // Exact color palette matching Miguel Iranzo's Paddock
    const wallBackMat = new THREE.MeshStandardMaterial({ color: 0x24584C, roughness: 0.5, metalness: 0.05 });
    const wallLeftMat = new THREE.MeshStandardMaterial({ color: 0x1E4A40, roughness: 0.5 });
    const wallRightMat = new THREE.MeshStandardMaterial({ color: 0x225247, roughness: 0.5 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x173B33, roughness: 0.6 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x1A4239, roughness: 0.6 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x327566, roughness: 0.4 });
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x265C50, roughness: 0.4 });
    const whitePropMat = new THREE.MeshStandardMaterial({ color: 0xEDF6F2, roughness: 0.3 });
    const darkFrameMat = new THREE.MeshStandardMaterial({ color: 0x0E211D, roughness: 0.4 });

    // 1. WALLS & CEILING
    // Back Wall
    const backWallGeo = new THREE.PlaneGeometry(12, 8);
    const backWall = new THREE.Mesh(backWallGeo, wallBackMat);
    backWall.position.set(0, 4, -4);
    backWall.receiveShadow = true;
    this.group.add(backWall);

    // Left Wall
    const leftWallGeo = new THREE.PlaneGeometry(10, 8);
    const leftWall = new THREE.Mesh(leftWallGeo, wallLeftMat);
    leftWall.position.set(-5, 4, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    this.group.add(leftWall);

    // Right Wall (Angled in perspective)
    const rightWallGeo = new THREE.PlaneGeometry(10, 8);
    const rightWall = new THREE.Mesh(rightWallGeo, wallRightMat);
    rightWall.position.set(4.8, 4, 0);
    rightWall.rotation.y = -Math.PI / 2 + 0.12;
    rightWall.receiveShadow = true;
    this.group.add(rightWall);

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(12, 10);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.set(0, 7.5, 0);
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    // Ceiling Beam across top
    const beamGeo = new THREE.BoxGeometry(12, 0.4, 0.6);
    const beam = new THREE.Mesh(beamGeo, trimMat);
    beam.position.set(0, 7.3, -3.7);
    this.group.add(beam);

    // Right corner support pillar
    const pillarGeo = new THREE.BoxGeometry(0.5, 8, 0.6);
    const pillar = new THREE.Mesh(pillarGeo, trimMat);
    pillar.position.set(3.4, 4, -3.7);
    this.group.add(pillar);

    // 2. LEFT SHELVING & 3D TOOLBOARD
    // Left white shelf unit
    const shelfGeo = new THREE.BoxGeometry(0.5, 7, 2.2);
    const shelf = new THREE.Mesh(shelfGeo, whitePropMat);
    shelf.position.set(-4.7, 3.5, -2.5);
    shelf.castShadow = true;
    this.group.add(shelf);

    // Toolboard Backing
    const toolboardGeo = new THREE.BoxGeometry(0.12, 4.0, 2.1);
    const toolboardMat = new THREE.MeshStandardMaterial({ color: 0x2E6E60, roughness: 0.4 });
    const toolboard = new THREE.Mesh(toolboardGeo, toolboardMat);
    toolboard.position.set(-4.9, 4.0, -0.6);
    this.group.add(toolboard);

    // Toolboard Outer Border Bevel
    const tbBorderGeo = new THREE.BoxGeometry(0.16, 4.2, 2.3);
    const tbBorder = new THREE.Mesh(tbBorderGeo, trimMat);
    tbBorder.position.set(-4.93, 4.0, -0.6);
    this.group.add(tbBorder);

    // 4 Screwdrivers mounted vertically on top of toolboard
    for (let i = 0; i < 4; i++) {
      const handleGeo = new THREE.BoxGeometry(0.08, 0.5, 0.08);
      const handle = new THREE.Mesh(handleGeo, whitePropMat);
      handle.position.set(-4.8, 4.9, -1.2 + i * 0.4);

      const shaftGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6);
      const shaft = new THREE.Mesh(shaftGeo, whitePropMat);
      shaft.position.set(-4.8, 4.2, -1.2 + i * 0.4);

      this.group.add(handle);
      this.group.add(shaft);
    }

    // 3 Double-ended wrenches / spanners mounted horizontally
    for (let j = 0; j < 3; j++) {
      const wrenchBodyGeo = new THREE.BoxGeometry(0.06, 0.12, 1.4);
      const wrenchBody = new THREE.Mesh(wrenchBodyGeo, whitePropMat);
      wrenchBody.position.set(-4.8, 3.3 - j * 0.38, -0.6);

      const wrenchHeadGeo = new THREE.BoxGeometry(0.07, 0.22, 0.18);
      const headL = new THREE.Mesh(wrenchHeadGeo, whitePropMat);
      headL.position.set(-4.8, 3.3 - j * 0.38, -1.3);

      const headR = new THREE.Mesh(wrenchHeadGeo, whitePropMat);
      headR.position.set(-4.8, 3.3 - j * 0.38, 0.1);

      this.group.add(wrenchBody);
      this.group.add(headL);
      this.group.add(headR);
    }

    // 3. FOREGROUND WORKBENCH DESK
    const deskGeo = new THREE.BoxGeometry(10, 0.4, 3.5);
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, 1.8, -2.2);
    desk.receiveShadow = true;
    this.group.add(desk);

    // 3D Minimalist White Keyboard in center of desk
    const kbGeo = new THREE.BoxGeometry(2.4, 0.12, 0.9);
    const kb = new THREE.Mesh(kbGeo, whitePropMat);
    kb.position.set(-0.3, 2.06, -1.8);
    kb.castShadow = true;
    this.group.add(kb);

    // 3D White Trackpad / Mouse to the right of keyboard
    const mouseGeo = new THREE.BoxGeometry(0.3, 0.08, 0.5);
    const mouse = new THREE.Mesh(mouseGeo, whitePropMat);
    mouse.position.set(1.3, 2.04, -1.8);
    this.group.add(mouse);

    // 3D Stack of pastel cyan & mint technical papers
    const paperMat1 = new THREE.MeshStandardMaterial({ color: 0x88BCB2, roughness: 0.6 });
    const paperMat2 = new THREE.MeshStandardMaterial({ color: 0xB6DDD5, roughness: 0.6 });
    const paperMat3 = new THREE.MeshStandardMaterial({ color: 0xEDF6F2, roughness: 0.6 });

    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 1.05), paperMat1);
    p1.position.set(2.1, 2.01, -1.7);
    p1.rotation.y = 0.15;
    this.group.add(p1);

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.02, 0.95), paperMat2);
    p2.position.set(2.2, 2.03, -1.8);
    p2.rotation.y = -0.1;
    this.group.add(p2);

    const p3 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.85), paperMat3);
    p3.position.set(2.3, 2.05, -1.75);
    p3.rotation.y = 0.05;
    this.group.add(p3);

    // 3D Garage Canisters on the left of desk
    const canGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.45, 12);
    const canMat = new THREE.MeshStandardMaterial({ color: 0x1E463D, roughness: 0.4 });
    const can1 = new THREE.Mesh(canGeo, canMat);
    can1.position.set(-2.4, 2.22, -1.8);
    this.group.add(can1);

    const can2 = new THREE.Mesh(canGeo, canMat);
    can2.position.set(-2.0, 2.22, -1.6);
    this.group.add(can2);

    // 4. RIGHT WALL 3D FRAMED PORTRAITS
    // Top Wide Picture Frame (Podium Champion celebration)
    const topFrameGeo = new THREE.BoxGeometry(0.12, 1.8, 3.4);
    const topFrame = new THREE.Mesh(topFrameGeo, darkFrameMat);
    topFrame.position.set(4.3, 5.4, -1.6);
    topFrame.rotation.y = -Math.PI / 2 + 0.12;
    this.group.add(topFrame);

    const topPicMat = new THREE.MeshBasicMaterial({ map: this.createPodiumTexture() });
    const topPicGeo = new THREE.PlaneGeometry(3.2, 1.6);
    const topPic = new THREE.Mesh(topPicGeo, topPicMat);
    topPic.position.set(4.23, 5.4, -1.6);
    topPic.rotation.y = -Math.PI / 2 + 0.12;
    this.group.add(topPic);

    // Bottom Portrait Frame (Driver with GOAT silhouette)
    const btmFrameGeo = new THREE.BoxGeometry(0.12, 2.2, 1.8);
    const btmFrame = new THREE.Mesh(btmFrameGeo, darkFrameMat);
    btmFrame.position.set(4.3, 3.2, -1.6);
    btmFrame.rotation.y = -Math.PI / 2 + 0.12;
    this.group.add(btmFrame);

    const btmPicMat = new THREE.MeshBasicMaterial({ map: this.createDriverPortraitTexture() });
    const btmPicGeo = new THREE.PlaneGeometry(1.6, 2.0);
    const btmPic = new THREE.Mesh(btmPicGeo, btmPicMat);
    btmPic.position.set(4.23, 3.2, -1.6);
    btmPic.rotation.y = -Math.PI / 2 + 0.12;
    this.group.add(btmPic);

    // 5. TOP ANGLED 3D MONITOR
    this.buildTopMonitor();

    // 6. BOTTOM 3D CRT TELEVISION
    this.buildBottomCRT();
  }

  buildTopMonitor() {
    const monW = 4.8;
    const monH = 2.0;
    const monDepth = 0.25;

    const topMonGroup = new THREE.Group();
    topMonGroup.position.set(-0.2, 5.7, -3.6);
    topMonGroup.rotation.x = 0.16; // Angled down towards driver camera

    const monFrameGeo = new THREE.BoxGeometry(monW, monH, monDepth);
    const monFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1B443B,
      roughness: 0.3,
      metalness: 0.2
    });
    const monFrame = new THREE.Mesh(monFrameGeo, monFrameMat);
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

    // Dark charcoal screen background matching Image 2
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

    // Center Title: Aryan's paddock (matching Mike's paddock in Image 2)
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

    // Body Text (Exact copy from Miguel Iranzo portfolio Image 2)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#EFF5F4';
    ctx.font = '22px "Titillium Web", sans-serif';

    ctx.fillText('As Web developers, we have the opportunity to showcase our', 40, 140);
    ctx.fillText('work in creative ways.', 40, 172);

    ctx.fillText('Since my first contact with 3D websites, I always wanted to', 40, 224);
    ctx.fillText('create my portfolio as an interactive 3D experience.', 40, 256);

    ctx.fillText('I am glad I finally came around to do it and hope you enjoy the', 40, 310);
    ctx.fillText('result as much as I did creating it!', 40, 342);

    // [ GO BACK ] Bright Red Pill Button (Bottom Right)
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
    crtGroup.position.set(-0.2, 3.4, -3.7);

    // CRT Outer Frame (Teal green bevel)
    const crtFrameGeo = new THREE.BoxGeometry(crtW, crtH, crtDepth);
    const crtFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1B443B,
      roughness: 0.3,
      metalness: 0.2
    });
    const crtFrame = new THREE.Mesh(crtFrameGeo, crtFrameMat);
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

    // 3. Central CRT Phosphor Screen (Pale Pistachio Yellow-Green from Image 2)
    const crtX = 140;
    const crtY = 24;
    const crtW = w - crtX - 24;
    const crtH = h - 48;

    ctx.fillStyle = '#D9EBC2';
    ctx.fillRect(crtX, crtY, crtW, crtH);
    ctx.strokeStyle = '#1E3B33';
    ctx.lineWidth = 4;
    ctx.strokeRect(crtX, crtY, crtW, crtH);

    // CRT Horizontal Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    for (let y = crtY; y < crtY + crtH; y += 4) {
      ctx.fillRect(crtX, y, crtW, 2);
    }

    // 4. Draw 3D Isometric F1 Transporter Diorama Graphic (Matching Image 2 Screen Art)
    const proj = this.projects[this.currentProjectIndex];

    // Circular Isometric Podium Base
    const dioramaCenterX = crtX + 180;
    const dioramaCenterY = crtY + 280;

    ctx.fillStyle = '#8AB89A';
    ctx.beginPath();
    ctx.ellipse(dioramaCenterX, dioramaCenterY, 150, 65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6E987C';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Red F1 Transporter Truck Cab & Hospitality Unit (Matching Image 2)
    ctx.fillStyle = '#D62828';
    ctx.fillRect(dioramaCenterX - 80, dioramaCenterY - 160, 110, 140); // Hospitality structure
    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 2;
    ctx.strokeRect(dioramaCenterX - 80, dioramaCenterY - 160, 110, 140);

    // Truck Cab Front
    ctx.fillStyle = '#E63946';
    ctx.fillRect(dioramaCenterX - 140, dioramaCenterY - 70, 70, 70);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(dioramaCenterX - 135, dioramaCenterY - 60, 30, 25); // Cab window

    // Miniature F1 Race Car in front of Truck
    ctx.fillStyle = '#E63946';
    ctx.fillRect(dioramaCenterX + 10, dioramaCenterY - 20, 85, 22);
    ctx.fillStyle = '#111111';
    ctx.fillRect(dioramaCenterX + 5, dioramaCenterY - 10, 20, 12); // Front tire
    ctx.fillRect(dioramaCenterX + 70, dioramaCenterY - 10, 20, 12); // Rear tire
    ctx.fillRect(dioramaCenterX + 85, dioramaCenterY - 32, 8, 22); // Rear wing

    // Interactive Project Telemetry & Spec Details (Right side of CRT screen)
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

    // Description text
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

    // Action CTA
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

    // Muted teal/cyan gradient with winner celebration
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

    // GOAT Horns / Animal silhouette backdrop matching Image 2
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
    const workLight = new THREE.DirectionalLight(0xEFFFF5, 2.2);
    workLight.position.set(0, 106, -1);
    workLight.target = this.group;
    workLight.castShadow = true;
    this.scene.add(workLight);

    const deskSpot = new THREE.SpotLight(0xD8F5EA, 3.5, 12, Math.PI / 3, 0.4);
    deskSpot.position.set(0, 106.5, -2);
    this.scene.add(deskSpot);
  }

  handleScreenClick(intersect) {
    if (!intersect || !intersect.object) return;
    const objName = intersect.object.name;
    const uv = intersect.uv;
    if (!uv) return;

    if (objName === 'PADDOCK_TOP_SCREEN') {
      const u = uv.x;
      const v = uv.y;

      // [ PREVIOUS ] (top left: u < 0.22, v > 0.80)
      if (u < 0.22 && v > 0.80) {
        this.currentProjectIndex = (this.currentProjectIndex - 1 + this.projects.length) % this.projects.length;
        this.renderCRTDisplay();
        return;
      }

      // [ NEXT ] (top right: u > 0.78, v > 0.80)
      if (u > 0.78 && v > 0.80) {
        this.currentProjectIndex = (this.currentProjectIndex + 1) % this.projects.length;
        this.renderCRTDisplay();
        return;
      }

      // [ GO BACK ] (bottom right: u > 0.72, v < 0.28)
      if (u > 0.72 && v < 0.28) {
        if (this.onReturnToCockpit) this.onReturnToCockpit();
        return;
      }
    }

    if (objName === 'PADDOCK_CRT_SCREEN') {
      const u = uv.x;
      const v = uv.y;
      const proj = this.projects[this.currentProjectIndex];

      // Left sidebar (u < 0.14)
      if (u < 0.14) {
        // Globe (v between 0.60 and 0.95)
        if (v >= 0.60 && v <= 0.95) {
          window.open(proj.web, '_blank');
          return;
        }
        // GitHub (v between 0.30 and 0.60)
        if (v >= 0.30 && v < 0.60) {
          window.open(proj.github, '_blank');
          return;
        }
      }
    }
  }
}
