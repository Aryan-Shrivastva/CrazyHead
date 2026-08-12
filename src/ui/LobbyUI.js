import confetti from 'canvas-confetti';
import { F1_TEAMS } from '../data/teams.js';

/**
 * Sequential 2-Page Lobby Controller:
 * Page 1: Pure Constructor/Team Selection
 * Page 2: Driver Selection / Career Confirm Settings
 */
export class LobbyUI {
  constructor(onStartRace, onTeamChange, onDriverChange, soundManager) {
    this.onStartRace = onStartRace;
    this.onTeamChange = onTeamChange;
    this.onDriverChange = onDriverChange;
    this.soundManager = soundManager;

    this.selectedTeam = F1_TEAMS[0]; // Default: Ferrari
    this.selectedDriver = this.selectedTeam.drivers[0]; // Default: Leclerc
    this.currentPage = 1; // 1 = Team Select, 2 = Driver Select

    // Page 1 Elements
    this.pageTeam = document.getElementById('page-team-select');
    this.ribbonEl = document.getElementById('team-carbon-ribbon');
    this.teamTitleEl = document.getElementById('lobby-team-title');
    this.perksListEl = document.getElementById('lobby-perks-list');
    this.confirmTeamBtn = document.getElementById('confirm-team-btn');
    this.ambientWaves = document.getElementById('showroom-ambient-waves');

    this.metaPrincipal = document.getElementById('meta-principal');
    this.metaChassis = document.getElementById('meta-chassis');
    this.metaBase = document.getElementById('meta-base');
    this.metaEngine = document.getElementById('meta-engine');

    // Page 2 Elements
    this.pageDriver = document.getElementById('page-driver-select');
    this.backToTeamBtn = document.getElementById('back-to-team-btn');
    this.startBtn = document.getElementById('start-race-btn');
    this.driverSwitchToggles = document.getElementById('driver-switch-toggles');
    this.leadDriverName = document.getElementById('lead-driver-name');
    this.leadDriverStats = document.getElementById('lead-driver-stats');
    this.leadDriverTeam = document.getElementById('lead-driver-team');

    this.init();
  }

  init() {
    this.renderTeamRibbon();
    this.updateTeamDetails();
    this.setupListeners();
    this.goToPage(1);
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
      this.onTeamChange(this.selectedTeam, this.selectedDriver, this.currentPage);
    }
  }

  goToPage(pageNum) {
    this.currentPage = pageNum;

    if (pageNum === 1) {
      // Show Team Select Page
      if (this.pageTeam) {
        this.pageTeam.classList.remove('hidden');
        this.pageTeam.classList.add('active');
      }
      if (this.pageDriver) {
        this.pageDriver.classList.remove('active');
        this.pageDriver.classList.add('hidden');
      }
    } else if (pageNum === 2) {
      // Show Driver Select Page
      if (this.pageTeam) {
        this.pageTeam.classList.remove('active');
        this.pageTeam.classList.add('hidden');
      }
      if (this.pageDriver) {
        this.pageDriver.classList.remove('hidden');
        this.pageDriver.classList.add('active');
      }
      this.renderDriverToggles();
    }

    if (this.onTeamChange) {
      this.onTeamChange(this.selectedTeam, this.selectedDriver, this.currentPage);
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
    // 1. Team Meta (Page 1)
    if (this.teamTitleEl) this.teamTitleEl.textContent = this.selectedTeam.name.toUpperCase();
    if (this.metaPrincipal) this.metaPrincipal.textContent = this.selectedTeam.teamPrincipal;
    if (this.metaChassis) this.metaChassis.textContent = this.selectedTeam.chassis;
    if (this.metaBase) this.metaBase.textContent = this.selectedTeam.base;
    if (this.metaEngine) this.metaEngine.textContent = this.selectedTeam.engineSupplier;

    // 2. Lead Driver Info (Page 2)
    if (this.leadDriverName) this.leadDriverName.textContent = this.selectedDriver.name;
    if (this.leadDriverStats) {
      this.leadDriverStats.textContent = `#${this.selectedDriver.number} • ${this.selectedDriver.flag} • ${this.selectedDriver.wins} WINS • ${this.selectedDriver.podiums} PODIUMS`;
    }
    if (this.leadDriverTeam) {
      this.leadDriverTeam.textContent = this.selectedTeam.name.toUpperCase();
    }

    // 3. Ambient Wave Color
    if (this.ambientWaves) {
      this.ambientWaves.style.setProperty('--ambient-wave-color', `${this.selectedTeam.color}44`);
    }

    // 4. Perks Table (Page 1)
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
    // Page 1 -> Page 2: Select Constructor button
    if (this.confirmTeamBtn) {
      this.confirmTeamBtn.addEventListener('click', () => {
        this.goToPage(2);
      });
    }

    // Page 2 -> Page 1: Back to Teams button
    if (this.backToTeamBtn) {
      this.backToTeamBtn.addEventListener('click', () => {
        this.goToPage(1);
      });
    }

    // Page 2 -> Race: Launch grid button
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
    this.goToPage(1);
    if (this.ambientWaves) this.ambientWaves.style.display = 'block';
    if (this.startBtn) {
      this.startBtn.disabled = false;
      this.startBtn.style.opacity = '1';
    }
  }

  hide() {
    if (this.pageTeam) {
      this.pageTeam.classList.remove('active');
      this.pageTeam.classList.add('hidden');
    }
    if (this.pageDriver) {
      this.pageDriver.classList.remove('active');
      this.pageDriver.classList.add('hidden');
    }
    if (this.ambientWaves) this.ambientWaves.style.display = 'none';
  }
}
