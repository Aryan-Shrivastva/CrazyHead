import * as THREE from 'three';
import { F1_TEAMS } from '../data/teams.js';
import { F1Car } from '../vehicle/F1Car.js';

/**
 * Starting Grid Manager: Generates 20 F1 Cars on the Monza Grid in Official Staggered Order
 * Features realistic launch sequence, balanced F1 racing pace, and car-to-car collision detection.
 */
export class GridManager {
  constructor(scene, monzaTrack) {
    this.scene = scene;
    this.monzaTrack = monzaTrack;
    this.gridCars = []; // 19 AI cars
    this.gridSlots = []; // Coordinates for P1 to P20
    this.isRaceStarted = false;

    this.calculateGridSlots();
  }

  calculateGridSlots() {
    // 20 Staggered starting grid boxes along the Rettifilo main straight
    // Start finish line is at curve progress u = 0 (x ~ 135, z ~ 0)
    const rowGap = 10.0;
    const xOffset = 2.8;

    for (let i = 0; i < 20; i++) {
      const isLeft = i % 2 === 0;
      const x = 135 + (i * rowGap * 0.45);
      const lateral = isLeft ? -xOffset : xOffset;
      const z = lateral;
      // Heading pointing towards Turn 1 (-X direction)
      const heading = -Math.PI / 2;
      this.gridSlots.push({ pos: i + 1, x, y: 0.05, z, heading });
    }
  }

  buildGrid(playerTeam, playerDriver, playerPosIndex = 2) {
    this.clearGrid();

    const allRoster = [];
    F1_TEAMS.forEach(team => {
      team.drivers.forEach(driver => {
        allRoster.push({ team, driver });
      });
    });

    const rivalDrivers = allRoster.filter(
      r => !(r.team.id === playerTeam.id && r.driver.id === playerDriver.id)
    );

    let rivalIndex = 0;
    for (let slotIndex = 0; slotIndex < 20; slotIndex++) {
      if (slotIndex === playerPosIndex) {
        continue;
      }

      if (rivalIndex < rivalDrivers.length) {
        const rival = rivalDrivers[rivalIndex];
        const slot = this.gridSlots[slotIndex];

        const aiCar = new F1Car(rival.team);
        aiCar.group.position.set(slot.x, slot.y, slot.z);
        aiCar.group.rotation.y = slot.heading;

        this.scene.add(aiCar.group);

        const nearest = this.monzaTrack.getNearestTrackPoint(new THREE.Vector3(slot.x, 0, slot.z));

        this.gridCars.push({
          car: aiCar,
          team: rival.team,
          driver: rival.driver,
          slot: slotIndex + 1,
          position: new THREE.Vector3(slot.x, slot.y, slot.z),
          progress: nearest.u || 0.01,
          speed: 0, // Starts at 0 km/h on the grid
          baseTargetSpeed: 64 + (20 - slotIndex) * 0.5 + Math.random() * 3, // ~230 - 270 km/h balanced F1 pace!
          collisionRadius: 2.2
        });

        rivalIndex++;
      }
    }
  }

  getPlayerGridSlot(playerPosIndex = 2) {
    return this.gridSlots[playerPosIndex] || this.gridSlots[0];
  }

  startRace() {
    this.isRaceStarted = true;
  }

  update(dt, playerPhysics, onCollisionCallback = null) {
    if (!this.monzaTrack || !this.monzaTrack.curve) return;

    if (!this.isRaceStarted) {
      // Pre-race idle revving on grid
      const t = Date.now() * 0.01;
      this.gridCars.forEach((item, idx) => {
        item.car.group.position.y = 0.05 + Math.sin(t + idx) * 0.002;
      });
      return;
    }

    const playerPos = playerPhysics.position;

    this.gridCars.forEach((ai, idx) => {
      // Dynamic Corner Braking vs Straight Speed
      let targetSpeed = ai.baseTargetSpeed;
      const p = ai.progress;

      // Braking zones for Variante del Rettifilo, Roggia, Lesmo, Ascari, and Parabolica
      if ((p > 0.08 && p < 0.14) || (p > 0.28 && p < 0.35) || (p > 0.62 && p < 0.70) || (p > 0.88 && p < 0.98)) {
        targetSpeed = ai.baseTargetSpeed * 0.58; // Realistic corner entry braking
      }

      // Smooth acceleration curve off the starting line
      ai.speed = THREE.MathUtils.lerp(ai.speed, targetSpeed, dt * 0.55);

      // Advance along Monza spline
      ai.progress += (ai.speed * dt) / 2800;
      if (ai.progress > 1) ai.progress -= 1;

      const pt = this.monzaTrack.curve.getPointAt(ai.progress);
      const tangent = this.monzaTrack.curve.getTangentAt(ai.progress);
      const heading = Math.atan2(tangent.x, tangent.z);

      const laneOffset = ((idx % 3) - 1) * 2.2;
      const right = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();

      ai.position.copy(pt).addScaledVector(right, laneOffset);
      ai.car.group.position.set(ai.position.x, 0.05, ai.position.z);
      ai.car.group.rotation.y = heading;

      // Wheel rotation
      ai.car.update(0, ai.speed / 50, false);

      // 3. COLLISION DETECTION WITH PLAYER CAR
      if (playerPos) {
        const dist = ai.position.distanceTo(playerPos);
        if (dist < 3.2) {
          // Impact occurred!
          const impactDir = playerPos.clone().sub(ai.position).normalize();
          
          // Determine impact zone (Front, Rear, Side)
          const playerForward = new THREE.Vector3(Math.sin(playerPhysics.heading), 0, Math.cos(playerPhysics.heading));
          const dot = playerForward.dot(impactDir.clone().negate());

          let hitZone = 'side';
          if (dot > 0.5) hitZone = 'front';
          else if (dot < -0.5) hitZone = 'rear';
          else hitZone = impactDir.x > 0 ? 'right' : 'left';

          if (onCollisionCallback) {
            onCollisionCallback(hitZone, impactDir, ai);
          }
        }
      }
    });
  }

  clearGrid() {
    this.gridCars.forEach(ai => {
      this.scene.remove(ai.car.group);
    });
    this.gridCars = [];
    this.isRaceStarted = false;
  }
}
