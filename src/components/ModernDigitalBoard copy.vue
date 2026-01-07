<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import '@excalidraw/excalidraw/index.css';

// Reactive data
const excalidrawContainer = ref(null);
const excalidrawAPI = ref(null);
const drawingCanvas = ref(null);

// Board state
const loading = ref(true);
const boardError = ref(null);
const loadingMessage = ref('Loading board components...');
const boardStatus = ref('Ready');
const elementCount = ref(0);
const lastSaved = ref(null);

// UI state
const darkMode = ref(false);
const isFullscreen = ref(false);
const zoomLevel = ref(100);
const showFloatingTools = ref(true);
const showStatusPanel = ref(false);

// Drawing state (inspired by DisplaySet.vue)
const drawingMode = ref(false);
const currentTool = ref('pen');
const drawingColor = ref('#ff0000');
const brushSize = ref(3);
const isDrawing = ref(false);
const drawingHistory = ref([]);
let drawingContext = null;

// Toolbar position (draggable like DisplaySet.vue)
const toolbarPosition = ref({ x: 20, y: 100 });

// Modal states
const showExportDialog = ref(false);
const showSaveDialog = ref(false);
const saving = ref(false);
const exporting = ref(false);

// Form data
const boardName = ref('');
const boardDescription = ref('');
const exportFormat = ref('png');
const exportQuality = ref('medium');
const includeBackground = ref(true);

// Dragging state (from DisplaySet.vue)
let isDragging = false;
let draggingElement = ref(null);
let dragOffset = { x: 0, y: 0 };

// Methods
const initializeBoard = async () => {
    loading.value = true;
    boardError.value = null;
    loadingMessage.value = 'Initializing board components...';

    try {
        await nextTick();

        if (!excalidrawContainer.value) {
            throw new Error('Board container not found');
        }

        loadingMessage.value = 'Loading React modules...';

        // Clear container
        excalidrawContainer.value.innerHTML = '';

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.id = 'excalidraw-modern-board';
        wrapper.style.height = '100%';
        wrapper.style.width = '100%';
        wrapper.className = 'excalidraw-modern-wrapper';
        excalidrawContainer.value.appendChild(wrapper);

        loadingMessage.value = 'Importing drawing engine...';

        // Import dependencies
        const React = await import('react');
        const { createRoot } = await import('react-dom/client');
        const { Excalidraw } = await import('@excalidraw/excalidraw');

        loadingMessage.value = 'Setting up drawing tools...';

        // Create Excalidraw element
        const excalidrawElement = React.createElement(Excalidraw, {
            initialData: {
                elements: [],
                appState: {
                    theme: darkMode.value ? 'dark' : 'light',
                    viewBackgroundColor: darkMode.value ? '#1e1e1e' : '#ffffff',
                    currentItemStrokeColor: '#000000',
                    currentItemBackgroundColor: 'transparent',
                    gridSize: null,
                    isBindingEnabled: true,
                    isLibraryOpen: false
                }
            },
            onChange: (elements, appState) => {
                elementCount.value = elements ? elements.length : 0;
                boardStatus.value = elementCount.value > 0 ? 'Modified' : 'Empty';

                // Auto-save functionality
                if (elements && elements.length > 0) {
                    autoSave(elements, appState);
                }
            },
            UIOptions: {
                canvasActions: {
                    export: false, // We handle this ourselves
                    loadScene: false,
                    saveToActiveFile: false,
                    toggleTheme: false,
                    clearCanvas: true
                },
                tools: {
                    image: true,
                    text: true
                }
            },
            langCode: 'en'
        });

        loadingMessage.value = 'Finalizing setup...';

        // Render
        const root = createRoot(wrapper);
        root.render(excalidrawElement);

        // Store API reference
        excalidrawAPI.value = { root, wrapper };

        // Initialize drawing canvas
        initDrawingCanvas();

        boardStatus.value = 'Ready';
    } catch (error) {
        console.error('❌ Board initialization failed:', error);
        boardError.value = error.message;
        boardStatus.value = 'Error';
    } finally {
        loading.value = false;
    }
};

