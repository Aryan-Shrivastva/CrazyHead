import * as THREE from 'three';

/**
 * 3D Paddock Garage Workstation Room (Matching Reference Image 2)
 * Features:
 * - Full 3D teal/sage workshop geometry with depth, directional lighting, and shadows
 * - Left wall 3D tool rack with screwdrivers, spanners & wrenches
 * - Angled top 3D info monitor with navigation & GO BACK button
 * - Bottom 3D CRT television with interactive 🌐/🐙 icons and project display
 * - Right wall with angled 3D framed winner & driver portraits
 * - Foreground 3D workbench with keyboard, notepad papers, and garage canisters
 */
export class PaddockRoom {
  constructor(scene, onReturnToCockpit) {
    this.scene = scene;
    this.onReturnToCockpit = onReturnToCockpit;
    this.group = new THREE.Group();
    this.group.position.set(0, 100, 0); // Positioned in its own dedicated studio coordinate space
    this.scene.add(this.group);

    // Interactive elements for raycasting
    this.interactiveObjects = [];

    // Projects list
    this.currentProjectIndex = 0;
    this.projects = [
      {
        title: 'F1 Monza GP 3D Experience',
        category: '3D WEBGL / THREE.JS SIMULATION',
        desc: 'Interactive Formula 1 portfolio featuring 20 cars on the Monza grid, real-time start gantry, and authentic engineering workstation.',
        techs: 'Three.js • WebGL • GSAP • Web Audio',
        web: 'https://github.com/Aryan-Shrivastva/CrazyHead',
        github: 'https://github.com/Aryan-Shrivastva/CrazyHead',
        badgeColor: '#E10600'
      },
      {
        title: 'Real-Time Telemetry Pipeline',
        category: 'FULL-STACK / STREAMING ENGINE',
        desc: 'High-throughput 60Hz WebSocket pipeline streaming multi-sensor telemetry, delta lap classifier, and distributed Redis cluster.',
        techs: 'Node.js • WebSockets • Redis • React',
        web: 'https://github.com/Aryan-Shrivastva',
        github: 'https://github.com/Aryan-Shrivastva',
        badgeColor: '#00D2BE'
      },
      {
        title: 'Neural Vision Apex Tracker',
        category: 'AI & COMPUTER VISION',
        desc: 'Deep learning computer vision system for track telemetry analysis, apex tracking, and aerodynamic drag forecasting.',
        techs: 'Python • PyTorch • FastAPI • OpenCV',
        web: 'https://github.com/Aryan-Shrivastva',
        github: 'https://github.com/Aryan-Shrivastva',
        badgeColor: '#FF8700'
      },
      {
        title: 'Cloud Container Orchestrator',
        category: 'DISTRIBUTED SYSTEMS',
        desc: 'Automated container scaling orchestrator with zero-downtime rolling deploys, latency health probes, and cloud telemetry.',
        techs: 'Go • Docker • Kubernetes • Prometheus',
        web: 'https://github.com/Aryan-Shrivastva',
        github: 'https://github.com/Aryan-Shrivastva',
        badgeColor: '#34C759'
      }
    ];

    // Canvas textures for top monitor & bottom CRT TV
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
    // Room Materials (Matching exact sage/teal palette of Image 2)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x306B5F, roughness: 0.5, metalness: 0.1 });
    const wallLeftMat = new THREE.MeshStandardMaterial({ color: 0x275E53, roughness: 0.5 });
    const wallRightMat = new THREE.MeshStandardMaterial({ color: 0x2A6256, roughness: 0.5 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1E4940, roughness: 0.6 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x1F4E44, roughness: 0.6 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x3D7F72, roughness: 0.4 });
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x326C60, roughness: 0.4 });
    const whitePropMat = new THREE.MeshStandardMaterial({ color: 0xE8EFEA, roughness: 0.3 });
    const darkFrameMat = new THREE.MeshStandardMaterial({ color: 0x132621, roughness: 0.4 });

    // 1. WALLS & CEILING
    // Back Wall
    const backWallGeo = new THREE.PlaneGeometry(12, 8);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
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

    // Right Wall (Angled inward in perspective matching Image 2)
    const rightWallGeo = new THREE.PlaneGeometry(10, 8);
    const rightWall = new THREE.Mesh(rightWallGeo, wallRightMat);
    rightWall.position.set(4.8, 4, 0);
    rightWall.rotation.y = -Math.PI / 2 + 0.12;
    rightWall.receiveShadow = true;
    this.group.add(rightWall);

    // Ceiling & Beams
    const ceilingGeo = new THREE.PlaneGeometry(12, 10);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.set(0, 7.5, 0);
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    // Top horizontal ceiling beam
    const beamGeo = new THREE.BoxGeometry(12, 0.4, 0.6);
    const beam = new THREE.Mesh(beamGeo, trimMat);
    beam.position.set(0, 7.3, -3.7);
    this.group.add(beam);

    // Right vertical corner pillar
    const pillarGeo = new THREE.BoxGeometry(0.5, 8, 0.6);
    const pillar = new THREE.Mesh(pillarGeo, trimMat);
    pillar.position.set(3.4, 4, -3.7);
    this.group.add(pillar);

    // 2. LEFT SHELVING & TOOL BOARD
    // Left cabinet shelf
    const shelfGeo = new THREE.BoxGeometry(0.5, 7, 2.2);
    const shelf = new THREE.Mesh(shelfGeo, whitePropMat);
    shelf.position.set(-4.7, 3.5, -2.5);
    shelf.castShadow = true;
    this.group.add(shelf);

    // Toolboard Backing
    const toolboardGeo = new THREE.BoxGeometry(0.12, 3.8, 2.0);
    const toolboardMat = new THREE.MeshStandardMaterial({ color: 0x367A6C, roughness: 0.4 });
    const toolboard = new THREE.Mesh(toolboardGeo, toolboardMat);
    toolboard.position.set(-4.9, 4.0, -0.6);
    this.group.add(toolboard);

    // Toolboard Border Bevel
    const tbBorderGeo = new THREE.BoxGeometry(0.16, 4.0, 2.2);
    const tbBorder = new THREE.Mesh(tbBorderGeo, trimMat);
    tbBorder.position.set(-4.93, 4.0, -0.6);
    this.group.add(tbBorder);

    // 3D Screwdrivers on Toolboard (4 vertical screwdrivers)
    for (let i = 0; i < 4; i++) {
      const handleGeo = new THREE.BoxGeometry(0.08, 0.5, 0.08);
      const handle = new THREE.Mesh(handleGeo, whitePropMat);
      handle.position.set(-4.8, 4.8, -1.2 + i * 0.4);

      const shaftGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6);
      const shaft = new THREE.Mesh(shaftGeo, whitePropMat);
      shaft.position.set(-4.8, 4.1, -1.2 + i * 0.4);

      this.group.add(handle);
      this.group.add(shaft);
    }

    // 3D Wrenches & Spanners on Toolboard (3 horizontal)
    for (let j = 0; j < 3; j++) {
      const wrenchBodyGeo = new THREE.BoxGeometry(0.06, 0.12, 1.4);
      const wrenchBody = new THREE.Mesh(wrenchBodyGeo, whitePropMat);
      wrenchBody.position.set(-4.8, 3.2 - j * 0.35, -0.6);

      const wrenchHeadGeo = new THREE.BoxGeometry(0.07, 0.22, 0.18);
      const headL = new THREE.Mesh(wrenchHeadGeo, whitePropMat);
      headL.position.set(-4.8, 3.2 - j * 0.35, -1.3);

      const headR = new THREE.Mesh(wrenchHeadGeo, whitePropMat);
      headR.position.set(-4.8, 3.2 - j * 0.35, 0.1);

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

    // 3D White Keyboard in center of desk
    const kbGeo = new THREE.BoxGeometry(2.4, 0.12, 0.9);
    const kb = new THREE.Mesh(kbGeo, whitePropMat);
    kb.position.set(-0.3, 2.06, -1.8);
    kb.castShadow = true;
    this.group.add(kb);

    // 3D Mouse / Notepad to the right of keyboard
    const mouseGeo = new THREE.BoxGeometry(0.3, 0.08, 0.5);
    const mouse = new THREE.Mesh(mouseGeo, whitePropMat);
    mouse.position.set(1.3, 2.04, -1.8);
    this.group.add(mouse);

    // 3D Stacked Papers & Notes
    const paperMat1 = new THREE.MeshStandardMaterial({ color: 0x93C5BD, roughness: 0.6 });
    const paperMat2 = new THREE.MeshStandardMaterial({ color: 0xBEDFD8, roughness: 0.6 });
    const paperMat3 = new THREE.MeshStandardMaterial({ color: 0xE8EFEA, roughness: 0.6 });

    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 1.0), paperMat1);
    p1.position.set(2.1, 2.01, -1.7);
    p1.rotation.y = 0.15;
    this.group.add(p1);

    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.9), paperMat2);
    p2.position.set(2.2, 2.03, -1.8);
    p2.rotation.y = -0.1;
    this.group.add(p2);

    const p3 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.8), paperMat3);
    p3.position.set(2.3, 2.05, -1.75);
    p3.rotation.y = 0.05;
    this.group.add(p3);

    // 3D Canisters / Cups on left of desk
    const canGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.45, 12);
    const canMat = new THREE.MeshStandardMaterial({ color: 0x224E43, roughness: 0.4 });
    const can1 = new THREE.Mesh(canGeo, canMat);
    can1.position.set(-2.4, 2.22, -1.8);
    this.group.add(can1);

    const can2 = new THREE.Mesh(canGeo, canMat);
    can2.position.set(-2.0, 2.22, -1.6);
    this.group.add(can2);

    // 4. RIGHT WALL FRAMED PORTRAITS (Matching Image 2)
    // Top Wide Picture Frame (Podium photo)
    const topFrameGeo = new THREE.BoxGeometry(0.12, 1.8, 3.4);
    const topFrame = new THREE.Mesh(topFrameGeo, darkFrameMat);
    topFrame.position.set(4.3, 5.4, -1.6);
    topFrame.rotation.y = -Math.PI / 2 + 0.12;
    this.group.add(topFrame);

    // Podium canvas texture
    const topPicMat = new THREE.MeshBasicMaterial({ map: this.createPodiumTexture() });
    const topPicGeo = new THREE.PlaneGeometry(3.2, 1.6);
    const topPic = new THREE.Mesh(topPicGeo, topPicMat);
    topPic.position.set(4.23, 5.4, -1.6);
    topPic.rotation.y = -Math.PI / 2 + 0.12;
    this.group.add(topPic);

    // Bottom Portrait Picture Frame (Driver with goat silhouette)
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

    // 5. TOP ANGLED 3D INFO MONITOR
    this.buildTopMonitor();

    // 6. BOTTOM 3D CRT TELEVISION
    this.buildBottomCRT();
  }

  buildTopMonitor() {
    // Top Monitor Outer Bezel (Angled down matching Image 2)
    const monW = 4.8;
    const monH = 2.0;
    const monDepth = 0.25;

    const topMonGroup = new THREE.Group();
    topMonGroup.position.set(-0.2, 5.7, -3.6);
    topMonGroup.rotation.x = 0.16; // Angled downwards towards camera

    const monFrameGeo = new THREE.BoxGeometry(monW, monH, monDepth);
    const monFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1E4F45,
      roughness: 0.3,
      metalness: 0.2
    });
    const monFrame = new THREE.Mesh(monFrameGeo, monFrameMat);
    topMonGroup.add(monFrame);

    // Monitor Screen Canvas
    this.topMonitorCanvas = document.createElement('canvas');
    this.topMonitorCanvas.width = 1024;
    this.topMonitorCanvas.height = 426;
    this.topMonitorCtx = this.topMonitorCanvas.getContext('2d');
    this.topMonitorTexture = new THREE.CanvasTexture(this.topMonitorCanvas);
    this.topMonitorTexture.minFilter = THREE.LinearFilter;

    this.renderTopMonitor();

    const screenGeo = new THREE.PlaneGeometry(monW - 0.15, monH - 0.15);
    const screenMat = new THREE.MeshBasicMaterial({ map: this.topMonitorTexture });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0, monDepth / 2 + 0.01);
    topMonGroup.add(screenMesh);

    this.group.add(topMonGroup);

    // Add raycast targets for PREVIOUS, NEXT, and GO BACK buttons
    this.topScreenMesh = screenMesh;
    screenMesh.name = 'PADDOCK_TOP_SCREEN';
    this.interactiveObjects.push(screenMesh);
  }

  renderTopMonitor() {
    if (!this.topMonitorCtx) return;
    const ctx = this.topMonitorCtx;
    const w = this.topMonitorCanvas.width;
    const h = this.topMonitorCanvas.height;

    // Dark charcoal screen background matching Image 2
    ctx.fillStyle = '#1D2529';
    ctx.fillRect(0, 0, w, h);

    // Subtle inner border
    ctx.strokeStyle = '#2D3E42';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // 1. Header Navigation Bar
    // [ PREVIOUS ] Button
    ctx.fillStyle = '#131A1E';
    ctx.fillRect(36, 26, 170, 52);
    ctx.strokeStyle = '#607B88';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 26, 170, 52);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Titillium Web", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PREVIOUS', 121, 60);

    // Center Title: Aryan's paddock
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Titillium Web", sans-serif';
    ctx.fillText("Aryan's paddock", w / 2, 62);

    // [ NEXT ] Button
    ctx.fillStyle = '#131A1E';
    ctx.fillRect(w - 206, 26, 170, 52);
    ctx.strokeStyle = '#607B88';
    ctx.lineWidth = 2;
    ctx.strokeRect(w - 206, 26, 170, 52);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Titillium Web", sans-serif';
    ctx.fillText('NEXT', w - 121, 60);

    // 2. Body Text (Matching exact copy from reference Image 2)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F0F5F5';
    ctx.font = '22px "Titillium Web", sans-serif';

    ctx.fillText('As Web developers, we have the opportunity to showcase our', 40, 140);
    ctx.fillText('work in creative ways.', 40, 172);

    ctx.fillText('Since my first contact with 3D websites, I always wanted to', 40, 224);
    ctx.fillText('create my portfolio as an interactive 3D experience.', 40, 256);

    ctx.fillText('I am glad I finally came around to do it and hope you enjoy the', 40, 310);
    ctx.fillText('result as much as I did creating it!', 40, 342);

    // 3. [ GO BACK ] Red Pill Button (Bottom Right matching Image 2)
    ctx.fillStyle = '#E51B17';
    ctx.fillRect(w - 230, h - 72, 190, 48);
    ctx.strokeStyle = '#FF4542';
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
      color: 0x1E4F45,
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

    const screenGeo = new THREE.PlaneGeometry(crtW - 0.16, crtH - 0.16);
    const screenMat = new THREE.MeshBasicMaterial({ map: this.crtTexture });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0, crtDepth / 2 + 0.01);
    crtGroup.add(screenMesh);

    this.group.add(crtGroup);

    this.crtScreenMesh = screenMesh;
    screenMesh.name = 'PADDOCK_CRT_SCREEN';
    this.interactiveObjects.push(screenMesh);
  }

  renderCRTDisplay() {
    if (!this.crtCtx) return;
    const ctx = this.crtCtx;
    const w = this.crtCanvas.width;
    const h = this.crtCanvas.height;

    // 1. Outer Dark Chassis
    ctx.fillStyle = '#0F1E1B';
    ctx.fillRect(0, 0, w, h);

    // 2. Left Vertical Icon Sidebar
    const sideW = 120;
    ctx.fillStyle = '#0B1513';
    ctx.fillRect(0, 0, sideW, h);
    ctx.strokeStyle = '#1D3B35';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, sideW, h);

    // 🌐 Web Icon (Button 1)
    ctx.fillStyle = '#1B3630';
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

    // 🐙 GitHub Icon (Button 2)
    ctx.fillStyle = '#1B3630';
    ctx.beginPath();
    ctx.arc(60, 230, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillText('🐙', 60, 230);

    // 3. Main CRT Phosphor Glow Screen (Matching Image 2 Pale Yellow-Green Screen)
    const crtX = 140;
    const crtY = 24;
    const crtW = w - crtX - 24;
    const crtH = h - 48;

    ctx.fillStyle = '#D9EAC2';
    ctx.fillRect(crtX, crtY, crtW, crtH);
    ctx.strokeStyle = '#223B33';
    ctx.lineWidth = 4;
    ctx.strokeRect(crtX, crtY, crtW, crtH);

    // CRT Horizontal Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    for (let y = crtY; y < crtY + crtH; y += 4) {
      ctx.fillRect(crtX, y, crtW, 2);
    }

    // 4. Project Showcase Presentation
    const proj = this.projects[this.currentProjectIndex];

    // Project Header Pill
    ctx.fillStyle = proj.badgeColor || '#E10600';
    ctx.fillRect(crtX + 32, crtY + 36, 320, 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px "Orbitron", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(proj.category, crtX + 44, crtY + 53);

    // Project Title
    ctx.fillStyle = '#1A2922';
    ctx.font = '900 38px "Titillium Web", sans-serif';
    ctx.fillText(proj.title, crtX + 32, crtY + 115);

    // Project Description
    ctx.fillStyle = '#2A443A';
    ctx.font = '22px "Titillium Web", sans-serif';
    ctx.fillText(proj.desc.slice(0, 55), crtX + 32, crtY + 180);
    if (proj.desc.length > 55) {
      ctx.fillText(proj.desc.slice(55, 115), crtX + 32, crtY + 215);
    }

    // Tech Stack Pills
    ctx.fillStyle = '#19332C';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`TECH: ${proj.techs}`, crtX + 32, crtY + 280);

    // Live Link Hint
    ctx.fillStyle = '#0B2019';
    ctx.font = 'bold 18px "Orbitron", sans-serif';
    ctx.fillText('➔ CLICK ICONS ON LEFT TO LAUNCH LIVE DEMO / CODE', crtX + 32, crtY + 380);

    // Project Index Tracker
    ctx.textAlign = 'right';
    ctx.font = 'bold 20px "Orbitron", sans-serif';
    ctx.fillStyle = '#3F6154';
    ctx.fillText(`PROJECT ${this.currentProjectIndex + 1} / ${this.projects.length}`, crtX + crtW - 32, crtY + 53);

    if (this.crtTexture) this.crtTexture.needsUpdate = true;
  }

  createPodiumTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Vibrant champion celebration photo backdrop
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, '#164E43');
    grad.addColorStop(0.5, '#2D7567');
    grad.addColorStop(1, '#8AD5C7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 MONZA GP CHAMPION', 256, 120);

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

    ctx.fillStyle = '#2F685C';
    ctx.beginPath();
    ctx.arc(128, 140, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏎️', 128, 140);

    ctx.font = 'bold 18px "Orbitron", sans-serif';
    ctx.fillText('LEAD DRIVER', 128, 240);

    ctx.font = '14px "Titillium Web", sans-serif';
    ctx.fillStyle = '#9FE0D3';
    ctx.fillText('Aryan Shrivastva', 128, 270);

    return new THREE.CanvasTexture(canvas);
  }

  buildLighting() {
    // Workshop directional light
    const workLight = new THREE.DirectionalLight(0xEFFFF5, 2.2);
    workLight.position.set(0, 106, -1);
    workLight.target = this.group;
    workLight.castShadow = true;
    this.scene.add(workLight);

    // Warm desk spotlight
    const deskSpot = new THREE.SpotLight(0xD8F5EA, 3.5, 12, Math.PI / 3, 0.4);
    deskSpot.position.set(0, 106.5, -2);
    this.scene.add(deskSpot);
  }

  handleScreenClick(intersect) {
    if (!intersect || !intersect.object) return;
    const objName = intersect.object.name;
    const uv = intersect.uv;
    if (!uv) return;

    // Top Monitor Clicks (PREVIOUS, NEXT, GO BACK)
    if (objName === 'PADDOCK_TOP_SCREEN') {
      const u = uv.x;
      const v = uv.y;

      // [ PREVIOUS ] top left (u < 0.22, v > 0.82)
      if (u < 0.22 && v > 0.80) {
        this.currentProjectIndex = (this.currentProjectIndex - 1 + this.projects.length) % this.projects.length;
        this.renderCRTDisplay();
        return;
      }

      // [ NEXT ] top right (u > 0.78, v > 0.80)
      if (u > 0.78 && v > 0.80) {
        this.currentProjectIndex = (this.currentProjectIndex + 1) % this.projects.length;
        this.renderCRTDisplay();
        return;
      }

      // [ GO BACK ] bottom right (u > 0.75, v < 0.25)
      if (u > 0.72 && v < 0.28) {
        if (this.onReturnToCockpit) this.onReturnToCockpit();
        return;
      }
    }

    // Bottom CRT Screen Clicks (🌐 Web & 🐙 GitHub on left sidebar)
    if (objName === 'PADDOCK_CRT_SCREEN') {
      const u = uv.x;
      const v = uv.y;
      const proj = this.projects[this.currentProjectIndex];

      // Left sidebar (u < 0.14)
      if (u < 0.14) {
        // Globe (v between 0.65 and 0.95)
        if (v >= 0.60 && v <= 0.95) {
          window.open(proj.web, '_blank');
          return;
        }
        // GitHub (v between 0.35 and 0.60)
        if (v >= 0.30 && v < 0.60) {
          window.open(proj.github, '_blank');
          return;
        }
      }
    }
  }

  nextProject() {
    this.currentProjectIndex = (this.currentProjectIndex + 1) % this.projects.length;
    this.renderCRTDisplay();
  }

  prevProject() {
    this.currentProjectIndex = (this.currentProjectIndex - 1 + this.projects.length) % this.projects.length;
    this.renderCRTDisplay();
  }
}
