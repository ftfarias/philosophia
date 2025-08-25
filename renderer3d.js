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

        // Face data cache for current mesh
        this.faceData = []; // [{ center: Vector3, normal: Vector3 }]

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
            canvas.width = 256;
            canvas.height = 256;
            const context = canvas.getContext('2d');

            // Background is transparent; symbols only
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Symbol
            context.fillStyle = symbolData[symbolName].color;
            context.font = 'bold 140px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(symbolData[symbolName].symbol, canvas.width / 2, canvas.height / 2);

            const tex = new THREE.CanvasTexture(canvas);
            tex.anisotropy = 8;
            tex.needsUpdate = true;

            this.symbolTextures[symbolName] = tex;
        });
    }

    createPlayerForm(formName, playerSymbols) {
        // Remove existing mesh
        if (this.playerMesh) {
            this.scene.remove(this.playerMesh);
            this.playerMesh.geometry.dispose();
            if (Array.isArray(this.playerMesh.material)) {
                this.playerMesh.material.forEach(m => m.dispose && m.dispose());
            } else {
                this.playerMesh.material.dispose && this.playerMesh.material.dispose();
            }
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

        // Compute face centers and normals from geometry
        this.faceData = this.computeFaceData(geometry, formName);

        // Add symbol overlays
        this.addSymbolOverlays(formName, playerSymbols);

        // Create interactive face meshes aligned with overlays
        this.createInteractiveFaces(formName);
    }

    // Compute per-face center and normal for each logical face
    computeFaceData(geometry, formName) {
        // Work on non-indexed for simpler triangle iteration
        const geom = geometry.index ? geometry.toNonIndexed() : geometry.clone();
        const pos = geom.getAttribute('position');
        const triCount = pos.count / 3;

        // Extract triangles with center and normal
        const tris = [];
        const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
        const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3(), center = new THREE.Vector3();

        for (let i = 0; i < triCount; i++) {
            a.set(pos.getX(i * 3 + 0), pos.getY(i * 3 + 0), pos.getZ(i * 3 + 0));
            b.set(pos.getX(i * 3 + 1), pos.getY(i * 3 + 1), pos.getZ(i * 3 + 1));
            c.set(pos.getX(i * 3 + 2), pos.getY(i * 3 + 2), pos.getZ(i * 3 + 2));

            center.copy(a).add(b).add(c).multiplyScalar(1 / 3);
            ab.copy(b).sub(a);
            ac.copy(c).sub(a);
            n.copy(ab).cross(ac).normalize();

            tris.push({
                center: center.clone(),
                normal: n.clone(),
                verts: [a.clone(), b.clone(), c.clone()]
            });
        }

        // Group triangles into logical faces
        if (formName === 'Cube') {
            // 12 triangles, 6 faces, 2 tris per face in order
            const faces = [];
            for (let i = 0; i < tris.length; i += 2) {
                const t1 = tris[i], t2 = tris[i + 1];
                const faceCenter = t1.center.clone().add(t2.center).multiplyScalar(0.5);
                const faceNormal = t1.normal.clone().add(t2.normal).normalize();
                faces.push({ center: faceCenter, normal: faceNormal });
            }
            return faces;
        }

        if (formName === 'Dodecahedron') {
            // 12 pentagons, typically triangulated into 36 triangles (3 per face).
            // Group by similar normals using rounding as key.
            const keyOf = (v) => `${Math.round(v.x * 100) / 100},${Math.round(v.y * 100) / 100},${Math.round(v.z * 100) / 100}`;
            const groups = new Map();
            for (const t of tris) {
                const key = keyOf(t.normal);
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key).push(t);
            }
            // If rounding too strict/loose, adjust decimals if needed
            let faces = [];
            for (const group of groups.values()) {
                const faceCenter = new THREE.Vector3();
                const faceNormal = new THREE.Vector3();
                for (const t of group) {
                    faceCenter.add(t.center);
                    faceNormal.add(t.normal);
                }
                faceCenter.multiplyScalar(1 / group.length);
                faceNormal.normalize();
                faces.push({ center: faceCenter, normal: faceNormal });
            }
            // If something odd happened, fallback to averaging 3-by-3
            if (faces.length !== 12 && tris.length >= 3) {
                faces = [];
                for (let i = 0; i < tris.length; i += 3) {
                    const g = tris.slice(i, i + 3);
                    const fc = new THREE.Vector3();
                    const fn = new THREE.Vector3();
                    g.forEach(t => { fc.add(t.center); fn.add(t.normal); });
                    fc.multiplyScalar(1 / g.length);
                    fn.normalize();
                    faces.push({ center: fc, normal: fn });
                }
            }
            return faces;
        }

        // Tetrahedron (4), Octahedron (8), Icosahedron (20) => one triangle per face
        return tris.map(t => ({ center: t.center, normal: t.normal }));
    }

    addSymbolOverlays(formName, playerSymbols) {
        // Remove existing symbol overlays
        if (this.playerMesh.symbolOverlays) {
            this.playerMesh.symbolOverlays.forEach(overlay => {
                overlay.geometry.dispose();
                overlay.material.dispose();
                this.playerMesh.remove(overlay);
            });
        }
        this.playerMesh.symbolOverlays = [];

        const faceCount = this.faceData.length;

        for (let i = 0; i < faceCount; i++) {
            const symbol = playerSymbols[i];
            if (symbol && this.symbolTextures[symbol.name]) {
                this.addSymbolToFace(i, symbol, formName);
            }
        }
    }

    addSymbolToFace(faceIndex, symbol, formName) {
        const symbolSize = this.getSymbolSizeForForm(formName);
        const symbolGeometry = new THREE.PlaneGeometry(symbolSize, symbolSize);
        const symbolMaterial = new THREE.MeshBasicMaterial({
            map: this.symbolTextures[symbol.name],
            transparent: true,
            opacity: 0.98,
            side: THREE.FrontSide,
            depthTest: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1, // pull slightly toward camera to avoid z-fighting
            polygonOffsetUnits: -1
        });

        const symbolMesh = new THREE.Mesh(symbolGeometry, symbolMaterial);
        symbolMesh.userData = { isSymbolOverlay: true, faceIndex };

        // Position and orient flush to the face
        this.positionSymbolOnFace(symbolMesh, faceIndex);

        this.playerMesh.add(symbolMesh);
        this.playerMesh.symbolOverlays.push(symbolMesh);
    }

    getSymbolSizeForForm(formName) {
        switch (formName) {
            case 'Tetrahedron': return 0.65;
            case 'Cube': return 0.95;
            case 'Octahedron': return 0.6;
            case 'Dodecahedron': return 0.55;
            case 'Icosahedron': return 0.45;
            default: return 0.6;
        }
    }

    positionSymbolOnFace(symbolMesh, faceIndex) {
        const face = this.faceData[faceIndex];
        if (!face) return;

        const normal = face.normal.clone().normalize();

        // Move the plane onto the face with a tiny epsilon outward to avoid z-fighting
        const EPS = 0.0008;
        const pos = face.center.clone().add(normal.clone().multiplyScalar(EPS));
        symbolMesh.position.copy(pos);

        // Orient plane so its +Z faces along the face normal
        const from = new THREE.Vector3(0, 0, 1);
        const quat = new THREE.Quaternion().setFromUnitVectors(from, normal);
        symbolMesh.quaternion.copy(quat);
    }

    // Build invisible pick-planes aligned to the logical faces
    createInteractiveFaces(formName) {
        // Remove any existing face meshes
        if (!this.playerMesh) return;

        if (this.playerMesh.faceMeshes) {
            this.playerMesh.faceMeshes.forEach(mesh => {
                mesh.geometry.dispose();
                mesh.material.dispose();
                this.playerMesh.remove(mesh);
            });
        }
        this.playerMesh.faceMeshes = [];

        const pickMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthTest: true,
            depthWrite: false
        });

        const faceCount = this.faceData.length;
        const pickSize = this.getSymbolSizeForForm(formName) * 1.2;

        for (let i = 0; i < faceCount; i++) {
            const face = this.faceData[i];
            const planeGeo = new THREE.PlaneGeometry(pickSize, pickSize);
            const plane = new THREE.Mesh(planeGeo, pickMaterial);
            plane.userData = { faceIndex: i, isFace: true };

            // Align with face
            const normal = face.normal.clone().normalize();
            const from = new THREE.Vector3(0, 0, 1);
            const quat = new THREE.Quaternion().setFromUnitVectors(from, normal);
            plane.quaternion.copy(quat);

            // Place at center (tiny epsilon so it's pickable on top of the surface)
            const EPS = 0.0009;
            plane.position.copy(face.center.clone().add(normal.multiplyScalar(EPS)));

            this.playerMesh.add(plane);
            this.playerMesh.faceMeshes.push(plane);
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

                this.playerMesh.rotation.y += deltaX * this.rotationSpeed * 0.01;
                this.playerMesh.rotation.x += deltaY * this.rotationSpeed * 0.01;

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
        if (!this.playerMesh) return;

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