// Drawing functions (inspired by DisplaySet.vue)
const initDrawingCanvas = () => {
    if (drawingCanvas.value) {
        drawingContext = drawingCanvas.value.getContext('2d');
        drawingCanvas.value.width = window.innerWidth;
        drawingCanvas.value.height = window.innerHeight;
        drawingContext.lineCap = 'round';
        drawingContext.lineJoin = 'round';
    }
};

const setTool = (tool) => {
    currentTool.value = tool;
};

const startDrawing = (event) => {
    if (!drawingMode.value || !drawingContext) return;

    saveCanvasState();
    isDrawing.value = true;

    const rect = drawingCanvas.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (currentTool.value === 'pen' || currentTool.value === 'highlighter') {
        drawingContext.beginPath();
        drawingContext.moveTo(x, y);
    }
};

const draw = (event) => {
    if (!isDrawing.value || !drawingMode.value || !drawingContext) return;

    const rect = drawingCanvas.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    drawingContext.lineWidth = brushSize.value;
    drawingContext.strokeStyle = drawingColor.value;

    if (currentTool.value === 'pen') {
        drawingContext.globalCompositeOperation = 'source-over';
        drawingContext.lineTo(x, y);
        drawingContext.stroke();
    } else if (currentTool.value === 'highlighter') {
        drawingContext.globalCompositeOperation = 'multiply';
        drawingContext.globalAlpha = 0.3;
        drawingContext.lineTo(x, y);
        drawingContext.stroke();
        drawingContext.globalAlpha = 1;
    } else if (currentTool.value === 'eraser') {
        drawingContext.globalCompositeOperation = 'destination-out';
        drawingContext.beginPath();
        drawingContext.arc(x, y, brushSize.value, 0, Math.PI * 2);
        drawingContext.fill();
    }
};

const stopDrawing = () => {
    if (!isDrawing.value) return;
    isDrawing.value = false;
    drawingContext.globalCompositeOperation = 'source-over';
};

const saveCanvasState = () => {
    if (drawingCanvas.value) {
        drawingHistory.value.push(drawingCanvas.value.toDataURL());
        if (drawingHistory.value.length > 20) {
            drawingHistory.value = drawingHistory.value.slice(-20);
        }
    }
};

const clearDrawing = () => {
    if (drawingContext && drawingCanvas.value) {
        saveCanvasState();
        drawingContext.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height);
    }
};

const undoDrawing = () => {
    if (drawingHistory.value.length > 0 && drawingContext && drawingCanvas.value) {
        const lastState = drawingHistory.value.pop();
        const img = new Image();
        img.onload = () => {
            drawingContext.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height);
            drawingContext.drawImage(img, 0, 0);
        };
        img.src = lastState;
    }
};

// Dragging functionality (from DisplaySet.vue)
const startDragging = (elementType, event) => {
    if (event.target.closest('.tool-btn') && elementType === 'toolbar') return;

    event.preventDefault();
    event.stopPropagation();

    isDragging = true;
    draggingElement.value = elementType;

    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    dragOffset.x = event.clientX - rect.left;
    dragOffset.y = event.clientY - rect.top;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDragging);

    element.style.cursor = 'grabbing';
};

const onDrag = (event) => {
    if (!isDragging || !draggingElement.value) return;

    const x = event.clientX - dragOffset.x;
    const y = event.clientY - dragOffset.y;

    const maxX = window.innerWidth - 300;
    const maxY = window.innerHeight - 200;

    const boundedX = Math.max(0, Math.min(x, maxX));
    const boundedY = Math.max(0, Math.min(y, maxY));

    if (draggingElement.value === 'toolbar') {
        toolbarPosition.value.x = boundedX;
        toolbarPosition.value.y = boundedY;
    }
};

const stopDragging = () => {
    isDragging = false;
    draggingElement.value = null;
    dragOffset = { x: 0, y: 0 };

    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDragging);
};

