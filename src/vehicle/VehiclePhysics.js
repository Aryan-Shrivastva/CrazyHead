import * as THREE from 'three';

/**
 * Formula 1 Arcade Vehicle Dynamics & Physics Engine
 */
export class VehiclePhysics {
  constructor() {
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.heading = 0; // In radians
    this.steeringAngle = 0; // Target steering angle
    this.currentSteer = 0; // Lerped steering angle

    // Vehicle Specifications
    this.maxSpeed = 96.0; // ~345 km/h in m/s
    this.maxReverseSpeed = 12.0; // ~43 km/h
    this.accelerationRate = 22.0; // m/s^2
    this.brakingRate = 42.0; // m/s^2 (F1 carbon-carbon brakes ~5G)
    this.dragCoeff = 0.0018; // Aerodynamic drag
    this.downforceCoeff = 0.0045; // Aerodynamic downforce
    this.corneringGrip = 38.0; // Lateral tire grip

    // Transmission & Engine
    this.gear = 1;
    this.maxGears = 8;
    this.rpm = 4000;
    this.idleRpm = 4000;
    this.maxRpm = 14500;
    this.gearRatios = [0, 42, 75, 115, 160, 210, 260, 305, 360]; // Max km/h per gear

    // ERS & Battery
    this.battery = 100.0; // 0 - 100%
    this.isDrsOpen = false;
    this.isOvertakeActive = false;
    this.engineMode = 'HARVESTING';

    // Inputs
    this.throttle = 0;
    this.brake = 0;
    this.steerInput = 0;
    this.handbrake = false;

    // Drifting & Slip
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
    if (dt > 0.1) dt = 0.1; // Clamp large time deltas

    const currentSpeed = this.velocity.length();
    const speedKmH = currentSpeed * 3.6;

    // 1. DYNAMIC STEERING SENSITIVITY (High speed reduces lock to prevent over-twitchiness)
    const speedFactor = Math.max(0.25, 1.0 - (currentSpeed / this.maxSpeed) * 0.65);
    const targetSteering = this.steerInput * (Math.PI / 6.5) * speedFactor;
    this.currentSteer = THREE.MathUtils.lerp(this.currentSteer, targetSteering, dt * 14.0);

    // 2. TRANSMISSION & GEAR RATIOS
    this.updateGears(speedKmH, soundManager);

    // 3. ERS BATTERY HARVESTING & DEPLOYMENT
    if (this.isOvertakeActive && this.throttle > 0.5) {
      this.battery = Math.max(0, this.battery - dt * 6.5);
      this.engineMode = 'OVERTAKE';
    } else if (this.brake > 0.2) {
      this.battery = Math.min(100, this.battery + dt * 12.0); // Kinetic energy recovery under braking
      this.engineMode = 'HARVESTING';
    } else {
      this.engineMode = 'BALANCED';
    }

    // 4. ACCELERATION & ENGINE FORCE
    let enginePower = this.accelerationRate;
    if (this.isOvertakeActive && this.battery > 0) {
      enginePower *= 1.35; // ERS hybrid boost!
    }

    let forwardForce = 0;
    if (this.throttle > 0) {
      const topSpeedCap = this.isDrsOpen ? this.maxSpeed * 1.06 : this.maxSpeed;
      const speedRatio = Math.min(currentSpeed / topSpeedCap, 1.0);
      forwardForce = this.throttle * enginePower * (1.0 - speedRatio * 0.55);
    }

    // Braking Force
    let brakeForce = 0;
    if (this.brake > 0) {
      if (currentSpeed > 0.5) {
        brakeForce = this.brake * this.brakingRate;
      } else {
        // Reverse
        forwardForce = -this.brake * (this.accelerationRate * 0.4);
      }
    }

    // Aerodynamic Drag & Downforce
    const currentDrag = this.isDrsOpen ? this.dragCoeff * 0.75 : this.dragCoeff;
    const aeroDrag = currentSpeed * currentSpeed * currentDrag;
    const netForwardAcc = forwardForce - (this.brake > 0 ? brakeForce : 0) - aeroDrag;

    // 5. UPDATE HEADING & ROTATION
    if (currentSpeed > 0.2) {
      const turnRate = (this.currentSteer * currentSpeed) / 2.8;
      this.heading += turnRate * dt;
    }

    // Forward Direction Vector
    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const right = new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));

    // Longitudinal acceleration
    let newVelocity = this.velocity.clone().addScaledVector(forward, netForwardAcc * dt);

    // Lateral tire grip & slide
    const lateralVel = right.dot(newVelocity);
    this.lateralSlip = Math.abs(lateralVel);

    // Apply lateral grip correction
    const gripFactor = Math.min(1.0, dt * (this.corneringGrip + currentSpeed * this.downforceCoeff));
    newVelocity.addScaledVector(right, -lateralVel * gripFactor);

    // Minimum rolling resistance
    if (this.throttle === 0 && this.brake === 0) {
      newVelocity.multiplyScalar(Math.max(0, 1.0 - dt * 0.8));
    }

    this.velocity.copy(newVelocity);
    this.position.addScaledVector(this.velocity, dt);

    // Calculate Drift / Tire Screech Intensity
    this.driftIntensity = Math.min(1.0, (this.lateralSlip * currentSpeed) / 80.0);
    if (soundManager) {
      const rpmRatio = Math.min(1.0, (this.rpm - this.idleRpm) / (this.maxRpm - this.idleRpm));
      soundManager.updateEngine(rpmRatio, this.throttle, speedKmH);
      soundManager.setTireScreech(this.driftIntensity);
    }
  }

  updateGears(speedKmH, soundManager) {
    const oldGear = this.gear;

    // Automatic Gear Shifter
    for (let g = 1; g <= this.maxGears; g++) {
      if (speedKmH <= this.gearRatios[g]) {
        this.gear = g;
        break;
      }
    }
    if (speedKmH > this.gearRatios[this.maxGears]) {
      this.gear = this.maxGears;
    }

    // Play shift sound on upshift
    if (this.gear > oldGear && soundManager) {
      soundManager.playGearShiftSound();
    }

    // RPM Calculation based on current gear ratio
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
    this.steeringAngle = 0;
    this.currentSteer = 0;
    this.gear = 1;
    this.rpm = this.idleRpm;
  }
}
