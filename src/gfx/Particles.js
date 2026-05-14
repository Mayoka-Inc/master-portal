import * as THREE from 'three';

export class Particles {
    constructor(scene, count = 2000) {
        this.scene = scene;
        this.count = count;
        
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(count * 3);
        this.velocities = new Float32Array(count * 3);
        
        for (let i = 0; i < count * 3; i++) {
            this.positions[i] = (Math.random() - 0.5) * 20;
            this.velocities[i] = (Math.random() - 0.5) * 0.02;
        }
        
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        
        this.material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.02,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        
        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);
    }

    update(mouse) {
        const positions = this.geometry.attributes.position.array;
        
        for (let i = 0; i < this.count; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;
            
            // Movement
            positions[ix] += this.velocities[ix];
            positions[iy] += this.velocities[iy];
            positions[iz] += this.velocities[iz];
            
            // Mouse interaction
            const dx = positions[ix] - mouse.x * 5;
            const dy = positions[iy] - mouse.y * 5;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 2) {
                positions[ix] += dx * 0.01;
                positions[iy] += dy * 0.01;
            }
            
            // Boundary check
            if (Math.abs(positions[ix]) > 10) positions[ix] *= -0.9;
            if (Math.abs(positions[iy]) > 10) positions[iy] *= -0.9;
            if (Math.abs(positions[iz]) > 10) positions[iz] *= -0.9;
        }
        
        this.geometry.attributes.position.needsUpdate = true;
    }
}
