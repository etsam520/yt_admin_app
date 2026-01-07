<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { excalidrawIntegration, createExcalidrawElement } from '@/utils/excalidrawIntegration.js';

export default {
    name: 'RBoard',
    setup() {
        // Reactive variables
        const excalidrawContainer = ref(null);
        const excalidrawWrapper = ref(null);
        const isConnected = ref(false);
        const hasChanges = ref(false);
        const showInfoPanel = ref(false);
        const elementCount = ref(0);
        const lastModified = ref(new Date().toLocaleString());
        const connectedUsers = ref(1);

        // Board state
        const currentElements = ref([]);
        const currentAppState = ref({});

        // Initialize Excalidraw
        const initializeExcalidraw = async () => {
            try {
                // Wait for the DOM to be ready
                await nextTick();

                // Add small delay to ensure container is fully rendered
                await new Promise((resolve) => setTimeout(resolve, 200));

                if (!excalidrawWrapper.value) {
                    console.error('Excalidraw wrapper not found');
                    return;
                }

                // Set up callbacks
                excalidrawIntegration.setCallbacks({
                    onChange: handleExcalidrawChange,
                    onPointerUpdate: handlePointerUpdate,
                    onCollabButtonClick: handleCollabButtonClick
                });

                // Initialize with options
                const initResult = await excalidrawIntegration.initialize(excalidrawWrapper.value, {
                    name: 'RealTime Digital Board',
                    theme: 'light',
                    gridModeEnabled: false,
                    UIOptions: {
                        canvasActions: {
                            loadScene: false,
                            export: {
                                saveFileToDisk: false
                            },
                            saveAsImage: false,
                            clearCanvas: true,
                            changeViewBackgroundColor: true
                        }
                    }
                });

                if (initResult.success) {
                    isConnected.value = true;
                    console.log('Excalidraw initialized successfully');
                } else {
                    console.error('Failed to initialize Excalidraw:', initResult.error);
                    isConnected.value = false;
                }
            } catch (error) {
                console.error('Failed to initialize Excalidraw:', error);
                isConnected.value = false;
            }
        };

        // Event handlers
        const handleExcalidrawChange = (elements, appState, files) => {
            // Normalize appState to ensure collaborators is a Map
            const normalizedAppState = {
                viewBackgroundColor: '#ffffff',
                collaborators: new Map(),
                isCollaborating: false,
                ...appState,
                // Ensure collaborators is always a Map
                collaborators: appState.collaborators instanceof Map ? appState.collaborators : new Map()
            };

            currentElements.value = elements;
            currentAppState.value = normalizedAppState;
            elementCount.value = elements.length;
            hasChanges.value = true;
            lastModified.value = new Date().toLocaleString();

            // Emit change event for real-time sync
            emitBoardChange({
                elements,
                appState: normalizedAppState,
                files
            });
        };

        const handlePointerUpdate = (payload) => {
            // Handle real-time pointer updates for collaborative editing
            console.log('Pointer update:', payload);
        };

        const handleCollabButtonClick = () => {
            // Toggle info panel when collaboration button is clicked
            showInfoPanel.value = !showInfoPanel.value;
        };

        // Board data management - simplified since no persistence needed
        const handleBoardDataChange = () => {
            // This function can be used for real-time sync in the future
            console.log('Board data changed - ready for real-time sync');
        };

        // Board actions
        const saveBoard = async () => {
            try {
                // Placeholder for save functionality - no localStorage saving needed
                hasChanges.value = false;
                console.log('Board state captured (not persisted)');
                // You can add a toast notification here
            } catch (error) {
                console.error('Failed to save board:', error);
            }
        };

        const exportBoard = async () => {
            try {
                const exportResult = await excalidrawIntegration.exportToPNG(currentElements.value, currentAppState.value, {
                    exportBackground: true,
                    exportScale: 2
                });

                if (exportResult.success) {
                    // Download the image
                    const link = document.createElement('a');
                    link.download = `realtime-board-${Date.now()}.png`;
                    link.href = exportResult.dataURL;
                    link.click();

                    console.log('Board exported successfully');
                } else {
                    console.error('Export failed:', exportResult.error);
                }
            } catch (error) {
                console.error('Failed to export board:', error);
            }
        };

        const shareBoard = () => {
            // Generate shareable link
            const shareUrl = `${window.location.origin}/board/share/${generateShareId()}`;

            if (navigator.share) {
                navigator.share({
                    title: 'Real-time Digital Board',
                    url: shareUrl
                });
            } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(shareUrl).then(() => {
                    console.log('Share URL copied to clipboard:', shareUrl);
                    // You can add a toast notification here
                });
            }
        };

        const clearBoard = async () => {
            if (confirm('Are you sure you want to clear the entire board? This action cannot be undone.')) {
                try {
                    const emptyAppState = excalidrawIntegration.normalizeAppState({});
                    await excalidrawIntegration.updateScene([], emptyAppState);
                    currentElements.value = [];
                    currentAppState.value = emptyAppState;
                    elementCount.value = 0;
                    hasChanges.value = true;
                    console.log('Board cleared');
                } catch (error) {
                    console.error('Failed to clear board:', error);
                }
            }
        };

        // Helper functions
        const generateShareId = () => {
            return Math.random().toString(36).substring(2, 15);
        };

        const emitBoardChange = (data) => {
            // Emit real-time changes via WebSocket or other mechanism
            // This is where you would integrate with your real-time sync system

            // Create a serializable version of the data for logging
            const logData = {
                elements: data.elements,
                appState: {
                    ...data.appState,
                    collaborators: data.appState.collaborators instanceof Map ? Object.fromEntries(data.appState.collaborators) : data.appState.collaborators
                },
                files: data.files
            };

            console.log('Board change:', logData);
        };

        // Lifecycle hooks
        onMounted(() => {
            initializeExcalidraw();
        });

        onUnmounted(() => {
            // Cleanup Excalidraw instance
            excalidrawIntegration.destroy();
        });

        return {
            // Refs
            excalidrawContainer,
            excalidrawWrapper,

            // State
            isConnected,
            hasChanges,
            showInfoPanel,
            elementCount,
            lastModified,
            connectedUsers,

            // Methods
            saveBoard,
            exportBoard,
            shareBoard,
            clearBoard
        };
    }
};
</script>

