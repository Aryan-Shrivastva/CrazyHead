import confetti from 'canvas-confetti';
import { F1_TEAMS } from '../data/teams.js';

/**
 * Two-Stage Lobby Controller:
 * Stage 1: Team Selection Ribbon
 * Stage 2: Driver Career / Confirm Settings (Driver in front of Car)
 */
export class LobbyUI {
  constructor(onStartRace, onTeamChange, onDriverChange, soundManager) {
    this.onStartRace = onStartRace;
    this.onTeamChange = onTeamChange;
    this.onDriverChange = onDriverChange;
    this.soundManager = soundManager;

    this.selectedTeam = F1_TEAMS[0]; // Default Ferrari
    this.selectedDriver = this.selectedTeam.drivers[0]; // Default Leclerc
    this.currentStage = 1; // 1 = Team Select, 2 = Driver Career

    this.screenElement = document.getElementById('lobby-screen');
    this.stage1Header = document.getElementById('stage-1-header');
    this.stage2Header = document.getElementById('stage-2-header');
    this.stage1Bottom = document.getElementById('stage-1-bottom');
    this.stage2Bottom = document.getElementById('stage-2-bottom');

    this.ribbonEl = document.getElementById('team-carbon-ribbon');
    this.teamTitleEl = document.getElementById('lobby-team-title');
    this.driverCompCardEl = document.getElementById('driver-comparison-card');
    this.perksListEl = document.getElementById('lobby-perks-list');

    this.gotoDriverBtn = document.getElementById('goto-driver-btn');
    this.backToTeamBtn = document.getElementById('back-to-team-btn');
    this.startBtn = document.getElementById('start-race-btn');
    this.driverSwitchToggles = document.getElementById('driver-switch-toggles');
    this.leadDriverName = document.getElementById('lead-driver-name');
    this.leadDriverStats = document.getElementById('lead-driver-stats');
    this.ambientWaves = document.getElementById('showroom-ambient-waves');

    // Metadata Elements
    this.metaPrincipal = document.getElementById('meta-principal');
    this.metaChassis = document.getElementById('meta-chassis');
    this.metaBase = document.getElementById('meta-base');
    this.metaEngine = document.getElementById('meta-engine');

    this.init();
  }

  init() {
    this.renderTeamRibbon();
    this.updateTeamDetails();
    this.setupListeners();
  }

  renderTeamRibbon() {
    if (!this.ribbonEl) return;
    this.ribbonEl.innerHTML = '';

    F1_TEAMS.forEach(team => {
      const tile = document.createElement('div');
      tile.className = `carbon-team-tile ${team.id === this.selectedTeam.id ? 'selected' : ''}`;
      tile.style.setProperty('--team-color', team.color);
      tile.style.setProperty('--team-glow', `${team.color}66`);

      tile.innerHTML = `
        <span class="tile-badge-icon">${team.badge}</span>
        <span class="tile-team-short">${team.logoText || team.shortName}</span>
      `;

      tile.addEventListener('click', () => {
        this.selectTeam(team);
      });

      this.ribbonEl.appendChild(tile);
    });
  }

  selectTeam(team) {
    this.selectedTeam = team;
    this.selectedDriver = team.drivers[0];

    this.renderTeamRibbon();
    this.updateTeamDetails();

    if (this.onTeamChange) {
      this.onTeamChange(this.selectedTeam, this.selectedDriver);
    }
  }

  setStage(stage) {
    this.currentStage = stage;
    if (stage === 1) {
      if (this.stage1Header) this.stage1Header.classList.remove('hidden');
      if (this.stage2Header) this.stage2Header.classList.add('hidden');
      if (this.stage1Bottom) this.stage1Bottom.classList.remove('hidden');
      if (this.stage2Bottom) this.stage2Bottom.classList.add('hidden');
    } else {
      if (this.stage1Header) this.stage1Header.classList.add('hidden');
      if (this.stage2Header) this.stage2Header.classList.remove('hidden');
      if (this.stage1Bottom) this.stage1Bottom.classList.add('hidden');
      if (this.stage2Bottom) this.stage2Bottom.classList.remove('hidden');
      this.renderDriverToggles();
    }
  }

  selectDriver(driver) {
    this.selectedDriver = driver;
    this.updateTeamDetails();
    this.renderDriverToggles();

    if (this.onDriverChange) {
      this.onDriverChange(this.selectedDriver);
    }
  }

  renderDriverToggles() {
    if (!this.driverSwitchToggles) return;
    this.driverSwitchToggles.innerHTML = '';

    this.selectedTeam.drivers.forEach(driver => {
      const btn = document.createElement('button');
      btn.className = `driver-switch-pill ${driver.id === this.selectedDriver.id ? 'selected' : ''}`;
      btn.innerHTML = `
        <span>${driver.flag}</span>
        <span>${driver.name}</span>
        <span style="color: var(--f1-yellow); font-size: 11px;">#${driver.number}</span>
      `;

      btn.addEventListener('click', () => {
        this.selectDriver(driver);
      });

      this.driverSwitchToggles.appendChild(btn);
    });
  }

