import * as THREE from 'three';

/**
 * Formula 1 Vehicle Dynamics & Physics Engine
 * Features realistic 2-DOF Bicycle Dynamics with angular momentum and progressive arc curving.
 */
export class VehiclePhysics {
  constructor() {
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.heading = 0; // Radians
    this.angularVelocity = 0; // Rotational yaw speed (rad/s) for authentic curving inertia

    this.steerInput = 0;
    this.currentSteer = 0;
    this.rollAngle = 0;
    this.pitchAngle = 0;

    // Vehicle Specifications
    this.maxSpeed = 92.0; // ~330 km/h
    this.maxReverseSpeed = 10.0;
    this.accelerationRate = 22.0;
    this.brakingRate = 45.0;
    this.dragCoeff = 0.0016;
    this.downforceCoeff = 0.0055;
    this.corneringGrip = 42.0;

    // Damage & Tire compound
    this.frontWingDamaged = false;
    this.tireCompound = 'SOFT'; // 'SOFT', 'MEDIUM', 'HARD'
    this.tireHealth = 100.0; // 0 to 100%

    // Transmission
    this.gear = 1;
    this.maxGears = 8;
    this.rpm = 4000;
    this.idleRpm = 4000;
    this.maxRpm = 14500;
    this.gearRatios = [0, 42, 75, 115, 160, 210, 260, 305, 360];

    // ERS & DRS
    this.battery = 100.0;
    this.isDrsOpen = false;
    this.isOvertakeActive = false;
    this.engineMode = 'HARVESTING';

    // Inputs
    this.throttle = 0;
    this.brake = 0;
    this.lateralSlip = 0;
    this.driftIntensity = 0;
  }

  setInputs(throttle, brake, steer, isBoost = false) {
    this.throttle = Math.max(0, Math.min(throttle, 1));
    this.brake = Math.max(0, Math.min(brake, 1));
    this.steerInput = Math.max(-1, Math.min(steer, 1));
    this.isOvertakeActive = isBoost && this.battery > 5;
    this.isDrsOpen = isBoost;
  }

