// Philosophia Game Engine
class PhilosophiaGame {
    constructor() {
        this.player = {
            form: 'Tetrahedron',
            knowledge: 100,
            reality: 10,
            maxReality: 10,
            willpower: 5,
            maxWillpower: 5,
            symbols: [
                { name: 'Interaction', level: 1, experience: 0, face: 1, description: 'Allows movement and interaction with reality' },
                null, // Face 2 empty
                null, // Face 3 empty
                null  // Face 4 empty
            ],
            location: 'void',
            x: 0,
            y: 0
        };

        this.locations = {
            void: {
                name: 'The Void',
                description: 'You find yourself in the endless expanse of The Beyond. Abstract geometries float in the distance, and whispers of ancient philosophical debates echo through the void.',
                exits: { north: 'construct1', east: 'maze1' }
            },
            construct1: {
                name: 'Construct of Logic',
                description: 'A gleaming structure built from pure logical principles. Syllogisms form the architecture, and the air hums with rational discourse.',
                exits: { south: 'void', east: 'library' }
            },
            maze1: {
                name: 'Labyrinth of Paradoxes',
                description: 'Twisted corridors that seem to fold in on themselves. Each turn presents a new logical contradiction that must be resolved.',
                exits: { west: 'void' }
            },
            library: {
                name: 'The Great Library',
                description: 'Infinite shelves containing the wisdom of ages. Books float freely, their pages turning themselves as if alive.',
                exits: { west: 'construct1' }
            }
        };

        this.platonicForms = [
            { name: 'Tetrahedron', faces: 4, knowledge: 1, description: 'The Fire element - simplest of forms' },
            { name: 'Cube', faces: 6, knowledge: 3, description: 'The Earth element - foundation of stability' },
            { name: 'Octahedron', faces: 8, knowledge: 6, description: 'The Air element - balance and duality' },
            { name: 'Icosahedron', faces: 20, knowledge: 10, description: 'The Water element - flowing complexity' },
            { name: 'Dodecahedron', faces: 12, knowledge: 15, description: 'The Universe element - cosmic perfection' }
        ];

        // Available symbols in the game
        this.availableSymbols = {
            'Interaction': { description: 'Allows movement and interaction with reality', basepower: 'movement_perception' },
            'Logic': { description: 'Enhances reasoning and argument construction', basepower: 'reasoning' },
            'Memory': { description: 'Stores and recalls information', basepower: 'recall' },
            'Empathy': { description: 'Understand others emotions and thoughts', basepower: 'social' },
            'Focus': { description: 'Concentrates willpower for enhanced effects', basepower: 'willpower' },
            'Resilience': { description: 'Protects against reality damage', basepower: 'defense' },
            'Creativity': { description: 'Generates new ideas and solutions', basepower: 'innovation' }
        };

        this.commands = {
            help: this.showHelp.bind(this),
            look: this.look.bind(this),
            status: this.showStatus.bind(this),
            symbols: this.showSymbols.bind(this),
            meditate: this.meditate.bind(this),
            transcend: this.attemptIteration.bind(this),
            forms: this.showPlatonicForms.bind(this),
            equip: this.equipSymbol.bind(this),
            unequip: this.unequipSymbol.bind(this),
            faces: this.showFaces.bind(this),
            north: () => this.move('north'),
            south: () => this.move('south'),
            east: () => this.move('east'),
            west: () => this.move('west'),
            n: () => this.move('north'),
            s: () => this.move('south'),
            e: () => this.move('east'),
            w: () => this.move('west')
        };

        // Symbol inventory (symbols not equipped to faces)
        this.symbolInventory = [];
        
        // 3D Renderer
        this.renderer3d = new Philosophia3DRenderer();

        this.initializeGame();
        this.setup3D();
    }

