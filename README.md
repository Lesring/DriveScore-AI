# DriveScore AI

> Next-generation AI-powered in-car music experience that creates personalized soundscapes based on your driving behavior and route conditions.

---

## 🚀 Features

### AI-Driven Music Generation
- **Journey Blueprint**: AI analyzes your route, weather, and driving style to create a personalized journey blueprint
- **Dynamic Music Segments**: 5 music segments (Calm, Build, Cruise, Peak, Ending) that adapt to your driving
- **Real-time Prediction**: AI predicts upcoming road conditions and selects optimal music

### Road Simulator
- **Dynamic Route Events**: Trigger rain, night, traffic, construction, accident, mountain, and highway events
- **AI Rerouting**: Real-time AI re-planning when conditions change
- **Continuous Animation**: Smooth transitions without page refresh

### Presentation Mode
- **Auto Demo**: 2-minute automated presentation of all features
- **Step Navigation**: Manual control with pause, resume, and skip
- **Highlight Focus**: Automatic emphasis on key features

### Audio Engine
- **Web Audio API**: Real-time synthesized music
- **Crossfade Transitions**: Smooth music switching
- **Energy-Adaptive**: Volume and tempo dynamically adjust based on driving intensity

---

## 🛠️ Tech Stack

- **Framework**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide Vue Next
- **AI**: Xenova Transformers (Local LLM)
- **Audio**: Web Audio API

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Lesring/DriveScore-AI.git
cd DriveScore-AI

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🗂️ Project Structure

```
src/
├── ai/                    # AI Service Layer
│   ├── aiService.ts       # Unified AI service with retry logic
│   └── prompts.ts         # Prompt templates for LLM
├── api/                   # API Interfaces
│   └── index.ts           # Route analysis, music generation, prediction
├── audio/                 # Audio Engine
│   └── AudioManager.ts    # Audio playback with crossfade
├── composables/           # Vue Composables
│   ├── useDrivingSimulation.ts  # Driving simulation logic
│   ├── useRoadSimulator.ts      # Road event simulation
│   ├── usePresentationMode.ts   # Auto demo mode
│   └── useDemoMode.ts           # Demo utilities
├── components/            # UI Components
│   ├── RoadSimulator.vue        # Road event panel
│   ├── PresentationPanel.vue    # Presentation controls
│   ├── PredictionPanel.vue      # AI prediction display
│   └── ...
├── views/                 # Pages
│   ├── Home.vue              # Landing page
│   ├── JourneyBrain.vue      # AI route analysis
│   ├── JourneyPlanner.vue    # Music planning
│   ├── DrivingSimulation.vue # Driving simulation
│   ├── Roadmap.vue           # Future roadmap
│   └── ...
├── router/                # Vue Router
├── types/                 # TypeScript types
└── mock/                  # Mock data (fallback)
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze-route` | POST | Analyze route and generate Journey Blueprint |
| `/api/generate-music` | POST | Generate music segments based on blueprint |
| `/api/predict` | POST | Predict next music based on driving state |

---

## 🎮 Usage

### Presentation Mode
1. Click "Presentation Mode" on the homepage
2. Watch the automatic 2-minute demo
3. Use the bottom control panel to pause/resume/skip

### Road Simulator (Driving Page)
1. Click "Start Driving"
2. Use the Road Simulator panel to trigger events
3. Watch AI re-plan in real-time

---

## 📋 Roadmap

| Year | Milestone |
|------|-----------|
| 2026 | Phone App (iOS/Android) |
| 2027 | CarPlay Integration |
| 2028 | Android Auto Integration |
| 2029 | Smart Cockpit Integration |
| 2030 | Vehicle OS Integration |
| 2035 | Autonomous Driving Support |

---

## 📝 License

MIT License

---

## 🙋‍♂️ Author

Lesring - [GitHub](https://github.com/Lesring)
