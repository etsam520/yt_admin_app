<script>
export default {
    name: 'ExcalidrawBoard',
    props: {
        initialData: {
            type: Object,
            default: () => null
        }
    },
    data() {
        return {
            baseUrl: 'https://excalidraw.com',
            scene: {
                type: 'excalidraw',
                version: 2,
                source: 'yt-admin-demo',
                elements: [],
                appState: {}
            },
            iframeSrc: 'https://excalidraw.com'
        };
    },
    mounted() {
        if (this.initialData) {
            this.scene = JSON.parse(JSON.stringify(this.initialData));
            this._updateIframeSrc();
        } else {
            this._updateIframeSrc();
        }

        // Try to listen to postMessage events from the iframe (basic demo)
        window.addEventListener('message', this._onMessage);
    },
    beforeUnmount() {
        window.removeEventListener('message', this._onMessage);
    },
    methods: {
        _onMessage(e) {
            // This is a placeholder - Excalidraw webapp does not send structured postMessages by default
            // But keep for future integration with a custom Excalidraw deployment
            if (!e.data) return;
            try {
                const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
                if (msg && msg.type === 'excalidraw:change') {
                    this.$emit('change', msg.payload);
                }
            } catch (err) {
                // ignore non-json messages
            }
        },

        _updateIframeSrc() {
            try {
                const json = encodeURIComponent(JSON.stringify(this.scene));
                this.iframeSrc = `${this.baseUrl}#json=${json}`;
                this.$nextTick(() => {
                    this.$emit('change', this.scene);
                });
            } catch (err) {
                console.error('Failed to update iframe src', err);
            }
        },

        exportJSON() {
            // Emit current scene as export
            this.$emit('export', this.scene);
            // Also copy JSON to clipboard for convenience
            try {
                navigator.clipboard.writeText(JSON.stringify(this.scene));
                alert('Scene JSON copied to clipboard (export event emitted).');
            } catch (err) {
                this.$emit('exportFailed', err);
            }
        },

        openInNewTab() {
            window.open(this.iframeSrc, '_blank', 'noopener');
        },

        clearBoard() {
            this.scene.elements = [];
            this._updateIframeSrc();
            this.$emit('clear');
        },

        // The following methods simulate simple edits by adding minimal element objects.
        addTextAnnotation(text = 'Teaching Note') {
            const id = `t_${Date.now()}`;
            const el = {
                id,
                type: 'text',
                x: 100,
                y: 100 + this.scene.elements.length * 30,
                width: 200,
                height: 24,
                angle: 0,
                strokeColor: '#000000',
                backgroundColor: 'transparent',
                fillStyle: 'hachure',
                strokeWidth: 1,
                strokeStyle: 'solid',
                roughness: 0,
                opacity: 100,
                text: text,
                fontSize: 20,
                fontFamily: 1,
                baseline: 18,
                groupIds: [],
                strokeSharpness: 'sharp',
                seed: Math.floor(Math.random() * 100000)
            };
            this.scene.elements.push(el);
            this._updateIframeSrc();
            this.$emit('change', this.scene);
        },

        addArrow() {
            const id = `a_${Date.now()}`;
            const el = {
                id,
                type: 'arrow',
                x: 300,
                y: 150,
                width: 200,
                height: 0,
                angle: 0,
                strokes: [],
                strokeColor: '#ff0000',
                backgroundColor: 'transparent',
                fillStyle: 'hachure',
                strokeWidth: 2,
                strokeStyle: 'solid',
                roughness: 0,
                opacity: 100,
                points: [
                    [0, 0],
                    [120, 0]
                ],
                seed: Math.floor(Math.random() * 100000)
            };
            this.scene.elements.push(el);
            this._updateIframeSrc();
            this.$emit('change', this.scene);
        },

        highlightArea() {
            const id = `h_${Date.now()}`;
            const el = {
                id,
                type: 'rectangle',
                x: 80,
                y: 80,
                width: 320,
                height: 160,
                angle: 0,
                strokeColor: '#f59e0b',
                backgroundColor: 'rgba(245,158,11,0.15)',
                fillStyle: 'solid',
                strokeWidth: 0,
                strokeStyle: 'solid',
                roughness: 0,
                opacity: 90,
                seed: Math.floor(Math.random() * 100000)
            };
            this.scene.elements.push(el);
            this._updateIframeSrc();
            this.$emit('change', this.scene);
        },

        // Methods used by parent components
        toggleExcalidraw() {
            // In this simplified demo toggling just ensures iframe is visible and emits event
            this.$emit('toggled', true);
        }
    }
};
</script>

<template>
    <div class="excalidraw-board">
        <div class="board-toolbar">
            <button @click="exportJSON">Export JSON</button>
            <button @click="openInNewTab">Open in New Tab</button>
            <button @click="clearBoard">Clear</button>
            <button @click="addTextAnnotation">Add Text</button>
            <button @click="addArrow">Add Arrow</button>
            <button @click="highlightArea">Highlight Area</button>
        </div>

        <div class="iframe-wrap">
            <iframe ref="iframe" :src="iframeSrc" frameborder="0" class="excalidraw-iframe"></iframe>
        </div>
    </div>
</template>

<style scoped>
.excalidraw-board {
    height: 100%;
    display: flex;
    flex-direction: column;
}
.board-toolbar {
    display: flex;
    gap: 8px;
    padding: 8px;
    background: rgba(0, 0, 0, 0.03);
}
.board-toolbar button {
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #ddd;
    background: white;
    cursor: pointer;
}
.iframe-wrap {
    flex: 1 1 auto;
    min-height: 480px;
    border-radius: 6px;
    overflow: hidden;
}
.excalidraw-iframe {
    width: 100%;
    height: 100%;
    display: block;
}
</style>
