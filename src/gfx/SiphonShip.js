import * as THREE from 'three';

export class SiphonShip {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // State
        this.pos = new THREE.Vector3(0, 0, 0);
        this.vel = new THREE.Vector3(0, 0, 0);
        this.target = new THREE.Vector3(0, 0, 0);
        this.mouse3D = new THREE.Vector3(0, 0, 0);
        
        // Physics params
        this.spring = 0.08;
        this.friction = 0.85;
        
        this.initShip();
        this.initTrail();
    }

    initShip() {
        // Create a sleek, sharp ship geometry
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, 0.4,    // Tip
            -0.15, -0.05, -0.2, // Left wing
            0, 0.05, -0.1,  // Top
            0.15, -0.05, -0.2,  // Right wing
        ]);
        
        const indices = [
            0, 1, 2, // Left face
            0, 2, 3, // Right face
            0, 3, 1, // Bottom face
            1, 3, 2  // Back face
        ];
        
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        this.material = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x004444,
            specular: 0xffffff,
            shininess: 100,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        
        // Add a core glow
        const glowGeo = new THREE.SphereGeometry(0.05, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
        this.glow = new THREE.Mesh(glowGeo, glowMat);
        this.mesh.add(this.glow);
        
        this.scene.add(this.mesh);
        
        // Light follow
        this.light = new THREE.PointLight(0x00ffff, 1, 5);
        this.scene.add(this.light);
    }

    initTrail() {
        this.trailMaxPoints = 40;
        this.trailHistory = [];
        for (let i = 0; i < this.trailMaxPoints; i++) {
            this.trailHistory.push(new THREE.Vector3(0, 0, 0));
        }
        
        this.trailGeometry = new THREE.BufferGeometry();
        // 2 vertices per point, N points -> 2*N vertices
        const vertices = new Float32Array(this.trailMaxPoints * 2 * 3); 
        this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        // Indices for triangles
        const indices = [];
        for (let i = 0; i < this.trailMaxPoints - 1; i++) {
            const row1 = i * 2;
            const row2 = (i + 1) * 2;
            indices.push(row1, row1 + 1, row2);
            indices.push(row1 + 1, row2 + 1, row2);
        }
        this.trailGeometry.setIndex(indices);
        
        this.trailMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.trailMesh = new THREE.Mesh(this.trailGeometry, this.trailMaterial);
        this.trailMesh.frustumCulled = false; // Keep trail visible
        this.scene.add(this.trailMesh);
        
        // Reusable vectors for performance
        this._tempDir = new THREE.Vector3();
        this._tempSide = new THREE.Vector3();
        this._up = new THREE.Vector3(0, 1, 0);
    }

    update(mouse) {
        // Project mouse to 3D
        this.mouse3D.set(mouse.x * 4, mouse.y * 4, 0);
        
        // Elastic Spring Physics
        const force = new THREE.Vector3().subVectors(this.mouse3D, this.pos).multiplyScalar(this.spring);
        this.vel.add(force);
        this.vel.multiplyScalar(this.friction);
        this.pos.add(this.vel);
        
        // Update Mesh
        this.mesh.position.copy(this.pos);
        
        // Banking & LookAt
        const direction = new THREE.Vector3().subVectors(this.mouse3D, this.pos).normalize();
        if (direction.length() > 0.01) {
            const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
            this.mesh.quaternion.slerp(targetQuaternion, 0.1);
        }
        
        // Banking (Roll based on X velocity, Pitch based on Y velocity)
        const roll = -this.vel.x * 2.5;
        this.mesh.rotation.z = roll;

        this.light.position.copy(this.pos);
        
        this.updateTrail();
    }

    updateTrail() {
        // Shift history
        for (let i = this.trailMaxPoints - 1; i > 0; i--) {
            this.trailHistory[i].copy(this.trailHistory[i - 1]);
        }
        this.trailHistory[0].copy(this.pos);
        
        const positions = this.trailGeometry.attributes.position.array;
        
        for (let i = 0; i < this.trailMaxPoints; i++) {
            const p = this.trailHistory[i];
            const nextP = this.trailHistory[Math.min(i + 1, this.trailMaxPoints - 1)];
            const prevP = this.trailHistory[Math.max(0, i - 1)];
            
            // Direction of the trail at this point
            this._tempDir.subVectors(nextP, prevP).normalize();
            if (this._tempDir.lengthSq() === 0) {
                this._tempDir.set(0, 0, 1);
            }
            
            // Side vector for width
            this._tempSide.crossVectors(this._tempDir, this._up).normalize();
            
            const width = 0.08 * (1 - i / this.trailMaxPoints);
            
            const idx = i * 6;
            // Vertex 1
            positions[idx] = p.x + this._tempSide.x * width;
            positions[idx + 1] = p.y + this._tempSide.y * width;
            positions[idx + 2] = p.z + this._tempSide.z * width;
            
            // Vertex 2
            positions[idx + 3] = p.x - this._tempSide.x * width;
            positions[idx + 4] = p.y - this._tempSide.y * width;
            positions[idx + 5] = p.z - this._tempSide.z * width;
        }
        
        this.trailGeometry.attributes.position.needsUpdate = true;
    }
}
