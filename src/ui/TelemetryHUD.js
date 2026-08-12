import * as THREE from 'three';

/**
 * Cockpit & Race Telemetry HUD Controller
 * Features:
 * 1. Dynamic Live 20-Driver Leaderboard (Overtaking updates standings in real time)
 * 2. 3-Lap Timing Stack (Current Lap running clock, Last Lap time, Best Lap record)
 * 3. Exact Monza Minimap (Auto-fitted bounds with zero clipping + all rival car blips)
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
    this.lastLapTimeEl = document.getElementById('hud-last-lap-time');
    this.bestLapTimeEl = document.getElementById('hud-best-lap-time');
    this.leaderboardListEl = document.getElementById('hud-leaderboard-list');

    // Minimap
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    // Buttons
    this.paddockBtn = document.getElementById('hud-paddock-btn');
    this.cameraBtn = document.getElementById('hud-camera-btn');
    this.camNameText = document.getElementById('cam-name-text');
    this.resetBtn = document.getElementById('hud-reset-btn');
    this.exitBtn = document.getElementById('hud-exit-btn');
    this.radioBanner = document.getElementById('radio-banner');

    // Lap Timing & Tracking State
    this.playerTeam = null;
    this.playerDriver = null;
    this.currentLap = 1;
    this.maxLaps = 60;
    this.lapStartTime = 0;
    this.lastLapTime = null; // Stored in seconds
    this.bestLapTime = 81.046; // Monza record ~1:21.046

    this.prevPlayerProgress = 0.05;
    this.playerLapsCompleted = 0;

    // Cached Monza Track Bounds for Minimap Auto-fit
    this.mapBounds = null;

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
    this.playerTeam = team;
    this.playerDriver = driver;
    this.currentLap = 1;
    this.playerLapsCompleted = 0;
    this.lapStartTime = Date.now();
    this.lastLapTime = null;
    this.prevPlayerProgress = 0.05;

    if (this.lastLapTimeEl) this.lastLapTimeEl.textContent = '--:--.---';
    if (this.bestLapTimeEl) this.bestLapTimeEl.textContent = this.formatTime(this.bestLapTime);
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '--:--.---';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, '0')}`;
  }

  update(physics, monzaTrack, gridManager) {
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

    // ERS Ring
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

    // Track Progress & Start/Finish Line Cross Detection
    let playerU = 0.05;
    if (monzaTrack) {
      const nearest = monzaTrack.getNearestTrackPoint(physics.position);
      playerU = nearest.u || 0.05;
    }

    // Detect lap completion (Crossing from u > 0.92 to u < 0.08)
    if (this.prevPlayerProgress > 0.90 && playerU < 0.10) {
      this.playerLapsCompleted++;
      this.currentLap = this.playerLapsCompleted + 1;

      const elapsedLapSeconds = (Date.now() - this.lapStartTime) / 1000;
      this.lastLapTime = elapsedLapSeconds;

      if (!this.bestLapTime || elapsedLapSeconds < this.bestLapTime) {
        this.bestLapTime = elapsedLapSeconds;
        this.showRadioMessage(`"PURPLE LAP! ${this.formatTime(elapsedLapSeconds)} - Fastest Lap!"`);
      } else {
        this.showRadioMessage(`"Lap ${this.playerLapsCompleted} Complete: ${this.formatTime(elapsedLapSeconds)}"`);
      }

      if (this.lastLapTimeEl) this.lastLapTimeEl.textContent = this.formatTime(this.lastLapTime);
      if (this.bestLapTimeEl) this.bestLapTimeEl.textContent = this.formatTime(this.bestLapTime);

      this.lapStartTime = Date.now();
    }
    this.prevPlayerProgress = playerU;

    // Live Current Lap Timer
    if (this.lapStartTime > 0) {
      const liveElapsed = (Date.now() - this.lapStartTime) / 1000;
      if (this.currentLapTimeEl) {
        this.currentLapTimeEl.textContent = this.formatTime(liveElapsed);
      }
    }

    // Lap Counter
    if (this.lapCounterEl) {
      this.lapCounterEl.innerHTML = `${this.currentLap} <span class="lap-total">/ ${this.maxLaps}</span>`;
    }

    // Update Live 20-Car Dynamic Standings
    this.updateDynamicStandings(playerU, gridManager);

    // Render Full Monza Minimap
    this.renderMinimap(physics.position, monzaTrack, gridManager);
  }

  updateDynamicStandings(playerU, gridManager) {
    if (!this.leaderboardListEl) return;

    // Gather all 20 racers
    const racers = [];

    // 1. Player
    const playerTotalScore = (this.playerLapsCompleted * 1.0) + playerU;
    racers.push({
      name: this.playerDriver?.code || 'YOU',
      fullName: this.playerDriver?.name || 'Player',
      teamColor: this.playerTeam?.color || '#E80020',
      tire: 'S',
      score: playerTotalScore,
      isPlayer: true
    });

    // 2. AI Competitors
    if (gridManager && gridManager.gridCars) {
      gridManager.gridCars.forEach(ai => {
        const aiScore = (this.playerLapsCompleted * 1.0) + (ai.progress || 0);
        racers.push({
          name: ai.driver?.code || 'DRV',
          fullName: ai.driver?.name || 'Driver',
          teamColor: ai.team?.color || '#00D2BE',
          tire: ai.slot % 3 === 0 ? 'M' : 'S',
          score: aiScore,
          isPlayer: false
        });
      });
    }

    // Sort descending (highest score = 1st place)
    racers.sort((a, b) => b.score - a.score);

    // Leader score for gap calculation
    const leaderScore = racers[0].score;

    this.leaderboardListEl.innerHTML = '';
    // Show top 8 in the tower
    racers.slice(0, 8).forEach((r, idx) => {
      let gapText = 'LEADER';
      if (idx > 0) {
        const delta = (leaderScore - r.score) * 80; // approximate gap in seconds
        gapText = `+${Math.max(0.08, delta).toFixed(3)}`;
      }

      const row = document.createElement('div');
      row.className = `tower-row ${r.isPlayer ? 'player' : ''}`;
      row.innerHTML = `
        <div class="tower-row-left">
          <span class="tower-pos">${idx + 1}</span>
          <span class="tower-team-indicator" style="background: ${r.teamColor}"></span>
          <span class="tower-driver-name">${r.name}</span>
        </div>
        <div class="tower-row-right">
          <span class="tire-badge ${r.tire === 'S' ? 'soft' : 'medium'}">${r.tire}</span>
          <span class="tower-gap">${gapText}</span>
        </div>
      `;
      this.leaderboardListEl.appendChild(row);
    });
  }

  renderMinimap(playerPos, monzaTrack, gridManager) {
    if (!this.minimapCtx || !monzaTrack || !monzaTrack.curve) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const points = monzaTrack.curve.getPoints(120);

    // Calculate auto-fit bounding box once
    if (!this.mapBounds) {
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
      });
      this.mapBounds = { minX, maxX, minZ, maxZ };
    }

    const { minX, maxX, minZ, maxZ } = this.mapBounds;
    const padding = 16;
    const usableW = w - padding * 2;
    const usableH = h - padding * 2;

    // Coordinate mapping that guarantees 100% of Monza fits inside canvas without cutoff
    const mapX = (x, z) => padding + ((z - minZ) / (maxZ - minZ)) * usableW;
    const mapY = (x, z) => h - padding - ((x - minX) / (maxX - minX)) * usableH;

    // 1. Draw Clean Track Glow
    ctx.strokeStyle = 'rgba(0, 210, 190, 0.25)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach((p, i) => {
      const px = mapX(p.x, p.z);
      const py = mapY(p.x, p.z);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();

    // 2. Draw Crisp White Track Silhouette (Matching Official Monza Circuit)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((p, i) => {
      const px = mapX(p.x, p.z);
      const py = mapY(p.x, p.z);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();

    // 3. Draw Yellow Start/Finish Checker Line
    const startPt = points[0];
    const sX = mapX(startPt.x, startPt.z);
    const sY = mapY(startPt.x, startPt.z);
    ctx.strokeStyle = '#FFF200';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sX - 4, sY - 4);
    ctx.lineTo(sX + 4, sY + 4);
    ctx.stroke();

    // 4. Draw AI Competitors Live Dots
    if (gridManager && gridManager.gridCars) {
      gridManager.gridCars.forEach(ai => {
        const ax = mapX(ai.position.x, ai.position.z);
        const ay = mapY(ai.position.x, ai.position.z);

        ctx.fillStyle = ai.team?.color || '#FFA500';
        ctx.beginPath();
        ctx.arc(ax, ay, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 5. Draw Player Live Beacon
    const pX = mapX(playerPos.x, playerPos.z);
    const pY = mapY(playerPos.x, playerPos.z);
    const teamCol = this.playerTeam?.color || '#E80020';

    ctx.fillStyle = `${teamCol}66`;
    ctx.beginPath();
    ctx.arc(pX, pY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = teamCol;
    ctx.beginPath();
    ctx.arc(pX, pY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
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
