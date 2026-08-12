import * as THREE from 'three';

/**
 * Formula 1 Vehicle Dynamics & Physics Engine
 * Features speed-sensitive progressive steering curves, weight transfer, and aero downforce.
 */
export class VehiclePhysics {
  constructor() {
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.heading = 0; // Radians
    this.steerInput = 0;
    this.currentSteer = 0; // Smooth progressive steering angle
    this.rollAngle = 0; // Chassis roll in corners
    this.pitchAngle = 0; // Chassis pitch under braking/acceleration

    // Vehicle Specifications
    this.maxSpeed = 95.0; // ~342 km/h
    this.maxReverseSpeed = 12.0;
    this.accelerationRate = 24.0;
    this.brakingRate = 42.0;
    this.dragCoeff = 0.0016;
    this.downforceCoeff = 0.0055;
    this.corneringGrip = 42.0;

    // Damage impact penalties
    this.frontWingDamaged = false;

    // Transmission & Engine
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
    if (dt > 0.1) dt = 0.1;

    const currentSpeed = this.velocity.length();
    const speedKmH = currentSpeed * 3.6;

    // 1. PROGRESSIVE CURVED STEERING DYNAMICS (SMOOTH CARVING INSTEAD OF INSTANT TWITCH)
    // Speed factor: At high speeds, steering angle is progressively limited for smooth arc carving
    const speedRatio = Math.min(currentSpeed / this.maxSpeed, 1.0);
    const maxLock = THREE.MathUtils.lerp(Math.PI / 7.5, Math.PI / 18.0, Math.pow(speedRatio, 0.7));
    const targetSteering = this.steerInput * maxLock;

    // Progressive turn-in inertia (smoother transition)
    const steerResponseSpeed = THREE.MathUtils.lerp(7.0, 4.5, speedRatio);
    this.currentSteer = THREE.MathUtils.lerp(this.currentSteer, targetSteering, dt * steerResponseSpeed);

    // 2. TRANSMISSION & RPM
    this.updateGears(speedKmH, soundManager);

    // 3. ERS BATTERY
    if (this.isOvertakeActive && this.throttle > 0.5) {
      this.battery = Math.max(0, this.battery - dt * 6.5);
      this.engineMode = 'OVERTAKE';
    } else if (this.brake > 0.2) {
      this.battery = Math.min(100, this.battery + dt * 12.0);
      this.engineMode = 'HARVESTING';
    } else {
      this.engineMode = 'BALANCED';
    }

    // 4. FORCES: ENGINE, BRAKES & AERO DRAG
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

    // Aerodynamic Drag & Downforce (Reduced downforce if front wing is damaged)
    const effectiveDownforce = this.frontWingDamaged ? this.downforceCoeff * 0.45 : this.downforceCoeff;
    const currentDrag = this.isDrsOpen ? this.dragCoeff * 0.78 : this.dragCoeff;
    const aeroDrag = currentSpeed * currentSpeed * currentDrag;
    const netForwardAcc = forwardForce - (this.brake > 0 ? brakeForce : 0) - aeroDrag;

    // 5. YAW / HEADING UPDATE (NATURAL ACKERMANN CURVATURE)
    if (currentSpeed > 0.2) {
      const wheelbase = 3.6; // F1 wheelbase ~3.6m
      const curvatureYawRate = (Math.tan(this.currentSteer) * currentSpeed) / wheelbase;
      this.heading += curvatureYawRate * dt;
    }

    // Chassis dynamic roll and pitch
    this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, -this.currentSteer * (currentSpeed / 40.0), dt * 8.0);
    this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, (this.throttle * 0.03) - (this.brake * 0.06), dt * 8.0);

    // Direction Vectors
    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const right = new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));

    // Longitudinal update
    let newVelocity = this.velocity.clone().addScaledVector(forward, netForwardAcc * dt);

    // Lateral grip & weight transfer (grip scales with speed via downforce)
    const lateralVel = right.dot(newVelocity);
    this.lateralSlip = Math.abs(lateralVel);

    const dynamicGrip = this.corneringGrip + (currentSpeed * currentSpeed * effectiveDownforce * 0.1);
    const gripFactor = Math.min(1.0, dt * dynamicGrip);
    newVelocity.addScaledVector(right, -lateralVel * gripFactor);

    if (this.throttle === 0 && this.brake === 0) {
      newVelocity.multiplyScalar(Math.max(0, 1.0 - dt * 0.8));
    }

    this.velocity.copy(newVelocity);
    this.position.addScaledVector(this.velocity, dt);

    // Sound Updates
    this.driftIntensity = Math.min(1.0, (this.lateralSlip * currentSpeed) / 75.0);
    if (soundManager) {
      const rpmRatio = Math.min(1.0, (this.rpm - this.idleRpm) / (this.maxRpm - this.idleRpm));
      soundManager.updateEngine(rpmRatio, this.throttle, speedKmH);
      soundManager.setTireScreech(this.driftIntensity);
    }
  }

  applyCollisionImpulse(impactVector, intensity = 1.0) {
    this.velocity.addScaledVector(impactVector, 6.0 * intensity);
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
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.heading = heading;
    this.steerInput = 0;
    this.currentSteer = 0;
    this.rollAngle = 0;
    this.pitchAngle = 0;
    this.gear = 1;
    this.rpm = this.idleRpm;
    this.frontWingDamaged = false;
  }
}