// Board actions
const newBoard = () => {
    if (confirm('Create a new board? All unsaved changes will be lost.')) {
        initializeBoard();
        elementCount.value = 0;
        boardStatus.value = 'Ready';
        lastSaved.value = null;
    }
};

const saveBoard = () => {
    showSaveDialog.value = true;
};

const performSave = async () => {
    saving.value = true;
    try {
        // Simulate save operation
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const saveData = {
            name: boardName.value,
            description: boardDescription.value,
            timestamp: new Date().toISOString(),
            elements: elementCount.value
        };

        localStorage.setItem(`board-${Date.now()}`, JSON.stringify(saveData));

        lastSaved.value = new Date().toLocaleString();
        boardStatus.value = 'Saved';
        showSaveDialog.value = false;
        boardName.value = '';
        boardDescription.value = '';
    } catch (error) {
        console.error('Save failed:', error);
    } finally {
        saving.value = false;
    }
};

const loadBoard = () => {
    // Implementation for loading saved boards
    console.log('Load board functionality');
};

const exportBoard = () => {
    showExportDialog.value = true;
};

const performExport = async () => {
    exporting.value = true;
    try {
        // Simulate export operation
        await new Promise((resolve) => setTimeout(resolve, 1500));

        console.log(`Exporting as ${exportFormat.value} with ${exportQuality.value} quality`);

        showExportDialog.value = false;
    } catch (error) {
        console.error('Export failed:', error);
    } finally {
        exporting.value = false;
    }
};

// View controls
const zoomIn = () => {
    if (zoomLevel.value < 200) {
        zoomLevel.value += 10;
    }
};

const zoomOut = () => {
    if (zoomLevel.value > 50) {
        zoomLevel.value -= 10;
    }
};

const resetZoom = () => {
    zoomLevel.value = 100;
};

const toggleTheme = () => {
    darkMode.value = !darkMode.value;
    // Update Excalidraw theme if available
    if (excalidrawAPI.value) {
        // Theme switching implementation
    }
};

const toggleFullscreen = () => {
    const elem = document.querySelector('.modern-digital-board');
    if (!document.fullscreenElement) {
        elem.requestFullscreen?.();
        isFullscreen.value = true;
    } else {
        document.exitFullscreen?.();
        isFullscreen.value = false;
    }
};

// Auto-save functionality
const autoSave = (elements, appState) => {
    try {
        const autoSaveData = {
            elements,
            appState,
            timestamp: Date.now()
        };
        localStorage.setItem('board-autosave', JSON.stringify(autoSaveData));
    } catch (error) {
        console.error('Auto-save failed:', error);
    }
};

// Lifecycle
onMounted(() => {
    initializeBoard();

    // Handle window resize
    window.addEventListener('resize', () => {
        if (drawingCanvas.value) {
            drawingCanvas.value.width = window.innerWidth;
            drawingCanvas.value.height = window.innerHeight;
        }
    });
});

onUnmounted(() => {
    if (excalidrawAPI.value?.root) {
        excalidrawAPI.value.root.unmount();
    }

    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDragging);
});
</script>

