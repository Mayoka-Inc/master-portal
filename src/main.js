import { Scene } from './gfx/Scene';
import { Singularity } from './gfx/Singularity';
import { Particles } from './gfx/Particles';
import { AudioManager } from './audio/AudioManager';
import { signal, effect } from '@preact/signals-core';
import { gsap } from 'gsap';

// --- SIGNALS ---
const currentView = signal('CORE'); // Options: CORE, SYSTEM, NETWORK, DATA

class App {
    constructor() {
        this.gfx = new Scene('app');
        this.singularity = new Singularity(this.gfx.scene);
        this.particles = new Particles(this.gfx.scene);
        this.audio = new AudioManager();
        
        // Nova System: Speed tracking
        this.lastMousePos = { x: 0, y: 0 };
        this.cursorSpeed = 0;
        
        this.render = this.render.bind(this);
        this.initUI();
        this.setupReactiveUI();
        this.initAnimations();
        this.setupAudioTrigger();
        
        requestAnimationFrame(this.render);
    }

    setupAudioTrigger() {
        const trigger = () => {
            this.audio.init();
            // Trigger Master Entry sound sequence
            setTimeout(() => {
                this.audio.playScanSound();
            }, 500);
            window.removeEventListener('click', trigger);
            window.removeEventListener('keydown', trigger);
        };
        window.addEventListener('click', trigger);
        window.addEventListener('keydown', trigger);
    }

    initUI() {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="hud-overlay" style="opacity: 0;">
                <div class="corner top-left"></div>
                <div class="corner top-right"></div>
                <div class="corner bottom-left"></div>
                <div class="corner bottom-right"></div>
                
                <nav id="main-nav">
                    <div class="nav-item" data-view="CORE">CORE</div>
                    <div class="nav-item" data-view="SYSTEM">SYSTEM</div>
                    <div class="nav-item" data-view="NETWORK">NETWORK</div>
                    <div class="nav-item" data-view="DATA">DATA</div>
                </nav>

                <div class="content-area">
                    <h1 id="view-title">MASTER PORTAL</h1>
                    <div class="status-box">
                        <div id="view-content">Initializing...</div>
                        <div style="margin-top: 10px; font-size: 0.8rem; color: #888;">
                            LOAD_SEQ: <span class="purple-text">0x7F2A...</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="scan-line"></div>
        `;

        // Navigation event listeners
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                currentView.value = e.target.getAttribute('data-view');
            });

            // GSAP Micro-interactions on hover
            item.addEventListener('mouseenter', () => {
                gsap.to(item, { 
                    scale: 1.05, 
                    duration: 0.2, 
                    boxShadow: "0 0 20px rgba(0, 242, 255, 0.6)",
                    borderColor: "rgba(0, 242, 255, 1)"
                });
            });

            item.addEventListener('mouseleave', () => {
                if (currentView.value !== item.getAttribute('data-view')) {
                    gsap.to(item, { 
                        scale: 1, 
                        duration: 0.2, 
                        boxShadow: "0 0 0px rgba(0, 242, 255, 0)",
                        borderColor: "rgba(0, 242, 255, 0.3)"
                    });
                }
            });
        });
    }

    setupReactiveUI() {
        // Effect to handle view changes reactively
        effect(() => {
            const view = currentView.value;
            const title = document.getElementById('view-title');
            const content = document.getElementById('view-content');
            
            // Update active state in CSS
            document.querySelectorAll('.nav-item').forEach(item => {
                if (item.getAttribute('data-view') === view) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // Animate content transition
            gsap.fromTo([title, content], 
                { opacity: 0, y: 10 }, 
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }
            );

            // Update content based on signal
            title.innerText = `PORTAL // ${view}`;
            
            const contentMap = {
                CORE: "Liquid metal singularity engine stable. Core temp: 450K. Flux stable.",
                SYSTEM: "Sub-systems operational. HUD layer active. Reactive signal bus synchronized.",
                NETWORK: "Global mesh network connected. Signal strength: 99.8%. Latency: 2ms.",
                DATA: "Processing metadata stream. 4.2PB indexed. Encryption level: G-OMEGA."
            };
            
            content.innerText = contentMap[view] || "Error: Unknown view";
        });
    }

    initAnimations() {
        // Scanning animation
        gsap.to(".scan-line", {
            top: "100%",
            opacity: 1,
            duration: 2.5,
            ease: "power2.inOut",
            repeat: -1,
            repeatDelay: 1
        });

        // Master Entry Sequence: UI Fade In
        const tl = gsap.timeline({ delay: 0.5 });
        
        tl.to(".hud-overlay", {
            opacity: 1,
            duration: 1.5,
            ease: "power2.out"
        });

        tl.from(".corner", {
            width: 0,
            height: 0,
            duration: 1.2,
            stagger: 0.15,
            ease: "expo.out"
        }, "-=1");

        tl.from(".nav-item", {
            opacity: 0,
            y: -20,
            duration: 0.8,
            stagger: 0.1,
            ease: "back.out(1.7)"
        }, "-=0.5");
    }

    orchestrate() {
        const mouse = this.gfx.mouse;
        if (!mouse) return;

        // Calculate Cursor Speed (Nova)
        const dx = mouse.x - this.lastMousePos.x;
        const dy = mouse.y - this.lastMousePos.y;
        const instantSpeed = Math.sqrt(dx * dx + dy * dy);
        
        // Smoothing
        this.cursorSpeed += (instantSpeed - this.cursorSpeed) * 0.1;
        this.lastMousePos.x = mouse.x;
        this.lastMousePos.y = mouse.y;

        // Link Cursor Speed to Shader Intensity (Atlas)
        const intensity = Math.min(1.0, this.cursorSpeed * 10);
        this.singularity.setIntensity(intensity);

        // Link Cursor Speed to Filter Cutoff (Aura)
        // AudioManager.update already handles speed internally, but we'll 
        // override/ensure it's synced if needed. 
        // Actually AudioManager.update(mouse) does its own speed calc.
        // Let's just make sure it's called.
    }

    render(time) {
        this.orchestrate();
        this.singularity.update(time);
        this.particles.update(this.gfx.mouse);
        this.audio.update(this.gfx.mouse);
        this.gfx.render(time);
        requestAnimationFrame(this.render);
    }
}

new App();
