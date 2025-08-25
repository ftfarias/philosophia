# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Philosophia" is a web-based philosophical RPG game where players exist as geometric forms in "The Beyond" - a virtual reality representing abstract philosophical concepts. The game has evolved from initial design documentation into a playable browser-based implementation.

## Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **3D Graphics**: Three.js (CDN: r128) for geometric form visualization
- **Architecture**: Single-page application with modular class-based structure
- **No build system**: Direct file serving, no compilation or bundling required

## Running the Game

- Open `index.html` in a web browser
- No local server required for basic functionality
- For Three.js to work properly with local files, use a local server:
  - Python: `python -m http.server 8000`
  - Node.js: `npx http-server`
  - Live Server extension in VS Code

## Code Architecture

### Core Game Engine (`game.js`)
The main `PhilosophiaGame` class handles:
- **Player state management**: Form, attributes (Knowledge/Reality/Willpower), symbol system
- **Location system**: Text-based rooms with descriptions and exits
- **Symbol mechanics**: Face-based equipment system where geometric forms hold symbols
- **Iteration system**: Progression from simple to complex Platonic forms
- **Command processing**: Text input parsing and execution
- **3D integration**: Interfaces with separate 3D renderer for form visualization

### 3D Renderer (`renderer3d.js`)
The separate `Philosophia3DRenderer` class handles:
- **Three.js scene management**: Camera, lighting, and rendering loop
- **Geometric form creation**: All Platonic solid geometries with proper positioning
- **Symbol visualization**: Canvas-based textures overlaid on form faces
- **Interactive controls**: Mouse rotation and face click detection with raycasting
- **Visual symbol representation**: Each symbol (⚡,∴,⌛,♡,◉,🛡,✨) with unique colors and positioning

### Symbol System
Central game mechanic where:
- Each geometric form has faces (Tetrahedron=4, Cube=6, etc.)
- Each face can hold one symbol providing abilities/powers
- Players start with only "Interaction" symbol (allows movement and perception)
- Symbols gain experience through use and can level up
- Symbol inventory system for unequipped symbols

### Form Progression
- Players start as Tetrahedron (simplest form)
- Progress through: Cube → Octahedron → Icosahedron → Dodecahedron
- Iteration requires Knowledge points and Willpower cost
- Higher forms have more faces for symbols

## Game Mechanics Implementation

### Movement System
- Requires "Interaction" symbol to move (updated from original Navigate + Interaction)
- Cardinal directions (north/south/east/west) with aliases (n/s/e/w)
- Location-based with predefined exit mappings

### Combat System
- Planned but not fully implemented
- Framework exists for Thesis/Antithesis/Synthesis philosophical arguments
- Placeholder methods in `philosophicalAction()`

### UI Components
- **Left Panel**: Player stats, interactive 3D form display, equipped symbols
- **Center Panel**: Location description, game output, command input
- **Right Panel**: Action buttons, movement controls, philosophical mode buttons
- **3D Interaction**: Click and drag to rotate forms, click faces to activate symbols
- Responsive design with mobile considerations

## Key Files

- `index.html`: Main game interface structure (includes both renderer3d.js and game.js)
- `game.js`: Core game engine and logic (clean, separated from 3D code)
- `renderer3d.js`: Dedicated 3D rendering class with Three.js integration
- `style.css`: Complete styling with dark philosophical theme (includes 3D container styling)
- `lore.txt`: Design documentation and philosophical background (updated with single Interaction symbol)

## Development Notes

- **Modular Architecture**: Clean separation between game logic and 3D rendering
- **Code Organization**: ES6+ class-based structure with separated concerns
- **3D Implementation**: Three.js geometries match mathematical Platonic solid definitions
- **Symbol Visualization**: Canvas-generated textures for each symbol type
- **Interactive 3D**: Mouse controls, face clicking with precise raycasting
- **Visual Design**: Dark theme with gold accents (philosophical aesthetic)
- **Dependencies**: Only Three.js CDN, no build system required
- **State Management**: Game state in memory, no persistence implemented
- **Event Architecture**: UI interactions and 3D callbacks properly integrated

## Extending the Game

When adding features:
- **New symbols**: Add to `availableSymbols` in game.js and create texture in renderer3d.js
- **New locations**: Add to `locations` object with name, description, and exits
- **New commands**: Register in `commands` object with bound methods
- **New forms**: Add Three.js geometries in renderer3d.js with proper face positioning
- **UI updates**: Update both game.js UI methods and corresponding CSS styling
- **3D features**: Extend renderer3d.js for new visual elements, call `update3DForm()` for changes

## Important Development Guidelines

- **Philosophical Authenticity**: New features should align with philosophical concepts
- **Geometric Progression**: Player progression follows Platonic geometry hierarchy - do not deviate
- **Symbol-Centric Design**: All new abilities should be symbol-based
- **Dual Interface**: Maintain text commands alongside 3D interactions
- **Mathematical Accuracy**: Three.js form representation should match geometric definitions
- **Code Separation**: Keep game logic in game.js, 3D code in renderer3d.js
- **3D Integration**: Use `this.update3DForm()` when symbols/forms change
- **Visual Consistency**: Maintain dark academic aesthetic with gold accents
- **Case Sensitivity**: Symbol names use proper case-insensitive matching