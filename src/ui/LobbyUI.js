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

    this.selectedTeam = F1_TEAMS[0]; // Ferrari default
    this.selectedDriver = this.selectedTeam.drivers[0]; // Leclerc default
    this.currentPage = 1;

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

      const onSelect = (e) => {
        if (e) e.stopPropagation();
        this.selectTeam(team);
      };

      tile.addEventListener('click', onSelect);
      tile.addEventListener('pointerdown', onSelect);

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
      if (this.pageTeam) {
        this.pageTeam.classList.remove('hidden');
        this.pageTeam.classList.add('active');
      }
      if (this.pageDriver) {
        this.pageDriver.classList.remove('active');
        this.pageDriver.classList.add('hidden');
      }
    } else if (pageNum === 2) {
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

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectDriver(driver);
      });

      this.driverSwitchToggles.appendChild(btn);
    });
  }

  updateTeamDetails() {
    if (this.teamTitleEl) this.teamTitleEl.textContent = this.selectedTeam.name.toUpperCase();
    if (this.metaPrincipal) this.metaPrincipal.textContent = this.selectedTeam.teamPrincipal;
    if (this.metaChassis) this.metaChassis.textContent = this.selectedTeam.chassis;
    if (this.metaBase) this.metaBase.textContent = this.selectedTeam.base;
    if (this.metaEngine) this.metaEngine.textContent = this.selectedTeam.engineSupplier;

    if (this.leadDriverName) this.leadDriverName.textContent = this.selectedDriver.name;
    if (this.leadDriverStats) {
      this.leadDriverStats.textContent = `#${this.selectedDriver.number} • ${this.selectedDriver.flag} • ${this.selectedDriver.wins} WINS • ${this.selectedDriver.podiums} PODIUMS`;
    }
    if (this.leadDriverTeam) {
      this.leadDriverTeam.textContent = this.selectedTeam.name.toUpperCase();
    }

    if (this.ambientWaves) {
      this.ambientWaves.style.setProperty('--ambient-wave-color', `${this.selectedTeam.color}55`);
    }

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
    if (this.confirmTeamBtn) {
      this.confirmTeamBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goToPage(2);
      });
    }

    if (this.backToTeamBtn) {
      this.backToTeamBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goToPage(1);
      });
    }

    if (this.startBtn) {
      this.startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide();
        if (this.onStartRace) {
          this.onStartRace(this.selectedTeam, this.selectedDriver);
        }
      });
    }
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
