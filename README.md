# 🧠 NeuroPlay NER

**An Offline-First Cognitive Engagement and Memory Assistance Platform**

NeuroPlay NER is an accessibility-focused application designed to support cognitive engagement through interactive games, personalized experiences, reminders, and family-assisted memory activities.

The project prioritizes offline access, privacy, accessibility, and configurable experiences for different user needs.

> ⚠️ **Important:** NeuroPlay NER is a non-diagnostic support tool. It is not intended to diagnose, treat, or prevent any medical condition. It does not replace professional medical advice or care. Clinical profiles and adaptive metrics must not be interpreted as medical assessments.

---

## ✨ Key Features

### 🎮 Cognitive Games
- Interactive memory-matching activities.
- A foundation for additional cognitive games.
- Configurable game difficulty and session metrics.

### 🌐 Offline-First Experience
- Progressive Web App (PWA) foundation.
- Local data storage using IndexedDB.
- Designed to support essential functionality without an internet connection.

### 🗣️ Accessibility and Localization
- English and Hindi interfaces, with Assamese localization support.
- Audio prompts and browser speech support where available.
- Responsive interface and accessibility-focused components.

### 🧩 Personalized Profiles
- Configurable profiles for different user needs.
- Profile-specific accessibility settings and game recommendations.
- Profiles are informational configurations, not clinical assessments.

### 📈 Adaptive Difficulty
- A foundation for adjusting game difficulty using interaction metrics.
- Designed to consider accuracy, response time, and hints.
- Adaptive results must not be interpreted as diagnoses or proof of cognitive decline.

### 👨‍👩‍👧 Family and Caregiver Support
- Planned support for family-assisted memory activities.
- Reminder management and caregiver-oriented activity history.

**Note:** Features described as planned or under development may not yet be fully implemented. See the current code and project documentation for implementation status.

---

## 🛠️ Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- IndexedDB / Dexie
- Vitest
- Playwright

### Backend
- Python
- FastAPI
- SQLite

### Development
- Git and GitHub
- Node.js and npm

The exact dependencies and available commands are defined in the project configuration files.

---

## 📁 Project Structure

```text
neuroplay-ner/
├── api/                    # FastAPI backend
├── app/                    # React frontend
│   ├── public/              # Static assets and icons
│   ├── src/                 # Application source code
│   └── tests/               # Frontend tests
├── docs/                   # Architecture decisions and documentation
├── packages/
│   └── game-sdk/            # Shared game SDK
├── profiles/                # User profile configurations
├── .gitignore
└── README.md