    initializeGame() {
        this.updateUI();
        this.setupEventListeners();
        this.addMessage('Welcome to Philosophia! You have entered The Beyond as a Tetrahedron.', 'system');
        this.addMessage('You start with only the Interaction symbol, which allows you to move and perceive reality.', 'system');
        this.addMessage('Click and drag your form to rotate it. Click on faces to activate symbols!', 'system');
        this.addMessage('Your journey toward higher Platonic forms begins now.', 'system');
        this.look();
    }

    setupEventListeners() {
        const input = document.getElementById('command-input');
        const submitBtn = document.getElementById('submit-command');

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.processCommand();
            }
        });

        submitBtn.addEventListener('click', () => {
            this.processCommand();
        });

        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.getAttribute('data-command');
                this.executeCommand(command);
            });
        });

        // Movement buttons
        document.querySelectorAll('.move-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.getAttribute('data-direction');
                this.move(direction);
            });
        });

        // Philosophical buttons
        document.querySelectorAll('.philo-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-mode');
                this.philosophicalAction(mode);
            });
        });
    }

    setup3D() {
        // Initialize the 3D renderer
        if (this.renderer3d.initialize('three-container')) {
            // Set up face click callback
            this.renderer3d.setFaceClickCallback((faceIndex) => {
                this.onFaceClick(faceIndex);
            });
            
            // Create initial player form
            this.update3DForm();
        } else {
            console.error('Failed to initialize 3D renderer');
        }
    }

    update3DForm() {
        // Update the 3D renderer with current player form and symbols
        this.renderer3d.updatePlayerForm(this.player.form, this.player.symbols);
    }

    onFaceClick(faceIndex) {
        const maxFaces = this.getCurrentFormFaces();
        if (faceIndex >= maxFaces) return;

        const symbol = this.player.symbols[faceIndex];
        if (symbol) {
            this.addMessage(`Face ${faceIndex + 1}: Activated ${symbol.name}!`, 'system');
            this.gainSymbolExperience(symbol.name, 2);
            
            // Special activation effects based on symbol type
            switch (symbol.name) {
                case 'Interaction':
                    this.addMessage('Your connection to reality strengthens.', 'game');
                    break;
                case 'Logic':
                    this.addMessage('Your reasoning becomes clearer.', 'game');
                    break;
                case 'Memory':
                    this.addMessage('Past knowledge flows through your mind.', 'game');
                    break;
                default:
                    this.addMessage(`The power of ${symbol.name} flows through you.`, 'game');
            }
        } else {
            this.addMessage(`Face ${faceIndex + 1}: Empty face. You could equip a symbol here.`, 'system');
        }
    }

    processCommand() {
        const input = document.getElementById('command-input');
        const command = input.value.trim().toLowerCase();
        input.value = '';

        if (command) {
            this.addMessage(`> ${command}`, 'player');
            this.executeCommand(command);
        }
    }
            symbolMesh.lookAt(
                symbolMesh.position.x + normal.x,
                symbolMesh.position.y + normal.y,
                symbolMesh.position.z + normal.z
            );
        }
    }

    positionCubeSymbol(symbolMesh, faceIndex) {
        const distance = 0.78; // Just outside cube surface
        
        const faces = [
            { pos: [0, 0, distance], normal: [0, 0, 1] },     // front
            { pos: [0, 0, -distance], normal: [0, 0, -1] },   // back  
            { pos: [0, distance, 0], normal: [0, 1, 0] },     // top
            { pos: [0, -distance, 0], normal: [0, -1, 0] },   // bottom
            { pos: [distance, 0, 0], normal: [1, 0, 0] },     // right
            { pos: [-distance, 0, 0], normal: [-1, 0, 0] }    // left
        ];
        
        if (faces[faceIndex]) {
            const face = faces[faceIndex];
            symbolMesh.position.set(...face.pos);
            
            // Make symbol face outward from the surface
            const normal = new THREE.Vector3(...face.normal);
            symbolMesh.lookAt(
                symbolMesh.position.x + normal.x,
                symbolMesh.position.y + normal.y,
                symbolMesh.position.z + normal.z
            );
        }
    }

    positionOctahedronSymbol(symbolMesh, faceIndex) {
        const distance = 1.28; // Just outside octahedron surface
        
        // Octahedron has 8 triangular faces
        const t = Math.sqrt(3) / 3; // 1/√3
        const faces = [
            { pos: [t, t, t], normal: [1, 1, 1] },       // Top-front-right
            { pos: [-t, t, t], normal: [-1, 1, 1] },     // Top-front-left
            { pos: [t, t, -t], normal: [1, 1, -1] },     // Top-back-right
            { pos: [-t, t, -t], normal: [-1, 1, -1] },   // Top-back-left
            { pos: [t, -t, t], normal: [1, -1, 1] },     // Bottom-front-right
            { pos: [-t, -t, t], normal: [-1, -1, 1] },   // Bottom-front-left
            { pos: [t, -t, -t], normal: [1, -1, -1] },   // Bottom-back-right
            { pos: [-t, -t, -t], normal: [-1, -1, -1] }  // Bottom-back-left
        ];
        
        if (faces[faceIndex]) {
            const face = faces[faceIndex];
            symbolMesh.position.set(...face.pos);
            
            const normal = new THREE.Vector3(...face.normal).normalize();
            symbolMesh.lookAt(
                symbolMesh.position.x + normal.x,
                symbolMesh.position.y + normal.y,
                symbolMesh.position.z + normal.z
            );
        }
    }

    positionDodecahedronSymbol(symbolMesh, faceIndex) {
        const distance = 1.05; // Just outside dodecahedron surface
        
        // Simplified dodecahedron positioning - 12 faces distributed around
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const baseAngle = (faceIndex * 2 * Math.PI) / 12;
        const heightVariation = Math.sin(faceIndex * Math.PI / 6);
        
        const pos = [
            Math.cos(baseAngle) * distance,
            heightVariation * distance * 0.6,
            Math.sin(baseAngle) * distance
        ];
        
        symbolMesh.position.set(...pos);
        
        // Face outward from center
        const normal = new THREE.Vector3(...pos).normalize();
        symbolMesh.lookAt(
            symbolMesh.position.x + normal.x,
            symbolMesh.position.y + normal.y,
            symbolMesh.position.z + normal.z
        );
    }

    positionIcosahedronSymbol(symbolMesh, faceIndex) {
        const distance = 1.25; // Just outside icosahedron surface
        
        // Simplified icosahedron positioning - 20 faces
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const baseAngle = (faceIndex * 2 * Math.PI) / 20;
        const heightLevel = Math.floor(faceIndex / 5); // 4 levels of 5 faces each
        const levelAngle = (faceIndex % 5) * (2 * Math.PI) / 5;
        
        const heightOffset = (heightLevel - 1.5) * 0.4; // Center around 0
        
        const pos = [
            Math.cos(levelAngle) * distance * 0.85,
            heightOffset * distance,
            Math.sin(levelAngle) * distance * 0.85
        ];
        
        symbolMesh.position.set(...pos);
        
        // Face outward from center
        const normal = new THREE.Vector3(...pos).normalize();
        symbolMesh.lookAt(
            symbolMesh.position.x + normal.x,
            symbolMesh.position.y + normal.y,
            symbolMesh.position.z + normal.z
        );
    }

    createInteractiveFaces(geometry) {
        // Remove any existing face meshes
        if (this.playerMesh.faceMeshes) {
            this.playerMesh.faceMeshes.forEach(mesh => this.playerMesh.remove(mesh));
        }
        this.playerMesh.faceMeshes = [];

        // Create invisible meshes for each face to detect clicks
        const faces = geometry.getAttribute('position').count / 3;
        for (let i = 0; i < faces; i++) {
            const faceMaterial = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide
            });

            // Create a small geometry for each face
            const faceGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array(9); // 3 vertices * 3 coordinates

            // Copy face vertices from main geometry
            const mainPositions = geometry.getAttribute('position').array;
            for (let j = 0; j < 9; j++) {
                positions[j] = mainPositions[i * 9 + j];
            }

            faceGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            faceGeometry.computeVertexNormals();

            const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
            faceMesh.userData = { faceIndex: i, isFace: true };

            this.playerMesh.add(faceMesh);
            this.playerMesh.faceMeshes.push(faceMesh);
        }
    }

    setupThreeJSControls() {
        const container = document.getElementById('three-container');

        container.addEventListener('mousedown', (event) => {
            this.isMouseDown = true;
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        });

        container.addEventListener('mousemove', (event) => {
            if (this.isMouseDown && this.playerMesh) {
                const deltaX = event.clientX - this.mouseX;
                const deltaY = event.clientY - this.mouseY;

                this.playerMesh.rotation.y += deltaX * this.rotationSpeed;
                this.playerMesh.rotation.x += deltaY * this.rotationSpeed;

                this.mouseX = event.clientX;
                this.mouseY = event.clientY;
            }
        });

        container.addEventListener('mouseleave', () => {
            this.isMouseDown = false;
        });

        container.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        container.addEventListener('click', (event) => {
            this.onThreeJSClick(event);
        });

        // Prevent context menu on right click
        container.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    onThreeJSClick(event) {
        const container = document.getElementById('three-container');
        const rect = container.getBoundingClientRect();

        // Calculate mouse position in normalized device coordinates
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.playerMesh.faceMeshes || []);

        if (intersects.length > 0) {
            const clickedFace = intersects[0].object;
            const faceIndex = clickedFace.userData.faceIndex;
            this.onFaceClick(faceIndex);
        }
    }

    onFaceClick(faceIndex) {
        const maxFaces = this.getCurrentFormFaces();
        if (faceIndex >= maxFaces) return;

        const symbol = this.player.symbols[faceIndex];
        if (symbol) {
            this.addMessage(`Face ${faceIndex + 1}: Activated ${symbol.name}!`, 'system');
            this.gainSymbolExperience(symbol.name, 2);

            // Special activation effects based on symbol type
            switch (symbol.name) {
                case 'Interaction':
                    this.addMessage('Your connection to reality strengthens.', 'game');
                    break;
                case 'Logic':
                    this.addMessage('Your reasoning becomes clearer.', 'game');
                    break;
                case 'Memory':
                    this.addMessage('Past knowledge flows through your mind.', 'game');
                    break;
                default:
                    this.addMessage(`The power of ${symbol.name} flows through you.`, 'game');
            }
        } else {
            this.addMessage(`Face ${faceIndex + 1}: Empty face. You could equip a symbol here.`, 'system');
        }
    }


    processCommand() {
        const input = document.getElementById('command-input');
        const command = input.value.trim().toLowerCase();
        input.value = '';

        if (command) {
            this.addMessage(`> ${command}`, 'player');
            this.executeCommand(command);
        }
    }

    executeCommand(command) {
        const args = command.split(' ');
        const baseCommand = args[0];

        if (this.commands[baseCommand]) {
            this.commands[baseCommand](args.slice(1));
        } else {
            this.addMessage(`Unknown command: ${baseCommand}. Type 'help' for available commands.`, 'error');
        }
    }

    addMessage(text, type = 'game') {
        const output = document.getElementById('game-output');
        const p = document.createElement('p');
        p.className = `${type}-message`;
        p.textContent = text;
        output.appendChild(p);
        output.scrollTop = output.scrollHeight;
    }

    updateUI() {
        document.getElementById('player-form').textContent = this.player.form;
        document.getElementById('player-knowledge').textContent = this.player.knowledge;
        document.getElementById('player-reality').textContent = this.player.reality;
        document.getElementById('player-max-reality').textContent = this.player.maxReality;
        document.getElementById('player-willpower').textContent = this.player.willpower;
        document.getElementById('player-max-willpower').textContent = this.player.maxWillpower;

        const symbolsList = document.getElementById('symbols-list');
        symbolsList.innerHTML = '';

        // Show equipped symbols
        const maxFaces = this.getCurrentFormFaces();
        for (let i = 0; i < maxFaces; i++) {
            const symbol = this.player.symbols[i];
            const div = document.createElement('div');
            div.className = 'symbol';
            if (symbol) {
                div.textContent = `Face ${i + 1}: ${symbol.name} (Lv.${symbol.level})`;
                div.title = symbol.description;
            } else {
                div.textContent = `Face ${i + 1}: Empty`;
                div.className += ' empty-symbol';
            }
            symbolsList.appendChild(div);
        }

        const currentLocation = this.locations[this.player.location];
        document.getElementById('current-location').textContent = currentLocation.name;
        document.getElementById('location-description').textContent = currentLocation.description;
    }

    // Game Commands
    showHelp() {
        this.addMessage('Available commands:', 'system');
        this.addMessage('Movement: north, south, east, west (or n, s, e, w)', 'system');
        this.addMessage('Actions: look, status, symbols, meditate, transcend, forms', 'system');
        this.addMessage('Symbols: faces, equip [symbol] [face], unequip [face]', 'system');
        this.addMessage('Use the buttons on the right panel for quick actions.', 'system');
    }

    look() {
        // Check if player has Interaction symbol for detailed perception
        if (!this.hasSymbol('Interaction')) {
            this.addMessage('Your perception is limited without the Interaction symbol.', 'error');
            return;
        }

        const location = this.locations[this.player.location];
        this.addMessage(`You are in: ${location.name}`, 'game');
        this.addMessage(location.description, 'game');

        const exits = Object.keys(location.exits);
        if (exits.length > 0) {
            this.addMessage(`Exits: ${exits.join(', ')}`, 'game');
        }

        this.gainSymbolExperience('Interaction', 1);
    }

    showStatus() {
        this.addMessage('=== FORM STATUS ===', 'system');
        this.addMessage(`Form: ${this.player.form}`, 'system');
        this.addMessage(`Knowledge: ${this.player.knowledge}`, 'system');
        this.addMessage(`Reality: ${this.player.reality}/${this.player.maxReality}`, 'system');
        this.addMessage(`Willpower: ${this.player.willpower}/${this.player.maxWillpower}`, 'system');
    }

    showSymbols() {
        this.addMessage('=== YOUR SYMBOLS ===', 'system');
        const maxFaces = this.getCurrentFormFaces();

        this.addMessage(`Your ${this.player.form} has ${maxFaces} faces:`, 'system');
        for (let i = 0; i < maxFaces; i++) {
            const symbol = this.player.symbols[i];
            if (symbol) {
                const expToNext = this.getExpToNextLevel(symbol.level);
                const expProgress = symbol.experience >= expToNext ? 'MAX' : `${symbol.experience}/${expToNext}`;
                this.addMessage(`Face ${i + 1}: ${symbol.name} (Level ${symbol.level}) [${expProgress} XP]`, 'system');
                this.addMessage(`  ${symbol.description}`, 'system');
            } else {
                this.addMessage(`Face ${i + 1}: Empty`, 'system');
            }
        }

        if (this.symbolInventory.length > 0) {
            this.addMessage('\n=== SYMBOL INVENTORY ===', 'system');
            this.symbolInventory.forEach((symbol, index) => {
                this.addMessage(`${index + 1}. ${symbol.name} (Level ${symbol.level})`, 'system');
            });
        }
    }

    meditate() {
        if (this.player.willpower < this.player.maxWillpower) {
            this.player.willpower = Math.min(this.player.maxWillpower, this.player.willpower + 1);
            this.addMessage('You focus your mind, feeling your willpower restore itself.', 'game');
            this.updateUI();
        } else {
            this.addMessage('Your willpower is already at its peak.', 'game');
        }
    }

    move(direction) {
        // Check if player has Interaction symbol for movement
        if (!this.hasSymbol('Interaction')) {
            this.addMessage('You need the Interaction symbol to move through The Beyond.', 'error');
            return;
        }

        const location = this.locations[this.player.location];

        if (location.exits[direction]) {
            this.player.location = location.exits[direction];
            this.addMessage(`You move ${direction}...`, 'game');
            this.gainSymbolExperience('Interaction', 1);
            this.updateUI();
            this.look();
        } else {
            this.addMessage(`You cannot go ${direction} from here.`, 'error');
        }
    }

    philosophicalAction(mode) {
        switch (mode) {
            case 'thesis':
                this.addMessage('You prepare to present a philosophical thesis...', 'game');
                this.addMessage('(This feature will be expanded in future iterations)', 'system');
                break;
            case 'antithesis':
                this.addMessage('You ready a counter-argument...', 'game');
                this.addMessage('(This feature will be expanded in future iterations)', 'system');
                break;
            case 'synthesis':
                this.addMessage('You seek to find synthesis between opposing ideas...', 'game');
                this.addMessage('(This feature will be expanded in future iterations)', 'system');
                break;
        }
    }

    showPlatonicForms() {
        this.addMessage('=== THE PLATONIC FORMS ===', 'system');
        this.platonicForms.forEach((form, index) => {
            const current = form.name === this.player.form ? ' [CURRENT]' : '';
            const available = this.player.knowledge >= form.knowledge ? ' [AVAILABLE]' : ' [LOCKED]';
            this.addMessage(`${form.name} (${form.faces} faces) - Req: ${form.knowledge} Knowledge${available}${current}`, 'system');
            this.addMessage(`  ${form.description}`, 'system');
        });
    }

    attemptIteration() {
        const currentFormIndex = this.platonicForms.findIndex(f => f.name === this.player.form);

        if (currentFormIndex === -1) {
            this.addMessage('Error: Current form not recognized.', 'error');
            return;
        }

        if (currentFormIndex >= this.platonicForms.length - 1) {
            this.addMessage('You have achieved the highest Platonic form. Seek the path to the Sphere.', 'game');
            return;
        }

        const nextForm = this.platonicForms[currentFormIndex + 1];

        if (this.player.knowledge < nextForm.knowledge) {
            this.addMessage(`You need ${nextForm.knowledge} Knowledge to iterate to ${nextForm.name}. You currently have ${this.player.knowledge}.`, 'error');
            return;
        }

        if (this.player.willpower < 3) {
            this.addMessage('Iteration requires 3 Willpower. Meditate to restore your mental energy.', 'error');
            return;
        }

        // Perform iteration
        this.player.willpower -= 3;
        const oldFaces = this.getCurrentFormFaces();
        this.player.form = nextForm.name;
        const newFaces = this.getCurrentFormFaces();

        // Expand symbol array if new form has more faces
        if (newFaces > oldFaces) {
            for (let i = oldFaces; i < newFaces; i++) {
                this.player.symbols.push(null);
            }
        }

        this.player.maxReality += 5;
        this.player.maxWillpower += 2;
        this.player.reality = this.player.maxReality; // Restore on iteration
        this.player.willpower = this.player.maxWillpower;

        this.addMessage(`*** ITERATION COMPLETE ***`, 'system');
        this.addMessage(`You have transcended to the form of ${nextForm.name}!`, 'system');
        this.addMessage(nextForm.description, 'game');
        this.addMessage(`Your form now has ${newFaces} faces available for symbols.`, 'system');
        this.addMessage('Your Reality and Willpower have been restored and expanded.', 'system');

        this.createPlayerForm();
        this.updateUI();
    }

    // Helper methods for symbol system
    getCurrentFormFaces() {
        const form = this.platonicForms.find(f => f.name === this.player.form);
        return form ? form.faces : 4;
    }

    hasSymbol(symbolName) {
        return this.player.symbols.some(symbol => symbol && symbol.name === symbolName);
    }

    getExpToNextLevel(level) {
        return level * 10; // Each level requires 10 * level experience
    }

    gainSymbolExperience(symbolName, amount) {
        const symbol = this.player.symbols.find(s => s && s.name === symbolName);
        if (symbol) {
            symbol.experience += amount;
            const expRequired = this.getExpToNextLevel(symbol.level);
            if (symbol.experience >= expRequired && symbol.level < 10) {
                symbol.experience -= expRequired;
                symbol.level++;
                this.addMessage(`Your ${symbolName} symbol has reached level ${symbol.level}!`, 'system');
                this.updateUI();
            }
        }
    }

    showFaces() {
        this.addMessage('=== FACE CONFIGURATION ===', 'system');
        const maxFaces = this.getCurrentFormFaces();
        for (let i = 0; i < maxFaces; i++) {
            const symbol = this.player.symbols[i];
            if (symbol) {
                this.addMessage(`Face ${i + 1}: ${symbol.name} (Lv.${symbol.level})`, 'system');
            } else {
                this.addMessage(`Face ${i + 1}: Empty [Available]`, 'system');
            }
        }
    }

    equipSymbol(args) {
        if (args.length < 2) {
            this.addMessage('Usage: equip [symbol] [face]', 'error');
            this.addMessage('Example: equip Logic 3', 'system');
            return;
        }

        const symbolName = this.findSymbolName(args[0]);
        const faceNumber = parseInt(args[1]) - 1;
        const maxFaces = this.getCurrentFormFaces();

        if (faceNumber < 0 || faceNumber >= maxFaces) {
            this.addMessage(`Invalid face number. Your ${this.player.form} has faces 1-${maxFaces}.`, 'error');
            return;
        }

        if (this.player.symbols[faceNumber] !== null) {
            this.addMessage(`Face ${faceNumber + 1} already has a symbol equipped.`, 'error');
            return;
        }

        // Check if symbol exists in available symbols
        if (!symbolName || !this.availableSymbols[symbolName]) {
            this.addMessage(`Unknown symbol: ${args[0]}`, 'error');
            this.addMessage('Available symbols: ' + Object.keys(this.availableSymbols).join(', '), 'system');
            return;
        }

        // For now, create new symbols. Later this could check inventory
        const newSymbol = {
            name: symbolName,
            level: 1,
            experience: 0,
            face: faceNumber + 1,
            description: this.availableSymbols[symbolName].description
        };

        this.player.symbols[faceNumber] = newSymbol;
        this.addMessage(`Equipped ${symbolName} to face ${faceNumber + 1}.`, 'game');
        this.updateUI();
        // Update 3D visualization
        this.createPlayerForm();
    }

    unequipSymbol(args) {
        if (args.length < 1) {
            this.addMessage('Usage: unequip [face]', 'error');
            this.addMessage('Example: unequip 3', 'system');
            return;
        }

        const faceNumber = parseInt(args[0]) - 1;
        const maxFaces = this.getCurrentFormFaces();

        if (faceNumber < 0 || faceNumber >= maxFaces) {
            this.addMessage(`Invalid face number. Your ${this.player.form} has faces 1-${maxFaces}.`, 'error');
            return;
        }

        const symbol = this.player.symbols[faceNumber];
        if (!symbol) {
            this.addMessage(`Face ${faceNumber + 1} is already empty.`, 'error');
            return;
        }

        // Move to inventory
        this.symbolInventory.push(symbol);
        this.player.symbols[faceNumber] = null;
        this.addMessage(`Unequipped ${symbol.name} from face ${faceNumber + 1}.`, 'game');
        this.updateUI();
        // Update 3D visualization
        this.createPlayerForm();
    }

    // Helper method to find symbol name with case-insensitive matching
    findSymbolName(inputName) {
        const lowerInput = inputName.toLowerCase();
        const symbolNames = Object.keys(this.availableSymbols);
        
        // First try exact match
        if (this.availableSymbols[inputName]) {
            return inputName;
        }
        
        // Then try case-insensitive match
        return symbolNames.find(name => name.toLowerCase() === lowerInput);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new PhilosophiaGame();
});