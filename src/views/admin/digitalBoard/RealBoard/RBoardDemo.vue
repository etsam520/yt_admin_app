<script>
import { ref, reactive, onMounted } from 'vue';
import RBoard from './RBoard.vue';

export default {
    name: 'RBoardDemo',
    components: {
        RBoard
    },
    setup() {
        const isFullscreen = ref(false);
        const boardStats = reactive({
            elements: 0,
            lastChange: 'Never',
            autoSaves: 0,
            exports: 0
        });

        const handleBoardChange = (data) => {
            boardStats.elements = data.elements?.length || 0;
            boardStats.lastChange = new Date().toLocaleTimeString();
        };

        const handleBoardSaved = () => {
            boardStats.autoSaves += 1;
        };

        const handleBoardExported = () => {
            boardStats.exports += 1;
        };

        const loadSampleBoard = () => {
            // This would load a predefined sample board
            console.log('Loading sample board...');
            // You could emit an event or call a method on RBoard to load sample data
        };

        const resetBoard = () => {
            // Reset the board to empty state
            console.log('Resetting board...');
            boardStats.elements = 0;
            boardStats.lastChange = 'Never';
        };

        const toggleFullscreen = () => {
            isFullscreen.value = !isFullscreen.value;

            if (isFullscreen.value) {
                document.documentElement.requestFullscreen?.();
            } else {
                document.exitFullscreen?.();
            }
        };

        onMounted(() => {
            // Listen for fullscreen changes
            document.addEventListener('fullscreenchange', () => {
                if (!document.fullscreenElement) {
                    isFullscreen.value = false;
                }
            });
        });

        return {
            isFullscreen,
            boardStats,
            handleBoardChange,
            handleBoardSaved,
            handleBoardExported,
            loadSampleBoard,
            resetBoard,
            toggleFullscreen
        };
    }
};
</script>

<template>
    <div class="rboard-demo">
        <div class="demo-header">
            <h1>RBoard Demo - Real-time Digital Whiteboard</h1>
            <p>Experience the power of Excalidraw integrated natively with Vue.js</p>
        </div>

        <div class="demo-controls">
            <button @click="loadSampleBoard" class="demo-btn primary">
                <i class="pi pi-play"></i>
                Load Sample Board
            </button>

            <button @click="resetBoard" class="demo-btn secondary">
                <i class="pi pi-refresh"></i>
                Reset Board
            </button>

            <button @click="toggleFullscreen" class="demo-btn">
                <i class="pi pi-expand"></i>
                Fullscreen
            </button>
        </div>

        <!-- RBoard Component -->
        <div class="rboard-wrapper" :class="{ fullscreen: isFullscreen }">
            <RBoard @boardChange="handleBoardChange" @boardSaved="handleBoardSaved" @boardExported="handleBoardExported" />
        </div>

        <!-- Demo Info Panel -->
        <div class="demo-info" v-if="!isFullscreen">
            <h3>Board Statistics</h3>
            <div class="info-grid">
                <div class="info-card">
                    <i class="pi pi-palette"></i>
                    <div>
                        <h4>Elements</h4>
                        <p>{{ boardStats.elements }}</p>
                    </div>
                </div>

                <div class="info-card">
                    <i class="pi pi-clock"></i>
                    <div>
                        <h4>Last Change</h4>
                        <p>{{ boardStats.lastChange }}</p>
                    </div>
                </div>

                <div class="info-card">
                    <i class="pi pi-save"></i>
                    <div>
                        <h4>Auto-saves</h4>
                        <p>{{ boardStats.autoSaves }}</p>
                    </div>
                </div>

                <div class="info-card">
                    <i class="pi pi-download"></i>
                    <div>
                        <h4>Exports</h4>
                        <p>{{ boardStats.exports }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.rboard-demo {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
}

.demo-header {
    text-align: center;
    color: white;
    margin-bottom: 2rem;
}

.demo-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    font-weight: 700;
}

.demo-header p {
    font-size: 1.2rem;
    opacity: 0.9;
}

.demo-controls {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
}

.demo-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.demo-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
}

.demo-btn.primary {
    background: #4f46e5;
}

.demo-btn.primary:hover {
    background: #4338ca;
}

.demo-btn.secondary {
    background: #059669;
}

.demo-btn.secondary:hover {
    background: #047857;
}

.rboard-wrapper {
    background: white;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    height: 600px;
    margin-bottom: 2rem;
    transition: all 0.3s ease;
}

.rboard-wrapper.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    border-radius: 0;
    height: 100vh;
    margin: 0;
}

.demo-info {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    padding: 2rem;
    color: white;
}

.demo-info h3 {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.info-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    transition: transform 0.3s ease;
}

.info-card:hover {
    transform: translateY(-5px);
}

.info-card i {
    font-size: 2rem;
    color: #fbbf24;
}

.info-card h4 {
    margin: 0 0 0.25rem 0;
    font-weight: 600;
}

.info-card p {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
}

/* Responsive Design */
@media (max-width: 768px) {
    .rboard-demo {
        padding: 1rem;
    }

    .demo-header h1 {
        font-size: 2rem;
    }

    .demo-controls {
        flex-direction: column;
        align-items: center;
    }

    .demo-btn {
        width: 200px;
        justify-content: center;
    }

    .rboard-wrapper {
        height: 400px;
    }

    .info-grid {
        grid-template-columns: 1fr;
    }
}
</style>
