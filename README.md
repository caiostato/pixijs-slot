# iGaming Slot Machine Prototype 🎰

A high-performance, test-driven 2D slot machine prototype built to demonstrate modern iGaming frontend architecture. This project strictly adheres to the "Dumb Client" model, utilizing a robust Finite State Machine (FSM) to orchestrate a simulated client-server relationship.

## 🚀 Tech Stack

*   **UI & Network:** React 18, Next.js (App Router), TypeScript
*   **Styling:** Tailwind CSS (HUD, Bet Controls, Overlays)
*   **State Management:** Zustand (Strict FSM Enforcer)
*   **Game Engine:** PixiJS (WebGL Canvas rendering)
*   **Audio Engine:** Howler.js (Cross-browser Web Audio API)
*   **Testing:** Jest & React Testing Library (TDD Approach)

---

## 🏗️ Core Architecture: The "Dumb Client"

This project is built around the fundamental rule of real-money iGaming: **The frontend never decides the outcome.**

1.  **FSM First:** `Zustand` dictates the exact state (`IDLE`, `SPINNING`, `RESULT_RECEIVED`, `PAYOUT_ANIMATION`).
2.  **React UI:** Renders the Heads-Up Display (HUD) and captures user input.
3.  **PixiJS Engine:** Subscribes to the FSM silently. It only handles WebGL 60FPS animations and visual reconciliation. It does *not* trigger React re-renders.
4.  **Mock RGS:** A simulated Remote Gaming Server (`mockRGS.ts`) calculates RNG, evaluates paylines, and injects network latency before returning payloads.

---

## 🤖 The Multi-Agent Workflow

This codebase was scaffolded using a highly compartmentalized Multi-Agent AI protocol defined in `AGENTS.md`. 
*   **Agent 1 (App & State):** Built the React HUD, Zustand FSM, and Jest test suites.
*   **Agent 2 (Engine):** Manages the PixiJS `Ticker`, Reel scrolling, and visual FX.
*   **Agent 3 (Mock Server):** Handles probability math, grid generation, and network simulation.
*   **Agent 4 (Audio):** Manages the Howler.js context and FSM sound triggers.

---

## 🛠️ Getting Started

### Installation
Ensure you have Node.js installed, then install the dependencies:
```bash
npm install
```

### Development Server
Start the Next.js local server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the interactive prototype.

### Testing (TDD)
This project is strictly Test-Driven. To run the full suite of FSM and Component tests:
```bash
npm test
```

---

## 📂 Folder Structure

```text
src/
├── app/                  # Next.js App Router (Layouts & Pages)
├── audio/                # Howler.js AudioManager
├── components/           # Dumb React HUD Components (Balance, Bets, etc.)
├── engine/               # PixiJS WebGL Logic (GameEngine, ReelManager)
├── server/               # Mock Remote Gaming Server (Math & Latency)
├── store/                # Zustand FSM (gameStore)
└── types/                # Shared TypeScript contracts (Game, SpinPayload)
```