<template>
    <div class="realtime-board-container">
        <!-- Board Header -->
        <div class="board-header">
            <div class="header-left">
                <h2 class="board-title">Real-time Digital Board</h2>
                <div class="board-status">
                    <span class="status-indicator" :class="{ online: isConnected, offline: !isConnected }"></span>
                    <span class="status-text">{{ isConnected ? 'Connected' : 'Offline' }}</span>
                </div>
            </div>

            <div class="header-actions">
                <button class="action-btn" @click="saveBoard" :disabled="!hasChanges">
                    <i class="pi pi-save"></i>
                    Save
                </button>

                <button class="action-btn" @click="exportBoard">
                    <i class="pi pi-download"></i>
                    Export
                </button>

                <button class="action-btn" @click="shareBoard">
                    <i class="pi pi-share-alt"></i>
                    Share
                </button>

                <button class="action-btn danger" @click="clearBoard">
                    <i class="pi pi-trash"></i>
                    Clear
                </button>
            </div>
        </div>

        <!-- Excalidraw Board Container -->
        <div class="excalidraw-container" ref="excalidrawContainer">
            <div id="excalidraw-board" ref="excalidrawWrapper"></div>
        </div>

        <!-- Board Info Panel -->
        <div class="info-panel" v-if="showInfoPanel">
            <div class="panel-header">
                <h4>Board Information</h4>
                <button @click="showInfoPanel = false" class="close-btn">
                    <i class="pi pi-times"></i>
                </button>
            </div>
            <div class="panel-content">
                <div class="info-item">
                    <label>Elements:</label>
                    <span>{{ elementCount }}</span>
                </div>
                <div class="info-item">
                    <label>Last Modified:</label>
                    <span>{{ lastModified }}</span>
                </div>
                <div class="info-item">
                    <label>Connected Users:</label>
                    <span>{{ connectedUsers }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Import Excalidraw styles globally */
@import '@excalidraw/excalidraw/index.css';

.realtime-board-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f8fafc;
    position: relative;
}

