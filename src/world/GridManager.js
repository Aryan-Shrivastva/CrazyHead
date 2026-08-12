import * as THREE from 'three';
import { F1_TEAMS } from '../data/teams.js';
import { F1Car } from '../vehicle/F1Car.js';

/**
 * Starting Grid Manager: 20 F1 Cars on the Monza Grid
 * Uses arc-length distance physics for true physical speed (m/s):
 * - On straights: Rapidly rockets up to 300 km/h
 * - In corners/turns: Rapidly brakes down to 30% speed (85-100 km/h)
 * - Exiting corners: Rapidly accelerates back up to 300 km/h down the straights
 */
export class GridManager {
  constructor(scene, monzaTrack) {
    this.scene = scene;
    this.monzaTrack = monzaTrack;
    this.gridCars = [];
    this.gridSlots = [];
    this.isRaceStarted = false;
    this.trackLength = 1;

    this.initTrackMetrics();
    this.calculateGridSlots();
  }

  initTrackMetrics() {
    if (this.monzaTrack && this.monzaTrack.curve) {
      this.trackLength = this.monzaTrack.curve.getLength();
    }
  }

  calculateGridSlots() {
    const rowGap = 14.0;
    const xOffset = 3.4;

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
    this.initTrackMetrics();

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
        const initialDistance = (nearest.u || 0.01) * this.trackLength;

        this.gridCars.push({
          car: aiCar,
          team: rival.team,
          driver: rival.driver,
          slot: slotIndex + 1,
          position: new THREE.Vector3(slot.x, 0, slot.z),
          distanceMeters: initialDistance,
          speedKmH: 0, // Starts at 0 km/h on the starting grid
          topStraightSpeed: 295 + Math.random() * 10, // ~300 km/h on straights
          cornerSpeed: 85 + Math.random() * 15 // ~30% speed (85-100 km/h) in corners
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

    if (dt > 0.05) dt = 0.05;

    this.gridCars.forEach((ai, idx) => {
      const u = (ai.distanceMeters / this.trackLength) % 1;

      // Detect corners along the Monza circuit layout:
      // Rettifilo chicane (0.07 - 0.16), Roggia chicane (0.27 - 0.36),
      // Lesmo 1 & 2 (0.43 - 0.53), Ascari chicane (0.64 - 0.73), Parabolica (0.86 - 0.98)
      const isCorner = (u >= 0.07 && u <= 0.16) ||
                       (u >= 0.27 && u <= 0.36) ||
                       (u >= 0.43 && u <= 0.53) ||
                       (u >= 0.64 && u <= 0.73) ||
                       (u >= 0.86 && u <= 0.98);

      // Target speed: 300 km/h on straights, 30% (~85-100 km/h) in corners
      const targetSpeedKmH = isCorner ? ai.cornerSpeed : ai.topStraightSpeed;

      // Realistic F1 rate of speed change (Rapid braking into corners, rapid power acceleration on straights)
      const speedRate = isCorner ? 5.5 : 3.2;
      ai.speedKmH = THREE.MathUtils.lerp(ai.speedKmH, targetSpeedKmH, dt * speedRate);

      // Convert km/h to physical m/s
      const speedMS = ai.speedKmH / 3.6;

      // Advance exact physical meters along the circuit
      ai.distanceMeters += speedMS * dt;
      if (ai.distanceMeters >= this.trackLength) {
        ai.distanceMeters -= this.trackLength;
      }

      const currentU = ai.distanceMeters / this.trackLength;
      const pt = this.monzaTrack.curve.getPointAt(currentU);
      const tangent = this.monzaTrack.curve.getTangentAt(currentU);
      const heading = Math.atan2(tangent.x, tangent.z);

      const laneOffset = ((idx % 3) - 1) * 3.6;
      const right = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();

      ai.position.copy(pt).addScaledVector(right, laneOffset);
      ai.car.group.position.set(ai.position.x, 0, ai.position.z);
      ai.car.group.rotation.y = heading;

      // Rotate wheels smoothly with physical speed
      ai.car.update(0, speedMS / 35, false);
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
