/**
 * Aryan's Paddock HUD Controller (Matching Exact Reference Image 2)
 * Features project pagination, interactive links (Web & GitHub), and return button.
 */
export class PaddockHUD {
  constructor(onReturnToCockpit) {
    this.onReturnToCockpit = onReturnToCockpit;
    this.container = document.getElementById('paddock-suite');
    this.returnBtn = document.getElementById('paddock-return-btn');
    this.prevBtn = document.getElementById('paddock-prev-btn');
    this.nextBtn = document.getElementById('paddock-next-btn');

    this.previewCategory = document.getElementById('preview-category');
    this.previewTitle = document.getElementById('preview-title');
    this.previewDesc = document.getElementById('preview-desc');
    this.previewTechs = document.getElementById('preview-techs');
    this.webLink = document.getElementById('project-web-link');
    this.githubLink = document.getElementById('project-github-link');

    this.currentProjectIndex = 0;
    this.projects = [
      {
        category: '3D WEBGL / RACING SIMULATION',
        title: 'F1 Monza Grand Prix Experience',
        desc: 'Full 3D Formula 1 portfolio experience featuring 20 cars on the Monza grid, real-time start gantry, and authentic engineering workstation.',
        techs: ['Three.js', 'WebGL', 'GSAP', 'Web Audio API'],
        web: 'https://github.com/Aryan-Shrivastva/CrazyHead',
        github: 'https://github.com/Aryan-Shrivastva/CrazyHead'
      },
      {
        category: 'FULL-STACK / TELEMETRY ENGINE',
        title: 'Real-Time WebSocket Telemetry Pipeline',
        desc: 'Ultra low-latency streaming pipeline handling multi-sensor telemetry data at 60Hz with distributed message queues and real-time dashboard.',
        techs: ['Node.js', 'WebSockets', 'Redis', 'React'],
        web: 'https://github.com/Aryan-Shrivastva',
        github: 'https://github.com/Aryan-Shrivastva'
      },
      {
        category: 'AI & COMPUTER VISION',
        title: 'Neural Vision & Lap Delta Classifier',
        desc: 'Deep learning computer vision pipeline for automated track telemetry analysis, apex tracking, and aerodynamic drag forecasting.',
        techs: ['Python', 'PyTorch', 'FastAPI', 'OpenCV'],
        web: 'https://github.com/Aryan-Shrivastva',
        github: 'https://github.com/Aryan-Shrivastva'
      },
      {
        category: 'SYSTEMS & CLOUD ARCHITECTURE',
        title: 'Container Scaling Orchestrator',
        desc: 'Automated container scaling orchestrator with zero-downtime rolling deploys, latency health probes, and cloud telemetry monitoring.',
        techs: ['Go', 'Docker', 'Kubernetes', 'Prometheus'],
        web: 'https://github.com/Aryan-Shrivastva',
        github: 'https://github.com/Aryan-Shrivastva'
      }
    ];

    this.init();
  }

  init() {
    if (this.returnBtn) {
      this.returnBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onReturnToCockpit) this.onReturnToCockpit();
      });
    }

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentProjectIndex = (this.currentProjectIndex - 1 + this.projects.length) % this.projects.length;
        this.renderCurrentProject();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentProjectIndex = (this.currentProjectIndex + 1) % this.projects.length;
        this.renderCurrentProject();
      });
    }

    this.renderCurrentProject();
  }

  renderCurrentProject() {
    const proj = this.projects[this.currentProjectIndex];
    if (!proj) return;

    if (this.previewCategory) this.previewCategory.textContent = proj.category;
    if (this.previewTitle) this.previewTitle.textContent = proj.title;
    if (this.previewDesc) this.previewDesc.textContent = proj.desc;
    
    if (this.previewTechs) {
      this.previewTechs.innerHTML = '';
      proj.techs.forEach(t => {
        const span = document.createElement('span');
        span.className = 'tech-pill';
        span.textContent = t;
        this.previewTechs.appendChild(span);
      });
    }

    if (this.webLink) this.webLink.href = proj.web;
    if (this.githubLink) this.githubLink.href = proj.github;
  }

  updateTeam(team) {
    // Dynamic team title if needed
  }

  show() {
    if (this.container) {
      this.container.classList.remove('hidden');
      this.container.classList.add('active');
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.remove('active');
      this.container.classList.add('hidden');
    }
  }
}
