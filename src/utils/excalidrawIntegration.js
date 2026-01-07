// Excalidraw integration utilities for Vue.js
import { nextTick } from 'vue';

// Import Excalidraw CSS styles
import '@excalidraw/excalidraw/index.css';

export class ExcalidrawVueIntegration {
    constructor() {
        this.excalidrawAPI = null;
        this.excalidrawImports = null;
        this.reactRoot = null;
        this.callbacks = {
            onChange: () => {},
            onPointerUpdate: () => {},
            onCollabButtonClick: () => {}
        };
    }

    // Helper function to ensure appState has required properties
    normalizeAppState(appState = {}) {
        // Handle the case where collaborators might be serialized from localStorage
        let collaborators = new Map();
        if (appState.collaborators) {
            if (appState.collaborators instanceof Map) {
                collaborators = appState.collaborators;
            } else if (typeof appState.collaborators === 'object') {
                // Convert object back to Map (in case it was serialized)
                collaborators = new Map(Object.entries(appState.collaborators));
            }
        }

        return {
            viewBackgroundColor: '#ffffff',
            currentItemStrokeColor: '#1971c2',
            currentItemBackgroundColor: 'transparent',
            currentItemFillStyle: 'solid',
            currentItemStrokeWidth: 2,
            currentItemStrokeStyle: 'solid',
            currentItemRoughness: 1,
            currentItemOpacity: 100,
            currentItemFontFamily: 1,
            currentItemFontSize: 20,
            currentItemTextAlign: 'left',
            currentItemStartArrowhead: null,
            currentItemEndArrowhead: 'arrow',
            gridSize: null,
            colorPalette: {},
            collaborators,
            isCollaborating: false,
            ...appState,
            // Ensure collaborators is always a Map (override any serialized version)
            collaborators
        };
    }

    async initialize(containerElement, options = {}) {
        try {
            // Import required modules
            const [{ Excalidraw, convertToExcalidrawElements, exportToCanvas, exportToSvg }, React, ReactDOM] = await Promise.all([import('@excalidraw/excalidraw'), import('react'), import('react-dom/client')]);

            this.excalidrawImports = {
                Excalidraw,
                convertToExcalidrawElements,
                exportToCanvas,
                exportToSvg
            };

            // Wait for DOM to be ready
            await nextTick();

            if (!containerElement) {
                throw new Error('Container element not found');
            }

            // Create wrapper div
            const excalidrawDiv = document.createElement('div');
            excalidrawDiv.style.height = '100%';
            excalidrawDiv.style.width = '100%';

            // Clear container and append wrapper
            containerElement.innerHTML = '';
            containerElement.appendChild(excalidrawDiv);

            // Create React root
            this.reactRoot = ReactDOM.createRoot(excalidrawDiv);

            // Create Error Boundary component
            const ErrorBoundary = class extends React.Component {
                constructor(props) {
                    super(props);
                    this.state = { hasError: false, error: null };
                }

                static getDerivedStateFromError(error) {
                    return { hasError: true, error };
                }

                componentDidCatch(error, errorInfo) {
                    console.error('Excalidraw Error:', error, errorInfo);
                }

                render() {
                    if (this.state.hasError) {
                        return React.createElement(
                            'div',
                            {
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    flexDirection: 'column',
                                    color: '#666',
                                    fontFamily: 'Arial, sans-serif'
                                }
                            },
                            [
                                React.createElement('h3', { key: 'title' }, 'Excalidraw Loading Error'),
                                React.createElement('p', { key: 'message' }, 'Please refresh the page to try again.'),
                                React.createElement(
                                    'button',
                                    {
                                        key: 'retry',
                                        onClick: () => window.location.reload(),
                                        style: {
                                            padding: '8px 16px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            background: '#fff',
                                            cursor: 'pointer'
                                        }
                                    },
                                    'Refresh Page'
                                )
                            ]
                        );
                    }

                    return this.props.children;
                }
            };

            // Default configuration
            const defaultConfig = {
                viewModeEnabled: false,
                zenModeEnabled: false,
                gridModeEnabled: false,
                theme: 'light',
                name: 'Digital Board',
                langCode: 'en',
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
                },
                initialData: {
                    elements: [],
                    appState: this.normalizeAppState()
                },
                onChange: (elements, appState, files) => {
                    try {
                        this.callbacks.onChange(elements, appState, files);
                    } catch (error) {
                        console.error('Error in onChange callback:', error);
                    }
                },
                onPointerUpdate: (payload) => {
                    try {
                        this.callbacks.onPointerUpdate(payload);
                    } catch (error) {
                        console.error('Error in onPointerUpdate callback:', error);
                    }
                },
                onCollabButtonClick: () => {
                    try {
                        this.callbacks.onCollabButtonClick();
                    } catch (error) {
                        console.error('Error in onCollabButtonClick callback:', error);
                    }
                }
            };

