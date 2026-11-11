/**
 * Weather Atmosphere Dashboard for Home Assistant
 * Full-screen atmospheric weather engine (rain, snow, clouds, stars, lightning)
 * designed specifically for dashboard backgrounds and wall displays.
 * 
 * GitHub: https://github.com/brombomb/weather-atmosphere-dashboard
 * Author: brombomb
 * License: MIT
 */

const DENSITY_MAP = {
  low: 35,
  medium: 70,
  high: 140
};

class WeatherAtmosphereDashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._particles = [];
    this._splashes = [];
    this._animationFrame = null;
    this._lastState = null;
    this._lastLightning = 0;
    this._lightningAlpha = 0;
    this._resizeHandler = null;
    this._visibilityHandler = null;
  }

  static getStubConfig(hass) {
    const weatherEntity = hass 
      ? Object.keys(hass.states).find(e => e.startsWith('weather.')) || 'weather.forecast_home'
      : 'weather.forecast_home';
    return {
      entity: weatherEntity,
      density: 'medium',
      speed: 1.0,
      opacity: 0.75,
      lightning: true
    };
  }

  static async getConfigElement() {
    return document.createElement('weather-atmosphere-dashboard-editor');
  }

  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    this._config = {
      entity: config.entity || 'weather.forecast_home',
      sun_entity: config.sun_entity || 'sun.sun',
      density: config.density || 'medium',
      speed: typeof config.speed === 'number' ? config.speed : 1.0,
      opacity: typeof config.opacity === 'number' ? config.opacity : 0.75,
      lightning: config.lightning !== false,
      force_state: config.force_state || null
    };

    if (this._canvas) {
      this._resetParticles();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;

    let state = this._config.force_state;
    if (!state) {
      const weatherObj = hass.states[this._config.entity];
      state = weatherObj ? weatherObj.state : 'sunny';
    }

    if (state !== this._lastState) {
      this._lastState = state;
      this._resetParticles();
    }
  }

  connectedCallback() {
    this._setupCanvas();
    this._startAnimation();
  }

  disconnectedCallback() {
    this._stopAnimation();
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    if (this._visibilityHandler) document.removeEventListener('visibilitychange', this._visibilityHandler);
  }

  _setupCanvas() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
      </style>
      <canvas id="atmosphereCanvas"></canvas>
    `;

    this._canvas = this.shadowRoot.getElementById('atmosphereCanvas');
    this._ctx = this._canvas.getContext('2d');
    this._resize();

    this._resizeHandler = () => this._resize();
    window.addEventListener('resize', this._resizeHandler, { passive: true });

    this._visibilityHandler = () => {
      if (document.hidden) this._stopAnimation();
      else this._startAnimation();
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);
  }

  _resize() {
    if (!this._canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._width = window.innerWidth;
    this._height = window.innerHeight;
    this._canvas.width = this._width * dpr;
    this._canvas.height = this._height * dpr;
    this._ctx.scale(dpr, dpr);
    this._resetParticles();
  }

  _getParticleCount() {
    const density = this._config.density;
    if (typeof density === 'number') return density;
    return DENSITY_MAP[density] || DENSITY_MAP.medium;
  }

  _resetParticles() {
    if (!this._width || !this._height) return;
    this._particles = [];
    this._splashes = [];

    const state = this._lastState || 'sunny';
    const isNight = state.includes('night') || (
      this._hass && 
      this._hass.states[this._config.sun_entity] && 
      this._hass.states[this._config.sun_entity].state === 'below_horizon'
    );
    const count = this._getParticleCount();

    if (state.includes('rain') || state.includes('pouring')) {
      const dropCount = state.includes('pouring') ? Math.floor(count * 1.8) : count;
      for (let i = 0; i < dropCount; i++) {
        this._particles.push({
          x: Math.random() * (this._width + 100) - 50,
          y: Math.random() * this._height,
          len: 12 + Math.random() * 20,
          speed: (14 + Math.random() * 10) * this._config.speed,
          opacity: (0.25 + Math.random() * 0.45) * this._config.opacity,
          angle: 0.12
        });
      }
    } else if (state.includes('snow') || state.includes('hail')) {
      for (let i = 0; i < count; i++) {
        this._particles.push({
          x: Math.random() * this._width,
          y: Math.random() * this._height,
          radius: 1.5 + Math.random() * 3.5,
          speed: (1.2 + Math.random() * 2.2) * this._config.speed,
          drift: (Math.random() - 0.5) * 1.4,
          phase: Math.random() * Math.PI * 2,
          opacity: (0.35 + Math.random() * 0.55) * this._config.opacity
        });
      }
    } else if (state.includes('cloud') || state.includes('fog') || state.includes('wind')) {
      for (let i = 0; i < 8; i++) {
        this._particles.push({
          x: Math.random() * this._width,
          y: Math.random() * (this._height * 0.65),
          radius: 140 + Math.random() * 220,
          speed: (0.15 + Math.random() * 0.35) * this._config.speed,
          opacity: (0.04 + Math.random() * 0.08) * this._config.opacity
        });
      }
    } else if (isNight) {
      for (let i = 0; i < Math.floor(count * 0.85); i++) {
        this._particles.push({
          x: Math.random() * this._width,
          y: Math.random() * (this._height * 0.85),
          radius: 0.8 + Math.random() * 1.8,
          baseOpacity: (0.25 + Math.random() * 0.7) * this._config.opacity,
          twinkleSpeed: 0.01 + Math.random() * 0.03,
          phase: Math.random() * Math.PI * 2
        });
      }
    } else {
      // Sunny / Clear Day ambient dust and sunbeams
      for (let i = 0; i < Math.floor(count * 0.35); i++) {
        this._particles.push({
          x: Math.random() * this._width,
          y: Math.random() * this._height,
          radius: 1 + Math.random() * 2.2,
          speedY: -(0.25 + Math.random() * 0.45) * this._config.speed,
          speedX: (Math.random() - 0.5) * 0.3,
          opacity: (0.15 + Math.random() * 0.35) * this._config.opacity,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  _startAnimation() {
    if (this._animationFrame) return;
    const loop = () => {
      this._render();
      this._animationFrame = requestAnimationFrame(loop);
    };
    this._animationFrame = requestAnimationFrame(loop);
  }

  _stopAnimation() {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
  }

  _render() {
    const ctx = this._ctx;
    if (!ctx || !this._width || !this._height) return;

    ctx.clearRect(0, 0, this._width, this._height);
    const state = this._lastState || 'sunny';
    const isNight = state.includes('night') || (
      this._hass && 
      this._hass.states[this._config.sun_entity] && 
      this._hass.states[this._config.sun_entity].state === 'below_horizon'
    );

    // Lightning flash simulation
    if (this._config.lightning && state.includes('lightning')) {
      const now = Date.now();
      if (now - this._lastLightning > 5000 + Math.random() * 8000) {
        this._lastLightning = now;
        this._lightningAlpha = 0.38;
      }
      if (this._lightningAlpha > 0) {
        ctx.fillStyle = `rgba(215, 235, 255, ${this._lightningAlpha})`;
        ctx.fillRect(0, 0, this._width, this._height);
        this._lightningAlpha *= 0.84;
        if (this._lightningAlpha < 0.01) this._lightningAlpha = 0;
      }
    }

    // Render active weather mode
    if (state.includes('rain') || state.includes('pouring')) {
      ctx.lineWidth = state.includes('pouring') ? 1.8 : 1.3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(185, 220, 255, 0.48)';

      for (const p of this._particles) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.len * p.angle, p.y + p.len);
        ctx.stroke();

        p.x += p.len * p.angle * 0.45;
        p.y += p.speed;

        if (p.y > this._height) {
          if (Math.random() < 0.35 && this._splashes.length < 25) {
            this._splashes.push({
              x: p.x,
              y: this._height - 2,
              radius: 1,
              maxRadius: 4 + Math.random() * 6,
              alpha: 0.5
            });
          }
          p.y = -p.len;
          p.x = Math.random() * (this._width + 100) - 50;
        }
      }

      // Render rain splashes
      for (let i = this._splashes.length - 1; i >= 0; i--) {
        const s = this._splashes[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(185, 220, 255, ${s.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        s.radius += 0.8;
        s.alpha *= 0.88;
        if (s.alpha < 0.05 || s.radius >= s.maxRadius) {
          this._splashes.splice(i, 1);
        }
      }
    } else if (state.includes('snow') || state.includes('hail')) {
      for (const p of this._particles) {
        p.phase += 0.025;
        ctx.beginPath();
        ctx.arc(p.x + Math.sin(p.phase) * 14, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();

        p.y += p.speed;
        p.x += p.drift;

        if (p.y > this._height) {
          p.y = -6;
          p.x = Math.random() * this._width;
        }
      }
    } else if (state.includes('cloud') || state.includes('fog') || state.includes('wind')) {
      for (const p of this._particles) {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, `rgba(225, 235, 250, ${p.opacity})`);
        grad.addColorStop(1, 'rgba(225, 235, 250, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.speed;
        if (p.x - p.radius > this._width) {
          p.x = -p.radius;
          p.y = Math.random() * (this._height * 0.65);
        }
      }
    } else if (isNight) {
      for (const p of this._particles) {
        p.phase += p.twinkleSpeed;
        const currentOpacity = p.baseOpacity * (0.6 + 0.4 * Math.sin(p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 245, 255, ${currentOpacity})`;
        ctx.fill();
      }
    } else {
      // Sunny subtle warm motes
      for (const p of this._particles) {
        p.phase += 0.02;
        const op = p.opacity * (0.7 + 0.3 * Math.sin(p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 235, 185, ${op})`;
        ctx.fill();

        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < 0) {
          p.y = this._height;
          p.x = Math.random() * this._width;
        }
      }
    }
  }

  getCardSize() {
    return 0;
  }
}

/**
 * Visual Dashboard Editor Element
 */
class WeatherAtmosphereDashboardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  _render() {
    if (this._form) return;
    this.innerHTML = `
      <div style="padding: 12px 0;">
        <ha-form id="form"></ha-form>
      </div>
    `;

    this._form = this.querySelector('#form');
    this._form.hass = this._hass;
    this._form.data = this._config;
    this._form.schema = [
      { name: 'entity', selector: { entity: { domain: 'weather' } } },
      { name: 'sun_entity', selector: { entity: { domain: 'sun' } } },
      {
        name: 'density',
        selector: {
          select: {
            options: [
              { value: 'low', label: 'Low (Battery / Low-power tablets)' },
              { value: 'medium', label: 'Medium (Balanced - Recommended)' },
              { value: 'high', label: 'High (Dense cinematic)' }
            ]
          }
        }
      },
      { name: 'speed', selector: { number: { min: 0.2, max: 3.0, step: 0.1, mode: 'slider' } } },
      { name: 'opacity', selector: { number: { min: 0.1, max: 1.0, step: 0.05, mode: 'slider' } } },
      { name: 'lightning', selector: { boolean: {} } }
    ];

    this._form.addEventListener('value-changed', (ev) => {
      ev.stopPropagation();
      this._config = ev.detail.value;
      const event = new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(event);
    });
  }
}

customElements.define('weather-atmosphere-dashboard', WeatherAtmosphereDashboard);
customElements.define('weather-atmosphere-dashboard-editor', WeatherAtmosphereDashboardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'weather-atmosphere-dashboard',
  name: 'Weather Atmosphere Dashboard',
  description: 'Full-screen atmospheric weather engine (rain, snow, clouds, stars, lightning) for your dashboard background.',
  preview: true,
  documentationURL: 'https://github.com/brombomb/weather-atmosphere-dashboard'
});
