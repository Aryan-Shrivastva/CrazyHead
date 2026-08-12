import * as THREE from 'three';

/**
 * 3D Paddock Hospitality Truck & Workstation (Pixel-Perfect Match to User Images & Specs)
 * 
 * Top Monitor:
 * - 4 Competitive Programming & Dev Profiles (LeetCode, Codeforces, CodeChef, GitHub)
 * - Questions Done, Submissions Activity Grid / Heatmap, Active Days, Max Streak
 * 
 * Bottom CRT Monitor:
 * - 3 Left Sidebar Icons:
 *   1st: LinkedIn (https://www.linkedin.com/in/aryanshriv/)
 *   2nd: GitHub (https://github.com/Aryan-Shrivastva)
 *   3rd: X / Twitter (https://x.com/aryanshriv09)
 * - CRT Phosphor Screen displaying 3D F1 Transporter Diorama & Project Telemetry
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

    // Top Monitor: 4 Coding Profiles
    this.currentProfileIndex = 0;
    this.profiles = [
      {
        id: 'leetcode',
        platform: 'LeetCode Profile',
        handle: 'AryannnnnnShrivastva',
        url: 'https://leetcode.com/u/AryannnnnnShrivastva/',
        color: '#FFA116',
        questionsDone: '654 Solved',
        breakdown: 'Easy: 267 • Med: 329 • Hard: 58',
        activeDays: '172 Days Active',
        maxStreak: '92 Days Streak 🔥',
        ranking: 'Top 5.2% (Rank #112,116)',
        calendar: this.generateActivityData(172, 92, 0.75)
      },
      {
        id: 'codeforces',
        platform: 'Codeforces Profile',
        handle: 'Aryan1901',
        url: 'https://codeforces.com/profile/Aryan1901',
        color: '#3B82F6',
        questionsDone: '184 Solved',
        breakdown: 'Rating: 1068 (Max: 1068) • Newbie',
        activeDays: '48 Days Active',
        maxStreak: '14 Days Streak 🔥',
        ranking: 'Contests: 12 • Division 2/3 Competitor',
        calendar: this.generateActivityData(48, 14, 0.45)
      },
      {
        id: 'codechef',
        platform: 'CodeChef Profile',
        handle: 'aryan1901',
        url: 'https://www.codechef.com/users/aryan1901',
        color: '#8B5CF6',
        questionsDone: '126 Solved',
        breakdown: 'Rating: 1420 (2★) • Global Div 3',
        activeDays: '38 Days Active',
        maxStreak: '12 Days Streak 🔥',
        ranking: 'Star Rating: 2★ • Div 3 Rank #420',
        calendar: this.generateActivityData(38, 12, 0.40)
      },
      {
        id: 'github',
        platform: 'GitHub Profile',
        handle: 'Aryan-Shrivastva',
        url: 'https://github.com/Aryan-Shrivastva',
        color: '#22C55E',
        questionsDone: '292 Contributions',
        breakdown: '52 Repositories • 1,480+ Commits',
        activeDays: '142 Active Days',
        maxStreak: '28 Days Streak ⚡',
        ranking: 'Top Repos: CrazyHead (F1 3D), Telemetry Engine',
        calendar: this.generateActivityData(142, 28, 0.65)
      }
    ];

    // Bottom CRT Monitor: 3 Social Profiles
    this.socialLinks = [
      {
        name: 'LinkedIn',
        url: 'https://www.linkedin.com/in/aryanshriv/',
        icon: '💼',
        glyph: 'in',
        color: '#0A66C2'
      },
      {
        name: 'GitHub',
        url: 'https://github.com/Aryan-Shrivastva',
        icon: '🐙',
        glyph: 'GH',
        color: '#FFFFFF'
      },
      {
        name: 'X / Twitter',
        url: 'https://x.com/aryanshriv09',
        icon: '𝕏',
        glyph: '𝕏',
        color: '#1DA1F2'
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

    // Fetch live APIs in background to refresh live data
    this.fetchLiveProfileData();
  }

  generateActivityData(activeCount, maxStreak, density) {
    const grid = [];
    const totalDays = 52 * 7; // 364 days
    for (let i = 0; i < totalDays; i++) {
      const r = Math.random();
      if (r < density * 0.4) {
        grid.push(Math.floor(Math.random() * 4) + 1); // 1-4 contributions
      } else if (r < density * 0.6) {
        grid.push(Math.floor(Math.random() * 8) + 3); // 3-10 contributions
      } else {
        grid.push(0);
      }
    }
    return grid;
  }

  async fetchLiveProfileData() {
    try {
      // 1. Fetch LeetCode
      const lcRes = await fetch('https://alfa-leetcode-api.onrender.com/userProfile/AryannnnnnShrivastva').catch(() => null);
      if (lcRes && lcRes.ok) {
        const lc = await lcRes.json();
        if (lc && lc.totalSolved) {
          this.profiles[0].questionsDone = `${lc.totalSolved} Solved`;
          this.profiles[0].breakdown = `Easy: ${lc.easySolved || 267} • Med: ${lc.mediumSolved || 329} • Hard: ${lc.hardSolved || 58}`;
          if (lc.ranking) this.profiles[0].ranking = `Global Rank #${lc.ranking.toLocaleString()}`;
        }
      }

      // 2. Fetch Codeforces
      const cfRes = await fetch('https://codeforces.com/api/user.info?handles=Aryan1901').catch(() => null);
      if (cfRes && cfRes.ok) {
        const cf = await cfRes.json();
        if (cf.status === 'OK' && cf.result && cf.result[0]) {
          const user = cf.result[0];
          this.profiles[1].breakdown = `Rating: ${user.rating || 1068} (Max: ${user.maxRating || 1068}) • ${user.rank || 'newbie'}`;
        }
      }

      // 3. Fetch GitHub
      const ghRes = await fetch('https://github-contributions-api.jogruber.de/v4/Aryan-Shrivastva?y=last').catch(() => null);
      if (ghRes && ghRes.ok) {
        const gh = await ghRes.json();
        if (gh && gh.total && gh.total.lastYear) {
          this.profiles[3].questionsDone = `${gh.total.lastYear} Contributions`;
        }
      }

      this.renderTopMonitor();
    } catch (e) {
      console.log('Profile fetch notice:', e);
    }
  }

  buildTruckEnvironment() {
    const truckRedMat = new THREE.MeshStandardMaterial({ color: 0xD32F2F, roughness: 0.35, metalness: 0.15 });
    const truckDarkRedMat = new THREE.MeshStandardMaterial({ color: 0x991B1B, roughness: 0.4 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, metalness: 0.85, roughness: 0.2 });
    const tireBlackMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.7 });

    // Floor & Trailer Shell
    const trailerFloor = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.4, 6.0), truckDarkRedMat);
    trailerFloor.position.set(0, 0.2, -1.5);
    this.group.add(trailerFloor);

    const trailerRoof = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.4, 6.0), truckRedMat);
    trailerRoof.position.set(0, 7.8, -1.5);
    this.group.add(trailerRoof);

    const trailerLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7.6, 6.0), truckRedMat);
    trailerLeft.position.set(-5.15, 4.0, -1.5);
    this.group.add(trailerLeft);

    const trailerRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7.6, 6.0), truckRedMat);
    trailerRight.position.set(5.15, 4.0, -1.5);
    this.group.add(trailerRight);

    // Top Signage Banner ("aramco" / "ILLE")
    const bannerGeo = new THREE.BoxGeometry(9.8, 1.1, 0.15);
    const bannerMat = new THREE.MeshBasicMaterial({ map: this.createTopBannerTexture() });
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerMesh.position.set(0, 7.25, 1.45);
    this.group.add(bannerMesh);

    // Floating 3D '@' Icon on Top Right
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

    const atStem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 16), atMat);
    atStem.position.set(0.18, -0.1, 0);
    atGroup.add(atStem);
    this.group.add(atGroup);

    // Front Truck Cab
    const cabGroup = new THREE.Group();
    cabGroup.position.set(-6.6, 2.5, 0.2);
    const cabMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.5, 4.0), truckRedMat);
    cabGroup.add(cabMesh);

    const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 3.2), new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.1, metalness: 0.9 }));
    windowMesh.position.set(-1.21, 0.6, 0);
    cabGroup.add(windowMesh);

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

    ctx.fillStyle = '#D62828';
    ctx.fillRect(0, 0, 260, 128);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 64px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ILLE', 130, 64);

    const grad = ctx.createLinearGradient(260, 0, 800, 128);
    grad.addColorStop(0, '#00A8E8');
    grad.addColorStop(0.5, '#70D6FF');
    grad.addColorStop(1, '#A0E426');
    ctx.fillStyle = grad;
    ctx.fillRect(260, 0, 560, 128);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px "Titillium Web", sans-serif';
    ctx.fillText('aramco', 540, 64);

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

    // Back & Perspective Walls
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 7.4), wallBackMat);
    backWall.position.set(0, 4.0, -3.9);
    this.group.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 7.4), wallLeftMat);
    leftWall.position.set(-4.95, 4.0, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.group.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 7.4), wallRightMat);
    rightWall.position.set(4.75, 4.0, 0);
    rightWall.rotation.y = -Math.PI / 2 + 0.12;
    this.group.add(rightWall);

    // Left 3-Tier Tire Rack (Holding 5 F1 Tires)
    const rackGroup = new THREE.Group();
    rackGroup.position.set(-3.7, 1.8, -2.4);

    for (let x of [-0.6, 0.6]) {
      for (let z of [-0.45, 0.45]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.2, 0.1), whiteMat);
        post.position.set(x, 1.9, z);
        rackGroup.add(post);
      }
    }

    for (let y of [0.0, 1.4, 2.8]) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.08, 1.0), whiteMat);
      shelf.position.set(0, y, 0);
      rackGroup.add(shelf);
    }

    const addTire = (x, y, z) => {
      const tireGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.38, 20);
      tireGeo.rotateX(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireBlackMat);
      tire.position.set(x, y, z);
      rackGroup.add(tire);
    };

    addTire(-0.25, 0.6, 0);
    addTire(0.25, 0.6, 0);
    addTire(-0.25, 2.0, 0);
    addTire(0.25, 2.0, 0);
    addTire(0.0, 3.4, 0);
    this.group.add(rackGroup);

    // Green Toolboard with Hanging Tools
    const toolboardGroup = new THREE.Group();
    toolboardGroup.position.set(-2.0, 4.4, -3.75);

    const boardMat = new THREE.MeshStandardMaterial({ color: 0x337A6C, roughness: 0.4 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.2, 0.12), boardMat);
    toolboardGroup.add(board);

    for (let i = 0; i < 4; i++) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), whiteMat);
      handle.position.set(-0.55 + i * 0.36, 0.9, 0.1);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8), whiteMat);
      shaft.position.set(-0.55 + i * 0.36, 0.35, 0.1);
      toolboardGroup.add(handle);
      toolboardGroup.add(shaft);
    }

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

    // Red Tool Cabinet & Drawers
    const cabinetGroup = new THREE.Group();
    cabinetGroup.position.set(0.7, 1.0, -2.6);
    const cabinetBody = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.8, 2.0), redCabinetMat);
    cabinetGroup.add(cabinetBody);

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

    const openDrawer = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.38, 1.2), redCabinetMat);
    openDrawer.position.set(-1.25, 0.55, 1.5);
    cabinetGroup.add(openDrawer);
    this.group.add(cabinetGroup);

    // Workbench Desktop
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.25, 2.8), deskMat);
    deskTop.position.set(0.2, 1.95, -2.4);
    this.group.add(deskTop);

    // Keyboard & Mouse
    const kb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.85), whiteMat);
    kb.position.set(-0.05, 2.12, -1.9);
    this.group.add(kb);

    const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.45), whiteMat);
    mouse.position.set(1.4, 2.1, -1.9);
    this.group.add(mouse);

    // Stacked Notes & Desk Wrench
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

    const deskWrench = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.12), whiteMat);
    deskWrench.position.set(-1.8, 2.09, -1.6);
    deskWrench.rotation.y = -0.3;
    this.group.add(deskWrench);

    // Canisters
    const canGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.45, 12);
    const canMat = new THREE.MeshStandardMaterial({ color: 0x1E463D, roughness: 0.4 });
    const can1 = new THREE.Mesh(canGeo, canMat);
    can1.position.set(-1.6, 2.3, -2.2);
    this.group.add(can1);

    const can2 = new THREE.Mesh(canGeo, canMat);
    can2.position.set(-1.25, 2.3, -2.4);
    this.group.add(can2);

    // Right Wall Pictures (Podium & Driver GOAT)
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 3.4), darkFrameMat);
    topFrame.position.set(4.3, 5.4, -1.6);
    topFrame.rotation.y = -Math.PI / 2 + 0.12;
    this.group.add(topFrame);

    const topPicMat = new THREE.MeshBasicMaterial({ map: this.createPodiumTexture() });
    const topPic = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), topPicMat);
    topPic.position.set(4.23, 5.4, -1.6);
    topPic.rotation.y = -Math.PI / 2 + 0.12;
    this.group.add(topPic);

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
    this.engineerGroup = new THREE.Group();
    this.engineerGroup.position.set(0.6, 0.4, -1.4);

    const redSuitMat = new THREE.MeshStandardMaterial({ color: 0xD32F2F, roughness: 0.4 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xC62828, roughness: 0.3 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.9, roughness: 0.2 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x7E9E97, roughness: 0.5 });

    // Stool
    const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 16), seatMat);
    stoolSeat.position.set(0, 1.3, 0);
    this.engineerGroup.add(stoolSeat);

    const stoolStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 12), chromeMat);
    stoolStem.position.set(0, 0.65, 0);
    this.engineerGroup.add(stoolStem);

    const stoolFootRingGeo = new THREE.TorusGeometry(0.28, 0.03, 12, 24);
    stoolFootRingGeo.rotateX(Math.PI / 2);
    const stoolFootRing = new THREE.Mesh(stoolFootRingGeo, chromeMat);
    stoolFootRing.position.set(0, 0.4, 0);
    this.engineerGroup.add(stoolFootRing);

    // Torso & Helmet
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.45), redSuitMat);
    torso.position.set(0, 2.0, 0);
    torso.rotation.x = 0.15;
    this.engineerGroup.add(torso);

    const helmet = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1), helmetMat);
    helmet.position.set(0, 2.7, -0.05);
    this.engineerGroup.add(helmet);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.2), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 }));
    visor.position.set(0, 2.7, -0.32);
    this.engineerGroup.add(visor);

    // Arms
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

    // Raycast hit target
    const hitBox = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.0, 1.8), new THREE.MeshBasicMaterial({ visible: false }));
    hitBox.position.set(0, 1.8, 0);
    hitBox.name = 'PADDOCK_ENGINEER_CLICK';
    this.engineerGroup.add(hitBox);
    this.interactiveObjects.push(hitBox);
  }

  buildTopMonitor() {
    const monW = 4.8;
    const monH = 2.0;
    const monDepth = 0.25;

    const topMonGroup = new THREE.Group();
    topMonGroup.position.set(-0.05, 5.7, -3.6);
    topMonGroup.rotation.x = 0.16;

    const monFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1B443B,
      roughness: 0.3,
      metalness: 0.2
    });
    const monFrame = new THREE.Mesh(new THREE.BoxGeometry(monW, monH, monDepth), monFrameMat);
    topMonGroup.add(monFrame);

    this.topMonitorCanvas = document.createElement('canvas');
    this.topMonitorCanvas.width = 1280;
    this.topMonitorCanvas.height = 540;
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

    this.topMonGroup = topMonGroup;
    screenMesh.name = 'PADDOCK_TOP_SCREEN';
    this.interactiveObjects.push(screenMesh);
  }

  renderTopMonitor() {
    if (!this.topMonitorCtx) return;
    const ctx = this.topMonitorCtx;
    const w = this.topMonitorCanvas.width;
    const h = this.topMonitorCanvas.height;
    const prof = this.profiles[this.currentProfileIndex];

    // 1. Dark charcoal cockpit monitor background
    ctx.fillStyle = '#141E22';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#22363D';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    // 2. Header Bar: [ PREVIOUS ] | Platform Title | [ NEXT ]
    ctx.fillStyle = '#0D1519';
    ctx.fillRect(28, 20, 160, 44);
    ctx.strokeStyle = '#5E7D8A';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 20, 160, 44);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px "Titillium Web", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PREVIOUS', 108, 42);

    // Center Platform Header Pill & Title
    ctx.fillStyle = prof.color;
    ctx.fillRect(w / 2 - 190, 20, 380, 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px "Orbitron", sans-serif';
    ctx.fillText(`${prof.platform.toUpperCase()} (${this.currentProfileIndex + 1}/4)`, w / 2, 42);

    // [ NEXT ]
    ctx.fillStyle = '#0D1519';
    ctx.fillRect(w - 188, 20, 160, 44);
    ctx.strokeStyle = '#5E7D8A';
    ctx.lineWidth = 2;
    ctx.strokeRect(w - 188, 20, 160, 44);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px "Titillium Web", sans-serif';
    ctx.fillText('NEXT', w - 108, 42);

    // 3. User Handle & Direct Link Badge
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '17px "JetBrains Mono", monospace';
    ctx.fillText(`HANDLE: @${prof.handle}`, 44, 94);

    ctx.fillStyle = prof.color;
    ctx.font = 'bold 15px "Orbitron", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`➔ CLICK ANYWHERE TO OPEN ${prof.platform.toUpperCase()}`, w - 44, 94);

    // 4. Metrics Cards Row (Questions Done, Active Days, Max Streak, Ranking)
    const cardY = 114;
    const cardH = 92;

    if (prof.id === 'github') {
      // GitHub Focus: Submissions & Contributions
      const colW = (1192 - 20) / 2;

      // Card 1: Total Contributions
      ctx.fillStyle = '#1B2A30';
      ctx.fillRect(44, cardY, colW, cardH);
      ctx.strokeStyle = '#2A444E';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(44, cardY, colW, cardH);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#A0C4D0';
      ctx.font = 'bold 13px "Orbitron", sans-serif';
      ctx.fillText('TOTAL CONTRIBUTIONS', 64, cardY + 26);
      ctx.fillStyle = '#22C55E';
      ctx.font = '900 32px "Orbitron", sans-serif';
      ctx.fillText(prof.questionsDone, 64, cardY + 66);

      // Card 2: Repos & Commits
      ctx.fillStyle = '#1B2A30';
      ctx.fillRect(44 + colW + 20, cardY, colW, cardH);
      ctx.strokeStyle = '#2A444E';
      ctx.strokeRect(44 + colW + 20, cardY, colW, cardH);

      ctx.fillStyle = '#A0C4D0';
      ctx.font = 'bold 13px "Orbitron", sans-serif';
      ctx.fillText('ACTIVITY & REPOSITORIES', 64 + colW + 20, cardY + 26);
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 24px "Titillium Web", sans-serif';
      ctx.fillText(prof.breakdown, 64 + colW + 20, cardY + 66);
    } else {
      // LeetCode, Codeforces, CodeChef: 3-Metric Cards
      const colW = (1192 - 32) / 3;

      // Metric 1: Questions Done
      ctx.fillStyle = '#1B2A30';
      ctx.fillRect(44, cardY, colW, cardH);
      ctx.strokeStyle = '#2A444E';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(44, cardY, colW, cardH);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#A0C4D0';
      ctx.font = 'bold 12px "Orbitron", sans-serif';
      ctx.fillText('QUESTIONS SOLVED', 60, cardY + 24);
      ctx.fillStyle = prof.color;
      ctx.font = '900 28px "Orbitron", sans-serif';
      ctx.fillText(prof.questionsDone, 60, cardY + 56);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px "Titillium Web", sans-serif';
      ctx.fillText(prof.breakdown, 60, cardY + 78);

      // Metric 2: Active Days
      ctx.fillStyle = '#1B2A30';
      ctx.fillRect(44 + colW + 16, cardY, colW, cardH);
      ctx.strokeStyle = '#2A444E';
      ctx.strokeRect(44 + colW + 16, cardY, colW, cardH);

      ctx.fillStyle = '#A0C4D0';
      ctx.font = 'bold 12px "Orbitron", sans-serif';
      ctx.fillText('ACTIVE DAYS', 60 + colW + 16, cardY + 24);
      ctx.fillStyle = '#38BDF8';
      ctx.font = '900 28px "Orbitron", sans-serif';
      ctx.fillText(prof.activeDays, 60 + colW + 16, cardY + 56);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px "Titillium Web", sans-serif';
      ctx.fillText('Consistency Tracker', 60 + colW + 16, cardY + 78);

      // Metric 3: Max Streak
      ctx.fillStyle = '#1B2A30';
      ctx.fillRect(44 + (colW + 16) * 2, cardY, colW, cardH);
      ctx.strokeStyle = '#2A444E';
      ctx.strokeRect(44 + (colW + 16) * 2, cardY, colW, cardH);

      ctx.fillStyle = '#A0C4D0';
      ctx.font = 'bold 12px "Orbitron", sans-serif';
      ctx.fillText('MAX STREAK', 60 + (colW + 16) * 2, cardY + 24);
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 28px "Orbitron", sans-serif';
      ctx.fillText(prof.maxStreak, 60 + (colW + 16) * 2, cardY + 56);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px "Titillium Web", sans-serif';
      ctx.fillText(prof.ranking, 60 + (colW + 16) * 2, cardY + 78);
    }

    // 5. 52-Week Submissions Activity Heatmap Grid
    const gridY = 222;
    const gridBoxH = 226;

    ctx.fillStyle = '#0F181C';
    ctx.fillRect(44, gridY, 1192, gridBoxH);
    ctx.strokeStyle = '#223842';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(44, gridY, 1192, gridBoxH);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 15px "Orbitron", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SUBMISSION & CONTRIBUTION ACTIVITY GRID (YEARLY HEATMAP)', 64, gridY + 30);

    // Render 52 columns x 7 rows heatmap matrix
    const numCols = 52;
    const numRows = 7;
    const cellW = 18;
    const cellH = 16;
    const gap = 4;
    const startX = 64;
    const startY = gridY + 50;

    const colors = [
      '#1E2C33', // 0 submissions
      '#0E4429', // 1-2
      '#006D32', // 3-5
      '#26A641', // 6-9
      '#39D353'  // 10+
    ];

    let dataIdx = 0;
    for (let c = 0; c < numCols; c++) {
      for (let r = 0; r < numRows; r++) {
        const val = prof.calendar[dataIdx % prof.calendar.length] || 0;
        let colorIdx = 0;
        if (val > 8) colorIdx = 4;
        else if (val > 5) colorIdx = 3;
        else if (val > 2) colorIdx = 2;
        else if (val > 0) colorIdx = 1;

        ctx.fillStyle = colors[colorIdx];
        ctx.fillRect(startX + c * (cellW + gap), startY + r * (cellH + gap), cellW, cellH);
        dataIdx++;
      }
    }

    // Heatmap Legend
    const legendX = w - 300;
    const legendY = gridY + 195;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px "Titillium Web", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Less', legendX - 10, legendY + 10);

    for (let l = 0; l < 5; l++) {
      ctx.fillStyle = colors[l];
      ctx.fillRect(legendX + l * 18, legendY, 14, 14);
    }
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'left';
    ctx.fillText('More', legendX + 5 * 18 + 6, legendY + 10);

    // 6. [ GO BACK ] Button (Bottom Right)
    ctx.fillStyle = '#E61E1A';
    ctx.fillRect(w - 210, h - 68, 178, 48);
    ctx.strokeStyle = '#FF4D4A';
    ctx.lineWidth = 2;
    ctx.strokeRect(w - 210, h - 68, 178, 48);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GO BACK', w - 121, h - 38);

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

    this.crtGroup = crtGroup;
    screenMesh.name = 'PADDOCK_CRT_SCREEN';
    this.interactiveObjects.push(screenMesh);
  }

  renderCRTDisplay() {
    if (!this.crtCtx) return;
    const ctx = this.crtCtx;
    const w = this.crtCanvas.width;
    const h = this.crtCanvas.height;

    // 1. Dark Outer Chassis
    ctx.fillStyle = '#0D1A17';
    ctx.fillRect(0, 0, w, h);

    // 2. Left Vertical Action Panel: 3 Social Links (LinkedIn, GitHub, X / Twitter)
    const sideW = 120;
    ctx.fillStyle = '#091311';
    ctx.fillRect(0, 0, sideW, h);
    ctx.strokeStyle = '#18342E';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, sideW, h);

    // Icon 1: LinkedIn (Top: Y = 90)
    ctx.fillStyle = '#0A66C2';
    ctx.beginPath();
    ctx.arc(60, 90, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#70B5FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px "Titillium Web", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('in', 60, 89);

    // Icon 2: GitHub (Middle: Y = 265)
    ctx.fillStyle = '#24292E';
    ctx.beginPath();
    ctx.arc(60, 265, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '36px sans-serif';
    ctx.fillText('🐙', 60, 265);

    // Icon 3: X / Twitter (Bottom: Y = 440)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(60, 440, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1DA1F2';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px "Orbitron", sans-serif';
    ctx.fillText('𝕏', 60, 440);

    // 3. Central CRT Phosphor Screen (Pale Pistachio from Image 3)
    const crtX = 140;
    const crtY = 24;
    const crtW = w - crtX - 24;
    const crtH = h - 48;

    ctx.fillStyle = '#D9EBC2';
    ctx.fillRect(crtX, crtY, crtW, crtH);
    ctx.strokeStyle = '#1E3B33';
    ctx.lineWidth = 4;
    ctx.strokeRect(crtX, crtY, crtW, crtH);

    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    for (let y = crtY; y < crtY + crtH; y += 4) {
      ctx.fillRect(crtX, y, crtW, 2);
    }

    // 4. 3D Isometric F1 Transporter Diorama
    const dioramaCenterX = crtX + 180;
    const dioramaCenterY = crtY + 280;

    ctx.fillStyle = '#8AB89A';
    ctx.beginPath();
    ctx.ellipse(dioramaCenterX, dioramaCenterY, 150, 65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6E987C';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Red Truck & Hospitality Unit
    ctx.fillStyle = '#D62828';
    ctx.fillRect(dioramaCenterX - 80, dioramaCenterY - 160, 110, 140);
    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 2;
    ctx.strokeRect(dioramaCenterX - 80, dioramaCenterY - 160, 110, 140);

    ctx.fillStyle = '#E63946';
    ctx.fillRect(dioramaCenterX - 140, dioramaCenterY - 70, 70, 70);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(dioramaCenterX - 135, dioramaCenterY - 60, 30, 25);

    ctx.fillStyle = '#E63946';
    ctx.fillRect(dioramaCenterX + 10, dioramaCenterY - 20, 85, 22);
    ctx.fillStyle = '#111111';
    ctx.fillRect(dioramaCenterX + 5, dioramaCenterY - 10, 20, 12);
    ctx.fillRect(dioramaCenterX + 70, dioramaCenterY - 10, 20, 12);
    ctx.fillRect(dioramaCenterX + 85, dioramaCenterY - 32, 8, 22);

    // Interactive Social Links Telemetry Section
    const infoX = crtX + 380;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#194A3D';
    ctx.fillRect(infoX, crtY + 36, 280, 32);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Orbitron", sans-serif';
    ctx.fillText('CONNECT & NETWORK', infoX + 16, crtY + 44);

    ctx.fillStyle = '#12261F';
    ctx.font = '900 32px "Titillium Web", sans-serif';
    ctx.fillText("Aryan's Social Hub", infoX, crtY + 84);

    ctx.fillStyle = '#234E41';
    ctx.font = 'bold 18px "Titillium Web", sans-serif';
    ctx.fillText('Click 3 Icons on Left to Visit:', infoX, crtY + 128);

    // Social Links details
    ctx.fillStyle = '#0A66C2';
    ctx.font = 'bold 18px "Titillium Web", sans-serif';
    ctx.fillText('1. LinkedIn  ➔  in/aryanshriv', infoX, crtY + 175);

    ctx.fillStyle = '#1F2937';
    ctx.fillText('2. GitHub    ➔  Aryan-Shrivastva', infoX, crtY + 215);

    ctx.fillStyle = '#0284C7';
    ctx.fillText('3. X (Twitter) ➔  @aryanshriv09', infoX, crtY + 255);

    // Direct CTA
    ctx.fillStyle = '#0A211B';
    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.fillText('➔ TAP ICONS ON LEFT (in / 🐙 / 𝕏)', infoX, crtY + 360);

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
    const roomAmbient = new THREE.AmbientLight(0xEFFDF8, 2.2);
    this.group.add(roomAmbient);

    const workPoint = new THREE.PointLight(0xFFFFFF, 3.5, 30);
    workPoint.position.set(0, 6.2, -1.5);
    this.group.add(workPoint);

    const deskSpot = new THREE.SpotLight(0xE0FFF4, 4.2, 18, Math.PI / 3, 0.3);
    deskSpot.position.set(0, 6.5, -2.0);
    deskSpot.target.position.set(0, 2.0, -2.0);
    this.group.add(deskSpot);
    this.group.add(deskSpot.target);

    const truckFill = new THREE.DirectionalLight(0xE5F5FF, 1.8);
    truckFill.position.set(3, 108, 6);
    this.group.add(truckFill);
  }

  enterPaddockOverview() {
    this.stage = 'overview';
    if (this.cameraController) {
      this.cameraController.transitionToPaddockOverview();
    }
  }

  zoomIntoDesk() {
    this.stage = 'desk';
    if (this.cameraController) {
      this.cameraController.transitionToPaddockDesk();
    }
  }

  zoomIntoTopMonitor() {
    this.stage = 'top_monitor';
    if (this.cameraController) {
      this.cameraController.transitionToPaddockTopMonitor();
    }
  }

  zoomIntoBottomMonitor() {
    this.stage = 'bottom_monitor';
    if (this.cameraController) {
      this.cameraController.transitionToPaddockBottomMonitor();
    }
  }

  prevProfile() {
    this.currentProfileIndex = (this.currentProfileIndex - 1 + this.profiles.length) % this.profiles.length;
    this.renderTopMonitor();
  }

  nextProfile() {
    this.currentProfileIndex = (this.currentProfileIndex + 1) % this.profiles.length;
    this.renderTopMonitor();
  }

  handleGlobalClick(hits) {
    if (!hits || hits.length === 0) return;

    for (let hit of hits) {
      let cur = hit.object;
      let isTop = false;
      let isBottom = false;
      let isEngineer = false;

      while (cur && cur !== this.group) {
        if (cur === this.topMonGroup || cur.name === 'PADDOCK_TOP_SCREEN') {
          isTop = true;
          break;
        }
        if (cur === this.crtGroup || cur.name === 'PADDOCK_CRT_SCREEN') {
          isBottom = true;
          break;
        }
        if (cur === this.engineerGroup || cur.name === 'PADDOCK_ENGINEER_CLICK') {
          isEngineer = true;
          break;
        }
        cur = cur.parent;
      }

      if (isTop) {
        if (this.stage !== 'top_monitor') {
          this.zoomIntoTopMonitor();
          return;
        } else {
          // Already in top_monitor -> handle navigation or links
          const uv = hit.uv;
          if (uv) {
            const u = uv.x;
            const v = uv.y;

            if (u < 0.20 && v > 0.82) {
              this.prevProfile();
              return;
            }
            if (u > 0.80 && v > 0.82) {
              this.nextProfile();
              return;
            }
            if (u > 0.78 && v < 0.20) {
              this.zoomIntoDesk();
              return;
            }
            const prof = this.profiles[this.currentProfileIndex];
            if (prof && prof.url) {
              window.open(prof.url, '_blank');
            }
          }
          return;
        }
      }

      if (isBottom) {
        if (this.stage !== 'bottom_monitor') {
          this.zoomIntoBottomMonitor();
          return;
        } else {
          // Already in bottom_monitor -> handle social icons
          const uv = hit.uv;
          if (uv && uv.x < 0.15) {
            if (uv.y >= 0.70) {
              window.open('https://www.linkedin.com/in/aryanshriv/', '_blank');
              return;
            }
            if (uv.y >= 0.35 && uv.y < 0.70) {
              window.open('https://github.com/Aryan-Shrivastva', '_blank');
              return;
            }
            if (uv.y < 0.35) {
              window.open('https://x.com/aryanshriv09', '_blank');
              return;
            }
          }
          this.zoomIntoDesk();
          return;
        }
      }

      if (isEngineer || this.stage === 'overview') {
        this.zoomIntoDesk();
        return;
      }
    }
  }

  handleScreenClick(intersect) {
    if (intersect) {
      this.handleGlobalClick([intersect]);
    }
  }
}