<template>
    <div class="modern-digital-board">
        <!-- Top Navigation Bar -->
        <div class="top-navigation">
            <div class="nav-left">
                <div class="app-title">
                    <i class="pi pi-palette"></i>
                    <span>Modern Digital Board</span>
                </div>
                <div class="board-info">
                    <span class="element-count">{{ elementCount }} elements</span>
                    <span class="separator">|</span>
                    <span class="board-status">{{ boardStatus }}</span>
                </div>
            </div>

            <div class="nav-center">
                <!-- Quick Action Buttons -->
                <div class="quick-actions">
                    <button class="action-btn" @click="newBoard" :disabled="loading" title="New Board">
                        <i class="pi pi-plus"></i>
                    </button>
                    <button class="action-btn save" @click="saveBoard" :disabled="elementCount === 0 || saving" title="Save Board">
                        <i class="pi pi-save"></i>
                    </button>
                    <button class="action-btn" @click="loadBoard" title="Load Board">
                        <i class="pi pi-folder-open"></i>
                    </button>
                    <div class="separator-vertical"></div>
                    <button class="action-btn" @click="exportBoard" :disabled="elementCount === 0" title="Export Board">
                        <i class="pi pi-download"></i>
                    </button>
                </div>
            </div>

            <div class="nav-right">
                <!-- View Controls -->
                <div class="view-controls">
                    <button class="control-btn" @click="zoomOut" :disabled="zoomLevel <= 50" title="Zoom Out">
                        <i class="pi pi-search-minus"></i>
                    </button>
                    <span class="zoom-display">{{ zoomLevel }}%</span>
                    <button class="control-btn" @click="zoomIn" :disabled="zoomLevel >= 200" title="Zoom In">
                        <i class="pi pi-search-plus"></i>
                    </button>
                    <button class="control-btn" @click="resetZoom" title="Reset Zoom">
                        <i class="pi pi-refresh"></i>
                    </button>
                    <div class="separator-vertical"></div>
                    <button class="control-btn" @click="toggleTheme" :title="darkMode ? 'Light Mode' : 'Dark Mode'">
                        <i :class="darkMode ? 'pi pi-sun' : 'pi pi-moon'"></i>
                    </button>
                    <button class="control-btn" @click="toggleFullscreen" title="Fullscreen">
                        <i class="pi pi-expand"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Main Board Area -->
        <div class="board-container" :class="{ fullscreen: isFullscreen, 'dark-mode': darkMode }">
            <!-- Loading Overlay -->
            <div v-if="loading" class="loading-overlay">
                <div class="loading-content">
                    <div class="spinner"></div>
                    <h3>Initializing Digital Board</h3>
                    <p>{{ loadingMessage }}</p>
                </div>
            </div>

            <!-- Error State -->
            <div v-if="boardError" class="error-overlay">
                <div class="error-content">
                    <i class="pi pi-exclamation-triangle"></i>
                    <h3>Board Initialization Failed</h3>
                    <p>{{ boardError }}</p>
                    <button class="retry-btn" @click="initializeBoard">
                        <i class="pi pi-refresh"></i>
                        Retry
                    </button>
                </div>
            </div>

            <!-- Excalidraw Container -->
            <div ref="excalidrawContainer" class="excalidraw-container" v-show="!loading && !boardError"></div>

            <!-- Floating Drawing Tools (inspired by DisplaySet.vue) -->
            <div
                v-if="showFloatingTools && !loading"
                class="floating-toolbar"
                :style="{
                    left: toolbarPosition.x + 'px',
                    top: toolbarPosition.y + 'px'
                }"
                @mousedown="startDragging('toolbar', $event)"
            >
                <div class="toolbar-header">
                    <span class="toolbar-title">Drawing Tools</span>
                    <button class="drag-handle" title="Drag to move">
                        <i class="pi pi-arrows-alt"></i>
                    </button>
                </div>
                <div class="toolbar-content">
                    <div class="tool-section">
                        <button class="tool-btn" :class="{ active: currentTool === 'pen' }" @click="setTool('pen')" title="Pen">
                            <i class="pi pi-pencil"></i>
                        </button>
                        <button class="tool-btn" :class="{ active: currentTool === 'highlighter' }" @click="setTool('highlighter')" title="Highlighter">
                            <i class="pi pi-palette"></i>
                        </button>
                        <button class="tool-btn" :class="{ active: currentTool === 'eraser' }" @click="setTool('eraser')" title="Eraser">
                            <i class="pi pi-times"></i>
                        </button>
                    </div>

                    <div class="tool-section">
                        <div class="color-picker-wrapper">
                            <input type="color" v-model="drawingColor" class="color-picker" title="Color" />
                        </div>
                        <div class="size-control">
                            <input type="range" v-model="brushSize" min="1" max="20" class="size-slider" title="Brush Size" />
                            <span class="size-indicator">{{ brushSize }}</span>
                        </div>
                    </div>

                    <div class="tool-section">
                        <button class="tool-btn clear-btn" @click="clearDrawing" title="Clear Drawing">
                            <i class="pi pi-trash"></i>
                        </button>
                        <button class="tool-btn" @click="undoDrawing" title="Undo">
                            <i class="pi pi-undo"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Floating Status Panel -->
            <div
                v-if="showStatusPanel"
                class="floating-status"
                :style="{
                    right: '20px',
                    top: '20px'
                }"
            >
                <div class="status-header">
                    <span>Board Status</span>
                    <button @click="showStatusPanel = false" class="close-btn">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="status-content">
                    <div class="status-item">
                        <span class="label">Elements:</span>
                        <span class="value">{{ elementCount }}</span>
                    </div>
                    <div class="status-item">
                        <span class="label">Theme:</span>
                        <span class="value">{{ darkMode ? 'Dark' : 'Light' }}</span>
                    </div>
                    <div class="status-item">
                        <span class="label">Zoom:</span>
                        <span class="value">{{ zoomLevel }}%</span>
                    </div>
                    <div class="status-item">
                        <span class="label">Last Saved:</span>
                        <span class="value">{{ lastSaved || 'Never' }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Drawing Canvas Overlay (inspired by DisplaySet.vue) -->
        <canvas ref="drawingCanvas" class="drawing-canvas" v-show="drawingMode" @mousedown="startDrawing" @mousemove="draw" @mouseup="stopDrawing" @mouseleave="stopDrawing"></canvas>

        <!-- Export Dialog -->
        <div v-if="showExportDialog" class="modal-overlay" @click="showExportDialog = false">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>Export Board</h3>
                    <button @click="showExportDialog = false" class="modal-close">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="export-options">
                        <div class="option-group">
                            <label>Format:</label>
                            <select v-model="exportFormat" class="format-select">
                                <option value="png">PNG Image</option>
                                <option value="svg">SVG Vector</option>
                                <option value="json">JSON Data</option>
                                <option value="pdf">PDF Document</option>
                            </select>
                        </div>
                        <div class="option-group">
                            <label>Quality:</label>
                            <select v-model="exportQuality" class="quality-select">
                                <option value="low">Low (Fast)</option>
                                <option value="medium">Medium</option>
                                <option value="high">High (Slow)</option>
                            </select>
                        </div>
                        <div class="option-group">
                            <label>Include Background:</label>
                            <input type="checkbox" v-model="includeBackground" class="checkbox" />
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button @click="showExportDialog = false" class="btn-secondary">Cancel</button>
                    <button @click="performExport" class="btn-primary" :disabled="exporting">
                        <i v-if="exporting" class="pi pi-spin pi-spinner"></i>
                        {{ exporting ? 'Exporting...' : 'Export' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Save Dialog -->
        <div v-if="showSaveDialog" class="modal-overlay" @click="showSaveDialog = false">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>Save Board</h3>
                    <button @click="showSaveDialog = false" class="modal-close">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="boardName">Board Name:</label>
                        <input id="boardName" type="text" v-model="boardName" placeholder="Enter board name" class="text-input" />
                    </div>
                    <div class="form-group">
                        <label for="boardDescription">Description (optional):</label>
                        <textarea id="boardDescription" v-model="boardDescription" placeholder="Brief description of the board" class="textarea-input" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button @click="showSaveDialog = false" class="btn-secondary">Cancel</button>
                    <button @click="performSave" class="btn-primary" :disabled="!boardName || saving">
                        <i v-if="saving" class="pi pi-spin pi-spinner"></i>
                        {{ saving ? 'Saving...' : 'Save' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Floating Action Button -->
        <button class="fab" @click="showStatusPanel = !showStatusPanel" title="Board Info">
            <i class="pi pi-info"></i>
        </button>

        <!-- Toggle Floating Tools Button -->
        <button class="fab fab-secondary" @click="showFloatingTools = !showFloatingTools" title="Toggle Drawing Tools" :style="{ right: '80px' }">
            <i class="pi pi-palette"></i>
        </button>
    </div>
</template>

<style scoped>
/* Modern Digital Board Styles */
.modern-digital-board {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--surface-ground, #f8f9fa);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    position: relative;
    overflow: hidden;
}

/* Top Navigation */
.top-navigation {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0.75rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 100;
    flex-shrink: 0;
}

.nav-left {
    display: flex;
    align-items: center;
    gap: 2rem;
}

.app-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
}

.app-title i {
    font-size: 1.5rem;
    color: #ffd700;
}

.board-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    opacity: 0.9;
}

.separator {
    color: rgba(255, 255, 255, 0.5);
}

.nav-center {
    flex: 1;
    display: flex;
    justify-content: center;
}

.quick-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.5rem;
    border-radius: 0.75rem;
    backdrop-filter: blur(10px);
}

.action-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 0.5rem;
    color: white;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
}

.action-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
}

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.action-btn.save {
    background: rgba(34, 197, 94, 0.8);
}

