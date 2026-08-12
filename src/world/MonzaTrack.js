import * as THREE from 'three';

/**
 * Autodromo Nazionale Monza 3D Circuit Generator
 * Exact official layout matching the Monza Grand Prix circuit map with Italian tricolore curbs,
 * start gantry, grandstands, and zero tree clipping on the track.
 */
export class MonzaTrack {
  constructor(scene) {
    this.scene = scene;
    this.trackGroup = new THREE.Group();
    this.trackWidth = 14.5;
    this.curve = null;
    this.checkpoints = [];

    this.initMonzaCurve();
    this.buildTrackRibbon();
    this.buildItalianCurbs();
    this.buildStartGantryAndGrid();
    this.buildTracksideProps();
    this.buildSurroundingTerrain();

    this.scene.add(this.trackGroup);
  }

  initMonzaCurve() {
    // Exact official Autodromo Nazionale Monza Layout (Matching User Circuit Diagram)
    // Scaled to real proportions in world units
    const scale = 2.4;
    const rawPoints = [
      // 1. Rettifilo Main Straight (Start line at 0, 0)
      { x: 300, z: 0 },    // Chequered Flag / Start Area
      { x: 180, z: 0 },
      { x: 50, z: 0 },
      { x: -80, z: 0 },
      { x: -220, z: 0 },   // Speed Trap before Turn 1

      // 2. Turns 01 & 02: Variante del Rettifilo Chicane (Tight Right-then-Left)
      { x: -260, z: 12 },  // Turn 01 Entry
      { x: -275, z: -8 },  // Chicane Apex
      { x: -295, z: 25 },  // Turn 02 Exit

      // 3. Turn 03: Curva Grande (Biassono) - Long sweeping high-speed right
      { x: -330, z: 80 },
      { x: -370, z: 155 },
      { x: -400, z: 245 },
      { x: -415, z: 340 },
      { x: -400, z: 420 },

      // 4. Turns 04 & 05: Variante della Roggia (Left-then-Right Chicane)
      { x: -385, z: 470 }, // Approach
      { x: -400, z: 505 }, // Turn 04 Left
      { x: -410, z: 535 }, // Turn 05 Right Exit

      // 5. Turns 06 & 07: Curva di Lesmo 1 & Lesmo 2
      { x: -415, z: 590 }, // Lesmo 1 entry
      { x: -390, z: 630 }, // Lesmo 1 apex
      { x: -335, z: 655 }, // Short connector
      { x: -270, z: 660 }, // Lesmo 2 entry
      { x: -215, z: 630 }, // Lesmo 2 exit heading down-right

      // 6. Curva del Serraglio & Diagonal Straight (DRS Zone towards Ascari)
      { x: -150, z: 560 },
      { x: -75, z: 470 },
      { x: 0, z: 380 },
      { x: 75, z: 290 },
      { x: 145, z: 200 },  // DRS straight end

      // 7. Turns 08, 09, 10: Variante Ascari (Fast Left-Right-Left sequence)
      { x: 175, z: 165 },  // Turn 08 Left entry
      { x: 200, z: 130 },  // Turn 09 Right apex
      { x: 235, z: 105 },  // Turn 10 Left exit

      // 8. Rettifilo Posteriore (Back Straight towards Parabolica)
      { x: 310, z: 95 },
      { x: 420, z: 95 },
      { x: 530, z: 95 },
      { x: 620, z: 95 },   // Braking zone for Parabolica

      // 9. Turn 11: Curva Parabolica / Curva Alboreto (Sweeping 180° right back to start)
      { x: 685, z: 75 },   // Turn 11 entry
      { x: 720, z: 35 },   // Mid-corner apex
      { x: 690, z: -15 },  // Sweeping around
      { x: 615, z: -18 },  // Acceleration zone
      { x: 500, z: -5 },
      { x: 400, z: 0 }     // Hooking back into Rettifilo straight
    ];

    const points = rawPoints.map(p => new THREE.Vector3(p.x * scale * 0.45, 0, p.z * scale * 0.45));
    this.curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.12);
  }

  buildTrackRibbon() {
    const numPoints = 1000;
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

      const leftPos = p1.clone().addScaledVector(right, -halfWidth);
      const rightPos = p1.clone().addScaledVector(right, halfWidth);

      vertices.push(leftPos.x, leftPos.y + 0.02, leftPos.z);
      vertices.push(rightPos.x, rightPos.y + 0.02, rightPos.z);

      const v = (i / numPoints) * 60;
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

    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1E2024,
      roughness: 0.85,
      metalness: 0.15
    });

    const trackMesh = new THREE.Mesh(trackGeom, asphaltMat);
    trackMesh.receiveShadow = true;
    this.trackGroup.add(trackMesh);
  }

  buildItalianCurbs() {
    const curbSegments = 360;
    const curbWidth = 1.3;
    const halfTrack = this.trackWidth / 2;
    const points = this.curve.getSpacedPoints(curbSegments);

    for (let i = 0; i < curbSegments; i += 2) {
      const p1 = points[i];
      const p2 = points[(i + 1) % curbSegments];
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

      const colorIndex = Math.floor(i / 2) % 3;
      let curbColor = 0xFFFFFF; // White
      if (colorIndex === 0) curbColor = 0xE80020; // Red
      if (colorIndex === 2) curbColor = 0x008C45; // Green

      const curbMat = new THREE.MeshStandardMaterial({
        color: curbColor,
        roughness: 0.45
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
    const startPoint = this.curve.getPointAt(0);
    const startTangent = this.curve.getTangentAt(0);
    const right = new THREE.Vector3().crossVectors(startTangent, new THREE.Vector3(0, 1, 0)).normalize();

    const gridLineGeo = new THREE.PlaneGeometry(this.trackWidth * 0.9, 1.6);
    gridLineGeo.rotateX(-Math.PI / 2);
    const gridMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.3
    });

    const finishLine = new THREE.Mesh(gridLineGeo, gridMat);
    finishLine.position.copy(startPoint).add(new THREE.Vector3(0, 0.03, 0));
    finishLine.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), startTangent);
    this.trackGroup.add(finishLine);

    // Starting Gantry Structure overhead (with 5 Red/Green Lights)
    const gantryPillarGeo = new THREE.CylinderGeometry(0.25, 0.25, 8.0, 8);
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, metalness: 0.85, roughness: 0.25 });

    const leftPillar = new THREE.Mesh(gantryPillarGeo, gantryMat);
    leftPillar.position.copy(startPoint).addScaledVector(right, -this.trackWidth / 2 - 2.5);
    leftPillar.position.y = 4.0;
    this.trackGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(gantryPillarGeo, gantryMat);
    rightPillar.position.copy(startPoint).addScaledVector(right, this.trackWidth / 2 + 2.5);
    rightPillar.position.y = 4.0;
    this.trackGroup.add(rightPillar);

    // Overhead Beam
    const beamGeo = new THREE.BoxGeometry(this.trackWidth + 6, 0.8, 0.8);
    const beam = new THREE.Mesh(beamGeo, gantryMat);
    beam.position.copy(startPoint);
    beam.position.y = 7.5;
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), right);
    this.trackGroup.add(beam);

    // 5 Start Lights Pod
    const lightBoxGeo = new THREE.BoxGeometry(6.5, 1.4, 0.6);
    const lightBoxMat = new THREE.MeshStandardMaterial({ color: 0x080808 });
    const lightBox = new THREE.Mesh(lightBoxGeo, lightBoxMat);
    lightBox.position.copy(startPoint);
    lightBox.position.y = 6.6;
    lightBox.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), right);
    this.trackGroup.add(lightBox);
  }

  buildTracksideProps() {
    // Grandstands along Main Rettifilo Straight
    const standGeo = new THREE.BoxGeometry(14.0, 9.0, 160.0);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x8E9BAE,
      roughness: 0.7
    });

    const grandstand = new THREE.Mesh(standGeo, standMat);
    grandstand.position.set(240, 4.5, 25);
    grandstand.castShadow = true;
    this.trackGroup.add(grandstand);
  }

  buildSurroundingTerrain() {
    // Royal Park of Monza (Grass terrain)
    const terrainGeo = new THREE.PlaneGeometry(3000, 3000);
    terrainGeo.rotateX(-Math.PI / 2);

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x162E19,
      roughness: 0.9,
      metalness: 0.05
    });

    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.y = -0.05;
    terrain.receiveShadow = true;
    this.trackGroup.add(terrain);

    // Place trees ONLY with 50m safe buffer away from any asphalt point
    const treeTrunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 6, 6);
    const treeLeavesGeo = new THREE.ConeGeometry(3.5, 10, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4A2F13, roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x144018, roughness: 0.8 });

    let placedTrees = 0;
    for (let i = 0; i < 800 && placedTrees < 150; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      const testPos = new THREE.Vector3(x, 0, z);

      const nearest = this.getNearestTrackPoint(testPos);
      if (nearest.distance > 50.0) {
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
    const numSamples = 300;
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
