import * as THREE from 'three';

/**
 * Autodromo Nazionale Monza 3D Circuit Generator
 * Accurate layout with Italian tricolore curbs, asphalt shaders, DRS zones, & Start Gantry
 */
export class MonzaTrack {
  constructor(scene) {
    this.scene = scene;
    this.trackGroup = new THREE.Group();
    this.trackWidth = 14.0;
    this.curve = null;
    this.checkpoints = [];
    this.startGridPosition = new THREE.Vector3(0, 0.05, 0);

    this.initMonzaCurve();
    this.buildTrackRibbon();
    this.buildItalianCurbs();
    this.buildStartGantryAndGrid();
    this.buildTracksideProps();
    this.buildSurroundingTerrain();

    this.scene.add(this.trackGroup);
  }

  initMonzaCurve() {
    // Key Monza Waypoints (Scaled & Normalized in X-Z space)
    const points = [
      // 1. Start/Finish Main Straight (Rettifilo Tribune)
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 180),
      new THREE.Vector3(0, 0, 320),
      new THREE.Vector3(0, 0, 420),

      // 2. Variante del Rettifilo (Tight Chicane 1: Right then Left)
      new THREE.Vector3(12, 0, 450),
      new THREE.Vector3(6, 0, 475),
      new THREE.Vector3(18, 0, 510),

      // 3. Curva Grande (Long sweeping high-speed right)
      new THREE.Vector3(60, 0, 580),
      new THREE.Vector3(120, 0, 620),
      new THREE.Vector3(190, 0, 625),
      new THREE.Vector3(250, 0, 590),

      // 4. Variante della Roggia (Chicane 2: Left then Right)
      new THREE.Vector3(280, 0, 520),
      new THREE.Vector3(265, 0, 470),
      new THREE.Vector3(275, 0, 420),

      // 5. Curva di Lesmo 1 & Lesmo 2
      new THREE.Vector3(300, 0, 350),
      new THREE.Vector3(330, 0, 280),
      new THREE.Vector3(335, 0, 210),
      new THREE.Vector3(310, 0, 150),

      // 6. Curva del Serraglio & Straight towards Ascari
      new THREE.Vector3(260, 0, 90),
      new THREE.Vector3(220, 0, 20),
      new THREE.Vector3(190, 0, -60),

      // 7. Variante Ascari (Fast Left-Right-Left sequence)
      new THREE.Vector3(160, 0, -120),
      new THREE.Vector3(180, 0, -165),
      new THREE.Vector3(150, 0, -210),

      // 8. Rettifilo Posteriore (Back Straight)
      new THREE.Vector3(110, 0, -280),
      new THREE.Vector3(70, 0, -360),
      new THREE.Vector3(40, 0, -420),

      // 9. Curva Parabolica / Curva Alboreto (Sweeping 180° right back to start)
      new THREE.Vector3(0, 0, -460),
      new THREE.Vector3(-45, 0, -430),
      new THREE.Vector3(-65, 0, -360),
      new THREE.Vector3(-60, 0, -260),
      new THREE.Vector3(-35, 0, -150),
      new THREE.Vector3(-10, 0, -60)
    ];

