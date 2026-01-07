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
</style>