            // Merge with user options
            const config = { ...defaultConfig, ...options };

            // Render Excalidraw with Error Boundary
            this.reactRoot.render(React.createElement(ErrorBoundary, {}, React.createElement(Excalidraw, config)));

            // Give React time to render
            await new Promise((resolve) => setTimeout(resolve, 100));

            return {
                success: true,
                message: 'Excalidraw initialized successfully'
            };
        } catch (error) {
            console.error('Failed to initialize Excalidraw:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Set event callbacks
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    // Update scene
    async updateScene(elements, appState) {
        try {
            if (!this.reactRoot || !this.excalidrawImports) {
                throw new Error('Excalidraw not initialized');
            }

            const { Excalidraw } = this.excalidrawImports;
            const React = await import('react');

            // Create Error Boundary component
            const ErrorBoundary = class extends React.Component {
                constructor(props) {
                    super(props);
                    this.state = { hasError: false, error: null };
                }

                static getDerivedStateFromError(error) {
                    return { hasError: true, error };
                }

                componentDidCatch(error, errorInfo) {
                    console.error('Excalidraw Update Error:', error, errorInfo);
                }

                render() {
                    if (this.state.hasError) {
                        return React.createElement(
                            'div',
                            {
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: '#666'
                                }
                            },
                            'Error updating board'
                        );
                    }

                    return this.props.children;
                }
            };

            const config = {
                viewModeEnabled: false,
                zenModeEnabled: false,
                gridModeEnabled: false,
                theme: 'light',
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
                },
                initialData: {
                    elements: elements || [],
                    appState: this.normalizeAppState(appState)
                },
                onChange: (elements, appState, files) => {
                    try {
                        this.callbacks.onChange(elements, appState, files);
                    } catch (error) {
                        console.error('Error in onChange callback:', error);
                    }
                },
                onPointerUpdate: (payload) => {
                    try {
                        this.callbacks.onPointerUpdate(payload);
                    } catch (error) {
                        console.error('Error in onPointerUpdate callback:', error);
                    }
                },
                onCollabButtonClick: () => {
                    try {
                        this.callbacks.onCollabButtonClick();
                    } catch (error) {
                        console.error('Error in onCollabButtonClick callback:', error);
                    }
                }
            };

            this.reactRoot.render(React.createElement(ErrorBoundary, {}, React.createElement(Excalidraw, config)));

            // Give React time to update
            await new Promise((resolve) => setTimeout(resolve, 50));

            return { success: true };
        } catch (error) {
            console.error('Failed to update scene:', error);
            return { success: false, error: error.message };
        }
    }

    // Export to PNG
    async exportToPNG(elements, appState, options = {}) {
        try {
            if (!this.excalidrawImports) {
                throw new Error('Excalidraw not initialized');
            }

            const { exportToCanvas } = this.excalidrawImports;

            const defaultOptions = {
                exportBackground: true,
                exportWithDarkMode: false,
                exportScale: 1,
                getDimensions: () => ({ width: 1920, height: 1080 })
            };

            const exportOptions = { ...defaultOptions, ...options };

            const canvas = await exportToCanvas({
                elements,
                appState,
                files: {},
                ...exportOptions
            });

            return {
                success: true,
                canvas,
                dataURL: canvas.toDataURL(),
                blob: await new Promise((resolve) => canvas.toBlob(resolve))
            };
        } catch (error) {
            console.error('Failed to export to PNG:', error);
            return { success: false, error: error.message };
        }
    }

    // Export to SVG
    async exportToSVG(elements, appState, options = {}) {
        try {
            if (!this.excalidrawImports) {
                throw new Error('Excalidraw not initialized');
            }

            const { exportToSvg } = this.excalidrawImports;

            const svg = await exportToSvg({
                elements,
                appState,
                files: {},
                ...options
            });

            return {
                success: true,
                svg,
                svgString: new XMLSerializer().serializeToString(svg)
            };
        } catch (error) {
            console.error('Failed to export to SVG:', error);
            return { success: false, error: error.message };
        }
    }

    // Create element helpers
    createTextElement(text, x = 100, y = 100, options = {}) {
        const id = `text_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        return {
            id,
            type: 'text',
            x,
            y,
            width: text.length * 12, // Approximate width
            height: 24,
            angle: 0,
            strokeColor: options.strokeColor || '#1e1e1e',
            backgroundColor: options.backgroundColor || 'transparent',
            fillStyle: options.fillStyle || 'solid',
            strokeWidth: options.strokeWidth || 1,
            strokeStyle: options.strokeStyle || 'solid',
            roughness: options.roughness || 1,
            opacity: options.opacity || 100,
            text,
            fontSize: options.fontSize || 20,
            fontFamily: options.fontFamily || 1,
            textAlign: options.textAlign || 'left',
            verticalAlign: options.verticalAlign || 'top',
            containerId: null,
            originalText: text,
            lineHeight: 1.25,
            baseline: 18,
            groupIds: [],
            frameId: null,
            roundness: null,
            seed: Math.floor(Math.random() * 100000),
            versionNonce: Math.floor(Math.random() * 1000000000),
            isDeleted: false,
            boundElements: null,
            updated: 1,
            link: null,
            locked: false
        };
    }

    createRectangleElement(x = 100, y = 100, width = 200, height = 100, options = {}) {
        const id = `rectangle_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        return {
            id,
            type: 'rectangle',
            x,
            y,
            width,
            height,
            angle: 0,
            strokeColor: options.strokeColor || '#1e1e1e',
            backgroundColor: options.backgroundColor || 'transparent',
            fillStyle: options.fillStyle || 'solid',
            strokeWidth: options.strokeWidth || 2,
            strokeStyle: options.strokeStyle || 'solid',
            roughness: options.roughness || 1,
            opacity: options.opacity || 100,
            groupIds: [],
            frameId: null,
            roundness: {
                type: 3
            },
            seed: Math.floor(Math.random() * 100000),
            versionNonce: Math.floor(Math.random() * 1000000000),
            isDeleted: false,
            boundElements: null,
            updated: 1,
            link: null,
            locked: false
        };
    }

    createArrowElement(startX = 100, startY = 100, endX = 200, endY = 100, options = {}) {
        const id = `arrow_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        return {
            id,
            type: 'arrow',
            x: startX,
            y: startY,
            width: endX - startX,
            height: endY - startY,
            angle: 0,
            strokeColor: options.strokeColor || '#1e1e1e',
            backgroundColor: options.backgroundColor || 'transparent',
            fillStyle: options.fillStyle || 'solid',
            strokeWidth: options.strokeWidth || 2,
            strokeStyle: options.strokeStyle || 'solid',
            roughness: options.roughness || 1,
            opacity: options.opacity || 100,
            points: [
                [0, 0],
                [endX - startX, endY - startY]
            ],
            lastCommittedPoint: null,
            startBinding: null,
            endBinding: null,
            startArrowhead: options.startArrowhead || null,
            endArrowhead: options.endArrowhead || 'arrow',
            groupIds: [],
            frameId: null,
            roundness: {
                type: 2
            },
            seed: Math.floor(Math.random() * 100000),
            versionNonce: Math.floor(Math.random() * 1000000000),
            isDeleted: false,
            boundElements: null,
            updated: 1,
            link: null,
            locked: false
        };
    }

    // Cleanup
    destroy() {
        if (this.reactRoot) {
            this.reactRoot.unmount();
            this.reactRoot = null;
        }
        this.excalidrawAPI = null;
        this.excalidrawImports = null;
        this.callbacks = {
            onChange: () => {},
            onPointerUpdate: () => {},
            onCollabButtonClick: () => {}
        };
    }
}

// Export a singleton instance
export const excalidrawIntegration = new ExcalidrawVueIntegration();

// Export utility functions
export const createExcalidrawElement = {
    text: (text, x, y, options) => excalidrawIntegration.createTextElement(text, x, y, options),
    rectangle: (x, y, width, height, options) => excalidrawIntegration.createRectangleElement(x, y, width, height, options),
    arrow: (startX, startY, endX, endY, options) => excalidrawIntegration.createArrowElement(startX, startY, endX, endY, options)
};

export default ExcalidrawVueIntegration;
