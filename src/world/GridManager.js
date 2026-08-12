import * as THREE from 'three';
import { F1_TEAMS } from '../data/teams.js';
import { F1Car } from '../vehicle/F1Car.js';

/**
 * Starting Grid Manager: Generates 20 F1 Cars on the Monza Grid in Official Staggered Order
 * Features authentic racing pace: 0 km/h start -> 300 km/h on straights -> 30% speed (85-100 km/h) in corners.
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
    const rowGap = 12.0;
    const xOffset = 3.2;

    for (let i = 0; i < 20; i++) {
      const isLeft = i % 2 === 0;
      const x = 135 + (i * rowGap * 0.45);
      const lateral = isLeft ? -xOffset : xOffset;
      const z = lateral;
      const heading = -Math.PI / 2;
      this.gridSlots.push({ pos: i + 1, x, y: 0, z, heading });
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
        aiCar.group.position.set(slot.x, 0, slot.z);
        aiCar.group.rotation.y = slot.heading;

        this.scene.add(aiCar.group);

        const nearest = this.monzaTrack.getNearestTrackPoint(new THREE.Vector3(slot.x, 0, slot.z));

        this.gridCars.push({
          car: aiCar,
          team: rival.team,
          driver: rival.driver,
          slot: slotIndex + 1,
          position: new THREE.Vector3(slot.x, 0, slot.z),
          progress: nearest.u || 0.01,
          speedKmH: 0, // Starts at 0 km/h on grid
          topStraightSpeed: 295 + Math.random() * 10, // ~300 km/h on straights
          cornerSpeed: 85 + Math.random() * 15 // ~30% speed (85-100 km/h) in turns
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

  update(dt) {
    if (!this.monzaTrack || !this.monzaTrack.curve) return;

    if (!this.isRaceStarted) {
      return;
    }

    this.gridCars.forEach((ai, idx) => {
      const p = ai.progress;

      // Check if car is approaching or inside a corner/turn along the Monza circuit:
      // Turn 1/2 Chicane (0.08 - 0.16), Roggia (0.28 - 0.36), Lesmo 1 & 2 (0.42 - 0.52),
      // Ascari Chicane (0.64 - 0.72), Parabolica (0.86 - 0.98)
      const isCorner = (p >= 0.08 && p <= 0.16) ||
                       (p >= 0.28 && p <= 0.36) ||
                       (p >= 0.42 && p <= 0.52) ||
                       (p >= 0.64 && p <= 0.72) ||
                       (p >= 0.86 && p <= 0.98);

      // Target speed: 300 km/h on straights, 30% (85-100 km/h) in corners
      const targetSpeedKmH = isCorner ? ai.cornerSpeed : ai.topStraightSpeed;

      // Smooth acceleration & braking transitions
      const rate = isCorner ? 1.6 : 0.65; // Decelerates smoothly into corners, builds up to 300 km/h on straights
      ai.speedKmH = THREE.MathUtils.lerp(ai.speedKmH, targetSpeedKmH, dt * rate);

      // Convert km/h to m/s for spline progression
      const speedMS = ai.speedKmH / 3.6;
      ai.progress += (speedMS * dt) / 2800;
      if (ai.progress > 1) ai.progress -= 1;

      const pt = this.monzaTrack.curve.getPointAt(ai.progress);
      const tangent = this.monzaTrack.curve.getTangentAt(ai.progress);
      const heading = Math.atan2(tangent.x, tangent.z);

      const laneOffset = ((idx % 3) - 1) * 3.5;
      const right = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();

      ai.position.copy(pt).addScaledVector(right, laneOffset);
      ai.car.group.position.set(ai.position.x, 0, ai.position.z);
      ai.car.group.rotation.y = heading;

      // Wheel rotation
      ai.car.update(0, speedMS / 40, false);
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
