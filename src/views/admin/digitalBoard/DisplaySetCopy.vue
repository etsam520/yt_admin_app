<script>
import ExcalidrawBoard from '@/components/ExcalidrawBoard.vue';

export default {
    name: 'CanvasTeachingBoard',
    components: {
        ExcalidrawBoard
    },
    data() {
        return {
            currentLanguage: 'en',
            currentIndex: 0,
            discussedTopics: [],
            markedTopics: [],
            showSummary: false,
            sessionStartTime: null,
            sessionTimer: null,
            teachingMeta: {
                sessionDuration: 0, // minutes
                allowAnnotations: true
            },
            // New Excalidraw integration
            useExcalidraw: false,
            excalidrawData: null,
            // Canvas specific properties
            canvasWidth: 1200,
            canvasHeight: 800,
            canvas: null,
            ctx: null,
            hoveredElement: null,
            clickableElements: [],
            canvasImages: {},
            teachingMode: 'present', // 'present' or 'interactive'
            annotations: [],
            isAnnotating: false,
            // Drawing tool properties
            currentTool: 'pen',
            currentStroke: '#000000',
            currentBackground: 'transparent',
            currentStrokeWidth: 2,
            currentStrokeStyle: 'solid',
            currentEdge: 'round',
            currentOpacity: 100,
            currentSloppiness: 1,
            currentLayer: 0,
            isDrawing: false,
            lastX: 0,
            lastY: 0,
            // Canvas view properties
            zoomLevel: 1,
            showGrid: false,
            devicePixelRatio: window.devicePixelRatio || 1,
            // Minimal UI properties
            sidebarExpanded: false,
            expandedSections: {
                colors: false,
                width: false,
                background: false,
                opacity: false
            },
            quickTools: [
                { name: 'pen', label: 'Pen', icon: '✏️' },
                { name: 'line', label: 'Line', icon: '📏' },
                { name: 'rectangle', label: 'Rectangle', icon: '⬜' },
                { name: 'circle', label: 'Circle', icon: '⭕' },
                { name: 'arrow', label: 'Arrow', icon: '➡️' },
                { name: 'eraser', label: 'Eraser', icon: '🧽' }
            ],
            // Drawing tool options
            strokeColors: ['#000000', '#333333', '#666666', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'],
            backgroundColors: ['transparent', '#ffffff', '#f0f0f0', '#e0e0e0', '#cccccc', '#ffeeee', '#eeffee', '#eeeeff', '#ffffee', '#ffeeff'],
            strokeWidths: [1, 2, 3, 5, 8, 12],
            strokeStyles: [
                { name: 'solid', label: 'Solid' },
                { name: 'dashed', label: 'Dashed' },
                { name: 'dotted', label: 'Dotted' }
            ],
            sloppinesses: [
                { name: 'architect', value: 0, label: 'Architect' },
                { name: 'artist', value: 1, label: 'Artist' },
                { name: 'cartoonist', value: 2, label: 'Cartoonist' }
            ],
            drawingTools: [
                { name: 'selection', label: 'Selection', icon: '🔗' },
                { name: 'pen', label: 'Pen', icon: '✏️' },
                { name: 'line', label: 'Line', icon: '📏' },
                { name: 'rectangle', label: 'Rectangle', icon: '⬜' },
                { name: 'circle', label: 'Circle', icon: '⭕' },
                { name: 'arrow', label: 'Arrow', icon: '➡️' },
                { name: 'text', label: 'Text', icon: '📝' },
                { name: 'eraser', label: 'Eraser', icon: '🧽' }
            ],
            shapes: [
                { name: 'pen', label: 'Pen', icon: 'fas fa-pen' },
                { name: 'line', label: 'Line', icon: 'fas fa-minus' },
                { name: 'rectangle', label: 'Rectangle', icon: 'fas fa-square' },
                { name: 'circle', label: 'Circle', icon: 'fas fa-circle' },
                { name: 'triangle', label: 'Triangle', icon: 'fas fa-play' },
                { name: 'arrow', label: 'Arrow', icon: 'fas fa-arrow-right' },
                { name: 'text', label: 'Text', icon: 'fas fa-font' },
                { name: 'eraser', label: 'Eraser', icon: 'fas fa-eraser' }
            ],
            edgeOptions: [
                { name: 'round', label: 'Round', icon: 'fas fa-circle' },
                { name: 'square', label: 'Square', icon: 'fas fa-square' },
                { name: 'butt', label: 'Butt', icon: 'fas fa-minus' }
            ],
            layers: [{ id: 0, name: 'Layer 1', visible: true, locked: false }],
            // Teaching content (converted from questions to topics)
            topics: [
                {
                    en: {
                        title: 'Capital Cities of Europe',
                        content: 'What is the capital of France?',
                        options: ['London', 'Paris', 'Berlin', 'Madrid'],
                        explanation: 'Paris is the capital and largest city of France.'
                    },
                    hi: {
                        title: 'यूरोप की राजधानियां',
                        content: 'फ्रांस की राजधानी क्या है?',
                        options: ['लंदन', 'पेरिस', 'बर्लिन', 'मैड्रिड'],
                        explanation: 'पेरिस फ्रांस की राजधानी और सबसे बड़ा शहर है।'
                    },
                    difficulty: 'easy',
                    category: 'geography',
                    correct_answer: 1,
                    image: null
                },
                {
                    en: {
                        title: 'Programming Languages vs Markup',
                        content: 'Which of these is not a programming language?',
                        options: ['Python', 'Java', 'HTML', 'C++'],
                        explanation: "HTML is a markup language, not a programming language. It's used to structure web content."
                    },
                    hi: {
                        title: 'प्रोग्रामिंग भाषाएं बनाम मार्कअप',
                        content: 'इनमें से कौन सी प्रोग्रामिंग भाषा नहीं है?',
                        options: ['पायथन', 'जावा', 'एचटीएमएल', 'सी++'],
                        explanation: 'एचटीएमएल एक मार्कअप भाषा है, प्रोग्रामिंग भाषा नहीं। इसका उपयोग वेब सामग्री को संरचित करने के लिए किया जाता है।'
                    },
                    difficulty: 'medium',
                    category: 'technology',
                    correct_answer: 2,
                    image: null
                },
                {
                    en: {
                        title: 'Chemical Symbols',
                        content: 'What is the chemical symbol for Gold?',
                        options: ['Go', 'Gd', 'Au', 'Ag'],
                        explanation: "Au comes from the Latin word 'aurum' meaning gold. Gold is a precious metal with atomic number 79."
                    },
                    hi: {
                        title: 'रासायनिक प्रतीक',
                        content: 'सोने का रासायनिक प्रतीक क्या है?',
                        options: ['Go', 'Gd', 'Au', 'Ag'],
                        explanation: "Au लैटिन शब्द 'aurum' से आता है जिसका अर्थ सोना है। सोना एक कीमती धातु है जिसका परमाणु क्रमांक 79 है।"
                    },
                    difficulty: 'easy',
                    category: 'chemistry',
                    correct_answer: 2,
                    image: null
                }
            ]
        };
    },
    computed: {
        currentTopic() {
            return this.topics[this.currentIndex];
        },
        discussedCount() {
            return this.discussedTopics.filter((topic) => topic !== undefined).length;
        },
        interactiveCount() {
            return this.discussedTopics.reduce((count, discussed, index) => {
                if (discussed && this.markedTopics.includes(index)) {
                    return count + 1;
                }
                return count;
            }, 0);
        },
        // Renamed from questions to topics
        questions() {
            return this.topics; // For backward compatibility with existing methods
        }
    },
    mounted() {
        this.initCanvas();
        // Add keyboard shortcuts
        window.addEventListener('keydown', this.handleKeyboardShortcuts);
    },
    beforeUnmount() {
        // Remove keyboard shortcuts
        window.removeEventListener('keydown', this.handleKeyboardShortcuts);
    },
    methods: {
        // Initialize canvas
        initCanvas() {
            this.canvas = this.$refs.teachingCanvas;
            this.ctx = this.canvas.getContext('2d');

            // Set up high DPI support
            this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

            this.sessionStartTime = new Date();
            this.drawTeachingBoard();
        },

        // Draw the entire teaching board on canvas
        drawTeachingBoard() {
            if (!this.ctx) return;

            // Clear canvas
            this.ctx.fillStyle = '#f8f9fa';
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

            // Reset clickable elements
            this.clickableElements = [];

            // Draw components based on mode
            this.drawLanguageToggle();
            this.drawTeachingHeader();
            this.drawTopicContent();
            this.drawNavigationControls();
            this.drawTopicProgress();

            if (this.teachingMode === 'interactive') {
                this.drawInteractiveElements();
            }
        },

        // Draw language toggle buttons
        drawLanguageToggle() {
            const x = this.canvasWidth - 200;
            const y = 20;
            const width = 80;
            const height = 30;

            // English button
            this.drawButton(x, y, width, height, 'English', this.currentLanguage === 'en' ? '#4CAF50' : '#fff', this.currentLanguage === 'en' ? '#fff' : '#000', 'switchLanguage', 'en');

            // Hindi button
            this.drawButton(x + width + 10, y, width, height, 'हिंदी', this.currentLanguage === 'hi' ? '#4CAF50' : '#fff', this.currentLanguage === 'hi' ? '#fff' : '#000', 'switchLanguage', 'hi');
        },

        // Draw teaching header
        drawTeachingHeader() {
            const title = this.currentLanguage === 'en' ? 'Digital Teaching Board' : 'डिजिटल शिक्षण बोर्ड';
            const modeText = this.currentLanguage === 'en' ? (this.teachingMode === 'present' ? 'Presentation Mode' : 'Interactive Mode') : this.teachingMode === 'present' ? 'प्रस्तुति मोड' : 'इंटरैक्टिव मोड';
            const sessionText = this.currentLanguage === 'en' ? 'Session Time:' : 'सत्र समय:';

            // Title
            this.ctx.font = 'bold 28px Arial';
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillText(title, 20, 50);

            // Mode indicator
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillStyle = this.teachingMode === 'present' ? '#3498db' : '#e74c3c';
            const modeX = this.canvasWidth - 400;
            this.ctx.fillText(modeText, modeX, 50);

            // Session timer
            this.ctx.fillStyle = '#27ae60';
            const sessionDuration = this.getSessionDuration();
            this.ctx.fillText(`${sessionText} ${sessionDuration}`, modeX, 70);

            // Draw separator line
            this.ctx.strokeStyle = '#ddd';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(20, 85);
            this.ctx.lineTo(this.canvasWidth - 20, 85);
            this.ctx.stroke();
        },

        // Draw current topic content
        drawTopicContent() {
            const topicY = 120;
            const topic = this.currentTopic;
            const topicTitle = topic[this.currentLanguage]?.title || topic.en.title;
            const topicContent = topic[this.currentLanguage]?.content || topic.en.content;
            const topicNumber = `${this.currentLanguage === 'en' ? 'Topic' : 'विषय'} ${this.currentIndex + 1} ${this.currentLanguage === 'en' ? 'of' : '/ '} ${this.topics.length}`;

            // Topic number and category
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillStyle = '#7f8c8d';
            this.ctx.fillText(topicNumber, 20, topicY);

            // Category badge
            this.ctx.fillStyle = '#f39c12';
            this.ctx.fillText(`[${topic.category.toUpperCase()}]`, 200, topicY);

            // Topic title
            this.ctx.font = 'bold 22px Arial';
            this.ctx.fillStyle = '#2c3e50';
            this.wrapText(topicTitle, 20, topicY + 35, this.canvasWidth - 40, 30);

            // Topic content/question
            this.ctx.font = '18px Arial';
            this.ctx.fillStyle = '#34495e';
            this.wrapText(topicContent, 20, topicY + 80, this.canvasWidth - 40, 25);

            // Show explanation if topic is discussed
            if (this.discussedTopics[this.currentIndex]) {
                this.drawExplanation(topicY + 130);
            }
        },

        // Draw explanation section
        drawExplanation(startY) {
            const topic = this.currentTopic;
            const explanation = topic[this.currentLanguage]?.explanation || topic.en.explanation;

            // Explanation header
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillStyle = '#27ae60';
            const explanationText = this.currentLanguage === 'en' ? 'Explanation:' : 'व्याख्या:';
            this.ctx.fillText(explanationText, 20, startY);

            // Explanation content
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#2c3e50';
            this.wrapText(explanation, 20, startY + 25, this.canvasWidth - 40, 22);
        },

        // Draw interactive elements (options for discussion)
        drawInteractiveElements() {
            const topic = this.currentTopic;
            const options = topic[this.currentLanguage]?.options || topic.en.options;
            const optionsY = this.discussedTopics[this.currentIndex] ? 350 : 250;
            const optionHeight = 35;
            const optionSpacing = 45;

            if (options && this.teachingMode === 'interactive') {
                // Options header
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillStyle = '#3498db';
                const optionsText = this.currentLanguage === 'en' ? 'Discussion Options:' : 'चर्चा विकल्प:';
                this.ctx.fillText(optionsText, 20, optionsY - 15);

                options.forEach((option, idx) => {
                    const y = optionsY + idx * optionSpacing;
                    const isCorrect = topic.correct_answer === idx;
                    const isHighlighted = this.markedTopics.includes(this.currentIndex) && isCorrect;

                    let bgColor = '#fff';
                    let borderColor = '#ddd';

                    if (isHighlighted) {
                        bgColor = '#e8f5e9';
                        borderColor = '#4CAF50';
                    }

                    this.drawOptionBox(20, y, this.canvasWidth - 40, optionHeight, option, idx, bgColor, borderColor, true);
                });
            }
        },

        // Draw option box (updated for teaching context)
        drawOptionBox(x, y, width, height, text, optionIndex, bgColor, borderColor, isTeaching = false) {
            // Draw background
            this.ctx.fillStyle = bgColor;
            this.ctx.fillRect(x, y, width, height);

            // Draw border
            this.ctx.strokeStyle = borderColor;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, width, height);

            // Draw option letter
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillStyle = '#3498db';
            const letter = String.fromCharCode(65 + optionIndex);
            this.ctx.fillText(letter, x + 15, y + 22);

            // Draw option text
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#000';
            this.ctx.fillText(text, x + 45, y + 22);

            // Add to clickable elements only in interactive mode
            if (isTeaching && this.teachingMode === 'interactive') {
                this.clickableElements.push({
                    type: 'option',
                    x,
                    y,
                    width,
                    height,
                    action: 'highlightOption',
                    data: optionIndex
                });
            }
        },

        // Draw navigation controls for teaching
        drawNavigationControls() {
            const y = this.canvasHeight - 120;
            const buttonWidth = 120;
            const buttonHeight = 35;

            // Previous topic button
            const prevDisabled = this.currentIndex === 0;
            const prevText = this.currentLanguage === 'en' ? 'Previous Topic' : 'पिछला विषय';
            this.drawButton(20, y, buttonWidth, buttonHeight, prevText, prevDisabled ? '#bdc3c7' : '#3498db', '#fff', prevDisabled ? null : 'prevTopic');

            // Next/Complete session button
            const isLastTopic = this.currentIndex === this.topics.length - 1;
            const nextText = isLastTopic ? (this.currentLanguage === 'en' ? 'End Session' : 'सत्र समाप्त करें') : this.currentLanguage === 'en' ? 'Next Topic' : 'अगला विषय';
            const nextAction = isLastTopic ? 'endSession' : 'nextTopic';
            this.drawButton(160, y, buttonWidth + 20, buttonHeight, nextText, isLastTopic ? '#e74c3c' : '#3498db', '#fff', nextAction);

            // Mark as discussed button
            const discussed = this.discussedTopics[this.currentIndex];
            const discussText = this.currentLanguage === 'en' ? (discussed ? 'Mark Undiscussed' : 'Mark as Discussed') : discussed ? 'अचर्चित मार्क करें' : 'चर्चित मार्क करें';
            this.drawButton(300, y, 150, buttonHeight, discussText, discussed ? '#27ae60' : '#f39c12', '#fff', 'toggleDiscussed');

            // Show answer button (interactive mode only)
            if (this.teachingMode === 'interactive') {
                const showAnswer = this.markedTopics.includes(this.currentIndex);
                const answerText = this.currentLanguage === 'en' ? (showAnswer ? 'Hide Answer' : 'Show Answer') : showAnswer ? 'उत्तर छुपाएं' : 'उत्तर दिखाएं';
                this.drawButton(470, y, 120, buttonHeight, answerText, showAnswer ? '#e74c3c' : '#2ecc71', '#fff', 'toggleAnswer');
            }
        },

        // Draw topic progress dots
        drawTopicProgress() {
            const startY = this.canvasHeight - 60;
            const dotSize = 28;
            const spacing = 35;
            const startX = (this.canvasWidth - this.topics.length * spacing) / 2;

            this.topics.forEach((topic, idx) => {
                const x = startX + idx * spacing;
                const isCurrent = idx === this.currentIndex;
                const isDiscussed = this.discussedTopics[idx];
                const hasAnswer = this.markedTopics.includes(idx);

                let color = '#ecf0f1';
                let textColor = '#7f8c8d';

                if (isCurrent) {
                    color = '#3498db';
                    textColor = '#fff';
                } else if (isDiscussed && hasAnswer) {
                    color = '#27ae60';
                    textColor = '#fff';
                } else if (isDiscussed) {
                    color = '#f39c12';
                    textColor = '#fff';
                }

                this.drawCircle(x, startY, dotSize / 2, color, textColor, (idx + 1).toString(), 'goToTopic', idx);
            });
        },

        // Helper method to draw buttons
        drawButton(x, y, width, height, text, bgColor, textColor, action, data = null) {
            // Draw background
            this.ctx.fillStyle = bgColor;
            this.ctx.fillRect(x, y, width, height);

            // Draw border
            this.ctx.strokeStyle = '#ddd';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, width, height);

            // Draw text
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = textColor;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(text, x + width / 2, y + height / 2 + 5);
            this.ctx.textAlign = 'left';

            // Add to clickable elements if action provided
            if (action) {
                this.clickableElements.push({
                    type: 'button',
                    x,
                    y,
                    width,
                    height,
                    action,
                    data
                });
            }
        },

        // Helper method to draw circles
        drawCircle(x, y, radius, bgColor, textColor, text, action, data = null) {
            // Draw circle
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
            this.ctx.fillStyle = bgColor;
            this.ctx.fill();
            this.ctx.strokeStyle = '#ddd';
            this.ctx.stroke();

            // Draw text
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillStyle = textColor;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(text, x, y + 4);
            this.ctx.textAlign = 'left';

            // Add to clickable elements
            this.clickableElements.push({
                type: 'circle',
                x: x - radius,
                y: y - radius,
                width: radius * 2,
                height: radius * 2,
                action,
                data
            });
        },

        // Helper method to wrap text
        wrapText(text, x, y, maxWidth, lineHeight) {
            const words = text.split(' ');
            let line = '';
            let currentY = y;

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = this.ctx.measureText(testLine);
                const testWidth = metrics.width;

                if (testWidth > maxWidth && n > 0) {
                    this.ctx.fillText(line, x, currentY);
                    line = words[n] + ' ';
                    currentY += lineHeight;
                } else {
                    line = testLine;
                }
            }
            this.ctx.fillText(line, x, currentY);
        },

        // Handle canvas click events
        handleCanvasClick(event) {
            if (this.isAnnotating) return; // Don't handle clicks when drawing

            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // Check if click is on any clickable element
            for (const element of this.clickableElements) {
                if (x >= element.x && x <= element.x + element.width && y >= element.y && y <= element.y + element.height) {
                    this.executeAction(element.action, element.data);
                    break;
                }
            }
        },

        // Handle canvas hover events
        handleCanvasHover(event) {
            if (!this.isAnnotating) {
                // Original hover logic for UI elements
                const rect = this.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                let isHovering = false;
                for (const element of this.clickableElements) {
                    if (x >= element.x && x <= element.x + element.width && y >= element.y && y <= element.y + element.height) {
                        isHovering = true;
                        break;
                    }
                }
                this.canvas.style.cursor = isHovering ? 'pointer' : 'default';
                return;
            }

            // Handle drawing
            if (this.isDrawing) {
                const coords = this.getCanvasCoordinates(event);

                if (this.currentTool === 'pen') {
                    this.drawPenStroke(coords.x, coords.y);
                } else if (this.currentTool === 'eraser') {
                    this.drawEraserStroke(coords.x, coords.y);
                }
            }
        },

        // Execute actions from canvas interactions
        executeAction(action, data) {
            switch (action) {
                case 'switchLanguage':
                    this.switchLanguage(data);
                    break;
                case 'highlightOption':
                    this.highlightOption(data);
                    break;
                case 'prevTopic':
                    this.prevTopic();
                    break;
                case 'nextTopic':
                    this.nextTopic();
                    break;
                case 'endSession':
                    this.endSession();
                    break;
                case 'toggleDiscussed':
                    this.toggleDiscussed();
                    break;
                case 'toggleAnswer':
                    this.toggleAnswer();
                    break;
                case 'goToTopic':
                    this.goToTopic(data);
                    break;
                // Legacy compatibility
                case 'selectOption':
                    this.highlightOption(data);
                    break;
                case 'prevQuestion':
                    this.prevTopic();
                    break;
                case 'nextQuestion':
                    this.nextTopic();
                    break;
                case 'finishExam':
                    this.endSession();
                    break;
                case 'toggleMarkForReview':
                    this.toggleAnswer();
                    break;
                case 'goToQuestion':
                    this.goToTopic(data);
                    break;
            }
        },

        // Teaching-specific methods
        toggleMode() {
            this.teachingMode = this.teachingMode === 'present' ? 'interactive' : 'present';
            this.drawTeachingBoard();
        },

        toggleAnnotations() {
            this.isAnnotating = !this.isAnnotating;
            if (this.isAnnotating) {
                this.setupDrawingMode();
            } else {
                this.exitDrawingMode();
            }
        },

        setupDrawingMode() {
            // Setup canvas for drawing
            if (this.currentTool === 'eraser') {
                this.canvas.style.cursor =
                    'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggM0w4IDIxSDIwVjNIOFoiIGZpbGw9IiNmZmZmZmYiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=") 12 12, auto';
            } else {
                this.canvas.style.cursor = 'crosshair';
            }
        },

        exitDrawingMode() {
            this.canvas.style.cursor = 'default';
            this.isDrawing = false;
        },

        // Drawing tool methods
        setStrokeColor(color) {
            this.currentStroke = color;
        },

        setBackgroundColor(color) {
            this.currentBackground = color;
            if (color !== 'transparent') {
                this.ctx.fillStyle = color;
                this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
                this.drawTeachingBoard();
            }
        },

        setStrokeWidth(width) {
            this.currentStrokeWidth = width;
        },

        setStrokeStyle(style) {
            this.currentStrokeStyle = style;
        },

        setTool(tool) {
            this.currentTool = tool;
            if (this.isAnnotating) {
                this.setupDrawingMode();
            }
        },

        setEdge(edge) {
            this.currentEdge = edge;
        },

        updateOpacity() {
            // Opacity is handled in drawing methods
        },

        setSloppiness(level) {
            this.currentSloppiness = level;
        },

        // Canvas view controls
        zoomIn() {
            this.zoomLevel = Math.min(this.zoomLevel + 0.1, 3);
        },

        zoomOut() {
            this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.1);
        },

        resetZoom() {
            this.zoomLevel = 1;
        },

        toggleGrid() {
            this.showGrid = !this.showGrid;
        },

        handleWheel(event) {
            if (event.ctrlKey) {
                event.preventDefault();
                if (event.deltaY < 0) {
                    this.zoomIn();
                } else {
                    this.zoomOut();
                }
            }
        },

        // Minimal UI methods
        toggleSidebar() {
            this.sidebarExpanded = !this.sidebarExpanded;
        },

        toggleSection(section) {
            this.expandedSections[section] = !this.expandedSections[section];
        },

        // Keyboard shortcuts
        handleKeyboardShortcuts(event) {
            if (!this.isAnnotating) return;

            // Zoom shortcuts
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case '+':
                    case '=':
                        event.preventDefault();
                        this.zoomIn();
                        break;
                    case '-':
                        event.preventDefault();
                        this.zoomOut();
                        break;
                    case '0':
                        event.preventDefault();
                        this.resetZoom();
                        break;
                }
            }

            // Tool shortcuts (without modifier keys)
            if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                switch (event.key.toLowerCase()) {
                    case 'p':
                        this.setTool('pen');
                        break;
                    case 'l':
                        this.setTool('line');
                        break;
                    case 'r':
                        this.setTool('rectangle');
                        break;
                    case 'c':
                        this.setTool('circle');
                        break;
                    case 'a':
                        this.setTool('arrow');
                        break;
                    case 'e':
                        this.setTool('eraser');
                        break;
                    case 'g':
                        this.toggleGrid();
                        break;
                }
            }
        },

        addLayer() {
            const newLayer = {
                id: this.layers.length,
                name: `Layer ${this.layers.length + 1}`,
                visible: true,
                locked: false
            };
            this.layers.push(newLayer);
            this.currentLayer = newLayer.id;
        },

        moveLayerUp() {
            // Layer management - placeholder for now
            console.log('Move layer up');
        },

        moveLayerDown() {
            // Layer management - placeholder for now
            console.log('Move layer down');
        },

        duplicateLayer() {
            // Layer management - placeholder for now
            console.log('Duplicate layer');
        },

        deleteLayer() {
            // Layer management - placeholder for now
            console.log('Delete layer');
        },

        // Drawing event handlers
        handleMouseDown(event) {
            if (!this.isAnnotating) return;
            event.preventDefault();

            const coords = this.getCanvasCoordinates(event);
            this.lastX = coords.x;
            this.lastY = coords.y;
            this.isDrawing = true;

            if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastX, this.lastY);
            }
        },

        handleMouseUp(event) {
            if (!this.isAnnotating || !this.isDrawing) return;
            event.preventDefault();

            this.isDrawing = false;

            if (this.currentTool !== 'pen' && this.currentTool !== 'eraser') {
                const coords = this.getCanvasCoordinates(event);
                this.drawShape(this.lastX, this.lastY, coords.x, coords.y);
            }
        },

        handleMouseLeave() {
            this.isDrawing = false;
        },

        // Touch event handlers
        handleTouchStart(event) {
            if (!this.isAnnotating) return;
            event.preventDefault();

            const touch = event.touches[0];
            const coords = this.getCanvasCoordinates(touch);
            this.lastX = coords.x;
            this.lastY = coords.y;
            this.isDrawing = true;

            if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastX, this.lastY);
            }
        },

        handleTouchMove(event) {
            if (!this.isAnnotating || !this.isDrawing) return;
            event.preventDefault();

            const touch = event.touches[0];
            const coords = this.getCanvasCoordinates(touch);

            if (this.currentTool === 'pen') {
                this.drawPenStroke(coords.x, coords.y);
            } else if (this.currentTool === 'eraser') {
                this.drawEraserStroke(coords.x, coords.y);
            }
        },

        handleTouchEnd(event) {
            if (!this.isAnnotating || !this.isDrawing) return;
            event.preventDefault();

            this.isDrawing = false;

            if (this.currentTool !== 'pen' && this.currentTool !== 'eraser') {
                const touch = event.changedTouches[0];
                const coords = this.getCanvasCoordinates(touch);
                this.drawShape(this.lastX, this.lastY, coords.x, coords.y);
            }
        },

        // Get proper canvas coordinates accounting for zoom and device pixel ratio
        getCanvasCoordinates(event) {
            const rect = this.canvas.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / this.zoomLevel) * this.devicePixelRatio;
            const y = ((event.clientY - rect.top) / this.zoomLevel) * this.devicePixelRatio;
            return { x, y };
        },

        // Drawing methods
        drawPenStroke(x, y) {
            this.ctx.globalAlpha = this.currentOpacity / 100;
            this.ctx.strokeStyle = this.currentStroke;
            this.ctx.lineWidth = this.currentStrokeWidth;
            this.ctx.lineCap = this.currentEdge;
            this.ctx.lineJoin = this.currentEdge;

            // Set line dash pattern
            if (this.currentStrokeStyle === 'dashed') {
                this.ctx.setLineDash([5, 5]);
            } else if (this.currentStrokeStyle === 'dotted') {
                this.ctx.setLineDash([2, 2]);
            } else {
                this.ctx.setLineDash([]);
            }

            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
        },

        drawEraserStroke(x, y) {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.globalAlpha = 1;
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.currentStrokeWidth * 2, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = 'source-over';
        },

        drawShape(startX, startY, endX, endY) {
            this.ctx.globalAlpha = this.currentOpacity / 100;
            this.ctx.strokeStyle = this.currentStroke;
            this.ctx.lineWidth = this.currentStrokeWidth;
            this.ctx.lineCap = this.currentEdge;
            this.ctx.lineJoin = this.currentEdge;

            // Set line dash pattern
            if (this.currentStrokeStyle === 'dashed') {
                this.ctx.setLineDash([5, 5]);
            } else if (this.currentStrokeStyle === 'dotted') {
                this.ctx.setLineDash([2, 2]);
            } else {
                this.ctx.setLineDash([]);
            }

            this.ctx.beginPath();

            switch (this.currentTool) {
                case 'line':
                    this.ctx.moveTo(startX, startY);
                    this.ctx.lineTo(endX, endY);
                    break;

                case 'rectangle':
                    const width = endX - startX;
                    const height = endY - startY;
                    this.ctx.rect(startX, startY, width, height);
                    break;

                case 'circle':
                    const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                    this.ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
                    break;

                case 'arrow':
                    this.drawArrow(startX, startY, endX, endY);
                    break;
            }

            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        },

        drawArrow(startX, startY, endX, endY) {
            const headLength = 10;
            const angle = Math.atan2(endY - startY, endX - startX);

            // Draw line
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);

            // Draw arrowhead
            this.ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
        },

        clearBoard() {
            this.annotations = [];
            if (this.isAnnotating) {
                // Clear only drawings, redraw the teaching content
                this.drawTeachingBoard();
            } else {
                this.drawTeachingBoard();
            }
        },

        getSessionDuration() {
            if (!this.sessionStartTime) return '00:00';
            const now = new Date();
            const diff = now - this.sessionStartTime;
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        },

        formatSessionTime() {
            return this.getSessionDuration();
        },

        // Topic navigation methods
        switchLanguage(lang) {
            this.currentLanguage = lang;
            this.drawTeachingBoard();
        },

        highlightOption(optionIndex) {
            // In teaching mode, this shows the correct answer
            const currentTopic = this.currentTopic;
            if (optionIndex === currentTopic.correct_answer) {
                if (!this.markedTopics.includes(this.currentIndex)) {
                    this.markedTopics.push(this.currentIndex);
                }
            }
            this.drawTeachingBoard();
        },

        nextTopic() {
            if (this.currentIndex < this.topics.length - 1) {
                this.currentIndex++;
                this.drawTeachingBoard();
            }
        },

        prevTopic() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.drawTeachingBoard();
            }
        },

        goToTopic(index) {
            this.currentIndex = index;
            this.drawTeachingBoard();
        },

        toggleDiscussed() {
            this.$set(this.discussedTopics, this.currentIndex, !this.discussedTopics[this.currentIndex]);
            this.drawTeachingBoard();
        },

        toggleAnswer() {
            const index = this.markedTopics.indexOf(this.currentIndex);
            if (index === -1) {
                this.markedTopics.push(this.currentIndex);
            } else {
                this.markedTopics.splice(index, 1);
            }
            this.drawTeachingBoard();
        },

        endSession() {
            this.showSummary = true;
        },

        resetSession() {
            this.discussedTopics = [];
            this.markedTopics = [];
            this.currentIndex = 0;
            this.showSummary = false;
            this.sessionStartTime = new Date();
            this.annotations = [];
            this.useExcalidraw = false;
            this.excalidrawData = null;
            this.drawTeachingBoard();
        },

        // Excalidraw Integration Methods
        toggleExcalidraw() {
            this.useExcalidraw = !this.useExcalidraw;
            if (this.useExcalidraw) {
                // Switch to Excalidraw mode
                this.isAnnotating = false;
            } else {
                // Switch back to canvas mode
                this.drawTeachingBoard();
            }
        },

        handleExcalidrawChange(data) {
            this.excalidrawData = data;
            // Optionally save to localStorage or emit to parent
            this.$emit('excalidrawChange', data);
        },

        handleExcalidrawExport(type) {
            console.log(`Excalidraw exported as ${type}`);
            // Handle export logic
        },

        handleExcalidrawClear() {
            this.excalidrawData = null;
            console.log('Excalidraw cleared');
        },

        // Enhanced drawing methods with Excalidraw integration
        addTeachingNote(text, x = 100, y = 100) {
            if (this.useExcalidraw && this.$refs.excalidrawBoard) {
                // Add note via Excalidraw
                this.$refs.excalidrawBoard.addTextAnnotation();
            } else {
                // Add note via canvas
                this.addCanvasNote(text, x, y);
            }
        },

        addTeachingHighlight(x = 150, y = 150, width = 200, height = 100) {
            if (this.useExcalidraw && this.$refs.excalidrawBoard) {
                // Add highlight via Excalidraw
                this.$refs.excalidrawBoard.highlightArea();
            } else {
                // Add highlight via canvas
                this.addCanvasHighlight(x, y, width, height);
            }
        },

        addTeachingArrow(startX = 200, startY = 200, endX = 300, endY = 250) {
            if (this.useExcalidraw && this.$refs.excalidrawBoard) {
                // Add arrow via Excalidraw
                this.$refs.excalidrawBoard.addArrow();
            } else {
                // Add arrow via canvas
                this.addCanvasArrow(startX, startY, endX, endY);
            }
        },

        // Canvas-specific methods for backward compatibility
        addCanvasNote(text, x, y) {
            if (!this.ctx) return;
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#1971c2';
            this.ctx.strokeStyle = '#1971c2';
            this.ctx.fillRect(x - 5, y - 20, 210, 30);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(text, x, y);
        },

        addCanvasHighlight(x, y, width, height) {
            if (!this.ctx) return;
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = '#ffe066';
            this.ctx.fillRect(x, y, width, height);
            this.ctx.strokeStyle = '#f03e3e';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, width, height);
            this.ctx.globalAlpha = 1;
        },

        addCanvasArrow(startX, startY, endX, endY) {
            if (!this.ctx) return;
            this.ctx.strokeStyle = '#e03131';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();

            // Draw arrowhead
            const headLength = 10;
            const angle = Math.atan2(endY - startY, endX - startX);
            this.ctx.beginPath();
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
            this.ctx.stroke();
        }
    }
};
</script>

