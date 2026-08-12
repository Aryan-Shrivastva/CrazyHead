import * as THREE from 'three';

/**
 * Autodromo Nazionale Monza 3D Circuit Generator
 * Features extra-wide asphalt (24m), official Monza curves, authentic Pit Lane complex with pit garages,
 * starting gantry, and zero clipping props.
 */
export class MonzaTrack {
  constructor(scene) {
    this.scene = scene;
    this.trackGroup = new THREE.Group();
    this.trackWidth = 24.0; // Wide spacious racing surface!
    this.curve = null;

    this.initMonzaCurve();
    this.buildTrackRibbon();
    this.buildItalianCurbs();
    this.buildStartGantryAndGrid();
    this.buildPitLaneComplex();
    this.buildSurroundingTerrain();

    this.scene.add(this.trackGroup);
  }

  initMonzaCurve() {
    // Official Autodromo Nazionale Monza Circuit Spline
    const scale = 2.4;
    const rawPoints = [
      // 1. Rettifilo Main Straight (Start line at 0, 0)
      { x: 300, z: 0 },
      { x: 180, z: 0 },
      { x: 50, z: 0 },
      { x: -80, z: 0 },
      { x: -220, z: 0 },

      // 2. Turns 01 & 02: Variante del Rettifilo Chicane
      { x: -260, z: 14 },
      { x: -275, z: -10 },
      { x: -295, z: 28 },

      // 3. Turn 03: Curva Grande (Biassono)
      { x: -330, z: 85 },
      { x: -370, z: 160 },
      { x: -400, z: 250 },
      { x: -415, z: 345 },
      { x: -400, z: 425 },

      // 4. Turns 04 & 05: Variante della Roggia
      { x: -385, z: 475 },
      { x: -400, z: 510 },
      { x: -410, z: 540 },

      // 5. Turns 06 & 07: Curva di Lesmo 1 & Lesmo 2
      { x: -415, z: 595 },
      { x: -390, z: 635 },
      { x: -335, z: 660 },
      { x: -270, z: 665 },
      { x: -215, z: 635 },

      // 6. Curva del Serraglio & Diagonal Straight (DRS Zone)
      { x: -150, z: 565 },
      { x: -75, z: 475 },
      { x: 0, z: 385 },
      { x: 75, z: 295 },
      { x: 145, z: 205 },

      // 7. Turns 08, 09, 10: Variante Ascari
      { x: 175, z: 170 },
      { x: 200, z: 135 },
      { x: 235, z: 110 },

      // 8. Rettifilo Posteriore (Back Straight)
      { x: 310, z: 100 },
      { x: 420, z: 100 },
      { x: 530, z: 100 },
      { x: 620, z: 100 },

      // 9. Turn 11: Curva Parabolica (Curva Alboreto)
      { x: 685, z: 80 },
      { x: 720, z: 38 },
      { x: 690, z: -18 },
      { x: 615, z: -20 },
      { x: 500, z: -8 },
      { x: 400, z: 0 }
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
    const curbWidth = 1.4;
    const halfTrack = this.trackWidth / 2;
    const points = this.curve.getSpacedPoints(curbSegments);

    for (let i = 0; i < curbSegments; i += 2) {
      const p1 = points[i];
      const p2 = points[(i + 1) % curbSegments];
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

      const colorIndex = Math.floor(i / 2) % 3;
      let curbColor = 0xFFFFFF;
      if (colorIndex === 0) curbColor = 0xE80020;
      if (colorIndex === 2) curbColor = 0x008C45;

      const curbMat = new THREE.MeshStandardMaterial({
        color: curbColor,
        roughness: 0.45
      });

      const curbGeo = new THREE.BoxGeometry(curbWidth, 0.08, p1.distanceTo(p2) * 1.05);

      const leftCurb = new THREE.Mesh(curbGeo, curbMat);
      leftCurb.position.copy(p1).addScaledVector(right, -(halfTrack + curbWidth / 2));
      leftCurb.position.y += 0.04;
      leftCurb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      this.trackGroup.add(leftCurb);

      const rightCurb = new THREE.Mesh(curbGeo, curbMat);
      rightCurb.position.copy(p1).addScaledVector(right, halfTrack + curbWidth / 2);
      rightCurb.position.y += 0.04;
      rightCurb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      this.trackGroup.add(rightCurb);
    }
  }

  buildStartGantryAndGrid() {
    const startPoint = this.curve.getPointAt(0);
    const startTangent = this.curve.getTangentAt(0);
    const right = new THREE.Vector3().crossVectors(startTangent, new THREE.Vector3(0, 1, 0)).normalize();

    // Start / Finish Line
    const gridLineGeo = new THREE.PlaneGeometry(this.trackWidth * 0.95, 1.8);
    gridLineGeo.rotateX(-Math.PI / 2);
    const gridMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });

    const finishLine = new THREE.Mesh(gridLineGeo, gridMat);
    finishLine.position.copy(startPoint).add(new THREE.Vector3(0, 0.03, 0));
    finishLine.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), startTangent);
    this.trackGroup.add(finishLine);

    // Starting Gantry Structure
    const gantryPillarGeo = new THREE.CylinderGeometry(0.3, 0.3, 9.0, 8);
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, metalness: 0.85, roughness: 0.25 });

    const leftPillar = new THREE.Mesh(gantryPillarGeo, gantryMat);
    leftPillar.position.copy(startPoint).addScaledVector(right, -this.trackWidth / 2 - 3.0);
    leftPillar.position.y = 4.5;
    this.trackGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(gantryPillarGeo, gantryMat);
    rightPillar.position.copy(startPoint).addScaledVector(right, this.trackWidth / 2 + 3.0);
    rightPillar.position.y = 4.5;
    this.trackGroup.add(rightPillar);

    const beamGeo = new THREE.BoxGeometry(this.trackWidth + 8, 1.0, 1.0);
    const beam = new THREE.Mesh(beamGeo, gantryMat);
    beam.position.copy(startPoint);
    beam.position.y = 8.5;
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), right);
    this.trackGroup.add(beam);
  }

  buildPitLaneComplex() {
    // Pit Lane on Rettifilo straight (Alongside the main straight on the right)
    const pitLaneGeo = new THREE.PlaneGeometry(160.0, 10.0);
    pitLaneGeo.rotateX(-Math.PI / 2);
    const pitMat = new THREE.MeshStandardMaterial({ color: 0x2A2E35, roughness: 0.8 });

    const pitLane = new THREE.Mesh(pitLaneGeo, pitMat);
    pitLane.position.set(120, 0.025, 20);
    this.trackGroup.add(pitLane);

    // Pit Wall separating track from Pit Lane
    const wallGeo = new THREE.BoxGeometry(160.0, 1.4, 0.8);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x002D62, roughness: 0.5 });
    const pitWall = new THREE.Mesh(wallGeo, wallMat);
    pitWall.position.set(120, 0.7, 14.5);
    this.trackGroup.add(pitWall);

    // Team Pit Garage Buildings
    const garageGeo = new THREE.BoxGeometry(160.0, 6.0, 18.0);
    const garageMat = new THREE.MeshStandardMaterial({ color: 0x1E222A, roughness: 0.6, metalness: 0.5 });
    const garage = new THREE.Mesh(garageGeo, garageMat);
    garage.position.set(120, 3.0, 34);
    garage.castShadow = true;
    this.trackGroup.add(garage);

    // Pit Stop Box Indicator (Yellow & White Box markings on pit asphalt)
    const boxMarkGeo = new THREE.PlaneGeometry(8.0, 5.0);
    boxMarkGeo.rotateX(-Math.PI / 2);
    const boxMarkMat = new THREE.MeshStandardMaterial({ color: 0xFFF200, roughness: 0.3 });
    const pitBox = new THREE.Mesh(boxMarkGeo, boxMarkMat);
    pitBox.position.set(120, 0.035, 20);
    this.trackGroup.add(pitBox);
  }

  buildSurroundingTerrain() {
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

    // Trees far away (> 55m from any track point)
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
      if (nearest.distance > 55.0) {
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