.board-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    z-index: 100;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.board-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
}

.board-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
}

.status-indicator.online {
    background: #10b981;
}

.status-text {
    font-size: 0.875rem;
    color: #64748b;
}

.header-actions {
    display: flex;
    gap: 0.75rem;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: white;
    color: #374151;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
}

.action-btn:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
}

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.action-btn.danger {
    color: #dc2626;
    border-color: #fca5a5;
}

.action-btn.danger:hover {
    background: #fef2f2;
    border-color: #f87171;
}

.excalidraw-container {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: white;
}

#excalidraw-board {
    width: 100%;
    height: 100%;
    position: relative;
}

/* Ensure Excalidraw elements are properly styled */
.excalidraw-container :deep(.excalidraw) {
    height: 100% !important;
    width: 100% !important;
}

.excalidraw-container :deep(.excalidraw .App-menu_top) {
    z-index: 10;
}

.excalidraw-container :deep(.excalidraw .App-menu_bottom) {
    z-index: 10;
}

.info-panel {
    position: fixed;
    top: 5rem;
    right: 1rem;
    width: 300px;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border: 1px solid #e2e8f0;
    z-index: 1000;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.panel-header h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
}

.close-btn {
    padding: 0.25rem;
    border: none;
    border-radius: 0.25rem;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    transition: color 0.2s;
}

.close-btn:hover {
    color: #1e293b;
}

.panel-content {
    padding: 1rem;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f1f5f9;
}

.info-item:last-child {
    border-bottom: none;
}

.info-item label {
    font-weight: 500;
    color: #64748b;
    font-size: 0.875rem;
}

.info-item span {
    color: #1e293b;
    font-size: 0.875rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    .board-header {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }

    .header-actions {
        width: 100%;
        justify-content: center;
        flex-wrap: wrap;
    }

    .info-panel {
        left: 1rem;
        right: 1rem;
        width: auto;
    }
}

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

/* Hide Excalidraw's built-in zoom controls */
.modern-digital-board :deep(.excalidraw-zoom) {
    display: none !important;
}

.modern-digital-board :deep(.zoom-actions) {
    display: none !important;
}