.separator-vertical {
    width: 1px;
    height: 1.5rem;
    background: rgba(255, 255, 255, 0.3);
    margin: 0 0.25rem;
}

.nav-right {
    display: flex;
    align-items: center;
}

.view-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.control-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 0.375rem;
    color: white;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
}

.control-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
}

.control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.zoom-display {
    font-size: 0.75rem;
    font-weight: 500;
    min-width: 2.5rem;
    text-align: center;
}

/* Board Container */
.board-container {
    flex: 1;
    position: relative;
    background: #ffffff;
    overflow: hidden;
}

.board-container.dark-mode {
    background: #1e1e1e;
}

.board-container.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
}

.excalidraw-container {
    width: 100%;
    height: 100%;
    position: relative;
}

/* Loading Overlay */
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.loading-content {
    text-align: center;
    color: #4b5563;
}

.spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.loading-content h3 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
}

.loading-content p {
    margin: 0;
    font-size: 0.875rem;
    opacity: 0.7;
}

/* Error Overlay */
.error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.error-content {
    text-align: center;
    color: #dc2626;
    max-width: 400px;
    padding: 2rem;
}

.error-content i {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.error-content h3 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
}

.error-content p {
    margin: 0 0 1.5rem;
    font-size: 0.875rem;
    color: #6b7280;
}

