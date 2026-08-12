/**
 * Cockpit & Race Telemetry HUD Controller (Matching F1 TV Broadcast & Cockpit Layout)
 */
export class TelemetryHUD {
  constructor(callbacks) {
    this.callbacks = callbacks || {};
    this.screenElement = document.getElementById('race-hud');

    // Telemetry Elements
    this.speedEl = document.getElementById('hud-speed');
    this.gearEl = document.getElementById('hud-gear');
    this.rpmEl = document.getElementById('hud-rpm');
    this.modeEl = document.getElementById('hud-mode');
    this.ersPercentEl = document.getElementById('ers-percent');
    this.ersRingEl = document.getElementById('ers-ring');
    this.rpmLeds = document.querySelectorAll('.rpm-led');

    // Timing & Leaderboard Elements
    this.lapCounterEl = document.getElementById('hud-lap-counter');
    this.currentLapTimeEl = document.getElementById('hud-current-lap-time');
    this.bestLapTimeEl = document.getElementById('hud-best-lap-time');
    this.leaderboardListEl = document.getElementById('hud-leaderboard-list');

    // Minimap
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    // Buttons
    this.paddockBtn = document.getElementById('hud-paddock-btn');
    this.cameraBtn = document.getElementById('hud-camera-btn');
    this.camNameText = document.getElementById('cam-name-text');
    this.resetBtn = document.getElementById('hud-reset-btn');
    this.exitBtn = document.getElementById('hud-exit-btn');
    this.radioBanner = document.getElementById('radio-banner');

    // Lap Timing State
    this.currentLap = 1;
    this.maxLaps = 60;
    this.lapStartTime = 0;
    this.bestLapTime = 81.046; // Monza record ~1:21.046

    this.setupListeners();
  }

  setupListeners() {
    if (this.paddockBtn) {
      this.paddockBtn.addEventListener('click', () => {
        if (this.callbacks.onOpenPaddock) this.callbacks.onOpenPaddock();
      });
    }

    if (this.cameraBtn) {
      this.cameraBtn.addEventListener('click', () => {
        if (this.callbacks.onToggleCamera) {
          const modeName = this.callbacks.onToggleCamera();
          if (this.camNameText) this.camNameText.textContent = modeName;
        }
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        if (this.callbacks.onResetCar) this.callbacks.onResetCar();
      });
    }

    if (this.exitBtn) {
      this.exitBtn.addEventListener('click', () => {
        if (this.callbacks.onReturnLobby) this.callbacks.onReturnLobby();
      });
    }
  }

  initRace(team, driver) {
    this.currentLap = 1;
    this.lapStartTime = Date.now();
    this.updateLeaderboard(team, driver);
  }

  updateLeaderboard(team, driver) {
    if (!this.leaderboardListEl) return;

    // Rivals List
    const rivals = [
      { name: driver.code || 'YOU', teamColor: team.color, gap: 'LEADER', isPlayer: true },
      { name: 'TSU', teamColor: '#6692FF', gap: '+0.183' },
      { name: 'ANT', teamColor: '#00D2BE', gap: '+0.835' },
      { name: 'HAM', teamColor: '#E80020', gap: '+1.318' },
      { name: 'VER', teamColor: '#3671C6', gap: '+1.719' }
    ];

    this.leaderboardListEl.innerHTML = '';
    rivals.forEach((r, idx) => {
      const row = document.createElement('div');
      row.className = `tower-row ${r.isPlayer ? 'player' : ''}`;
      row.innerHTML = `
        <div class="tower-row-left">
          <span class="tower-pos">${idx + 1}</span>
          <span class="tower-team-indicator" style="background: ${r.teamColor}"></span>
          <span class="tower-driver-name">${r.name}</span>
        </div>
        <div class="tower-row-right">
          <span class="tire-badge soft">S</span>
          <span class="tower-gap">${r.gap}</span>
        </div>
      `;
      this.leaderboardListEl.appendChild(row);
    });
  }

