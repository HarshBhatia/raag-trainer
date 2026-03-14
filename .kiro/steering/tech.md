# Tech Stack

## Build System & Framework

- **Build Tool**: Vite 5.x
- **Framework**: React 18.2 with TypeScript 5.3
- **Module System**: ES Modules

## Core Dependencies

- React 18.2 (react, react-dom)
- TypeScript 5.3
- Vite React Plugin (@vitejs/plugin-react)

## Audio Implementation

- Web Audio API (native browser API, no external libraries)
- Custom AudioEngine class for sound synthesis
- Real-time audio generation with multiple instrument types
- Harmonium synthesis using additive synthesis with reed-like characteristics
- Tanpura drone synthesis using oscillators and modulation

## State Management

- React hooks (useState, useEffect, useMemo, useRef)
- LocalStorage for persistence (key: 'raag_trainer_prefs')
- No external state management libraries

## Common Commands

```bash
# Development server (runs on 0.0.0.0 for network access)
npm run dev

# Production build (TypeScript compilation + Vite build)
npm run build

# Preview production build
npm run preview
```

## Browser Requirements

- Modern browser with Web Audio API support
- AudioContext or webkitAudioContext required
- Touch-optimized for mobile devices
