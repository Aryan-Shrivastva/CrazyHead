/**
 * Paddock Suite & Dual-Monitor Workstation UI Controller
 */
export class PaddockHUD {
  constructor(onReturnToTrack) {
    this.onReturnToTrack = onReturnToTrack;
    this.screenElement = document.getElementById('paddock-suite');
    this.returnBtn = document.getElementById('paddock-return-btn');
    this.teamBadgeEl = document.getElementById('paddock-team-badge');
    this.teamTitleEl = document.getElementById('paddock-team-title');

    this.tabButtons = document.querySelectorAll('.os-tab');
    this.tabPanes = document.querySelectorAll('.os-tab-pane');

    this.init();
  }

  init() {
    // Tab Switching
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTabId = btn.getAttribute('data-tab');
        this.switchTab(targetTabId, btn);
      });
    });

    // Return to track
    if (this.returnBtn) {
      this.returnBtn.addEventListener('click', () => {
        if (this.onReturnToTrack) this.onReturnToTrack();
      });
    }
  }

  updateTeam(team) {
    if (this.teamBadgeEl) this.teamBadgeEl.textContent = team.badge;
    if (this.teamTitleEl) this.teamTitleEl.textContent = `${team.name.toUpperCase()} • ENGINEERING SUITE`;
  }

  switchTab(tabId, activeBtn) {
    this.tabButtons.forEach(b => b.classList.remove('active'));
    this.tabPanes.forEach(p => p.classList.remove('active'));

    activeBtn.classList.add('active');
    const targetPane = document.getElementById(tabId);
    if (targetPane) {
      targetPane.classList.add('active');
    }
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
