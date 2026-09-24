# React & TDD Guidelines for iGaming Prototype

To maintain a scalable and testable architecture as we integrate complex WebGL (PixiJS) functionality, this project strictly adheres to the following React guidelines:

## 1. Test-Driven Development (TDD) First
- **Test Before Implementation:** Write the test specifications in `src/**/__tests__/` before implementing or modifying any component or store logic.
- **Testing Tools:** We use `Jest` combined with `@testing-library/react` and `@testing-library/jest-dom`.
- **Focus on Behavior:** Tests must assert UI behavior (e.g., "button is disabled when state is SPINNING") and FSM transitions, not implementation details.

## 2. Separation of Concerns (Dumb Components)
- **UI is a Reflection of State:** React components should generally be "dumb." They receive state via props or selectors and dispatch events.
- **Component Modularity:** Break down monolithic pages (like `page.tsx`) into small, testable, and reusable blocks inside `src/components/`. 
- **Examples:**
  - `BalanceDisplay.tsx`: Only cares about rendering the user's balance.
  - `BetControls.tsx`: Only cares about rendering bet amounts and triggering increment/decrement callbacks.

## 3. Strict State Segregation
- **No Local State for Game Logic:** React `useState` should only be used for purely visual component states (like dropdown toggles or hydration checks).
- **Zustand is Authoritative:** All game-related data (Balance, Bet, GameState, Spin Results) must live in `src/store/gameStore.ts`.
- **Canvas Decoupling:** Never pass React state directly into the PixiJS render loop. Pass the Zustand store reference instead.

## 4. Directory Structure
```text
src/
├── app/                  # Next.js App Router definitions
├── components/           # Reusable, testable "Dumb" React components
│   ├── __tests__/        # Component test files (*.test.tsx)
│   └── *.tsx
├── store/                # Zustand FSM and state logic
│   ├── __tests__/        # Store test files (*.test.ts)
│   └── gameStore.ts
└── types/                # Shared TypeScript interfaces (Game, FSM, RGS)
```