<template>
    <div class="canvas-teaching-container" :class="{ 'hindi-font': currentLanguage === 'hi' }">
        <!-- Minimal Left Sidebar with Expandable Controls -->
        <div v-if="isAnnotating" class="minimal-sidebar" :class="{ expanded: sidebarExpanded }">
            <!-- Sidebar Toggle -->
            <div class="sidebar-toggle" @click="toggleSidebar">
                <span v-if="!sidebarExpanded">⚙️</span>
                <span v-else>✖️</span>
            </div>

            <!-- Expandable Controls -->
            <div v-if="sidebarExpanded" class="expanded-controls">
                <!-- Stroke Colors -->
                <div class="mini-control-section">
                    <div class="control-header" @click="toggleSection('colors')">
                        <span class="control-icon">🎨</span>
                        <span class="control-title">Colors</span>
                        <span class="expand-icon" :class="{ rotated: expandedSections.colors }">▼</span>
                    </div>
                    <div v-if="expandedSections.colors" class="control-content">
                        <div class="mini-color-grid">
                            <div v-for="color in strokeColors.slice(0, 8)" :key="'stroke-' + color" :style="{ backgroundColor: color }" :class="{ active: currentStroke === color }" @click="setStrokeColor(color)" class="mini-color-box"></div>
                        </div>
                    </div>
                </div>

                <!-- Stroke Width -->
                <div class="mini-control-section">
                    <div class="control-header" @click="toggleSection('width')">
                        <span class="control-icon">📏</span>
                        <span class="control-title">Width</span>
                        <span class="expand-icon" :class="{ rotated: expandedSections.width }">▼</span>
                    </div>
                    <div v-if="expandedSections.width" class="control-content">
                        <div class="width-options">
                            <div v-for="width in [1, 2, 4, 8]" :key="'width-' + width" :class="{ active: currentStrokeWidth === width }" @click="setStrokeWidth(width)" class="width-option">
                                <div class="width-preview" :style="{ height: width + 'px' }"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Background -->
                <div class="mini-control-section">
                    <div class="control-header" @click="toggleSection('background')">
                        <span class="control-icon">🎭</span>
                        <span class="control-title">Background</span>
                        <span class="expand-icon" :class="{ rotated: expandedSections.background }">▼</span>
                    </div>
                    <div v-if="expandedSections.background" class="control-content">
                        <div class="mini-color-grid">
                            <div
                                v-for="color in ['transparent', '#ffffff', '#f0f0f0', '#000000']"
                                :key="'bg-' + color"
                                :style="{ backgroundColor: color === 'transparent' ? '#ffffff' : color }"
                                :class="{
                                    active: currentBackground === color,
                                    transparent: color === 'transparent'
                                }"
                                @click="setBackgroundColor(color)"
                                class="mini-color-box"
                            >
                                <div v-if="color === 'transparent'" class="transparent-pattern-mini"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Opacity -->
                <div class="mini-control-section">
                    <div class="control-header" @click="toggleSection('opacity')">
                        <span class="control-icon">🌫️</span>
                        <span class="control-title">Opacity: {{ currentOpacity }}%</span>
                        <span class="expand-icon" :class="{ rotated: expandedSections.opacity }">▼</span>
                    </div>
                    <div v-if="expandedSections.opacity" class="control-content">
                        <input type="range" min="10" max="100" step="10" v-model="currentOpacity" class="mini-opacity-slider" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Minimal Top Toolbar with Zoom Shortcuts -->
        <div v-if="isAnnotating" class="minimal-top-toolbar">
            <!-- Drawing Tools - Compact -->
            <div class="compact-tools">
                <button v-for="tool in quickTools" :key="'tool-' + tool.name" :class="{ active: currentTool === tool.name }" @click="setTool(tool.name)" class="compact-tool-btn" :title="tool.label">
                    <span v-html="tool.icon"></span>
                </button>
            </div>

            <!-- Zoom Controls - Shortcuts -->
            <div class="zoom-shortcuts">
                <div class="zoom-display">{{ Math.round(zoomLevel * 100) }}%</div>
                <button @click="zoomOut" class="zoom-shortcut" title="Zoom Out (Ctrl + -)">-</button>
                <button @click="zoomIn" class="zoom-shortcut" title="Zoom In (Ctrl + +)">+</button>
                <button @click="resetZoom" class="zoom-shortcut" title="Reset Zoom (Ctrl + 0)">⌂</button>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
                <button @click="clearBoard" class="quick-action-btn" title="Clear Board">🗑️</button>
                <button @click="toggleGrid" class="quick-action-btn" :class="{ active: showGrid }" title="Toggle Grid">⊞</button>
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="main-content" :class="{ 'with-minimal-sidebar': isAnnotating }">
            <!-- Canvas Container -->
            <div class="canvas-wrapper">
                <canvas
                    ref="teachingCanvas"
                    :width="canvasWidth * devicePixelRatio"
                    :height="canvasHeight * devicePixelRatio"
                    :style="{
                        width: canvasWidth + 'px',
                        height: canvasHeight + 'px',
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top left'
                    }"
                    @click="handleCanvasClick"
                    @mousemove="handleCanvasHover"
                    @mousedown="handleMouseDown"
                    @mouseup="handleMouseUp"
                    @mouseleave="handleMouseLeave"
                    @wheel="handleWheel"
                    @touchstart="handleTouchStart"
                    @touchmove="handleTouchMove"
                    @touchend="handleTouchEnd"
                    @touchcancel="handleTouchEnd"
                    class="teaching-canvas"
                ></canvas>

                <!-- Grid Overlay -->
                <div
                    v-if="showGrid && isAnnotating"
                    class="grid-overlay"
                    :style="{
                        width: canvasWidth + 'px',
                        height: canvasHeight + 'px',
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'top left'
                    }"
                ></div>
            </div>
        </div>

        <!-- Teaching Controls Panel -->
        <div class="teaching-controls">
            <button @click="toggleMode" class="mode-btn" :class="{ active: teachingMode === 'present' }">
                {{ currentLanguage === 'en' ? 'Presentation Mode' : 'प्रस्तुति मोड' }}
            </button>
            <button @click="toggleMode" class="mode-btn" :class="{ active: teachingMode === 'interactive' }">
                {{ currentLanguage === 'en' ? 'Interactive Mode' : 'इंटरैक्टिव मोड' }}
            </button>
            <button @click="toggleAnnotations" class="annotation-btn" :class="{ active: isAnnotating }">
                {{ currentLanguage === 'en' ? 'Draw Mode' : 'ड्रॉ मोड' }}
            </button>
            <button @click="toggleExcalidraw" class="excalidraw-btn" :class="{ active: useExcalidraw }">
                {{ currentLanguage === 'en' ? 'Excalidraw Mode' : 'एक्साड्रा मोड' }}
            </button>
            <button @click="clearBoard" class="clear-btn">
                {{ currentLanguage === 'en' ? 'Clear Board' : 'बोर्ड साफ़ करें' }}
            </button>
        </div>

        <!-- Excalidraw Integration -->
        <div v-if="useExcalidraw" class="excalidraw-overlay">
            <ExcalidrawBoard
                :currentLanguage="currentLanguage"
                :teachingMode="teachingMode === 'interactive'"
                :showControls="true"
                @change="handleExcalidrawChange"
                @export="handleExcalidrawExport"
                @clear="handleExcalidrawClear"
                ref="excalidrawBoard"
            />
        </div>

        <!-- Summary Modal -->
        <div v-if="showSummary" class="summary-modal" @click.self="showSummary = false">
            <div class="summary-content">
                <h2>{{ currentLanguage === 'en' ? 'Teaching Session Summary' : 'शिक्षण सत्र सारांश' }}</h2>

                <div class="summary-stats">
                    <div class="stat-item">
                        <div class="stat-value">{{ topics.length }}</div>
                        <div class="stat-label">{{ currentLanguage === 'en' ? 'Total Topics' : 'कुल विषय' }}</div>
                    </div>

                    <div class="stat-item">
                        <div class="stat-value">{{ discussedCount }}</div>
                        <div class="stat-label">{{ currentLanguage === 'en' ? 'Discussed' : 'चर्चित' }}</div>
                    </div>

                    <div class="stat-item">
                        <div class="stat-value">{{ interactiveCount }}</div>
                        <div class="stat-label">{{ currentLanguage === 'en' ? 'Interactive' : 'इंटरैक्टिव' }}</div>
                    </div>

                    <div class="stat-item">
                        <div class="stat-value">{{ formatSessionTime() }}</div>
                        <div class="stat-label">{{ currentLanguage === 'en' ? 'Session Time' : 'सत्र समय' }}</div>
                    </div>
                </div>

                <div class="summary-actions">
                    <button @click="resetSession" class="action-btn primary-btn">
                        {{ currentLanguage === 'en' ? 'New Session' : 'नया सत्र' }}
                    </button>
                    <button @click="showSummary = false" class="action-btn secondary-btn">
                        {{ currentLanguage === 'en' ? 'Close' : 'बंद करें' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Main Container */
.canvas-teaching-container {
    position: relative;
    width: 100%;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: 'Inter', sans-serif;
    overflow: hidden;
}

.hindi-font {
    font-family: 'Noto Sans Devanagari', 'Inter', sans-serif;
}

/* Minimal Left Sidebar */
.minimal-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 50px;
    height: 100vh;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-right: 1px solid rgba(0, 0, 0, 0.1);
    z-index: 1000;
    transition: width 0.3s ease;
    overflow: hidden;
}

.minimal-sidebar.expanded {
    width: 250px;
}

.sidebar-toggle {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    font-size: 18px;
    transition: background 0.2s ease;
}

.sidebar-toggle:hover {
    background: rgba(0, 0, 0, 0.05);
}

.expanded-controls {
    padding: 10px;
}

.mini-control-section {
    margin-bottom: 15px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 6px;
    overflow: hidden;
}

.control-header {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: background 0.2s ease;
}

.control-header:hover {
    background: rgba(0, 0, 0, 0.1);
}

.control-icon {
    font-size: 16px;
    margin-right: 8px;
}

.control-title {
    flex: 1;
    font-size: 12px;
    font-weight: 500;
}

.expand-icon {
    font-size: 10px;
    transition: transform 0.2s ease;
}

.expand-icon.rotated {
    transform: rotate(180deg);
}

.control-content {
    padding: 10px;
}

.mini-color-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
}