  update(dt, soundManager = null) {
    if (dt > 0.05) dt = 0.05;

    // Strict ground clamp
    this.velocity.y = 0;
    this.position.y = 0;

    const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    const speedKmH = currentSpeed * 3.6;

    // 1. PROGRESSIVE CURVED STEERING & ROTATIONAL INERTIA
    const speedRatio = Math.min(currentSpeed / this.maxSpeed, 1.0);
    // Steering lock reduces smoothly at speed so the car carves large, elegant racing curves
    const maxLock = THREE.MathUtils.lerp(Math.PI / 8.0, Math.PI / 18.0, Math.pow(speedRatio, 0.6));
    const targetSteerAngle = this.steerInput * maxLock;

    // Smooth turn-in build up
    this.currentSteer = THREE.MathUtils.lerp(this.currentSteer, targetSteerAngle, dt * 5.5);

    // 2. YAW MOMENTUM & ANGULAR VELOCITY (CURVING INSTEAD OF INSTANT SNAP)
    if (currentSpeed > 0.2) {
      const wheelbase = 3.6;
      // Target yaw rate determined by curvature
      const targetYawRate = (Math.tan(this.currentSteer) * currentSpeed) / wheelbase;

      // Angular acceleration with rotational damping
      const yawInertiaSpeed = THREE.MathUtils.lerp(4.2, 2.8, speedRatio);
      this.angularVelocity = THREE.MathUtils.lerp(this.angularVelocity, targetYawRate, dt * yawInertiaSpeed);
      this.heading += this.angularVelocity * dt;
    } else {
      this.angularVelocity = THREE.MathUtils.lerp(this.angularVelocity, 0, dt * 8.0);
    }

    // 3. CHASSIS ROLL & PITCH
    this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, -this.angularVelocity * 0.08, dt * 6.0);
    this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, (this.throttle * 0.015) - (this.brake * 0.025), dt * 6.0);

    // 4. TRANSMISSION & RPM
    this.updateGears(speedKmH, soundManager);

    // 5. ERS BATTERY & ENGINE FORCE
    if (this.isOvertakeActive && this.throttle > 0.5) {
      this.battery = Math.max(0, this.battery - dt * 6.5);
      this.engineMode = 'OVERTAKE';
    } else if (this.brake > 0.2) {
      this.battery = Math.min(100, this.battery + dt * 12.0);
      this.engineMode = 'HARVESTING';
    } else {
      this.engineMode = 'BALANCED';
    }

    let enginePower = this.accelerationRate;
    if (this.isOvertakeActive && this.battery > 0) {
      enginePower *= 1.35;
    }

    let forwardForce = 0;
    if (this.throttle > 0) {
      const topSpeedCap = this.isDrsOpen ? this.maxSpeed * 1.05 : this.maxSpeed;
      const speedCapRatio = Math.min(currentSpeed / topSpeedCap, 1.0);
      forwardForce = this.throttle * enginePower * (1.0 - speedCapRatio * 0.5);
    }

    let brakeForce = 0;
    if (this.brake > 0) {
      if (currentSpeed > 0.5) {
        brakeForce = this.brake * this.brakingRate;
      } else {
        forwardForce = -this.brake * (this.accelerationRate * 0.35);
      }
    }

    // Aero Drag & Downforce
    const effectiveDownforce = this.frontWingDamaged ? this.downforceCoeff * 0.38 : this.downforceCoeff;
    const currentDrag = this.isDrsOpen ? this.dragCoeff * 0.78 : this.dragCoeff;
    const aeroDrag = currentSpeed * currentSpeed * currentDrag;
    const netForwardAcc = forwardForce - (this.brake > 0 ? brakeForce : 0) - aeroDrag;

    // Direction Vectors
    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const right = new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));

    // Velocity update
    let newVelocity = this.velocity.clone().addScaledVector(forward, netForwardAcc * dt);

    // Lateral grip & centripetal tire force
    const lateralVel = right.dot(newVelocity);
    this.lateralSlip = Math.abs(lateralVel);

    const dynamicGrip = this.corneringGrip + (currentSpeed * currentSpeed * effectiveDownforce * 0.1);
    const gripFactor = Math.min(1.0, dt * dynamicGrip);
    newVelocity.addScaledVector(right, -lateralVel * gripFactor);

    if (this.throttle === 0 && this.brake === 0) {
      newVelocity.multiplyScalar(Math.max(0, 1.0 - dt * 0.8));
    }

    newVelocity.y = 0;
    this.velocity.copy(newVelocity);

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    this.position.y = 0;

    // Sounds
    this.driftIntensity = Math.min(1.0, (this.lateralSlip * currentSpeed) / 75.0);
    if (soundManager) {
      const rpmRatio = Math.min(1.0, (this.rpm - this.idleRpm) / (this.maxRpm - this.idleRpm));
      soundManager.updateEngine(rpmRatio, this.throttle, speedKmH);
      soundManager.setTireScreech(this.driftIntensity);
    }
  }

  applyCollisionImpulse(impactVector, intensity = 1.0) {
    const impulse = new THREE.Vector3(impactVector.x, 0, impactVector.z).normalize();
    this.velocity.addScaledVector(impulse, 3.5 * intensity);
    this.velocity.y = 0;
    this.position.y = 0;
  }

  performPitStop(tireCompound = 'SOFT') {
    this.tireCompound = tireCompound;
    this.tireHealth = 100.0;
    this.frontWingDamaged = false;
    this.battery = 100.0;
  }

  updateGears(speedKmH, soundManager) {
    const oldGear = this.gear;

    for (let g = 1; g <= this.maxGears; g++) {
      if (speedKmH <= this.gearRatios[g]) {
        this.gear = g;
        break;
      }
    }
    if (speedKmH > this.gearRatios[this.maxGears]) {
      this.gear = this.maxGears;
    }

    if (this.gear > oldGear && soundManager) {
      soundManager.playGearShiftSound();
    }

    const currentGearMinSpeed = this.gear === 1 ? 0 : this.gearRatios[this.gear - 1];
    const currentGearMaxSpeed = this.gearRatios[this.gear];
    const gearSpeedProgress = Math.max(0, Math.min(1, (speedKmH - currentGearMinSpeed) / (currentGearMaxSpeed - currentGearMinSpeed)));

    this.rpm = this.idleRpm + gearSpeedProgress * (this.maxRpm - this.idleRpm);
    if (this.throttle === 0 && speedKmH < 5) {
      this.rpm = this.idleRpm + Math.sin(Date.now() * 0.008) * 150;
    }
  }

  resetPosition(x = 0, y = 0, z = 0, heading = 0) {
    this.position.set(x, 0, z);
    this.velocity.set(0, 0, 0);
    this.heading = heading;
    this.angularVelocity = 0;
    this.steerInput = 0;
    this.currentSteer = 0;
    this.rollAngle = 0;
    this.pitchAngle = 0;
    this.gear = 1;
    this.rpm = this.idleRpm;
    this.frontWingDamaged = false;
  }
}
