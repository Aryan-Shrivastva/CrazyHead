import confetti from 'canvas-confetti';
import { F1_TEAMS } from '../data/teams.js';

/**
 * Lobby UI Controller: Team & Driver Selection with 5 Red Lights Sequence
 */
export class LobbyUI {
  constructor(onStartRace, onTeamChange, soundManager) {
    this.onStartRace = onStartRace;
    this.onTeamChange = onTeamChange;
    this.soundManager = soundManager;

    this.selectedTeam = F1_TEAMS[0]; // Default: Ferrari
    this.selectedDriver = this.selectedTeam.drivers[0]; // Default: Charles Leclerc

    this.screenElement = document.getElementById('lobby-screen');
    this.teamListEl = document.getElementById('team-list');
    this.driverListEl = document.getElementById('driver-list');
    this.startBtn = document.getElementById('start-race-btn');
    this.lightsGantry = document.getElementById('f1-lights-gantry');

    this.specTeamBadge = document.getElementById('spec-team-badge');
    this.specTeamName = document.getElementById('spec-team-name');
    this.specEngine = document.getElementById('spec-engine');
    this.specPower = document.getElementById('spec-power');
    this.showroomGlow = document.getElementById('showroom-glow');

    this.init();
  }

  init() {
    this.renderTeams();
    this.renderDrivers();
    this.updateSpecBanner();
    this.setupListeners();
  }

  renderTeams() {
    this.teamListEl.innerHTML = '';
    F1_TEAMS.forEach(team => {
      const card = document.createElement('div');
      card.className = `team-card-item ${team.id === this.selectedTeam.id ? 'selected' : ''}`;
      card.style.setProperty('--team-color', team.color);
      card.style.setProperty('--team-glow', `${team.color}44`);

      card.innerHTML = `
        <span class="team-item-badge">${team.badge}</span>
        <div class="team-item-info">
          <span class="team-item-name">${team.shortName}</span>
          <span class="team-item-country">${team.country}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectTeam(team);
      });

      this.teamListEl.appendChild(card);
    });
  }

  selectTeam(team) {
    this.selectedTeam = team;
    this.selectedDriver = team.drivers[0];
    this.renderTeams();
    this.renderDrivers();
    this.updateSpecBanner();

    if (this.onTeamChange) {
      this.onTeamChange(this.selectedTeam);
    }
  }

  renderDrivers() {
    this.driverListEl.innerHTML = '';
    this.selectedTeam.drivers.forEach(driver => {
      const card = document.createElement('div');
      card.className = `driver-card-item ${driver.id === this.selectedDriver.id ? 'selected' : ''}`;

      card.innerHTML = `
        <div class="driver-info-main">
          <span class="driver-flag">${driver.flag}</span>
          <div>
            <div class="driver-name">${driver.name}</div>
            <div class="driver-stats-meta">${driver.wins} Wins • ${driver.podiums} Podiums</div>
          </div>
        </div>
        <div class="driver-number">${driver.number}</div>
      `;

      card.addEventListener('click', () => {
        this.selectedDriver = driver;
        this.renderDrivers();
      });

      this.driverListEl.appendChild(card);
    });
  }

  updateSpecBanner() {
    this.specTeamBadge.textContent = this.selectedTeam.badge;
    this.specTeamName.textContent = this.selectedTeam.name.toUpperCase();
    this.specEngine.textContent = this.selectedTeam.engine;
    this.specPower.textContent = this.selectedTeam.power;

    if (this.showroomGlow) {
      this.showroomGlow.style.background = `radial-gradient(circle, ${this.selectedTeam.color}33 0%, transparent 70%)`;
    }
  }

  setupListeners() {
    this.startBtn.addEventListener('click', () => {
      this.triggerLightsOutSequence();
    });
  }

  triggerLightsOutSequence() {
    this.startBtn.disabled = true;
    this.startBtn.style.opacity = '0.5';

    // 5 Red Lights Sequence Countdown
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
        // Random pause between 0.8s and 2.0s for authentic F1 start
        const randomDelay = 800 + Math.random() * 800;
        setTimeout(() => {
          // LIGHTS OUT!
          lights.forEach(l => l && l.classList.remove('on'));
          if (this.soundManager) this.soundManager.playGantryLightBeep(true);

          // Confetti celebration
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 }
          });

          // Transition to Race
          setTimeout(() => {
            this.hide();
            if (this.onStartRace) {
              this.onStartRace(this.selectedTeam, this.selectedDriver);
            }
          }, 300);
        }, randomDelay);
      }
    }, 700);
  }

  show() {
    this.screenElement.classList.remove('hidden');
    this.screenElement.classList.add('active');
    this.startBtn.disabled = false;
    this.startBtn.style.opacity = '1';
  }

  hide() {
    this.screenElement.classList.remove('active');
    this.screenElement.classList.add('hidden');
  }
}