  update(physics, monzaTrack) {
    const speedKmH = Math.round(physics.velocity.length() * 3.6);
    const gear = physics.gear;
    const rpm = Math.round(physics.rpm);
    const battery = Math.round(physics.battery);

    // Speed & Gear
    if (this.speedEl) this.speedEl.textContent = speedKmH;
    if (this.gearEl) this.gearEl.textContent = gear === 0 ? 'N' : gear;
    if (this.rpmEl) this.rpmEl.innerHTML = `${rpm} <span class="rpm-unit">RPM</span>`;
    if (this.modeEl) this.modeEl.textContent = physics.engineMode;
    if (this.ersPercentEl) this.ersPercentEl.textContent = `${battery}%`;

    // ERS SVG Ring offset
    if (this.ersRingEl) {
      const circumference = 175.9;
      const offset = circumference - (battery / 100) * circumference;
      this.ersRingEl.style.strokeDashoffset = offset;
    }

    // RPM Shift LEDs
    const rpmRatio = (physics.rpm - physics.idleRpm) / (physics.maxRpm - physics.idleRpm);
    const totalLeds = this.rpmLeds.length;
    this.rpmLeds.forEach((led, i) => {
      const threshold = (i + 1) / totalLeds;
      if (rpmRatio >= threshold * 0.85) {
        led.classList.add('on');
      } else {
        led.classList.remove('on');
      }
    });

    // Lap Timing
    if (this.lapStartTime > 0) {
      const elapsed = (Date.now() - this.lapStartTime) / 1000;
      const mins = Math.floor(elapsed / 60);
      const secs = (elapsed % 60).toFixed(3);
      if (this.currentLapTimeEl) {
        this.currentLapTimeEl.textContent = `${mins}:${secs.padStart(6, '0')}`;
      }
    }

    // Lap Counter
    if (this.lapCounterEl) {
      this.lapCounterEl.innerHTML = `${this.currentLap} <span class="lap-total">/ ${this.maxLaps}</span>`;
    }

    // Render Minimap
    this.renderMinimap(physics.position, monzaTrack);
  }

  renderMinimap(playerPos, monzaTrack) {
    if (!this.minimapCtx || !monzaTrack || !monzaTrack.curve) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Map bounds: Monza spans X: -70 to 350, Z: -470 to 630
    const minX = -80, maxX = 360;
    const minZ = -480, maxZ = 640;

    const mapX = (x) => 20 + ((x - minX) / (maxX - minX)) * (w - 40);
    const mapY = (z) => h - 20 - ((z - minZ) / (maxZ - minZ)) * (h - 40);

    // Draw Track Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const points = monzaTrack.curve.getPoints(100);
    points.forEach((p, i) => {
      const px = mapX(p.x);
      const py = mapY(p.z);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();

    // Draw Player Dot
    const pX = mapX(playerPos.x);
    const pY = mapY(playerPos.z);

    // Pulsing outer ring
    ctx.fillStyle = 'rgba(232, 0, 32, 0.4)';
    ctx.beginPath();
    ctx.arc(pX, pY, 7, 0, Math.PI * 2);
    ctx.fill();

    // Core player dot
    ctx.fillStyle = '#E80020';
    ctx.beginPath();
    ctx.arc(pX, pY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  showRadioMessage(text, duration = 3500) {
    if (!this.radioBanner) return;
    const radioText = document.getElementById('radio-text');
    if (radioText) radioText.textContent = text;

    this.radioBanner.classList.remove('hidden');
    setTimeout(() => {
      this.radioBanner.classList.add('hidden');
    }, duration);
  }

  show() {
    this.screenElement.classList.remove('hidden');
    this.screenElement.classList.add('active');
  }

  hide() {
    this.screenElement.classList.remove('active');
    this.screenElement.classList.add('hidden');
  }
}
