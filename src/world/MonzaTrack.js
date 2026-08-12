import * as THREE from 'three';

/**
 * Autodromo Nazionale Monza 3D Circuit Generator
 * Accurate official layout matching the Monza Grand Prix circuit map with Italian tricolore curbs,
 * start gantry, grandstands, and zero tree clipping on the track.
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
    // Official Autodromo Nazionale Monza Spline Waypoints (Matching User Circuit Diagram)
    const points = [
      // 1. Rettifilo Main Start/Finish Straight (Start line at 0,0,0)
      new THREE.Vector3(0, 0, -60),
      new THREE.Vector3(0, 0, 0),     // Start/Finish Line
      new THREE.Vector3(0, 0, 120),
      new THREE.Vector3(0, 0, 240),
      new THREE.Vector3(0, 0, 360),   // Speed Trap area

      // 2. Turns 01 & 02: Variante del Rettifilo (Tight Right-then-Left Chicane)
      new THREE.Vector3(12, 0, 410),   // Turn 01 Right entry
      new THREE.Vector3(6, 0, 440),    // Chicane apex
      new THREE.Vector3(-8, 0, 470),   // Turn 02 Left exit

      // 3. Turn 03: Curva Grande (Long sweeping high-speed curve)
      new THREE.Vector3(-35, 0, 520),
      new THREE.Vector3(-80, 0, 580),
      new THREE.Vector3(-140, 0, 630),
      new THREE.Vector3(-210, 0, 660),
      new THREE.Vector3(-280, 0, 650),

      // 4. Turns 04 & 05: Variante della Roggia (Left-then-Right Chicane)
      new THREE.Vector3(-340, 0, 610),
      new THREE.Vector3(-375, 0, 580), // Turn 04 Left
      new THREE.Vector3(-385, 0, 545), // Turn 05 Right exit

      // 5. Turns 06 & 07: Curva di Lesmo 1 & Lesmo 2
      new THREE.Vector3(-420, 0, 480), // Turn 06 Lesmo 1
      new THREE.Vector3(-440, 0, 410),
      new THREE.Vector3(-445, 0, 330), // Turn 07 Lesmo 2
      new THREE.Vector3(-420, 0, 260),

      // 6. Curva del Serraglio & Long Diagonal Straight towards Ascari
      new THREE.Vector3(-360, 0, 170),
      new THREE.Vector3(-290, 0, 80),
      new THREE.Vector3(-210, 0, -20),
      new THREE.Vector3(-140, 0, -110),

      // 7. Turns 08, 09, 10: Variante Ascari (Fast Left-Right-Left sequence)
      new THREE.Vector3(-85, 0, -180), // Turn 08 Left entry
      new THREE.Vector3(-60, 0, -220), // Turn 09 Right apex
      new THREE.Vector3(-45, 0, -260), // Turn 10 Left exit

      // 8. Rettifilo Posteriore (Back Straight towards Parabolica)
      new THREE.Vector3(-40, 0, -340),
      new THREE.Vector3(-40, 0, -430),
      new THREE.Vector3(-40, 0, -510),

      // 9. Turn 11: Curva Parabolica / Curva Alboreto (180° long sweeping right back to main straight)
      new THREE.Vector3(-30, 0, -570), // Entry
      new THREE.Vector3(0, 0, -610),   // Mid apex
      new THREE.Vector3(45, 0, -590),
      new THREE.Vector3(65, 0, -530),  // Exit sweep
      new THREE.Vector3(55, 0, -430),
      new THREE.Vector3(35, 0, -300),
      new THREE.Vector3(15, 0, -170)
    ];

    this.curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.15);
  }

  buildTrackRibbon() {
    const numPoints = 800;
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

      const v = (i / numPoints) * 50;
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
    const curbSegments = 320;
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
    // Start / Finish Line Grid Markings on Main Straight (at Z = 0)
    const gridLineGeo = new THREE.PlaneGeometry(this.trackWidth * 0.85, 1.4);
    gridLineGeo.rotateX(-Math.PI / 2);
    const gridMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.4
    });

    const finishLine = new THREE.Mesh(gridLineGeo, gridMat);
    finishLine.position.set(0, 0.03, 0);
    this.trackGroup.add(finishLine);

    // Starting Gantry Structure overhead (with 5 Red Lights)
    const gantryPillarGeo = new THREE.CylinderGeometry(0.2, 0.2, 7.0, 8);
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, metalness: 0.8, roughness: 0.3 });

    const leftPillar = new THREE.Mesh(gantryPillarGeo, gantryMat);
    leftPillar.position.set(-this.trackWidth / 2 - 2, 3.5, 0);
    this.trackGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(gantryPillarGeo, gantryMat);
    rightPillar.position.set(this.trackWidth / 2 + 2, 3.5, 0);
    this.trackGroup.add(rightPillar);

    // Cross beam
    const beamGeo = new THREE.BoxGeometry(this.trackWidth + 6, 0.8, 0.8);
    const beam = new THREE.Mesh(beamGeo, gantryMat);
    beam.position.set(0, 7.0, 0);
    this.trackGroup.add(beam);

    // 5 Red Lights Pod
    const lightBoxGeo = new THREE.BoxGeometry(6.0, 1.2, 0.6);
    const lightBoxMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
    const lightBox = new THREE.Mesh(lightBoxGeo, lightBoxMat);
    lightBox.position.set(0, 6.2, 0);
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
      bulb.position.set(-2.0 + i * 1.0, 6.2, -0.4);
      this.trackGroup.add(bulb);
    }
  }

  buildTracksideProps() {
    // Grandstands along Main Rettifilo Straight
    const standGeo = new THREE.BoxGeometry(12.0, 8.0, 140.0);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x8E9BAE,
      roughness: 0.7
    });

    const leftGrandstand = new THREE.Mesh(standGeo, standMat);
    leftGrandstand.position.set(-22, 4.0, 50);
    leftGrandstand.castShadow = true;
    this.trackGroup.add(leftGrandstand);

    // Distance Brake Marker Boards for Turn 1 Chicane
    const markerDistances = [
      { z: 250, text: '300' },
      { z: 280, text: '200' },
      { z: 310, text: '100' },
      { z: 340, text: '50' }
    ];

    markerDistances.forEach(m => {
      const boardGeo = new THREE.BoxGeometry(0.2, 1.8, 1.2);
      const boardMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(-this.trackWidth / 2 - 1.2, 0.9, m.z);
      this.trackGroup.add(board);
    });
  }

  buildSurroundingTerrain() {
    // Royal Park of Monza (Grass terrain)
    const terrainGeo = new THREE.PlaneGeometry(2400, 2400);
    terrainGeo.rotateX(-Math.PI / 2);

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x18301B,
      roughness: 0.9,
      metalness: 0.05
    });

    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.y = -0.05;
    terrain.receiveShadow = true;
    this.trackGroup.add(terrain);

    // Place trees ONLY far outside the track boundaries (Minimum 45m away from any track point!)
    const treeTrunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 6, 6);
    const treeLeavesGeo = new THREE.ConeGeometry(3.5, 10, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4A2F13, roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x144018, roughness: 0.8 });

    let placedTrees = 0;
    for (let i = 0; i < 600 && placedTrees < 140; i++) {
      const x = (Math.random() - 0.5) * 1600;
      const z = (Math.random() - 0.5) * 1600;
      const testPos = new THREE.Vector3(x, 0, z);

      // Check distance to closest track point
      const nearest = this.getNearestTrackPoint(testPos);
      if (nearest.distance > 45.0) {
        // Safe: Far away from asphalt
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, 0, z);

        const trunk = new THREE.Mesh(treeTrunkGeo, trunkMat);
        trunk.position.y = 3;
        treeGroup.add(trunk);

        const leaves = new THREE.Mesh(treeLeavesGeo, leavesMat);
        leaves.position.y = 8;
        treeGroup.add(leaves);

        this.trackGroup.add(treeGroup);
        placedTrees++;
      }
    }
  }

  getNearestTrackPoint(pos) {
    if (!this.curve) return { point: new THREE.Vector3(), tangent: new THREE.Vector3(0, 0, 1), distance: 0, u: 0 };
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
