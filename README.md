# Weather Atmosphere Dashboard 🌧️⚡❄️☀️

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/default)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/brombomb/weather-atmosphere-dashboard/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, full-screen atmospheric weather engine for **Home Assistant** dashboards and dedicated wall kiosks (Portal, iPad, Fire Tablet, Fully Kiosk, WallPanel).

Instead of heavy looping `.mp4` video backgrounds (which consume high memory and buffer) or GPU-intensive WebGL shaders (which cause wall tablets to overheat), **Weather Atmosphere Dashboard** uses an optimized HTML5 2D canvas with `requestAnimationFrame` to render realistic ambient weather behind your entire dashboard at silky-smooth 60 FPS while consuming **< 1% CPU**.

---

## Features

* 🌧️ **Dynamic Live Weather**: Reacts in real-time to your Home Assistant `weather.*` entity state:
  * **Rain & Pouring**: Realistic falling raindrops with natural wind angle and subtle floor splashes.
  * **Thunderstorms**: Rainfall paired with natural ambient lightning flash pulses.
  * **Snow & Sleet**: Soft, drifting snowflakes with realistic wind sway.
  * **Cloudy, Fog & Mist**: Ethereal volumetric cloud layers drifting smoothly across the background.
  * **Clear Night**: Twinkling starlight field matching sun horizon elevation.
  * **Sunny & Clear Day**: Gentle warm ambient floating sunbeam motes.
* 🛡️ **Zero Touch Interference**: Operates strictly in the background (`pointer-events: none; z-index: 0`). You can tap buttons, scroll calendars, and open pop-ups through it seamlessly.
* 🪟 **Deep Glassmorphism**: Drifts naturally behind translucent frosted-glass cards (`backdrop-filter: blur()`).
* 🔋 **Kiosk & Hardware Friendly**: Automatically halts animation when the screen or browser tab is asleep (`document.hidden`), drawing 0% CPU when not in view.
* 🎨 **Visual UI Editor**: Fully configurable via the Home Assistant visual dashboard editor with live previews.

---


## Screenshots

Raining
<img width="1224" height="490" alt="image" src="https://github.com/user-attachments/assets/808a6f41-5d57-46d0-8040-58e0706617d3" />

Pouring
<img width="1224" height="490" alt="image" src="https://github.com/user-attachments/assets/346fd764-4f3b-4c63-886f-21eaced7d5cd" />

Snow
<img width="1224" height="490" alt="image" src="https://github.com/user-attachments/assets/91868b13-5915-4eb4-a7b1-8574075f568e" />

Stars
<img width="1224" height="490" alt="image" src="https://github.com/user-attachments/assets/0da603f0-d019-45dc-8997-3f338038858d" />

Sun
<img width="1224" height="490" alt="image" src="https://github.com/user-attachments/assets/fd94aed5-cc71-4ec7-9ee1-45d33c1014c0" />


---


## Installation

### Method 1: HACS (Recommended)

1. Open **HACS** in your Home Assistant instance.
2. Click the three dots in the top right corner and select **Custom repositories**.
3. Add the repository URL: `https://github.com/brombomb/weather-atmosphere-dashboard` with category **Dashboard** (or **Lovelace**).
4. Search for **Weather Atmosphere Dashboard** and click **Download**.
5. Reload your browser or dashboard.

### Method 2: Manual Installation

1. Download `weather-atmosphere-dashboard.js` from the [latest release](https://github.com/brombomb/weather-atmosphere-dashboard/releases).
2. Copy the file into your Home Assistant `/config/www/` folder.
3. In Home Assistant, go to **Settings > Dashboards > Three dots (top right) > Resources**.
4. Add a new resource:
   * **URL**: `/local/weather-atmosphere-dashboard.js`
   * **Type**: JavaScript Module

---

## Configuration

Add the element to your dashboard view. It takes **0 grid slots** and covers the entire background of the screen:

```yaml
type: custom:weather-atmosphere-dashboard
entity: weather.forecast_home
density: medium
speed: 1.0
opacity: 0.75
lightning: true
```

### Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `entity` | `string` | First `weather.*` | Entity ID of your weather integration (e.g. `weather.forecast_home`, `weather.home`). |
| `sun_entity` | `string` | `sun.sun` | Entity ID for detecting day/night cycles for clear conditions. |
| `density` | `string` / `number` | `medium` | Particle density: `low` (35), `medium` (70), `high` (140), or custom number. |
| `speed` | `number` | `1.0` | Particle speed multiplier (`0.2` to `3.0`). |
| `opacity` | `number` | `0.75` | Global particle opacity multiplier (`0.1` to `1.0`). |
| `lightning` | `boolean` | `true` | Enable or disable subtle atmospheric ambient flashes during thunderstorms. |
| `force_state` | `string` | `null` | *(Optional)* Force a specific weather state for testing (e.g., `rainy`, `snowy`, `lightning-rainy`, `cloudy`). |

---

## Glassmorphism Styling Tip

For the best look on a wall tablet, pair with dark frosted-glass cards by adding `card_mod` to your cards:

```yaml
card_mod:
  style: |
    ha-card {
      background: rgba(0, 0, 0, 0.3) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      border-radius: 18px !important;
      backdrop-filter: blur(14px);
    }
```

The weather particles will drift seamlessly behind and between your cards, giving your dashboard extraordinary visual depth.

---

## License

MIT © [brombomb](https://github.com/brombomb)
