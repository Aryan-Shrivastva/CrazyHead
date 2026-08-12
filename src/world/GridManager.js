import * as THREE from 'three';
import { F1_TEAMS } from '../data/teams.js';
import { F1Car } from '../vehicle/F1Car.js';

/**
 * Starting Grid Manager: 20 F1 Cars on the Monza Grid
 * Uses 3000 Equidistant Track Waypoints for 100% physically accurate uniform speed:
 * - On straights: Rockets at 310 - 335 km/h
 * - In corners/turns: Decelerates to 30% speed (85 - 100 km/h)
 * - Exiting corners: Rapidly unleashes full throttle acceleration to top speed
 */
export class GridManager {
  constructor(scene, monzaTrack) {
    this.scene = scene;
    this.monzaTrack = monzaTrack;
    this.gridCars = [];
    this.gridSlots = [];
    this.isRaceStarted = false;

    // 3000 Equidistant physical track waypoints
    this.numWaypoints = 3000;
    this.waypoints = [];
    this.tangents = [];
    this.totalTrackLength = 0;
    this.metersPerWaypoint = 1;

    this.initWaypoints();
    this.calculateGridSlots();
  }

  initWaypoints() {
    if (!this.monzaTrack || !this.monzaTrack.curve) return;

    // Generate 3000 precisely equidistant spaced points
    this.waypoints = this.monzaTrack.curve.getSpacedPoints(this.numWaypoints);
    this.totalTrackLength = this.monzaTrack.curve.getLength();
    this.metersPerWaypoint = this.totalTrackLength / this.numWaypoints;

    // Precalculate forward tangents for every waypoint
    this.tangents = [];
    for (let i = 0; i < this.numWaypoints; i++) {
      const nextIdx = (i + 1) % this.numWaypoints;
      const t = new THREE.Vector3().subVectors(this.waypoints[nextIdx], this.waypoints[i]).normalize();
      this.tangents.push(t);
    }
  }

  calculateGridSlots() {
    const rowGap = 14.0;
    const xOffset = 3.5;

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
    this.initWaypoints();

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
        const initialWaypoint = Math.floor((nearest.u || 0.01) * this.numWaypoints);

        this.gridCars.push({
          car: aiCar,
          team: rival.team,
          driver: rival.driver,
          slot: slotIndex + 1,
          position: new THREE.Vector3(slot.x, 0, slot.z),
          waypointIndex: initialWaypoint,
          speedKmH: 0, // Starts at 0 km/h on the starting grid
          topStraightSpeed: 310 + Math.random() * 20, // 310 - 330 km/h on straights!
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
    if (this.waypoints.length === 0) return;

    if (!this.isRaceStarted) {
      return;
    }

    if (dt > 0.05) dt = 0.05;

    this.gridCars.forEach((ai, idx) => {
      const progressRatio = (ai.waypointIndex / this.numWaypoints) % 1;

      // Identify Monza corner zones:
      // Turn 1/2 Chicane (0.07 - 0.16), Roggia (0.27 - 0.36),
      // Lesmo 1 & 2 (0.43 - 0.53), Ascari (0.64 - 0.73), Parabolica (0.86 - 0.98)
      const isCorner = (progressRatio >= 0.07 && progressRatio <= 0.16) ||
                       (progressRatio >= 0.27 && progressRatio <= 0.36) ||
                       (progressRatio >= 0.43 && progressRatio <= 0.53) ||
                       (progressRatio >= 0.64 && progressRatio <= 0.73) ||
                       (progressRatio >= 0.86 && progressRatio <= 0.98);

      // Target speed: 310-330 km/h on straights, 30% (85-100 km/h) in corners
      const targetSpeedKmH = isCorner ? ai.cornerSpeed : ai.topStraightSpeed;

      // Fast, aggressive F1 acceleration and braking
      const speedRate = isCorner ? 6.5 : 4.0;
      ai.speedKmH = THREE.MathUtils.lerp(ai.speedKmH, targetSpeedKmH, dt * speedRate);

      // Physical speed in m/s
      const speedMS = ai.speedKmH / 3.6;

      // Advance precisely along equidistant waypoints
      const waypointsToAdvance = (speedMS * dt) / this.metersPerWaypoint;
      ai.waypointIndex = (ai.waypointIndex + waypointsToAdvance) % this.numWaypoints;

      const baseIdx = Math.floor(ai.waypointIndex);
      const nextIdx = (baseIdx + 1) % this.numWaypoints;
      const frac = ai.waypointIndex - baseIdx;

      // Interpolated position
      const p1 = this.waypoints[baseIdx];
      const p2 = this.waypoints[nextIdx];
      const pt = new THREE.Vector3().lerpVectors(p1, p2, frac);

      const tangent = this.tangents[baseIdx];
      const heading = Math.atan2(tangent.x, tangent.z);

      const laneOffset = ((idx % 3) - 1) * 3.8;
      const right = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();

      ai.position.copy(pt).addScaledVector(right, laneOffset);
      ai.car.group.position.set(ai.position.x, 0, ai.position.z);
      ai.car.group.rotation.y = heading;

      // Rotate wheels with high speed
      ai.car.update(0, speedMS / 25, false);
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
