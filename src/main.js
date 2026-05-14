import { Scene } from './gfx/Scene';
import { Singularity } from './gfx/Singularity';
import { Particles } from './gfx/Particles';

class App {
    constructor() {
        this.gfx = new Scene('app');
        this.singularity = new Singularity(this.gfx.scene);
        this.particles = new Particles(this.gfx.scene);
        
        this.render = this.render.bind(this);
        this.initUI();
        requestAnimationFrame(this.render);
    }

    initUI() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="content">
                <h1>MASTER PORTAL</h1>
                <p>The next generation 3D core architecture. High-performance liquid metal singularity engine deployed.</p>
            </div>
        `;
    }

    render(time) {
        this.singularity.update(time);
        this.particles.update(this.gfx.mouse);
        this.gfx.render(time);
        requestAnimationFrame(this.render);
    }
}

new App();