  updateTeamDetails() {
    // 1. Update Title & Meta
    if (this.teamTitleEl) this.teamTitleEl.textContent = this.selectedTeam.name.toUpperCase();
    if (this.metaPrincipal) this.metaPrincipal.textContent = this.selectedTeam.teamPrincipal;
    if (this.metaChassis) this.metaChassis.textContent = this.selectedTeam.chassis;
    if (this.metaBase) this.metaBase.textContent = this.selectedTeam.base;
    if (this.metaEngine) this.metaEngine.textContent = this.selectedTeam.engineSupplier;

    // 2. Stage 2 Lead Driver Banner
    if (this.leadDriverName) this.leadDriverName.textContent = this.selectedDriver.name;
    if (this.leadDriverStats) {
      this.leadDriverStats.textContent = `#${this.selectedDriver.number} • ${this.selectedDriver.flag} • ${this.selectedDriver.wins} WINS • ${this.selectedDriver.podiums} PODIUMS`;
    }

    // 3. Ambient Wave Color
    if (this.ambientWaves) {
      this.ambientWaves.style.setProperty('--ambient-wave-color', `${this.selectedTeam.color}44`);
    }

    // 4. Driver Comparison Split Card (Stage 1)
    if (this.driverCompCardEl) {
      const d1 = this.selectedTeam.drivers[0];
      const d2 = this.selectedTeam.drivers[1];

      this.driverCompCardEl.innerHTML = `
        <div class="driver-split-row">
          <div class="driver-side ${this.selectedDriver.id === d1.id ? 'selected' : ''}" id="driver-side-1">
            <div class="driver-name-tag">${d1.name} <span class="driver-percent">${d1.share || '50%'}</span></div>
            <div class="driver-badges-strip">
              <span class="f1-stat-badge">${d1.rtg || 90} RTG</span>
              <span class="f1-stat-badge">${d1.foc || 90} FOC</span>
            </div>
          </div>

          <div class="f1-stat-badge" style="background: rgba(175, 82, 222, 0.3); color: #DDA0DD; border: 1px solid rgba(175,82,222,0.4);">
            Inc. 2% Bonus
          </div>

          <div class="driver-side ${this.selectedDriver.id === d2.id ? 'selected' : ''}" id="driver-side-2" style="text-align: right; align-items: flex-end;">
            <div class="driver-name-tag"><span class="driver-percent">${d2.share || '50%'}</span> ${d2.name}</div>
            <div class="driver-badges-strip">
              <span class="f1-stat-badge">${d2.foc || 90} FOC</span>
              <span class="f1-stat-badge">${d2.rtg || 90} RTG</span>
            </div>
          </div>
        </div>

        <div class="driver-split-bar" style="--team-color: ${this.selectedTeam.color}">
          <div class="split-fill-left" style="width: ${d1.share || '50%'}"></div>
          <div class="split-fill-right" style="width: ${d2.share || '50%'}"></div>
        </div>
      `;

      const side1 = document.getElementById('driver-side-1');
      const side2 = document.getElementById('driver-side-2');
      if (side1) side1.addEventListener('click', () => this.selectDriver(d1));
      if (side2) side2.addEventListener('click', () => this.selectDriver(d2));
    }

    // 5. Perks Table (Stage 1)
    if (this.perksListEl) {
      this.perksListEl.innerHTML = '';
      (this.selectedTeam.perks || []).forEach(perk => {
        const row = document.createElement('div');
        row.className = 'perk-row';
        row.innerHTML = `
          <span class="perk-name">${perk.name}</span>
          <span class="perk-val-pill ${perk.active ? '' : 'inactive'}">${perk.val}</span>
        `;
        this.perksListEl.appendChild(row);
      });
    }
  }

  setupListeners() {
    if (this.gotoDriverBtn) {
      this.gotoDriverBtn.addEventListener('click', () => {
        this.setStage(2);
        if (this.onTeamChange) this.onTeamChange(this.selectedTeam, this.selectedDriver, 2);
      });
    }

    if (this.backToTeamBtn) {
      this.backToTeamBtn.addEventListener('click', () => {
        this.setStage(1);
        if (this.onTeamChange) this.onTeamChange(this.selectedTeam, this.selectedDriver, 1);
      });
    }

    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        this.triggerLightsOutSequence();
      });
    }
  }

  triggerLightsOutSequence() {
    this.startBtn.disabled = true;
    this.startBtn.style.opacity = '0.5';

    const lights = [
      document.getElementById('light-1'),
      document.getElementById('light-2'),
      document.getElementById('light-3'),
      document.getElementById('light-4'),
      document.getElementById('light-5')
    ];

    lights.forEach(l => l && l.classList.remove('on'));

    let count = 0;
    const interval = setInterval(() => {
      if (count < 5) {
        if (lights[count]) lights[count].classList.add('on');
        if (this.soundManager) this.soundManager.playGantryLightBeep(false);
        count++;
      } else {
        clearInterval(interval);
        const randomDelay = 800 + Math.random() * 800;
        setTimeout(() => {
          lights.forEach(l => l && l.classList.remove('on'));
          if (this.soundManager) this.soundManager.playGantryLightBeep(true);

          confetti({
            particleCount: 130,
            spread: 90,
            origin: { y: 0.6 }
          });

          setTimeout(() => {
            this.hide();
            if (this.onStartRace) {
              this.onStartRace(this.selectedTeam, this.selectedDriver);
            }
          }, 350);
        }, randomDelay);
      }
    }, 650);
  }

  show() {
    this.screenElement.classList.remove('hidden');
    this.screenElement.classList.add('active');
    if (this.ambientWaves) this.ambientWaves.style.display = 'block';
    this.startBtn.disabled = false;
    this.startBtn.style.opacity = '1';
    this.setStage(1);
  }

  hide() {
    this.screenElement.classList.remove('active');
    this.screenElement.classList.add('hidden');
    if (this.ambientWaves) this.ambientWaves.style.display = 'none';
  }
}
