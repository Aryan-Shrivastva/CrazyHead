import * as THREE from 'three';
import { F1_TEAMS } from '../data/teams.js';
import { F1Car } from '../vehicle/F1Car.js';

/**
 * Starting Grid Manager: Generates 20 F1 Cars on the Monza Grid
 * Smooth, consistent, balanced competitive F1 race pace around the whole circuit.
 */
export class GridManager {
  constructor(scene, monzaTrack) {
    this.scene = scene;
    this.monzaTrack = monzaTrack;
    this.gridCars = [];
    this.gridSlots = [];
    this.isRaceStarted = false;

    this.calculateGridSlots();
  }

  calculateGridSlots() {
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
          speed: 0, // Starts at 0 km/h on the starting grid
          targetSpeed: 68 + (20 - slotIndex) * 0.4 + (Math.random() * 2 - 1) // ~245 - 275 km/h balanced F1 pack racing!
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
      // Smooth starting launch acceleration to target speed
      ai.speed = THREE.MathUtils.lerp(ai.speed, ai.targetSpeed, dt * 0.85);

      // Advance along Monza spline
      ai.progress += (ai.speed * dt) / 2800;
      if (ai.progress > 1) ai.progress -= 1;

      const pt = this.monzaTrack.curve.getPointAt(ai.progress);
      const tangent = this.monzaTrack.curve.getTangentAt(ai.progress);
      const heading = Math.atan2(tangent.x, tangent.z);

      const laneOffset = ((idx % 3) - 1) * 3.4;
      const right = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();

      ai.position.copy(pt).addScaledVector(right, laneOffset);
      ai.car.group.position.set(ai.position.x, 0, ai.position.z);
      ai.car.group.rotation.y = heading;

      // Wheel rotation
      ai.car.update(0, ai.speed / 45, false);
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