.modern-digital-board :deep(.App-menu__left) {
    display: none !important;
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

/* Floating components styles (from DisplaySet.vue) */
.floating-draggable {
    position: fixed;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 1rem;
    cursor: move;
    user-select: none;
    z-index: 1001;
    min-width: 300px;
    max-width: 500px;
}
.floating-draggable.question-timer {
    background: #e9ecef;
    padding: 8px 15px;
    border-radius: 50%;
    height: 200px;
    width: 200px;
    font-size: 55px;
    font-weight: 600;
    color: #0f4c75;
    border: 15px solid;
    margin: 20px;
    transition:
        opacity 1.5s ease-out,
        transform 1.5s ease-out,
        box-shadow 0.2s ease;
    opacity: 1;
    transform: scale(1);
}
.floating-draggable.question-timer.fade-out {
    opacity: 0.3;
    transform: scale(0.95);
}
.timer {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.floating-draggable:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.drag-handle {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    color: #6b7280;
    font-size: 12px;
    font-weight: bold;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.drag-handle:hover {
    background: rgba(107, 114, 128, 0.1);
    color: #374151;
}

.drag-handle:active {
    cursor: grabbing;
}

/* Control Panel Styles (from DisplaySet.vue) */

/* Resizable functionality */
.resizable {
    position: relative;
}

.resize-handle {
    position: absolute;
    background: rgba(102, 126, 234, 0.2);
    transition: background 0.2s ease;
    z-index: 10;
}

.resize-handle:hover {
    background: rgba(102, 126, 234, 0.4);
}

/* Touch-friendly resize handles for mobile */
@media (max-width: 768px) {
    .resize-handle-right {
        width: 12px !important;
        right: -6px !important;
    }

    .resize-handle-bottom {
        height: 12px !important;
        bottom: -6px !important;
    }

    .resize-handle-corner {
        width: 20px !important;
        height: 20px !important;
        right: -10px !important;
        bottom: -10px !important;
    }
}

.resize-handle-right {
    top: 0;
    right: -2px;
    width: 4px;
    height: 100%;
    cursor: ew-resize;
}

.resize-handle-bottom {
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 4px;
    cursor: ns-resize;
}

.resize-handle-corner {
    bottom: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    cursor: nwse-resize;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 0 0 0.75rem 0;
}

.resize-handle-corner::after {
    content: '';
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-bottom: 6px solid rgba(255, 255, 255, 0.8);
}

/* Enhanced Question Box */
.question-box {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-width: none;
    width: 100%;
}

.question-content {
    flex: 1;
    overflow: auto;
    word-wrap: break-word;
    hyphens: auto;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
}

.question-text {
    font-size: inherit;
    line-height: inherit;
    word-wrap: break-word;
    overflow-wrap: break-word;
    transition: font-size 0.2s ease;
}

.question-number {
    font-weight: 600;
    color: #4f46e5;
    margin-bottom: 0.75rem;
    flex-shrink: 0;
}

.question-image {
    margin-top: 1rem;
    text-align: center;
}

/* Enhanced Solution Box */
.solution-box {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-width: none;
    width: 100%;
    border-left: 4px solid #059669;
    box-shadow: 0 8px 32px rgba(5, 150, 105, 0.15);
}

.solution-content {
    flex: 1;
    overflow: auto;
    word-wrap: break-word;
    hyphens: auto;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
}

.solution-text {
    font-size: inherit;
    line-height: inherit;
    word-wrap: break-word;
    overflow-wrap: break-word;
    transition: font-size 0.2s ease;
}

.solution-header {
    font-weight: 600;
    color: #059669;
    margin-bottom: 0.75rem;
    flex-shrink: 0;
}

.solution-images {
    margin-top: 1rem;
}

.solution-image {
    text-align: center;
    margin-bottom: 0.5rem;
}

.question-image img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Enhanced Options Container */
.options-container {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-width: none;
    width: 100%;
}

.options-content {
    flex: 1;
    overflow: auto;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
}

.option {
    align-items: center;
    /*border: 2px solid #e5e7eb;*/
    cursor: pointer;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.8);
    word-wrap: break-word;
}

.option:hover {
    /* border-color: #3b82f6; */
    background: rgba(59, 130, 246, 0.05);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.option.selected {
    /* border-color: #3b82f6; */
    background: rgba(59, 130, 246, 0.1);
}

.option.correct {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.1);
}

.option.incorrect {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
}

.option-letter {
    font-weight: 600;
    color: #4f46e5;
    text-align: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.option-text {
    line-height: inherit;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
    transition: font-size 0.2s ease;
}

/* Enhanced drag handle */
.floating-draggable .drag-handle {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-align: center;
    cursor: grab;
    border-radius: 0.75rem 0.75rem 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    user-select: none;
}

.floating-draggable .drag-handle:active {
    cursor: grabbing;
}

.floating-draggable {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(10px);
    user-select: none;
    min-width: 200px;
    min-height: 100px;
    max-width: none !important;
    width: auto;
}

.floating-draggable:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

/* Compact Panel Styles */
.timer-controls-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 8px;
    margin-bottom: 16px;
}

.timer-controls-grid .reset-btn {
    grid-column: 1 / -1;
}

.timer-control-btn {
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-height: 60px;
    justify-content: center;
}

.timer-control-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.timer-control-btn.start-btn {
    background: #4caf50;
    color: white;
}

.timer-control-btn.start-btn:hover:not(:disabled) {
    background: #45a049;
}

.timer-control-btn.pause-btn {
    background: #ffc107;
    color: white;
}

.timer-control-btn.pause-btn:hover:not(:disabled) {
    background: #e0a800;
}

.timer-control-btn.reset-btn {
    background: #f44336;
    color: white;
}

.timer-control-btn.reset-btn:hover {
    background: #da190b;
}

.timer-input-section {
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.timer-label {
    font-size: 14px;
    font-weight: 500;
    color: #495057;
    margin-bottom: 8px;
    display: block;
}

.time-input-container {
    display: flex;
    align-items: center;
    gap: 8px;
}

.time-input {
    width: 80px;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 6px;
    font-size: 14px;
    text-align: center;
}

.time-input:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
}

.time-unit {
    font-size: 14px;
    color: #6c757d;
    font-weight: 500;
}

/* Question Navigation Styles */
.navigation-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 0 4px;
}

.nav-arrow-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: #f5f5f5;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #666;
}

