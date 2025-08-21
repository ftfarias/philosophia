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
                { name: 'Navigate', level: 1, experience: 0, face: 1, description: 'Allows movement through The Beyond' },
                { name: 'Interaction', level: 1, experience: 0, face: 2, description: 'Touch, feel, and perceive reality' },
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
            'Navigate': { description: 'Allows movement through The Beyond', basepower: 'movement' },
            'Interaction': { description: 'Touch, feel, and perceive reality', basepower: 'perception' },
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

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.playerMesh = null;
        
        // Symbol inventory (symbols not equipped to faces)
        this.symbolInventory = [];

        this.initializeGame();
        this.setupThreeJS();
    }

    initializeGame() {
        this.updateUI();
        this.setupEventListeners();
        this.addMessage('Welcome to Philosophia! You have entered The Beyond as a Tetrahedron.', 'system');
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

    setupThreeJS() {
        const container = document.getElementById('three-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a1a);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.z = 5;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffd700, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Create player form
        this.createPlayerForm();

        // Animation loop
        this.animate();
    }

    createPlayerForm() {
        // Remove existing mesh
        if (this.playerMesh) {
            this.scene.remove(this.playerMesh);
        }

        let geometry;
        switch (this.player.form) {
            case 'Tetrahedron':
                // 4 triangular faces - simplest Platonic solid
                geometry = new THREE.TetrahedronGeometry(1.2);
                break;
            case 'Cube':
                // 6 square faces
                geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                break;
            case 'Octahedron':
                // 8 triangular faces
                geometry = new THREE.OctahedronGeometry(1.2);
                break;
            case 'Dodecahedron':
                // 12 pentagonal faces
                geometry = new THREE.DodecahedronGeometry(1.0);
                break;
            case 'Icosahedron':
                // 20 triangular faces - most complex regular solid
                geometry = new THREE.IcosahedronGeometry(1.2);
                break;
            default:
                // Default to Tetrahedron (starting form)
                geometry = new THREE.TetrahedronGeometry(1.2);
        }

        const material = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            shininess: 100,
            transparent: true,
            opacity: 0.9,
            wireframe: false
        });

        this.playerMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.playerMesh);

        // Add wireframe overlay for better definition
        const wireframeGeometry = geometry.clone();
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        this.playerMesh.add(wireframeMesh);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.playerMesh) {
            this.playerMesh.rotation.y += 0.01;
            this.playerMesh.rotation.x += 0.005;
        }

        this.renderer.render(this.scene, this.camera);
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
        // Check if player has Navigate symbol
        if (!this.hasSymbol('Navigate')) {
            this.addMessage('You need the Navigate symbol to move through The Beyond.', 'error');
            return;
        }
        
        const location = this.locations[this.player.location];

        if (location.exits[direction]) {
            this.player.location = location.exits[direction];
            this.addMessage(`You move ${direction}...`, 'game');
            this.gainSymbolExperience('Navigate', 1);
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
        
        const symbolName = args[0];
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
        if (!this.availableSymbols[symbolName]) {
            this.addMessage(`Unknown symbol: ${symbolName}`, 'error');
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
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new PhilosophiaGame();
});