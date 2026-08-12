import * as THREE from 'three';
import { F1_TEAMS } from '../data/teams.js';
import { F1Car } from '../vehicle/F1Car.js';

/**
 * Starting Grid Manager: Generates 20 F1 Cars on the Monza Grid in Official Staggered Order
 * Features competitive AI racing physics with realistic launch acceleration and corner braking.
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
    // 20 Staggered starting grid boxes along the Rettifilo main straight (Z: 0 down to -160)
    const startZ = -10; // P1 position just behind Start/Finish line
    const rowGap = 8.0; // Distance between grid rows
    const xOffset = 2.6; // Left / Right staggered offset

    for (let i = 0; i < 20; i++) {
      const isLeft = i % 2 === 0;
      const x = isLeft ? -xOffset : xOffset;
      const z = startZ - i * rowGap;
      this.gridSlots.push({ pos: i + 1, x, y: 0.05, z, heading: 0 });
    }
  }

  buildGrid(playerTeam, playerDriver, playerPosIndex = 2) {
    this.clearGrid();

    // Compile list of all 20 drivers
    const allRoster = [];
    F1_TEAMS.forEach(team => {
      team.drivers.forEach(driver => {
        allRoster.push({ team, driver });
      });
    });

    // Filter out player driver
    const rivalDrivers = allRoster.filter(
      r => !(r.team.id === playerTeam.id && r.driver.id === playerDriver.id)
    );

    // Place 19 AI Cars on the grid
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

        // Find initial normalized track progress based on grid slot Z
        const nearest = this.monzaTrack.getNearestTrackPoint(new THREE.Vector3(slot.x, 0, slot.z));

        this.gridCars.push({
          car: aiCar,
          team: rival.team,
          driver: rival.driver,
          slot: slotIndex + 1,
          position: new THREE.Vector3(slot.x, slot.y, slot.z),
          progress: nearest.u || 0.01,
          speed: 0, // Starts at 0 km/h
          baseTargetSpeed: 42 + (20 - slotIndex) * 0.6 + Math.random() * 3, // Paced between ~155 - 195 km/h
          currentSteer: 0
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

  update(dt, playerPos) {
    if (!this.isRaceStarted) {
      // Pre-race idle revving vibration
      const t = Date.now() * 0.01;
      this.gridCars.forEach((item, idx) => {
        item.car.group.position.y = 0.05 + Math.sin(t + idx) * 0.002;
      });
      return;
    }

    if (!this.monzaTrack || !this.monzaTrack.curve) return;

    this.gridCars.forEach((ai, idx) => {
      // Corner braking vs Straight acceleration
      let targetSpeed = ai.baseTargetSpeed;
      
      // Chicanes / tight corners in Monza spline:
      // Turn 1 & 2 Chicane (progress ~0.10 - 0.16)
      // Turn 4 & 5 Roggia (progress ~0.30 - 0.38)
      // Ascari & Parabolica (progress ~0.65 - 0.75 & ~0.88 - 0.98)
      const p = ai.progress;
      if ((p > 0.09 && p < 0.16) || (p > 0.30 && p < 0.38) || (p > 0.65 && p < 0.74) || (p > 0.88 && p < 0.98)) {
        targetSpeed = ai.baseTargetSpeed * 0.65; // Slow down for corners
      }

      // Smooth gradual acceleration from grid start
      ai.speed = THREE.MathUtils.lerp(ai.speed, targetSpeed, dt * 0.6);

      // Advance along spline
      ai.progress += (ai.speed * dt) / 3200;
      if (ai.progress > 1) ai.progress -= 1;

      const pt = this.monzaTrack.curve.getPointAt(ai.progress);
      const tangent = this.monzaTrack.curve.getTangentAt(ai.progress);
      const heading = Math.atan2(tangent.x, tangent.z);

      // Lateral lane offset for natural racing spread
      const laneOffset = ((idx % 3) - 1) * 2.2;
      const right = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();

      ai.position.copy(pt).addScaledVector(right, laneOffset);
      ai.car.group.position.set(ai.position.x, 0.05, ai.position.z);
      ai.car.group.rotation.y = heading;

      // Rotate wheels with speed
      ai.car.update(0, ai.speed / 50, false);
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
