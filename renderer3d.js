// Philosophia 3D Renderer
// Handles all Three.js rendering for the geometric forms

class Philosophia3DRenderer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.playerMesh = null;
        this.raycaster = null;
        this.mouse = null;
        
        // Mouse interaction variables
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.rotationSpeed = 0.05;
        
        // Symbol visualization
        this.symbolTextures = {};
        
        // Callbacks
        this.onFaceClickCallback = null;
    }

    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return false;
        }

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

        // Raycaster for mouse picking
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffd700, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Create symbol textures
        this.createSymbolTextures();

        // Setup mouse controls
        this.setupControls(container);

        // Start animation loop
        this.animate();

        return true;
    }

    createSymbolTextures() {
        // Create canvas-based textures for each symbol
        const symbolData = {
            'Interaction': { symbol: '⚡', color: '#FFD700' },
            'Logic': { symbol: '∴', color: '#00BFFF' },
            'Memory': { symbol: '⌛', color: '#9370DB' },
            'Empathy': { symbol: '♡', color: '#FF69B4' },
            'Focus': { symbol: '◉', color: '#FF4500' },
            'Resilience': { symbol: '🛡', color: '#32CD32' },
            'Creativity': { symbol: '✨', color: '#FF1493' }
        };

        Object.keys(symbolData).forEach(symbolName => {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const context = canvas.getContext('2d');
            
            // Background
            context.fillStyle = 'rgba(0, 0, 0, 0.8)';
            context.fillRect(0, 0, 128, 128);
            
            // Symbol
            context.fillStyle = symbolData[symbolName].color;
            context.font = 'bold 60px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(symbolData[symbolName].symbol, 64, 64);
            
            // Create texture
            this.symbolTextures[symbolName] = new THREE.CanvasTexture(canvas);
        });
    }

    createPlayerForm(formName, playerSymbols) {
        // Remove existing mesh
        if (this.playerMesh) {
            this.scene.remove(this.playerMesh);
        }

        let geometry;
        switch (formName) {
            case 'Tetrahedron':
                geometry = new THREE.TetrahedronGeometry(1.2);
                break;
            case 'Cube':
                geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                break;
            case 'Octahedron':
                geometry = new THREE.OctahedronGeometry(1.2);
                break;
            case 'Dodecahedron':
                geometry = new THREE.DodecahedronGeometry(1.0);
                break;
            case 'Icosahedron':
                geometry = new THREE.IcosahedronGeometry(1.2);
                break;
            default:
                geometry = new THREE.TetrahedronGeometry(1.2);
        }

        // Create base material
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });

        this.playerMesh = new THREE.Mesh(geometry, baseMaterial);
        this.scene.add(this.playerMesh);

        // Add wireframe overlay
        const wireframeGeometry = geometry.clone();
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        this.playerMesh.add(wireframeMesh);

        // Add symbol overlays
        this.addSymbolOverlays(formName, playerSymbols);

        // Create interactive face meshes
        this.createInteractiveFaces(geometry, this.getFormFaceCount(formName));
    }

    addSymbolOverlays(formName, playerSymbols) {
        // Remove existing symbol overlays
        if (this.playerMesh.symbolOverlays) {
            this.playerMesh.symbolOverlays.forEach(overlay => this.playerMesh.remove(overlay));
        }
        this.playerMesh.symbolOverlays = [];

        const maxFaces = this.getFormFaceCount(formName);
        
        for (let i = 0; i < maxFaces; i++) {
            const symbol = playerSymbols[i];
            if (symbol && this.symbolTextures[symbol.name]) {
                this.addSymbolToFace(i, symbol, formName);
            }
        }
    }

    addSymbolToFace(faceIndex, symbol, formName) {
        // Create a plane geometry for the symbol
        const symbolSize = this.getSymbolSizeForForm(formName);
        const symbolGeometry = new THREE.PlaneGeometry(symbolSize, symbolSize);
        const symbolMaterial = new THREE.MeshBasicMaterial({
            map: this.symbolTextures[symbol.name],
            transparent: true,
            opacity: 0.95,
            side: THREE.FrontSide,
            depthTest: false,
            depthWrite: false
        });

        const symbolMesh = new THREE.Mesh(symbolGeometry, symbolMaterial);
        symbolMesh.renderOrder = 1; // Render on top
        
        // Position the symbol on the face
        this.positionSymbolOnFace(symbolMesh, faceIndex, formName);
        
        symbolMesh.userData = { isSymbolOverlay: true, faceIndex: faceIndex };
        this.playerMesh.add(symbolMesh);
        this.playerMesh.symbolOverlays.push(symbolMesh);
    }

    getSymbolSizeForForm(formName) {
        switch (formName) {
            case 'Tetrahedron': return 0.6;
            case 'Cube': return 0.8;
            case 'Octahedron': return 0.5;
            case 'Dodecahedron': return 0.4;
            case 'Icosahedron': return 0.3;
            default: return 0.6;
        }
    }

    getFormFaceCount(formName) {
        switch (formName) {
            case 'Tetrahedron': return 4;
            case 'Cube': return 6;
            case 'Octahedron': return 8;
            case 'Dodecahedron': return 12;
            case 'Icosahedron': return 20;
            default: return 4;
        }
    }

    positionSymbolOnFace(symbolMesh, faceIndex, formName) {
        switch (formName) {
            case 'Tetrahedron':
                this.positionTetrahedronSymbol(symbolMesh, faceIndex);
                break;
            case 'Cube':
                this.positionCubeSymbol(symbolMesh, faceIndex);
                break;
            case 'Octahedron':
                this.positionOctahedronSymbol(symbolMesh, faceIndex);
                break;
            case 'Dodecahedron':
                this.positionDodecahedronSymbol(symbolMesh, faceIndex);
                break;
            case 'Icosahedron':
                this.positionIcosahedronSymbol(symbolMesh, faceIndex);
                break;
        }
    }

    positionTetrahedronSymbol(symbolMesh, faceIndex) {
        const faces = [
            { pos: [0, 0.85, 0.5], normal: [0, 0.577, 0.816] },
            { pos: [-0.7, -0.4, 0.5], normal: [-0.816, -0.471, 0.333] },
            { pos: [0.7, -0.4, 0.5], normal: [0.816, -0.471, 0.333] },
            { pos: [0, -0.1, -0.95], normal: [0, 0.333, -0.943] }
        ];
        
        if (faces[faceIndex]) {
            const face = faces[faceIndex];
            symbolMesh.position.set(...face.pos);
            
            const normal = new THREE.Vector3(...face.normal);
            symbolMesh.lookAt(
                symbolMesh.position.x + normal.x,
                symbolMesh.position.y + normal.y,
                symbolMesh.position.z + normal.z
            );
        }
    }

    positionCubeSymbol(symbolMesh, faceIndex) {
        const distance = 0.78;
        const faces = [
            { pos: [0, 0, distance], normal: [0, 0, 1] },
            { pos: [0, 0, -distance], normal: [0, 0, -1] },
            { pos: [0, distance, 0], normal: [0, 1, 0] },
            { pos: [0, -distance, 0], normal: [0, -1, 0] },
            { pos: [distance, 0, 0], normal: [1, 0, 0] },
            { pos: [-distance, 0, 0], normal: [-1, 0, 0] }
        ];
        
        if (faces[faceIndex]) {
            const face = faces[faceIndex];
            symbolMesh.position.set(...face.pos);
            
            const normal = new THREE.Vector3(...face.normal);
            symbolMesh.lookAt(
                symbolMesh.position.x + normal.x,
                symbolMesh.position.y + normal.y,
                symbolMesh.position.z + normal.z
            );
        }
    }

    positionOctahedronSymbol(symbolMesh, faceIndex) {
        const t = Math.sqrt(3) / 3;
        const faces = [
            { pos: [t, t, t], normal: [1, 1, 1] },
            { pos: [-t, t, t], normal: [-1, 1, 1] },
            { pos: [t, t, -t], normal: [1, 1, -1] },
            { pos: [-t, t, -t], normal: [-1, 1, -1] },
            { pos: [t, -t, t], normal: [1, -1, 1] },
            { pos: [-t, -t, t], normal: [-1, -1, 1] },
            { pos: [t, -t, -t], normal: [1, -1, -1] },
            { pos: [-t, -t, -t], normal: [-1, -1, -1] }
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
        const distance = 1.05;
        const baseAngle = (faceIndex * 2 * Math.PI) / 12;
        const heightVariation = Math.sin(faceIndex * Math.PI / 6);
        
        const pos = [
            Math.cos(baseAngle) * distance,
            heightVariation * distance * 0.6,
            Math.sin(baseAngle) * distance
        ];
        
        symbolMesh.position.set(...pos);
        
        const normal = new THREE.Vector3(...pos).normalize();
        symbolMesh.lookAt(
            symbolMesh.position.x + normal.x,
            symbolMesh.position.y + normal.y,
            symbolMesh.position.z + normal.z
        );
    }

    positionIcosahedronSymbol(symbolMesh, faceIndex) {
        const distance = 1.25;
        const heightLevel = Math.floor(faceIndex / 5);
        const levelAngle = (faceIndex % 5) * (2 * Math.PI) / 5;
        const heightOffset = (heightLevel - 1.5) * 0.4;
        
        const pos = [
            Math.cos(levelAngle) * distance * 0.85,
            heightOffset * distance,
            Math.sin(levelAngle) * distance * 0.85
        ];
        
        symbolMesh.position.set(...pos);
        
        const normal = new THREE.Vector3(...pos).normalize();
        symbolMesh.lookAt(
            symbolMesh.position.x + normal.x,
            symbolMesh.position.y + normal.y,
            symbolMesh.position.z + normal.z
        );
    }

    createInteractiveFaces(geometry, maxFaces) {
        // Remove any existing face meshes
        if (this.playerMesh.faceMeshes) {
            this.playerMesh.faceMeshes.forEach(mesh => this.playerMesh.remove(mesh));
        }
        this.playerMesh.faceMeshes = [];

        // Create invisible meshes for each face to detect clicks
        const faces = geometry.getAttribute('position').count / 3;
        for (let i = 0; i < Math.min(faces, maxFaces * 2); i++) {
            const faceMaterial = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide
            });
            
            const faceGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array(9);
            
            const mainPositions = geometry.getAttribute('position').array;
            for (let j = 0; j < 9; j++) {
                positions[j] = mainPositions[i * 9 + j];
            }
            
            faceGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            faceGeometry.computeVertexNormals();
            
            const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
            faceMesh.userData = { faceIndex: Math.floor(i / 2), isFace: true };
            
            this.playerMesh.add(faceMesh);
            this.playerMesh.faceMeshes.push(faceMesh);
        }
    }

    setupControls(container) {
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
            this.handleClick(event, container);
        });

        container.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    handleClick(event, container) {
        const rect = container.getBoundingClientRect();
        
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.playerMesh.faceMeshes || []);

        if (intersects.length > 0) {
            const clickedFace = intersects[0].object;
            const faceIndex = clickedFace.userData.faceIndex;
            
            if (this.onFaceClickCallback) {
                this.onFaceClickCallback(faceIndex);
            }
        }
    }

    setFaceClickCallback(callback) {
        this.onFaceClickCallback = callback;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Only auto-rotate if mouse is not being used for manual rotation
        if (this.playerMesh && !this.isMouseDown) {
            this.playerMesh.rotation.y += 0.005;
            this.playerMesh.rotation.x += 0.002;
        }

        if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Public method to update the form
    updatePlayerForm(formName, playerSymbols) {
        this.createPlayerForm(formName, playerSymbols);
    }
}