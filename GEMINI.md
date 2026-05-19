# Master Portal Agent Instructions

## Overview
Master Portal is the central landing page and orchestration hub for the digital ecosystem. It integrates Three.js visuals, GSAP animations, and Preact Signals for a highly reactive and immersive experience.

## Core Components
- `src/main.js`: The central application orchestrator, managing state (via signals) and the render loop.
- `src/gfx`: Specialized visual components (Singularity, Particles, SiphonShip).
- `src/audio`: Procedural audio management via `AudioManager`.
- `@preact/signals-core`: Used for reactive UI updates (e.g., switching views).

## Coding Standards
- **Reactivity**: Use signals for global state that needs to be shared across UI and GFX layers.
- **Orchestration**: The `App.orchestrate()` method is the hot path for linking user input (mouse movement) to visual and audio intensity.
- **GSAP Animations**: Use GSAP for all DOM-based transitions and micro-interactions. Ensure timelines are cleaned up if components are unmounted.

## Visual Feedback Loop
- Cursor speed is calculated and linked to the `Singularity` shader intensity and `AudioManager` filter cutoff.
- View transitions are handled reactively via the `currentView` signal and `effect()`.

## Future Improvements
- [ ] Add more "Deep Dive" views for each sub-agent (Aura, Atlas, etc.).
- [ ] Implement a full state machine to handle complex transition sequences between views.
- [ ] Add unit tests for the signal-based UI logic.
- [ ] Migrate `src/gfx` components to use a more unified base class for scene registration and disposal.
