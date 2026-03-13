# Project Structure

## Directory Organization

```
/
├── src/
│   ├── components/     # React UI components
│   ├── utils/          # Core logic and utilities
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   └── types.ts        # TypeScript type definitions
├── .kiro/
│   └── steering/       # AI assistant guidance documents
├── index.html          # HTML entry point
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite build configuration
```

## Component Architecture

### Main Components (`src/components/`)

- **RaagSelector**: Thaat/raag selection interface
- **PaltaDisplay**: Pattern list and visualization
- **Controls**: Tempo, repetitions, sound settings, tanpura controls
- **PracticeMode**: Full-screen practice interface
- **TaanDisplay**: Individual pattern note display

### Utilities (`src/utils/`)

- **audioEngine.ts**: Web Audio API wrapper, sound synthesis, tanpura generation
- **taanGenerator.ts**: Pattern generation logic, raag definitions, frequency calculations

## Type System (`src/types.ts`)

Core types define the domain model:
- `Swara`: Indian classical music note notation
- `Raag`: Scale definition with aroha (ascent) and avaroha (descent)
- `TaanNote`: Individual note with frequency and octave
- `Palta`: Complete pattern with notes, category, and metadata
- `NoteName`: Western note names (C, C#, D, etc.)
- `SoundType`: Instrument types (harmonium, flute, piano, synth)
- `Notation`: Display format (english, hindi, numbers)

## Styling Approach

- Inline styles with CSS-in-JS
- Responsive design using CSS media queries
- CSS custom properties for theming (--sidebar-width, --spacing-app)
- Mobile-first responsive breakpoint at 1024px

## State Persistence

All user preferences persist to localStorage under key 'raag_trainer_prefs', including:
- Selected thaat, tempo, repetitions, loop mode
- Sa note, notation system, sound type
- Tanpura settings, custom patterns
- Current pattern selection and category filter