.retry-btn {
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 auto;
    transition: background 0.2s ease;
}

.retry-btn:hover {
    background: #b91c1c;
}

/* Floating Toolbar (inspired by DisplaySet.vue) */
.floating-toolbar {
    position: absolute;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(20px);
    z-index: 500;
    min-width: 200px;
    user-select: none;
}

.toolbar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 0.75rem 0.75rem 0 0;
}

.toolbar-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
}

.drag-handle {
    background: none;
    border: none;
    color: #6b7280;
    cursor: grab;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
}

.drag-handle:hover {
    background: rgba(107, 114, 128, 0.1);
    color: #374151;
}

.drag-handle:active {
    cursor: grabbing;
}

.toolbar-content {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.tool-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.tool-btn {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    color: #374151;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
}

.tool-btn:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
}

.tool-btn.active {
    background: #667eea;
    border-color: #667eea;
    color: white;
}

.tool-btn.clear-btn {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
}

.tool-btn.clear-btn:hover {
    background: #fee2e2;
    border-color: #fca5a5;
}

.color-picker-wrapper {
    position: relative;
}

.color-picker {
    width: 2.5rem;
    height: 2.5rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    background: none;
}

.color-picker::-webkit-color-swatch-wrapper {
    padding: 0;
    border-radius: 0.375rem;
}

.color-picker::-webkit-color-swatch {
    border: none;
    border-radius: 0.375rem;
}

.size-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 120px;
}

.size-slider {
    flex: 1;
    height: 0.25rem;
    background: #e5e7eb;
    border-radius: 0.125rem;
    outline: none;
    cursor: pointer;
}

