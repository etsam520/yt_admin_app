<script>
import DisplaySetCopy from './DisplaySetCopy.vue';

export default {
    name: 'ExcalidrawDemoPage',
    components: {
        DisplaySetCopy
    },
    data() {
        return {
            currentLanguage: 'en',
            showBoard: false,
            showInstructions: false,
            isFullscreen: false
        };
    },
    mounted() {
        // Show instructions on first visit
        const hasSeenInstructions = localStorage.getItem('excalidraw-demo-instructions');
        if (!hasSeenInstructions) {
            setTimeout(() => {
                this.showInstructions = true;
                localStorage.setItem('excalidraw-demo-instructions', 'true');
            }, 1000);
        }
    },
    methods: {
        startDemo() {
            this.showBoard = true;
        },

        loadSample() {
            this.showBoard = true;
            // Load sample data after board is mounted
            this.$nextTick(() => {
                if (this.$refs.teachingBoard) {
                    // Enable Excalidraw mode
                    this.$refs.teachingBoard.toggleExcalidraw();

                    // Add some sample annotations
                    setTimeout(() => {
                        this.$refs.teachingBoard.addTeachingNote('Sample Teaching Note');
                        this.$refs.teachingBoard.addTeachingHighlight();
                        this.$refs.teachingBoard.addTeachingArrow();
                    }, 500);
                }
            });
        },

        exitDemo() {
            this.showBoard = false;
        },

        toggleFullscreen() {
            if (!this.isFullscreen) {
                document.documentElement.requestFullscreen?.();
                this.isFullscreen = true;
            } else {
                document.exitFullscreen?.();
                this.isFullscreen = false;
            }
        }
    }
};
</script>

