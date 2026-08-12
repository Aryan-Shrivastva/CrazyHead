import * as THREE from 'three';
import { F1_TEAMS } from '../data/teams.js';
import { F1Car } from '../vehicle/F1Car.js';

/**
 * Starting Grid Manager: Generates 20 F1 Cars on the Monza Grid in Official Staggered Order
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
    // 20 Staggered starting grid boxes along the Rettifilo main straight (Z: 50 down to -102)
    const startZ = 50; // Finish line area
    const rowGap = 8.0; // Distance between grid slots
    const xOffset = 2.8; // Left / Right staggered offset

    for (let i = 0; i < 20; i++) {
      const isLeft = i % 2 === 0;
      const x = isLeft ? -xOffset : xOffset;
      const z = startZ - i * rowGap;
      this.gridSlots.push({ pos: i + 1, x, y: 0.05, z, heading: 0 });
    }
  }

  buildGrid(playerTeam, playerDriver, playerPosIndex = 2) {
    // Clear any previous AI grid cars
    this.clearGrid();

    // Compile list of all 20 drivers across 10 teams
    const allRoster = [];
    F1_TEAMS.forEach(team => {
      team.drivers.forEach(driver => {
        allRoster.push({ team, driver });
      });
    });

    // Remove player's selected driver
    const rivalDrivers = allRoster.filter(
      r => !(r.team.id === playerTeam.id && r.driver.id === playerDriver.id)
    );

    // Place 19 AI Cars on the grid
    let rivalIndex = 0;
    for (let slotIndex = 0; slotIndex < 20; slotIndex++) {
      if (slotIndex === playerPosIndex) {
        // Player's grid slot
        continue;
      }

      if (rivalIndex < rivalDrivers.length) {
        const rival = rivalDrivers[rivalIndex];
        const slot = this.gridSlots[slotIndex];

        // Create 3D Car
        const aiCar = new F1Car(rival.team);
        aiCar.group.position.set(slot.x, slot.y, slot.z);
        aiCar.group.rotation.y = slot.heading;

        this.scene.add(aiCar.group);

        this.gridCars.push({
          car: aiCar,
          team: rival.team,
          driver: rival.driver,
          slot: slotIndex + 1,
          position: new THREE.Vector3(slot.x, slot.y, slot.z),
          velocity: new THREE.Vector3(0, 0, 0),
          progress: (slot.z + 460) / 1000, // Normalized track progress
          speed: 0,
          targetSpeed: 65 + Math.random() * 25 // Variable AI top speed
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
      // Pre-race idle revving: slight wheel vibration & rain light blinking
      const t = Date.now() * 0.01;
      this.gridCars.forEach((item, idx) => {
        item.car.group.position.y = 0.05 + Math.sin(t + idx) * 0.003;
      });
      return;
    }

    // AI Race Behavior: Accelerate along the Monza track spline!
    if (!this.monzaTrack || !this.monzaTrack.curve) return;

    this.gridCars.forEach((ai, idx) => {
      // Accelerate towards target speed
      ai.speed = THREE.MathUtils.lerp(ai.speed, ai.targetSpeed, dt * 0.4);

      // Advance along spline
      ai.progress += (ai.speed * dt) / 1100;
      if (ai.progress > 1) ai.progress -= 1;

      const pt = this.monzaTrack.curve.getPointAt(ai.progress);
      const tangent = this.monzaTrack.curve.getTangentAt(ai.progress);
      const heading = Math.atan2(tangent.x, tangent.z);

      // Add slight lateral lane offset
      const laneOffset = ((idx % 3) - 1) * 2.2;
      const right = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();

      ai.position.copy(pt).addScaledVector(right, laneOffset);
      ai.car.group.position.set(ai.position.x, 0.05, ai.position.z);
      ai.car.group.rotation.y = heading;

      // Wheel animation
      ai.car.update(0, ai.speed / 70, false);
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