    this.curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.15);
  }

  buildTrackRibbon() {
    const numPoints = 600;
    const sampledPoints = this.curve.getSpacedPoints(numPoints);

    const trackGeom = new THREE.BufferGeometry();
    const vertices = [];
    const uvs = [];
    const normals = [];
    const halfWidth = this.trackWidth / 2;

    for (let i = 0; i <= numPoints; i++) {
      const p1 = sampledPoints[i % numPoints];
      const p2 = sampledPoints[(i + 1) % numPoints];

      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(dir, up).normalize();

      // Left vertex
      const leftPos = p1.clone().addScaledVector(right, -halfWidth);
      // Right vertex
      const rightPos = p1.clone().addScaledVector(right, halfWidth);

      vertices.push(leftPos.x, leftPos.y + 0.02, leftPos.z);
      vertices.push(rightPos.x, rightPos.y + 0.02, rightPos.z);

      const v = (i / numPoints) * 40;
      uvs.push(0, v);
      uvs.push(1, v);

      normals.push(0, 1, 0);
      normals.push(0, 1, 0);
    }

    const indices = [];
    for (let i = 0; i < numPoints; i++) {
      const idx = i * 2;
      indices.push(idx, idx + 1, idx + 2);
      indices.push(idx + 1, idx + 3, idx + 2);
    }

    trackGeom.setIndex(indices);
    trackGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    trackGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    trackGeom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

    // Dark Asphalt Texture Material
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.85,
      metalness: 0.15
    });

    const trackMesh = new THREE.Mesh(trackGeom, asphaltMat);
    trackMesh.receiveShadow = true;
    this.trackGroup.add(trackMesh);
  }

  buildItalianCurbs() {
    // Monza Italian Tricolore Curbs (Red, White, Green)
    const curbSegments = 300;
    const curbWidth = 1.2;
    const halfTrack = this.trackWidth / 2;

    const points = this.curve.getSpacedPoints(curbSegments);

    for (let i = 0; i < curbSegments; i += 2) {
      const p1 = points[i];
      const p2 = points[(i + 1) % curbSegments];
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

      // Alternate Colors: Red, White, Green
      const colorIndex = Math.floor(i / 2) % 3;
      let curbColor = 0xFFFFFF; // White
      if (colorIndex === 0) curbColor = 0xE80020; // Red
      if (colorIndex === 2) curbColor = 0x008C45; // Green

      const curbMat = new THREE.MeshStandardMaterial({
        color: curbColor,
        roughness: 0.5
      });

      const curbGeo = new THREE.BoxGeometry(curbWidth, 0.08, p1.distanceTo(p2) * 1.05);

      // Left curb
      const leftCurb = new THREE.Mesh(curbGeo, curbMat);
      leftCurb.position.copy(p1).addScaledVector(right, -(halfTrack + curbWidth / 2));
      leftCurb.position.y += 0.04;
      leftCurb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      this.trackGroup.add(leftCurb);

      // Right curb
      const rightCurb = new THREE.Mesh(curbGeo, curbMat);
      rightCurb.position.copy(p1).addScaledVector(right, halfTrack + curbWidth / 2);
      rightCurb.position.y += 0.04;
      rightCurb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      this.trackGroup.add(rightCurb);
    }
  }

  buildStartGantryAndGrid() {
    // Start / Finish Line Grid Markings on Main Straight
    const gridLineGeo = new THREE.PlaneGeometry(this.trackWidth * 0.85, 1.2);
    gridLineGeo.rotateX(-Math.PI / 2);
    const gridMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.4
    });

    const finishLine = new THREE.Mesh(gridLineGeo, gridMat);
    finishLine.position.set(0, 0.03, 50);
    this.trackGroup.add(finishLine);

    // Starting Gantry Structure overhead (with 5 Red Lights)
    const gantryPillarGeo = new THREE.CylinderGeometry(0.2, 0.2, 7.0, 8);
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, metalness: 0.8, roughness: 0.3 });

    const leftPillar = new THREE.Mesh(gantryPillarGeo, gantryMat);
    leftPillar.position.set(-this.trackWidth / 2 - 2, 3.5, 50);
    this.trackGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(gantryPillarGeo, gantryMat);
    rightPillar.position.set(this.trackWidth / 2 + 2, 3.5, 50);
    this.trackGroup.add(rightPillar);

    // Cross beam
    const beamGeo = new THREE.BoxGeometry(this.trackWidth + 6, 0.8, 0.8);
    const beam = new THREE.Mesh(beamGeo, gantryMat);
    beam.position.set(0, 7.0, 50);
    this.trackGroup.add(beam);

    // 5 Red Lights Pod
    const lightBoxGeo = new THREE.BoxGeometry(6.0, 1.2, 0.6);
    const lightBoxMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
    const lightBox = new THREE.Mesh(lightBoxGeo, lightBoxMat);
    lightBox.position.set(0, 6.2, 50);
    this.trackGroup.add(lightBox);

    // 5 Red Emissive Bulbs
    for (let i = 0; i < 5; i++) {
      const bulbGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 1.5
      });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(-2.0 + i * 1.0, 6.2, 49.6);
      this.trackGroup.add(bulb);
    }
  }

  buildTracksideProps() {
    // Grandstands along Main Rettifilo Straight
    const standGeo = new THREE.BoxGeometry(12.0, 8.0, 120.0);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x8E9BAE,
      roughness: 0.7
    });

    const leftGrandstand = new THREE.Mesh(standGeo, standMat);
    leftGrandstand.position.set(-22, 4.0, 100);
    leftGrandstand.castShadow = true;
    this.trackGroup.add(leftGrandstand);

    // Distance Brake Marker Boards (300m, 200m, 100m, 50m)
    const markerDistances = [
      { z: 350, text: '300' },
      { z: 380, text: '200' },
      { z: 410, text: '100' },
      { z: 430, text: '50' }
    ];

    markerDistances.forEach(m => {
      const boardGeo = new THREE.BoxGeometry(0.2, 1.8, 1.2);
      const boardMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(-this.trackWidth / 2 - 1.2, 0.9, m.z);
      this.trackGroup.add(board);
    });

    // Pirelli / F1 Advertising Barriers
    const barrierSegments = 80;
    const points = this.curve.getSpacedPoints(barrierSegments);
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x002D62, roughness: 0.4 });

    for (let i = 0; i < barrierSegments; i += 4) {
      const p = points[i];
      const barrierGeo = new THREE.BoxGeometry(0.4, 1.2, 8.0);
      const barrier = new THREE.Mesh(barrierGeo, barrierMat);
      barrier.position.set(p.x + 12, 0.6, p.z);
      this.trackGroup.add(barrier);
    }
  }

  buildSurroundingTerrain() {
    // Royal Park of Monza (Green terrain with ambient trees/foliage)
    const terrainGeo = new THREE.PlaneGeometry(1600, 1600);
    terrainGeo.rotateX(-Math.PI / 2);

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x1E3B20,
      roughness: 0.9,
      metalness: 0.05
    });

    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.y = -0.05;
    terrain.receiveShadow = true;
    this.trackGroup.add(terrain);

    // Ambient 3D Pine / Oak Trees around Monza Park
    const treeTrunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 6, 6);
    const treeLeavesGeo = new THREE.ConeGeometry(3.5, 10, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4A2F13, roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x144018, roughness: 0.8 });

    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 300;
      const x = Math.cos(angle) * dist + 100;
      const z = Math.sin(angle) * dist + 50;

      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, 0, z);

      const trunk = new THREE.Mesh(treeTrunkGeo, trunkMat);
      trunk.position.y = 3;
      treeGroup.add(trunk);

      const leaves = new THREE.Mesh(treeLeavesGeo, leavesMat);
      leaves.position.y = 8;
      treeGroup.add(leaves);

      this.trackGroup.add(treeGroup);
    }
  }

  getNearestTrackPoint(pos) {
    if (!this.curve) return { point: new THREE.Vector3(), tangent: new THREE.Vector3(0, 0, 1), distance: 0 };
    // Find closest point on spline
    const numSamples = 200;
    let closestPoint = null;
    let minDistance = Infinity;
    let closestU = 0;

    for (let i = 0; i <= numSamples; i++) {
      const u = i / numSamples;
      const pt = this.curve.getPointAt(u);
      const dist = pt.distanceTo(pos);
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = pt;
        closestU = u;
      }
    }

    const tangent = this.curve.getTangentAt(closestU);
    return { point: closestPoint, tangent, distance: minDistance, u: closestU };
  }
}