.mini-color-box {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.2s ease;
    position: relative;
}

.mini-color-box:hover {
    border-color: rgba(0, 0, 0, 0.3);
}

.mini-color-box.active {
    border-color: #2563eb;
}

.mini-color-box.transparent {
    background: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 4px 4px;
}

.width-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.width-option {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s ease;
}

.width-option:hover {
    background: rgba(0, 0, 0, 0.05);
}

.width-option.active {
    background: rgba(37, 99, 235, 0.1);
}

.width-preview {
    width: 100%;
    background: #000;
    border-radius: 1px;
}

.mini-opacity-slider {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(to right, transparent, #000);
    outline: none;
    cursor: pointer;
}

/* Minimal Top Toolbar */
.minimal-top-toolbar {
    position: fixed;
    top: 10px;
    left: 70px;
    right: 10px;
    height: 50px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    display: flex;
    align-items: center;
    padding: 0 15px;
    gap: 20px;
    z-index: 999;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.compact-tools {
    display: flex;
    gap: 4px;
}

.compact-tool-btn {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.compact-tool-btn:hover {
    background: rgba(0, 0, 0, 0.05);
}

.compact-tool-btn.active {
    background: #2563eb;
    color: white;
}

.zoom-shortcuts {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
}

.zoom-display {
    font-size: 12px;
    font-weight: 500;
    color: #666;
    min-width: 40px;
    text-align: center;
}

.zoom-shortcut {
    width: 32px;
    height: 32px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.zoom-shortcut:hover {
    background: #f0f0f0;
    border-color: rgba(0, 0, 0, 0.2);
}

.quick-actions {
    display: flex;
    gap: 8px;
}

.quick-action-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s ease;
}

.quick-action-btn:hover {
    background: rgba(0, 0, 0, 0.05);
}

.quick-action-btn.active {
    background: #10b981;
    color: white;
}

/* Main Content */
.main-content {
    height: 100vh;
    display: flex;
    flex-direction: column;
    transition: margin-left 0.3s ease;
}

.main-content.with-minimal-sidebar {
    margin-left: 50px;
}

.canvas-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: white;
    margin: 70px 10px 80px 10px;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.teaching-canvas {
    display: block;
    cursor: default;
    transition: transform 0.2s ease;
}

.grid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    background-image: linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
}

/* Teaching Controls */
.teaching-controls {
    position: fixed;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 15px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    z-index: 999;
}

.mode-btn,
.annotation-btn,
.excalidraw-btn,
.clear-btn {
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    background: white;
    color: #374151;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    border: 1px solid rgba(0, 0, 0, 0.1);
}

.mode-btn:hover,
.annotation-btn:hover,
.excalidraw-btn:hover,
.clear-btn:hover {
    background: #f9fafb;
    border-color: rgba(0, 0, 0, 0.2);
}

.mode-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

.annotation-btn.active {
    background: #10b981;
    color: white;
    border-color: #10b981;
}

.excalidraw-btn.active {
    background: #8b5cf6;
    color: white;
    border-color: #8b5cf6;
}

.clear-btn {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
}

.clear-btn:hover {
    background: #dc2626;
    border-color: #dc2626;
}

/* Excalidraw Overlay */
.excalidraw-overlay {
    position: absolute;
    top: 70px;
    left: 10px;
    right: 10px;
    bottom: 80px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    z-index: 500;
    overflow: hidden;
}

/* Summary Modal */
.summary-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.summary-content {
    background: white;
    padding: 30px;
    border-radius: 12px;
    min-width: 400px;
    max-width: 500px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.summary-content h2 {
    margin: 0 0 20px 0;
    color: #1f2937;
    font-size: 24px;
    font-weight: 600;
    text-align: center;
}

.summary-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 25px;
}

.stat-item {
    text-align: center;
    padding: 15px;
    background: #f9fafb;
    border-radius: 8px;
}

.stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #3b82f6;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
}

.summary-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
}