<template>
    <div class="excalidraw-demo-page">
        <div class="demo-header">
            <h1>{{ currentLanguage === 'en' ? 'Digital Teaching Board with Excalidraw' : 'एक्साड्रा के साथ डिजिटल शिक्षण बोर्ड' }}</h1>
            <div class="language-switcher">
                <button @click="currentLanguage = 'en'" :class="{ active: currentLanguage === 'en' }" class="lang-btn">English</button>
                <button @click="currentLanguage = 'hi'" :class="{ active: currentLanguage === 'hi' }" class="lang-btn">हिंदी</button>
            </div>
        </div>

        <div class="demo-content">
            <!-- Feature Showcase -->
            <div class="feature-showcase" v-if="!showBoard">
                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-icon">🎨</div>
                        <h3>{{ currentLanguage === 'en' ? 'Advanced Drawing Tools' : 'उन्नत ड्राइंग टूल्स' }}</h3>
                        <p>{{ currentLanguage === 'en' ? 'Professional drawing tools with pen, shapes, arrows, and text annotations' : 'पेन, आकार, तीर और टेक्स्ट एनोटेशन के साथ पेशेवर ड्राइंग टूल्स' }}</p>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">👥</div>
                        <h3>{{ currentLanguage === 'en' ? 'Interactive Teaching' : 'इंटरैक्टिव शिक्षण' }}</h3>
                        <p>{{ currentLanguage === 'en' ? 'Switch between presentation and interactive modes for engaging lessons' : 'आकर्षक पाठों के लिए प्रस्तुति और इंटरैक्टिव मोड के बीच स्विच करें' }}</p>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">💾</div>
                        <h3>{{ currentLanguage === 'en' ? 'Save & Export' : 'सेव और एक्सपोर्ट' }}</h3>
                        <p>{{ currentLanguage === 'en' ? 'Save your work as PNG images or Excalidraw files for later use' : 'बाद में उपयोग के लिए अपने काम को PNG छवियों या Excalidraw फ़ाइलों के रूप में सेव करें' }}</p>
                    </div>

                    <div class="feature-card">
                        <div class="feature-icon">🌍</div>
                        <h3>{{ currentLanguage === 'en' ? 'Multi-language Support' : 'बहुभाषी समर्थन' }}</h3>
                        <p>{{ currentLanguage === 'en' ? 'Full support for English and Hindi languages with proper fonts' : 'उचित फ़ॉन्ट के साथ अंग्रेजी और हिंदी भाषाओं के लिए पूर्ण समर्थन' }}</p>
                    </div>
                </div>

                <div class="demo-actions">
                    <button @click="startDemo" class="start-demo-btn">
                        {{ currentLanguage === 'en' ? 'Start Teaching Board' : 'शिक्षण बोर्ड शुरू करें' }}
                    </button>

                    <button @click="loadSample" class="load-sample-btn">
                        {{ currentLanguage === 'en' ? 'Load Sample Drawing' : 'नमूना ड्राइंग लोड करें' }}
                    </button>
                </div>
            </div>

            <!-- Teaching Board -->
            <div class="board-container" v-if="showBoard">
                <DisplaySetCopy :currentLanguage="currentLanguage" ref="teachingBoard" />

                <div class="demo-controls">
                    <button @click="exitDemo" class="exit-demo-btn">
                        {{ currentLanguage === 'en' ? 'Exit Demo' : 'डेमो से बाहर निकलें' }}
                    </button>

                    <button @click="toggleFullscreen" class="fullscreen-btn">
                        {{ currentLanguage === 'en' ? 'Toggle Fullscreen' : 'फुलस्क्रीन टॉगल करें' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Instructions Modal -->
        <div v-if="showInstructions" class="instructions-modal" @click.self="showInstructions = false">
            <div class="modal-content">
                <h2>{{ currentLanguage === 'en' ? 'How to Use' : 'उपयोग कैसे करें' }}</h2>

                <div class="instructions-content">
                    <div class="instruction-section">
                        <h3>{{ currentLanguage === 'en' ? 'Drawing Modes' : 'ड्राइंग मोड' }}</h3>
                        <ul>
                            <li>{{ currentLanguage === 'en' ? 'Canvas Mode: Basic drawing with pen, shapes, and colors' : 'कैनवास मोड: पेन, आकार और रंगों के साथ बुनियादी ड्राइंग' }}</li>
                            <li>{{ currentLanguage === 'en' ? 'Excalidraw Mode: Advanced sketching with hand-drawn style' : 'Excalidraw मोड: हाथ से खींची गई शैली के साथ उन्नत स्केचिंग' }}</li>
                        </ul>
                    </div>

                    <div class="instruction-section">
                        <h3>{{ currentLanguage === 'en' ? 'Teaching Features' : 'शिक्षण सुविधाएं' }}</h3>
                        <ul>
                            <li>{{ currentLanguage === 'en' ? 'Add teaching notes and annotations' : 'शिक्षण नोट्स और एनोटेशन जोड़ें' }}</li>
                            <li>{{ currentLanguage === 'en' ? 'Highlight important areas' : 'महत्वपूर्ण क्षेत्रों को हाइलाइट करें' }}</li>
                            <li>{{ currentLanguage === 'en' ? 'Use arrows to point to specific content' : 'विशिष्ट सामग्री की ओर इंगित करने के लिए तीरों का उपयोग करें' }}</li>
                        </ul>
                    </div>

                    <div class="instruction-section">
                        <h3>{{ currentLanguage === 'en' ? 'Keyboard Shortcuts' : 'कीबोर्ड शॉर्टकट' }}</h3>
                        <ul>
                            <li><kbd>Ctrl + Z</kbd> - {{ currentLanguage === 'en' ? 'Undo' : 'पूर्ववत' }}</li>
                            <li><kbd>Ctrl + Y</kbd> - {{ currentLanguage === 'en' ? 'Redo' : 'दोहराएं' }}</li>
                            <li><kbd>Ctrl + +</kbd> - {{ currentLanguage === 'en' ? 'Zoom In' : 'ज़ूम इन' }}</li>
                            <li><kbd>Ctrl + -</kbd> - {{ currentLanguage === 'en' ? 'Zoom Out' : 'ज़ूम आउट' }}</li>
                        </ul>
                    </div>
                </div>

                <button @click="showInstructions = false" class="close-instructions-btn">
                    {{ currentLanguage === 'en' ? 'Got it!' : 'समझ गया!' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.excalidraw-demo-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.demo-header {
    text-align: center;
    padding: 40px 20px;
    color: white;
}

.demo-header h1 {
    font-size: 2.5rem;
    margin-bottom: 20px;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.language-switcher {
    display: flex;
    justify-content: center;
    gap: 10px;
}

.lang-btn {
    padding: 8px 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 25px;
    background: transparent;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
}

.lang-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
}

.lang-btn.active {
    background: rgba(255, 255, 255, 0.2);
    border-color: white;
}

.demo-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.feature-showcase {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 40px;
    margin-bottom: 40px;
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 30px;
    margin-bottom: 40px;
}

.feature-card {
    text-align: center;
    padding: 30px;
    border-radius: 15px;
    background: white;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-5px);
}

.feature-icon {
    font-size: 3rem;
    margin-bottom: 20px;
}

.feature-card h3 {
    color: #333;
    margin-bottom: 15px;
    font-size: 1.25rem;
}

.feature-card p {
    color: #666;
    line-height: 1.6;
}

.demo-actions {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
}

.start-demo-btn,
.load-sample-btn {
    padding: 15px 30px;
    border: none;
    border-radius: 30px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 200px;
}

.start-demo-btn {
    background: linear-gradient(135deg, #4285f4, #34a853);
    color: white;
}

.load-sample-btn {
    background: linear-gradient(135deg, #ff6b6b, #ffa726);
    color: white;
}

.start-demo-btn:hover,
.load-sample-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.board-container {
    position: relative;
    height: 100vh;
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.demo-controls {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    z-index: 2000;
}

.exit-demo-btn,
.fullscreen-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.exit-demo-btn:hover,
.fullscreen-btn:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: translateY(-1px);
}

/* Instructions Modal */
.instructions-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
    backdrop-filter: blur(5px);
}

.modal-content {
    background: white;
    border-radius: 20px;
    padding: 40px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    margin: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-content h2 {
    color: #333;
    margin-bottom: 30px;
    text-align: center;
    font-size: 1.8rem;
}

.instructions-content {
    margin-bottom: 30px;
}

.instruction-section {
    margin-bottom: 25px;
}

.instruction-section h3 {
    color: #4285f4;
    margin-bottom: 15px;
    font-size: 1.2rem;
}

.instruction-section ul {
    list-style-type: none;
    padding: 0;
}

.instruction-section li {
    padding: 8px 0;
    padding-left: 20px;
    position: relative;
    color: #555;
    line-height: 1.5;
}

.instruction-section li::before {
    content: '▶';
    position: absolute;
    left: 0;
    color: #4285f4;
    font-size: 0.8rem;
}

kbd {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 2px 6px;
    font-family: monospace;
    font-size: 0.9rem;
}

.close-instructions-btn {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #4285f4, #34a853);
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.close-instructions-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 5px 15px rgba(66, 133, 244, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
    .demo-header h1 {
        font-size: 2rem;
    }

    .feature-showcase {
        padding: 20px;
    }

    .feature-grid {
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .demo-actions {
        flex-direction: column;
        align-items: center;
    }

    .modal-content {
        padding: 20px;
        margin: 10px;
    }

    .demo-controls {
        flex-direction: column;
        gap: 5px;
    }
}

/* Hindi font support */
.excalidraw-demo-page[data-lang='hi'] {
    font-family: 'Noto Sans Devanagari', 'Mangal', 'Kokila', sans-serif;
}
</style>