.size-slider::-webkit-slider-thumb {
    appearance: none;
    width: 1rem;
    height: 1rem;
    background: #667eea;
    border-radius: 50%;
    cursor: pointer;
}

.size-indicator {
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    min-width: 1.5rem;
    text-align: center;
}

/* Floating Status Panel */
.floating-status {
    position: absolute;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(20px);
    z-index: 500;
    min-width: 200px;
}

.status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    background: rgba(34, 197, 94, 0.1);
    border-radius: 0.75rem 0.75rem 0 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
}

.close-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
}

.close-btn:hover {
    background: rgba(107, 114, 128, 0.1);
    color: #374151;
}

.status-content {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
}

.status-item .label {
    color: #6b7280;
    font-weight: 500;
}

.status-item .value {
    color: #374151;
    font-weight: 600;
}

/* Drawing Canvas */
.drawing-canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: auto;
    z-index: 400;
    cursor: crosshair;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(4px);
}

.modal-content {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
}

.modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
}

.modal-close {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
}

.modal-close:hover {
    background: #f3f4f6;
    color: #374151;
}

.modal-body {
    padding: 1.5rem;
    max-height: 400px;
    overflow-y: auto;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
}

/* Form Elements */
.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
}

.text-input,
.textarea-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: border-color 0.2s ease;
}

.text-input:focus,
.textarea-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.textarea-input {
    resize: vertical;
    min-height: 80px;
}

.option-group {
    margin-bottom: 1rem;
}

.option-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
}

.format-select,
.quality-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: white;
}

.checkbox {
    width: 1rem;
    height: 1rem;
    accent-color: #667eea;
}

/* Buttons */
.btn-primary {
    background: #667eea;
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
    background: #5a67d8;
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-secondary {
    background: #f9fafb;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-secondary:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
}

/* Floating Action Buttons */
.fab {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 3.5rem;
    height: 3.5rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
    z-index: 1000;
}

.fab:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
}

.fab.fab-secondary {
    background: #10b981;
    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
}

.fab.fab-secondary:hover {
    box-shadow: 0 12px 40px rgba(16, 185, 129, 0.4);
}

/* Responsive Design */
@media (max-width: 768px) {
    .top-navigation {
        padding: 0.5rem 1rem;
        flex-direction: column;
        gap: 0.75rem;
    }

    .nav-left,
    .nav-center,
    .nav-right {
        width: 100%;
        justify-content: center;
    }

    .board-info {
        justify-content: center;
    }

    .quick-actions {
        justify-content: center;
    }

    .floating-toolbar {
        position: fixed;
        bottom: 1rem;
        left: 1rem;
        right: 1rem;
        top: auto;
    }

    .toolbar-content {
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
    }

    .fab {
        bottom: 5rem;
    }

    .fab.fab-secondary {
        bottom: 5rem;
        right: 5rem;
    }
}

/* Dark mode adjustments */
.board-container.dark-mode .floating-toolbar,
.board-container.dark-mode .floating-status {
    background: rgba(31, 41, 55, 0.95);
    border-color: #374151;
}

.board-container.dark-mode .toolbar-header,
.board-container.dark-mode .status-header {
    background: rgba(102, 126, 234, 0.2);
    border-color: #374151;
}

.board-container.dark-mode .toolbar-title,
.board-container.dark-mode .status-header {
    color: #f9fafb;
}

.board-container.dark-mode .tool-btn {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
}

.board-container.dark-mode .tool-btn:hover {
    background: #4b5563;
}

.board-container.dark-mode .status-item .label {
    color: #9ca3af;
}

.board-container.dark-mode .status-item .value {
    color: #f9fafb;
}

/* Excalidraw integration styles */
.excalidraw-modern-wrapper {
    font-family: inherit !important;
}

.excalidraw-modern-wrapper :deep(.excalidraw) {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
}

.excalidraw-modern-wrapper :deep(.App-toolbar) {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px) !important;
    border-radius: 0.5rem !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.excalidraw-modern-wrapper :deep(.App-menu_top) {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px) !important;
    border-radius: 0.5rem !important;
}
</style>