.nav-arrow-btn:hover:not(:disabled) {
    background: #e0e0e0;
    color: #333;
}

.nav-arrow-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.page-text {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    background: #f8f9fa;
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid #e9ecef;
}

.question-grid-container {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
}

.question-grid-btn {
    width: 40px;
    height: 40px;
    border: 1px solid #e0e0e0;
    background: #ffffff;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333;
}

.question-grid-btn:hover {
    background: #f5f5f5;
    border-color: #d0d0d0;
}

.question-grid-btn.active {
    background: #4285f4;
    color: white;
    border-color: #4285f4;
    font-weight: 600;
}

.question-grid-btn.answered {
    background: #34a853;
    color: white;
    border-color: #34a853;
}

/* Answer Controls Styles */
.answer-controls-layout {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.answer-buttons-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.answer-control-btn {
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
}

.answer-control-btn.show-answer-btn {
    background: #4285f4;
    color: white;
}

.answer-control-btn.show-answer-btn:hover {
    background: #3367d6;
}

.answer-control-btn.clear-btn {
    background: #9e9e9e;
    color: white;
}

.answer-control-btn.clear-btn:hover {
    background: #757575;
}

.answer-control-btn.solution-btn {
    background: #e0e0e0;
    color: #333;
    border: 1px solid #d0d0d0;
}

.answer-control-btn.solution-btn:hover {
    background: #d5d5d5;
}

.answer-control-btn.full-width {
    width: 100%;
}

/* Mirror Controls Styles */
.mirror-layout {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.mirror-btn.create-btn {
    padding: 12px 16px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
}

.mirror-btn.create-btn:hover {
    background: #5a6268;
}

.mirror-key-container {
    padding: 12px 16px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s ease;
    min-height: 48px;
}

.mirror-key-container:hover {
    background: #e2e6ea;
}

.key-icon {
    color: #6c757d;
}

.key-text {
    font-size: 12px;
    font-family: monospace;
    color: #495057;
    flex: 1;
}

/* Screen Appearance Settings Styles */
.appearance-settings {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.setting-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.section-subtitle {
    font-size: 14px;
    font-weight: 600;
    color: #495057;
    margin: 0;
    padding: 8px 0 4px 0;
    border-bottom: 1px solid #e9ecef;
}

.setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.setting-label {
    font-size: 13px;
    color: #6c757d;
    font-weight: 500;
    flex: 1;
}

.color-input {
    width: 40px;
    height: 32px;
    border: 1px solid #ced4da;
    border-radius: 6px;
    cursor: pointer;
    padding: 0;
}

.range-input {
    width: 100px;
    height: 6px;
    background: #e9ecef;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
}

.range-input::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #4285f4;
    border-radius: 50%;
    cursor: pointer;
}

.select-input {
    padding: 6px 12px;
    border: 1px solid #ced4da;
    border-radius: 6px;
    font-size: 13px;
    background: white;
    cursor: pointer;
    min-width: 80px;
}

.select-input:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
}

.reset-defaults-btn {
    padding: 10px 20px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;
    align-self: flex-end;
}

.reset-defaults-btn:hover {
    background: #c82333;
}

/* Circular Timer Styles */
.circular-timer-container {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    height: 100%;
}

.circular-timer {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.timer-svg {
    transform: rotate(-90deg);
}

.timer-circle {
    fill: none;
    stroke: #e2e8f0;
    stroke-width: var(--stroke-width);
}

.timer-progress {
    fill: none;
    stroke: #2c5282;
    stroke-width: var(--stroke-width);
    stroke-linecap: round;
    transition: stroke-dashoffset 0.5s ease;
}

.timer-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: clamp(10px, 2.5vw, 16px);
    font-weight: 600;
    color: #2c5282;
    pointer-events: none;
}

.timer-controls {
    position: absolute;
    bottom: -35px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.circular-timer-container:hover .timer-controls {
    opacity: 1;
}

.timer-control-btn {
    padding: 4px 6px;
    background: rgba(44, 82, 130, 0.9);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 10px;
    cursor: pointer;
    transition: background 0.2s ease;
}

.timer-control-btn:hover {
    background: rgba(44, 82, 130, 1);
}

.timer-control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ===== MODERN CONTROL PANEL STYLES ===== */

/* Modern Section Base */
.modern-section {
    background: linear-gradient(145deg, #ffffff, #f8fafc);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: all 0.3s ease;
    margin-bottom: 16px;
}

.modern-section:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
}

/* Modern Headers */
.modern-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.5px;
}

.header-icon-wrapper {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
}

.timer-icon {
    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
}

.navigation-icon {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
}

.mirror-icon {
    background: linear-gradient(135deg, #a8edea, #fed6e3);
}

.appearance-icon {
    background: linear-gradient(135deg, #ffecd2, #fcb69f);
}

/* Modern Buttons */
.modern-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.modern-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
}

.modern-btn:hover::before {
    left: 100%;
}

.btn-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-text {
    font-size: 13px;
    font-weight: 600;
}

/* Button Variants */
.primary-btn {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.primary-btn.active {
    background: linear-gradient(135deg, #5a67d8, #6b46c1);
    box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
}

.secondary-btn {
    background: linear-gradient(135deg, #f7fafc, #edf2f7);
    color: #4a5568;
    border: 1px solid #e2e8f0;
}

.secondary-btn:hover {
    background: linear-gradient(135deg, #edf2f7, #e2e8f0);
    transform: translateY(-1px);
}

.accent-btn {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    color: white;
    box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3);
}

.accent-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(78, 205, 196, 0.4);
}

.accent-btn.active {
    background: linear-gradient(135deg, #38b2ac, #319795);
}

/* Timer Controls */
.timer-controls-modern {
    padding: 20px;
}

.timer-action-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 20px;
}

.timer-btn {
    padding: 14px 12px;
    flex-direction: column;
    gap: 6px;
    min-height: 60px;
}

.start-btn {
    background: linear-gradient(135deg, #48bb78, #38a169);
    color: white;
}

.start-btn:hover {
    background: linear-gradient(135deg, #38a169, #2f855a);
}

.pause-btn {
    background: linear-gradient(135deg, #ed8936, #dd6b20);
    color: white;
}

.pause-btn:hover {
    background: linear-gradient(135deg, #dd6b20, #c05621);
}

.reset-btn {
    background: linear-gradient(135deg, #e53e3e, #c53030);
    color: white;
}

.reset-btn:hover {
    background: linear-gradient(135deg, #c53030, #9c2626);
}

.timer-settings-card {
    background: linear-gradient(145deg, #f7fafc, #edf2f7);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #e2e8f0;
}

.settings-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: #4a5568;
    font-weight: 600;
    font-size: 13px;
}

.settings-icon {
    color: #667eea;
}

.input-group {
    display: flex;
    align-items: center;
    gap: 12px;
}

.modern-input {
    flex: 1;
    padding: 10px 14px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s ease;
    background: white;
}

.modern-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-unit {
    color: #718096;
    font-size: 13px;
    font-weight: 600;
}

/* Answer Controls */
.modern-controls {
    padding: 20px;
}

.control-buttons-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
}

.full-width {
    grid-column: 1 / -1;
}

.answer-display.modern-display {
    margin-top: 16px;
    padding: 0;
}

.answer-badge {
    background: linear-gradient(135deg, #48bb78, #38a169);
    color: white;
    padding: 12px 16px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
}

.answer-label {
    font-size: 13px;
    font-weight: 600;
}

.answer-value {
    background: rgba(255, 255, 255, 0.2);
    padding: 6px 12px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 16px;
}

/* Navigation Controls */
.navigation-modern {
    padding: 20px;
}

.navigation-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 20px;
    padding: 12px;
    background: linear-gradient(145deg, #f7fafc, #edf2f7);
    border-radius: 12px;
}

.nav-btn {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.nav-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.page-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-weight: 600;
    color: #4a5568;
}

.current-page {
    color: #667eea;
    font-size: 16px;
    font-weight: bold;
}

.page-separator {
    color: #a0aec0;
}

.total-pages {
    color: #718096;
}

.question-grid-modern {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
}

.question-number-btn {
    position: relative;
    width: 44px;
    height: 44px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    color: #4a5568;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.question-number-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.question-number-btn.current {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border-color: #667eea;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.question-number-btn.answered {
    background: linear-gradient(135deg, #48bb78, #38a169);
    color: white;
    border-color: #48bb78;
}

.question-number-btn.answered.current {
    background: linear-gradient(135deg, #38a169, #2f855a);
}

.question-status {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.check-icon {
    font-size: 10px;
    color: #38a169;
}

/* Mirror Controls */
.mirror-modern {
    padding: 20px;
}

.create-mirror-btn {
    width: 100%;
    background: linear-gradient(135deg, #a8edea, #fed6e3);
    color: #4a5568;
    padding: 16px;
    justify-content: center;
    font-size: 14px;
}

.create-mirror-btn:hover {
    background: linear-gradient(135deg, #fed6e3, #a8edea);
}

.mirror-key-card {
    background: linear-gradient(145deg, #f7fafc, #edf2f7);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.mirror-key-card:hover {
    background: linear-gradient(145deg, #edf2f7, #e2e8f0);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.key-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    color: #4a5568;
    font-weight: 600;
    font-size: 13px;
}

.key-icon {
    color: #667eea;
}

.key-display {
    background: white;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.key-value {
    font-family: 'Courier New', monospace;
    font-weight: bold;
    color: #2d3748;
    font-size: 14px;
}

.copy-indicator {
    font-size: 11px;
    color: #718096;
    margin-top: 4px;
}

/* Appearance Controls */
.appearance-modern {
    padding: 20px;
}

.setting-card {
    background: linear-gradient(145deg, #f7fafc, #edf2f7);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 16px;
    overflow: hidden;
}

.setting-header {
    background: linear-gradient(135deg, #ffecd2, #fcb69f);
    color: #744210;
    padding: 12px 16px;
    font-weight: 600;
    font-size: 13px;
}

.setting-content {
    padding: 16px;
}

.setting-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
}

.setting-row:last-child {
    margin-bottom: 0;
}

.setting-item-modern {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.modern-label {
    font-size: 12px;
    font-weight: 600;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.color-picker-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.modern-color-input {
    width: 40px;
    height: 40px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.modern-color-input:hover {
    border-color: #667eea;
    transform: scale(1.05);
}

.color-value {
    font-size: 11px;
    color: #718096;
    font-family: 'Courier New', monospace;
    font-weight: bold;
}

.modern-range {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #e2e8f0;
    outline: none;
    transition: all 0.2s ease;
}

.modern-range::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.modern-range::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.modern-select {
    width: 100%;
    padding: 8px 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    font-size: 12px;
    font-weight: 600;
    color: #4a5568;
    cursor: pointer;
    transition: all 0.2s ease;
}

.modern-select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modern-reset-btn {
    width: 100%;
    background: linear-gradient(135deg, #e53e3e, #c53030);
    color: white;
    padding: 14px;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 15px rgba(229, 62, 62, 0.3);
}

.modern-reset-btn:hover {
    background: linear-gradient(135deg, #c53030, #9c2626);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(229, 62, 62, 0.4);
}

.reset-icon {
    font-size: 16px;
}

/* Dark mode adjustments */
.board-container.dark-mode .modern-section {
    background: linear-gradient(145deg, #2d3748, #1a202c);
    border-color: #4a5568;
}

.board-container.dark-mode .modern-input,
.board-container.dark-mode .modern-select {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
}

.board-container.dark-mode .timer-settings-card,
.board-container.dark-mode .setting-card {
    background: linear-gradient(145deg, #2d3748, #1a202c);
    border-color: #4a5568;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .control-buttons-grid {
        grid-template-columns: 1fr;
    }

    .timer-action-buttons {
        grid-template-columns: 1fr;
    }

    .setting-row {
        grid-template-columns: 1fr;
    }

    .question-grid-modern {
        grid-template-columns: repeat(4, 1fr);
    }
}

/* ===== TAILWIND CSS CUSTOM STYLES ===== */

/* Custom Range Slider Styles */
.slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
    transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.6);
}

.slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
    transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.6);
}

/* Enhanced Button Hover Effects */
.btn-gradient-hover {
    position: relative;
    overflow: hidden;
}

.btn-gradient-hover::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
}

.btn-gradient-hover:hover::before {
    left: 100%;
}

/* Glassmorphism Effect */
.glass-effect {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Floating Animation */
@keyframes float {
    0%,
    100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-5px);
    }
}

.float-animation {
    animation: float 3s ease-in-out infinite;
}

/* Pulse Animation for Active States */
@keyframes pulse-glow {
    0%,
    100% {
        box-shadow: 0 0 5px rgba(99, 102, 241, 0.3);
    }
    50% {
        box-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
    }
}

.pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
}

/* Custom Focus Ring */
.focus-ring-custom:focus {
    outline: none;
    box-shadow:
        0 0 0 2px rgb(255 255 255),
        0 0 0 4px rgb(99 102 241 / 0.5);
}

/* Gradient Text */
.gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Modern Card Hover Effect */
.modern-card-hover {
    transition: all 0.3s ease;
}

.modern-card-hover:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Loading Shimmer Effect */
@keyframes shimmer {
    0% {
        background-position: -200px 0;
    }
    100% {
        background-position: calc(200px + 100%) 0;
    }
}

.shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
}

/* Neon Glow Effect */
.neon-glow {
    text-shadow:
        0 0 5px currentColor,
        0 0 10px currentColor,
        0 0 15px currentColor,
        0 0 20px currentColor;
}

/* Smooth Scale Transition */
.scale-hover {
    transition: transform 0.2s ease;
}

.scale-hover:hover {
    transform: scale(1.05);
}

.scale-hover:active {
    transform: scale(0.95);
}
</style>