.action-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.primary-btn {
    background: #3b82f6;
    color: white;
}

.primary-btn:hover {
    background: #2563eb;
}

.secondary-btn {
    background: #f3f4f6;
    color: #374151;
}

.secondary-btn:hover {
    background: #e5e7eb;
}

/* Responsive Design */
@media (max-width: 768px) {
    .minimal-sidebar.expanded {
        width: 200px;
    }

    .minimal-top-toolbar {
        left: 60px;
        flex-wrap: wrap;
        height: auto;
        min-height: 50px;
        padding: 10px;
    }

    .teaching-controls {
        flex-wrap: wrap;
        justify-content: center;
        max-width: calc(100% - 20px);
    }

    .mode-btn,
    .annotation-btn,
    .excalidraw-btn,
    .clear-btn {
        font-size: 12px;
        padding: 8px 12px;
    }

    .canvas-wrapper {
        margin: 80px 5px 100px 5px;
    }

    .excalidraw-overlay {
        top: 80px;
        left: 5px;
        right: 5px;
        bottom: 100px;
    }
}

@media (max-width: 480px) {
    .summary-stats {
        grid-template-columns: 1fr;
    }

    .stat-value {
        font-size: 24px;
    }

    .summary-content {
        margin: 20px;
        min-width: auto;
    }
}

/* Animation Classes */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Focus States for Accessibility */
.compact-tool-btn:focus,
.zoom-shortcut:focus,
.quick-action-btn:focus,
.mode-btn:focus,
.annotation-btn:focus,
.excalidraw-btn:focus,
.clear-btn:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
    .minimal-sidebar,
    .minimal-top-toolbar,
    .teaching-controls {
        background: white;
        border: 2px solid black;
    }

    .compact-tool-btn.active,
    .mode-btn.active,
    .annotation-btn.active,
    .excalidraw-btn.active {
        background: black;
        color: white;
    }
}

/* Print Styles */
@media print {
    .minimal-sidebar,
    .minimal-top-toolbar,
    .teaching-controls,
    .summary-modal {
        display: none !important;
    }

    .main-content {
        margin: 0 !important;
        height: auto !important;
    }

    .canvas-wrapper {
        margin: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
    }
}
</style>
