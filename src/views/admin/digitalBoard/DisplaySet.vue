

<script setup>
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import { faPhone, faLandmarkFlag, faHouseChimney, faChalkboardTeacher, faChevronLeft, faChevronRight, faSearch, faExpand, faCompass, faSlidersH, faBook, faBookOpen, faEraser, faCheckCircle, faPause, faRedo, faPlay, faClock, faSearchMinus, faSearchPlus, faClipboard, faClipboardList, faDesktopAlt } from '@fortawesome/free-solid-svg-icons'

  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { faClockFour, faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
  import { useRoute } from 'vue-router';
  import { apiClient } from '@/service/apiService';
  import { useToast } from 'primevue/usetoast';
  const route = useRoute();
  const toast = useToast();



/*====================================================*/
const boardBgColor = ref('#ffffff');
const questionBgColor = ref('#ffffff');
const questionColor = ref('#1f2937');
const questionFontSize = ref(20);
const questionFontWeight = ref('bold');
const questionFontFamily = ref("'Segoe UI', Tahoma, Geneva, Verdana, sans-serif");

const optionBgColor = ref('#ffffff');
const optionColor = ref('#4b5563');
const optionFontSize = ref(16);
const optionFontWeight = ref('normal');
const fontWeights = ['lighter', 'normal', 'bold', 'bolder'];

// Floating element positions
const questionPosition = ref({ x: 50, y: 150 });
const optionsPosition = ref({ x: 50, y: 350 });
const timerPosition = ref({ x: window.innerWidth - 250, y: 50 });
const toolbarPosition = ref({ x: 20, y: 300 });

// Drawing state
const drawingCanvas = ref(null);
const drawingMode = ref(false);
const showDrawingTools = ref(true);
const currentTool = ref('pen');
const drawingColor = ref('#ff0000');
const brushSize = ref(3);
const isDrawing = ref(false);
const drawingHistory = ref([]);
let lastX = 0;
let lastY = 0;
let drawingContext = null;

// Dragging state
let isDragging = false;
let draggingElement = ref(null);
let dragOffset = { x: 0, y: 0 };

const startDragging = (elementType, event) => {
  // Only start dragging if clicking on the drag handle or the element itself (not on interactive content)
  if (event.target.closest('.option') && elementType === 'options') {
    return; // Don't start dragging when clicking on options
  }
  if (event.target.closest('.tool-btn') && elementType === 'toolbar') {
    return; // Don't start dragging when clicking on toolbar buttons
  }
  
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
  
  // Add visual feedback
  element.style.cursor = 'grabbing';
};

const onDrag = (event) => {
  if (!isDragging || !draggingElement.value) return;

  const x = event.clientX - dragOffset.x;
  const y = event.clientY - dragOffset.y;
  
  // Ensure elements stay within viewport bounds
  const maxX = window.innerWidth - 300;
  const maxY = window.innerHeight - 200;
  
  const boundedX = Math.max(0, Math.min(x, maxX));
  const boundedY = Math.max(0, Math.min(y, maxY));

  if (draggingElement.value === 'question') {
    questionPosition.value.x = boundedX;
    questionPosition.value.y = boundedY;
  } else if (draggingElement.value === 'options') {
    optionsPosition.value.x = boundedX;
    optionsPosition.value.y = boundedY;
  } else if (draggingElement.value === 'timer') {
    timerPosition.value.x = boundedX;
    timerPosition.value.y = boundedY;
  } else if (draggingElement.value === 'toolbar') {
    toolbarPosition.value.x = boundedX;
    toolbarPosition.value.y = boundedY;
  }
};

const stopDragging = (event) => {
  if (isDragging) {
    const element = document.querySelector('.floating-draggable');
    if (element) {
      element.style.cursor = 'move';
    }
  }
  
  isDragging = false;
  draggingElement.value = null;
  dragOffset = { x: 0, y: 0 };

  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDragging);
};

const resetStyles = () => {
    boardBgColor.value = '#ffffff';
    questionBgColor.value = '#ffffff';
    questionColor.value = '#1f2937';
    questionFontSize.value = 20;
    questionFontWeight.value = 'bold';
    questionFontFamily.value = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

    optionBgColor.value = '#ffffff';
    optionColor.value = '#4b5563';
    optionFontSize.value = 16;
    optionFontWeight.value = 'normal';

    // Reset positions to default
    questionPosition.value = { x: 50, y: 150 };
    optionsPosition.value = { x: 50, y: 350 };
    timerPosition.value = { x: window.innerWidth - 250, y: 50 };
    toolbarPosition.value = { x: 20, y: 300 };
};

// Drawing functions
const toggleDrawingMode = () => {
  drawingMode.value = !drawingMode.value;
};

const setTool = (tool) => {
  currentTool.value = tool;
};

const initCanvas = () => {
  if (drawingCanvas.value) {
    drawingContext = drawingCanvas.value.getContext('2d');
    drawingCanvas.value.width = window.innerWidth;
    drawingCanvas.value.height = window.innerHeight;
    drawingContext.lineCap = 'round';
    drawingContext.lineJoin = 'round';
  }
};

const startDrawing = (event) => {
  if (!drawingMode.value || !drawingContext) return;
  
  saveCanvasState();
  isDrawing.value = true;
  
  const rect = drawingCanvas.value.getBoundingClientRect();
  lastX = event.clientX - rect.left;
  lastY = event.clientY - rect.top;
  
  if (currentTool.value === 'pen' || currentTool.value === 'highlighter') {
    drawingContext.beginPath();
    drawingContext.moveTo(lastX, lastY);
  }
};

const draw = (event) => {
  if (!isDrawing.value || !drawingMode.value || !drawingContext) return;
  
  const rect = drawingCanvas.value.getBoundingClientRect();
  const currentX = event.clientX - rect.left;
  const currentY = event.clientY - rect.top;
  
  drawingContext.lineWidth = brushSize.value;
  drawingContext.strokeStyle = drawingColor.value;
  
  if (currentTool.value === 'pen') {
    drawingContext.globalCompositeOperation = 'source-over';
    drawingContext.lineTo(currentX, currentY);
    drawingContext.stroke();
  } else if (currentTool.value === 'highlighter') {
    drawingContext.globalCompositeOperation = 'multiply';
    drawingContext.globalAlpha = 0.3;
    drawingContext.lineTo(currentX, currentY);
    drawingContext.stroke();
    drawingContext.globalAlpha = 1;
  } else if (currentTool.value === 'eraser') {
    drawingContext.globalCompositeOperation = 'destination-out';
    drawingContext.beginPath();
    drawingContext.arc(currentX, currentY, brushSize.value, 0, Math.PI * 2);
    drawingContext.fill();
  }
  
  lastX = currentX;
  lastY = currentY;
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
      drawingHistory.value.shift();
    }
  }
};

const clearCanvas = () => {
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
      if (drawingHistory.value.length > 0) {
        const prevState = drawingHistory.value[drawingHistory.value.length - 1];
        const prevImg = new Image();
        prevImg.onload = () => {
          drawingContext.drawImage(prevImg, 0, 0);
        };
        prevImg.src = prevState;
      }
    };
    img.src = lastState;
  }
};


/*====================================================*/


  const setId = ref(route.params.id)
  const mirror_key = ref(null);

  const currentLanguage = ref('en'); // Default language 'en',
  const timerInterval = ref(null);
  const currentIndex = ref(0);// 0,
  const currentPage = ref(0);// 0,
  const questionsPerPage = ref(10);// 30,
  const selectedOption = ref(null);
  const showAnswer = ref(false);// false,
  const showSolution = ref(false);// false,
  const userAnswers = ref([]);
  const timerActive = ref(false);// false,
  const currentQuestionTime = ref(30);
  const examMeta = ref( {
          timePerQuestion: 30,
        });
  const showControls = ref(true);// true,
  const showTimer = ref(true);// true,
  const zoomLevel = ref(100);// 100,
  const fontSize = ref(18);// 18,
  const fontFamily = ref( "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif");

  const questions =  ref([
    {
            question: {
              text: {
                en: "What is the primary function of the mitochondria in a cell?",
                hi: "कोशिका में माइटोकॉन्ड्रिया का प्राथमिक कार्य क्या है?"
              }
            },
            options: [
              { text: { en: "Protein synthesis", hi: "प्रोटीन संश्लेषण" } },
              { text: { en: "Energy production", hi: "ऊर्जा उत्पादन" } },
              { text: { en: "Cell division", hi: "कोशिका विभाजन" } },
              { text: { en: "Waste elimination", hi: "अपशिष्ट उन्मूलन" } }
            ],
            marks: 1,
            negative_mark: 0.25,
            correct_answer: 1,
            explanation: {
              en: "Mitochondria are known as the powerhouses of the cell. They generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.",
              hi: "माइटोकॉन्ड्रिया को कोशिका का पावरहाउस कहा जाता है। ये कोशिका के अधिकांश एडेनोसिन ट्राइफॉस्फेट (ATP) का उत्पादन करते हैं, जिसका उपयोग रासायनिक ऊर्जा के स्रोत के रूप में किया जाता है।"
            },
            image: "https://images.unsplash.com/photo-1584556812950-a3a2b1b4e95b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=300&w=500"
          },
          {
            question: {
              text: {
                en: "Which of these is NOT a prime number?",
                hi: "इनमें से कौन सी एक अभाज्य संख्या नहीं है?"
              }
            },
            options: [
              { text: { en: "17", hi: "17" } },
              { text: { en: "23", hi: "23" } },
              { text: { en: "31", hi: "31" } },
              { text: { en: "39", hi: "39" } }
            ],
            marks: 1,
            negative_mark: 0,
            correct_answer: 3,
            explanation: {
              en: "A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself. 39 is divisible by 3 and 13.",
              hi: "एक अभाज्य संख्या 1 से बड़ी एक प्राकृतिक संख्या होती है जिसका 1 और स्वयं के अलावा कोई सकारात्मक भाजक नहीं होता है। 39, 3 और 13 से विभाज्य है।"
            },
            image: null
          },
          {
            question: {
              text: {
                en: "What is the chemical symbol for gold?",
                hi: "सोने का रासायनिक प्रतीक क्या है?"
              }
            },
            options: [
              { text: { en: "Ag", hi: "Ag" } },
              { text: { en: "Au", hi: "Au" } },
              { text: { en: "Fe", hi: "Fe" } },
              { text: { en: "Cu", hi: "Cu" } }
            ],
            marks: 1,
            negative_mark: 0.25,
            correct_answer: 1,
            explanation: {
              en: "The chemical symbol for gold is Au, derived from its Latin name 'Aurum' which means 'shining dawn'.",
              hi: "सोने का रासायनिक प्रतीक Au है, जो इसके लैटिन नाम 'ऑरम' से लिया गया है जिसका अर्थ है 'चमकती भोर'।"
            },
            image: "https://images.unsplash.com/photo-1612428978260-2b9c7df20150?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=300&w=500"
          },
          {
            question: {
              text: {
                en: "Who wrote the play 'Romeo and Juliet'?",
                hi: "'रोमियो और जूलियट' नाटक किसने लिखा?"
              }
            },
            options: [
              { text: { en: "Charles Dickens", hi: "चार्ल्स डिकेंस" } },
              { text: { en: "William Shakespeare", hi: "विलियम शेक्सपियर" } },
              { text: { en: "Jane Austen", hi: "जेन ऑस्टेन" } },
              { text: { en: "Mark Twain", hi: "मार्क ट्वेन" } }
            ],
            marks: 1,
            negative_mark: 0,
            correct_answer: 1,
            explanation: {
              en: "'Romeo and Juliet' is a tragedy written by William Shakespeare early in his career about two young star-crossed lovers whose deaths ultimately reconcile their feuding families.",
              hi: "'रोमियो और जूलियट' विलियम शेक्सपियर द्वारा उनके करियर की शुरुआत में लिखा गया एक दुखांत नाटक है, जो दो युवा प्रेमियों के बारे में है जिनकी मृत्यु अंततः उनके झगड़ते परिवारों में सुलह कराती है।"
            },
            image: null
          },
          {
            question: {
              text: {
                en: "What is the capital of Australia?",
                hi: "ऑस्ट्रेलिया की राजधानी क्या है?"
              }
            },
            options: [
              { text: { en: "Sydney", hi: "सिडनी" } },
              { text: { en: "Melbourne", hi: "मेलबर्न" } },
              { text: { en: "Canberra", hi: "कैनबरा" } },
              { text: { en: "Perth", hi: "पर्थ" } }
            ],
            marks: 1,
            negative_mark: 0.25,
            correct_answer: 2,
            explanation: {
              en: "Canberra was selected as the capital in 1908 as a compromise between rivals Sydney and Melbourne. It's unusual among Australian cities as an entirely planned city.",
              hi: "1908 में कैनबरा को प्रतिद्वंद्वियों सिडनी और मेलबर्न के बीच समझौते के रूप में राजधानी के रूप में चुना गया था। यह पूरी तरह से नियोजित शहर के रूप में ऑस्ट्रेलियाई शहरों में असामान्य है।"
            },
            image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=300&w=500"
          }
  ]);
  const currentQuestion = computed(() => questions.value[currentIndex.value]);
  const totalPages = computed(() => Math.ceil(questions.value.length / questionsPerPage.value));
  const visibleQuestions = computed(() => {
    const start = currentPage.value * questionsPerPage.value;
    const end = Math.min(start + questionsPerPage.value, questions.value.length);
    return Array.from({ length: end - start }, (_, i) => start + i + 1);
  });

  const selectOption = (optionIndex) => {
    selectedOption.value = optionIndex;
    userAnswers.value[currentIndex.value] = optionIndex;
  }

  // Watch for changes in currentQuestion
  watch(currentQuestion, (newQuestion, oldQuestion) => {
    console.log('Current question changed:', newQuestion);
    (async() => {
      const _data = {
        question_id : newQuestion.id,
        set_id : setId.value
      }
     const response = await apiClient.post('admin/digital-board/mirror-the-question',_data);
    })();
  });

  const clearSelection = () => {
    selectedOption.value = null;
    userAnswers.value[currentIndex.value] = undefined;
  }

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.value.length) {
      currentIndex.value = index;
      currentPage.value = Math.floor(index / questionsPerPage.value);
      resetTimer();
      startTimer();
      selectedOption.value = userAnswers.value[index] !== undefined ? userAnswers.value[index] : null;
    }
  }
  const nextPage = () => {
    if (currentPage.value < totalPages.value - 1) {
      currentPage.value++;
      currentIndex.value = currentPage.value * questionsPerPage.value;
      resetTimer();
    }
  }

  const prevPage = () => {
    if (currentPage.value > 0) {
      currentPage.value--;
      currentIndex.value = currentPage.value * questionsPerPage.value;
      resetTimer();
    }
  }

  const startTimer = () => {
    if (!timerActive.value) {
      showTimer.value = true; // Show timer when starting
      timerActive.value = true;
      timerInterval.value = setInterval(() => {
        if (currentQuestionTime.value > 0) {
          currentQuestionTime.value--;
        } else {
          clearInterval(timerInterval.value);
          timerActive.value = false;
          // Start fade out animation
          showTimer.value = false;
        }
      }, 1000);
    }
  }

  const pauseTimer = () => {
    clearInterval(timerInterval.value);
    timerActive.value = false;
  }

  const resetTimer = () => {
    pauseTimer();
    currentQuestionTime.value = examMeta.value.timePerQuestion;
    showTimer.value = true; // Show timer when resetting
    selectedOption.value = userAnswers.value[currentIndex.value] !== undefined ?
                           userAnswers.value[currentIndex.value] : null;
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  const zoomIn = () => {
    if (zoomLevel.value < 150) {
      zoomLevel.value += 10;
    }
  }
  const zoomOut = () => {
    if (zoomLevel.value > 50) {
      zoomLevel.value -= 10;
    }
  }
  const resetZoom = () => {
    zoomLevel.value = 100;
  }
  const toggleFullscreen = () => {
    const elem = document.querySelector('.teaching-board');
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

 watch(
  () => route.params.id,
  (newId) => {
    setId.value = newId
    fetchQuestionsOfSet(newId);
    console.log("Set ID updated:", newId)
  },
  { immediate: true }  // run immediately on mount
)

  onMounted(() => {
    console.log("set ===", setId.value);
    fetchQuestionsOfSet(setId.value);
    fetchMirrorKey();
    resetTimer();
    
    // Initialize positions based on window size
    timerPosition.value.x = window.innerWidth - 250;
    
    // Initialize drawing canvas
    setTimeout(() => {
      initCanvas();
    }, 100);
    
    // Handle window resize to keep elements in bounds
    const handleResize = () => {
      const maxX = window.innerWidth - 300;
      const maxY = window.innerHeight - 200;
      
      // Adjust positions if they're out of bounds
      if (timerPosition.value.x > maxX) timerPosition.value.x = maxX;
      if (timerPosition.value.y > maxY) timerPosition.value.y = maxY;
      if (questionPosition.value.x > maxX) questionPosition.value.x = maxX;
      if (questionPosition.value.y > maxY) questionPosition.value.y = maxY;
      if (optionsPosition.value.x > maxX) optionsPosition.value.x = maxX;
      if (optionsPosition.value.y > maxY) optionsPosition.value.y = maxY;
      if (toolbarPosition.value.x > maxX) toolbarPosition.value.x = maxX;
      if (toolbarPosition.value.y > maxY) toolbarPosition.value.y = maxY;
      
      // Resize canvas
      if (drawingCanvas.value) {
        drawingCanvas.value.width = window.innerWidth;
        drawingCanvas.value.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up on unmount
    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
    });
  });

  onBeforeUnmount(() => {
    clearInterval(timerInterval);
    // Clean up drag event listeners
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDragging);
  });

  // data calls
  async function fetchQuestionsOfSet(setId) {
    try {
      const response = await apiClient.get('/admin/digital-board/questions/'+setId)
      questions.value = response.data.data.map(q => q.formattedQuestion )
      // console.log(this.questions);
    } catch (error) {
      console.error("Error fetching questions:", error)
    }
  }

  async function createMirror(){
    try {
      const response = await apiClient.post('/admin/digital-board/create-mirror',{
        "setId":setId.value
      });
      mirror_key.value = response.data.data.mirror_key
      // console.log(this.questions);
    } catch (error) {
      console.error("Error fetching questions:", error)
    }
  }

  async function fetchMirrorKey(){
    try {
      const response = await apiClient.get('/admin/digital-board/mirror-key/'+setId.value)

    // alert(response.data.data.mirror_key);
      mirror_key.value = response.data.data.mirror_key
      // console.log(this.questions);
    } catch (error) {
      console.error("Error fetching questions:", error)
    }
  }
  // mirror_key

  const copyToClipboard = () => {
    if (!mirror_key.value) return

    navigator.clipboard.writeText(mirror_key.value)
    .then(() => {
      alert('Copied to clipboard!');
    })
    .catch(err => {
      console.error(err)
    })
  }
</script>

  <template>
  <div class="teacher-board-frame">
    <div class="teaching-board">
      <!-- Top Bar -->
      <div class="top-bar">
        <div class="app-title">
          <FontAwesomeIcon :icon="faChalkboardTeacher"  class="icon"/>
          <div class="header-line-separator">
             <span v-if="currentLanguage === 'en'">Digital Teaching Board</span>
             <span v-else>डिजिटल शिक्षण बोर्ड</span>
          </div>
        </div>

        <div class="top-controls">
          <div class="language-selector">
            <span v-if="currentLanguage === 'en'">Language:</span>
            <span v-else>भाषा:</span>
            <select v-model="currentLanguage">
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>

          <div class="question-counter">
            Q{{ currentIndex + 1 }}/{{ questions.length }}
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Question Area -->
        <div class="question-area" :style="{ fontSize: fontSize + 'px', fontFamily: fontFamily , backgroundColor: boardBgColor}">
          <div class="question-content" :style="{ transform: 'scale(' + (zoomLevel/100) + ')' }">
            <!-- Main content area - now empty but maintains structure -->
            
            <!-- Explanation (for teacher) - keeping this in original position -->
            <div v-if="showSolution && currentQuestion.explanation" class="explanation-box">
              <div class="explanation-title">
                <span v-if="currentLanguage === 'en'">Teaching Notes:</span>
                <span v-else>शिक्षण नोट्स:</span>
              </div>
              <p>{{ currentQuestion.explanation[currentLanguage] || currentQuestion.explanation.en }}</p>
            </div>
          </div>
        </div>

        <!-- Floating Draggable Question Box -->
        <div class="question-box floating-draggable" 
             :style="{
               position: 'fixed',
               left: questionPosition.x + 'px',
               top: questionPosition.y + 'px',
               zIndex: draggingElement === 'question' ? 1003 : 1001,
               backgroundColor: questionBgColor,
               color: questionColor,
               fontSize: questionFontSize + 'px',
               fontWeight: questionFontWeight,
               display: 'block',
               marginLeft: '-40px'
             }"
             @mousedown="startDragging('question', $event)">
          <div class="drag-handle">⋮⋮</div>
          <div class="flex gap-1">
            <div class="question-number flex gap-2" style="align-items: center;border-right: 1px solid #dfe3e7;padding-right: 10px;">
              <span v-if="currentLanguage === 'en'">Question</span>
              <span v-else>प्रश्न</span> {{ currentIndex + 1 }}
              <span v-if="currentQuestion.marks"> |
                <span v-if="currentLanguage === 'en'">Marks:</span>
                <span v-else>अंक:</span> {{ currentQuestion.marks }}
              </span>
            </div>
            <div>
              <div class="question-text" :style="{ fontSize: questionFontSize + 'px' , fontWeight: questionFontWeight, color: questionColor, fontFamily: questionFontFamily,backgroundColor: questionBgColor}">
                {{ currentQuestion.question.text.en }}
              </div>
              <div class="question-text question-hindi-text" v-if="currentLanguage !== 'en'" :style="{ fontSize: questionFontSize + 'px' , fontWeight: questionFontWeight, color: questionColor, fontFamily: questionFontFamily,backgroundColor: questionBgColor}">
                {{ currentQuestion.question.text.hi }}
              </div>
            </div>
          </div>

          <!-- Question Image -->
          <div v-if="currentQuestion.image" class="question-image">
            <img :src="currentQuestion.image"
                :alt="currentLanguage === 'en' ? 'Question diagram' : 'प्रश्न आरेख'">
          </div>
        </div>

        <!-- Floating Draggable Options Container -->
        <div class="options-container floating-draggable" 
             :style="{
               position: 'fixed',
               left: optionsPosition.x + 'px',
               top: optionsPosition.y + 'px',
               zIndex: draggingElement === 'options' ? 1003 : 1001,
               backgroundColor: optionBgColor,
               color: optionColor,
               fontSize: optionFontSize + 'px',
               fontWeight: optionFontWeight
             }"
             @mousedown="startDragging('options', $event)">
          <div class="drag-handle">⋮⋮</div>
          <div v-for="(option, idx) in currentQuestion.options" :style="{backgroundColor: optionBgColor,
                       color: optionColor,
                       fontSize: optionFontSize + 'px',
                       fontWeight: optionFontWeight,}"
               :key="idx"
               class="option"
               :class="{
                  'selected': selectedOption === idx,
                  'correct': showAnswer && currentQuestion.answer.charAt(0).toUpperCase() === String.fromCharCode(65 + idx),
                  'incorrect': showAnswer && selectedOption === idx && selectedOption !== currentQuestion.correct_answer
                }"
                @click="selectOption(idx)">
            <div class="option-letter">{{ String.fromCharCode(65 + idx) }}.</div>
            <div class="option-text">{{ option.text[currentLanguage] || option.text.en }}</div>
          </div>
        </div>

        <!-- Floating Draggable Timer -->
        <div class="question-timer floating-draggable" 
             :class="{ 'fade-out': !showTimer }" 
             v-show="showTimer"
             :style="{
               position: 'fixed',
               left: timerPosition.x + 'px',
               top: timerPosition.y + 'px',
               zIndex: draggingElement === 'timer' ? 1003 : 1002
             }"
             @mousedown="startDragging('timer', $event)">
          <div class="drag-handle">⋮⋮</div>
          <div class="timer">
            {{ formatTime(currentQuestionTime) }}
          </div>
        </div>

        <!-- Drawing Canvas Layer -->
        <canvas ref="drawingCanvas" 
                class="drawing-canvas"
                :style="{
                  position: 'fixed',
                  top: '0px',
                  left: '0px',
                  width: '100vw',
                  height: '100vh',
                  zIndex: isDrawing ? 999 : 900,
                  pointerEvents: drawingMode ? 'auto' : 'none'
                }"
                @mousedown="startDrawing"
                @mousemove="draw"
                @mouseup="stopDrawing"
                @mouseleave="stopDrawing">
        </canvas>

        <!-- Floating Drawing Toolbar -->
        <div class="drawing-toolbar floating-draggable" 
             v-show="showDrawingTools"
             :style="{
               position: 'fixed',
               left: toolbarPosition.x + 'px',
               top: toolbarPosition.y + 'px',
               zIndex: draggingElement === 'toolbar' ? 1003 : 1000
             }"
             @mousedown="startDragging('toolbar', $event)">
          <div class="drag-handle">⋮⋮</div>
          
          <div class="toolbar-content">
            <!-- Drawing Mode Toggle -->
            <button class="tool-btn" 
                    :class="{ active: drawingMode }" 
                    @click="toggleDrawingMode"
                    title="Toggle Drawing Mode">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>

            <!-- Pen Tool -->
            <button class="tool-btn" 
                    :class="{ active: currentTool === 'pen' }" 
                    @click="setTool('pen')"
                    title="Pen">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>

            <!-- Highlighter -->
            <button class="tool-btn" 
                    :class="{ active: currentTool === 'highlighter' }" 
                    @click="setTool('highlighter')"
                    title="Highlighter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 9h4v2h-4V9zm0 4h4v2h-4v-2zm0-8h4v2h-4V5zm7-4H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H6V3h12v16z"/>
              </svg>
            </button>

            <!-- Eraser -->
            <button class="tool-btn" 
                    :class="{ active: currentTool === 'eraser' }" 
                    @click="setTool('eraser')"
                    title="Eraser">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l8.63-8.64c.79-.78 2.05-.78 2.84 0l1.96 1.97zm-2.83 14.14l3.54-3.54L12 9.21l-3.54 3.54 4.95 4.95z"/>
              </svg>
            </button>

            <!-- Rectangle -->
            <button class="tool-btn" 
                    :class="{ active: currentTool === 'rectangle' }" 
                    @click="setTool('rectangle')"
                    title="Rectangle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              </svg>
            </button>

            <!-- Circle -->
            <button class="tool-btn" 
                    :class="{ active: currentTool === 'circle' }" 
                    @click="setTool('circle')"
                    title="Circle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </button>

            <!-- Arrow -->
            <button class="tool-btn" 
                    :class="{ active: currentTool === 'arrow' }" 
                    @click="setTool('arrow')"
                    title="Arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="7,7 17,7 17,17"/>
              </svg>
            </button>

            <!-- Text -->
            <button class="tool-btn" 
                    :class="{ active: currentTool === 'text' }" 
                    @click="setTool('text')"
                    title="Text">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 4v3h5.5v12h3V7H19V4z"/>
              </svg>
            </button>

            <!-- Color Picker -->
            <div class="color-picker-container">
              <input type="color" 
                     v-model="drawingColor" 
                     class="color-picker"
                     title="Color">
            </div>

            <!-- Brush Size -->
            <div class="brush-size-container">
              <input type="range" 
                     v-model="brushSize" 
                     min="1" 
                     max="20" 
                     class="brush-size-slider"
                     title="Brush Size">
              <span class="brush-size-indicator" :style="{ width: brushSize + 'px', height: brushSize + 'px' }"></span>
            </div>

            <!-- Clear All -->
            <button class="tool-btn clear-btn" 
                    @click="clearCanvas"
                    title="Clear All">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>

            <!-- Undo -->
            <button class="tool-btn" 
                    @click="undoDrawing"
                    :disabled="drawingHistory.length === 0"
                    title="Undo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
              </svg>
            </button>
          </div>
        </div>
        <!-- Control Panel Toggle -->
        <div class="toggle-panel" @click="showControls = !showControls">
          <FontAwesomeIcon v-if="showControls" :icon="faChevronRight" />
          <FontAwesomeIcon v-else :icon="faChevronLeft" />
        </div>

        <!-- Control Panel -->
        <div class="control-panel" v-if="showControls">
          <!-- Timer Controls -->
          <div class="panel-section">
            <div class="section-title">
               <FontAwesomeIcon :icon="faClockFour" class="icon" />
              <span v-if="currentLanguage === 'en'">Timer Controls</span>
              <span v-else>टाइमर नियंत्रण</span>
            </div>

            <div class="controls-grid">
              <button class="control-btn start"
                      @click="startTimer"
                      :disabled="timerActive">
                 <FontAwesomeIcon :icon="faPlay" class="icon" />
                <span v-if="currentLanguage === 'en'">Start</span>
                <span v-else>शुरू</span>
              </button>

              <button class="control-btn pause"
                      @click="pauseTimer"
                      :disabled="!timerActive">

                 <FontAwesomeIcon :icon="faPause" class="icon" />
                <span v-if="currentLanguage === 'en'">Pause</span>
                <span v-else>रोकें</span>
              </button>

              <button class="control-btn reset" @click="resetTimer">
                <FontAwesomeIcon :icon="faRedo" class="icon" />
                <span v-if="currentLanguage === 'en'">Reset</span>
                <span v-else>रीसेट</span>
              </button>
            </div>

            <div class="timer-controls">
              <span v-if="currentLanguage === 'en'">Set time:</span>
              <span v-else>समय सेट करें:</span>
              <input type="number" v-model="examMeta.timePerQuestion" min="10">
              <span>sec</span>
            </div>
          </div>

          <!-- Question Navigation -->
          <div class="panel-section">
            <div class="section-title">
              <FontAwesomeIcon :icon="faCompass"  class="icon"/>

              <span v-if="currentLanguage === 'en'">Question Navigation</span>
              <span v-else>प्रश्न नेविगेशन</span>
            </div>

            <div class="nav-controls">
              <button class="nav-btn" @click="prevPage" :disabled="currentPage === 0">

                <FontAwesomeIcon :icon="faChevronRight"  class="icon"/>
              </button>

              <span class="page-info">
                <span v-if="currentLanguage === 'en'">Page</span>
                <span v-else>पृष्ठ</span> {{ currentPage + 1 }}/{{ totalPages }}
              </span>

              <button class="nav-btn" @click="nextPage" :disabled="currentPage === totalPages - 1">

                <FontAwesomeIcon :icon="faChevronLeft"  class="icon"/>
              </button>
            </div>

            <div class="question-grid">
              <button v-for="num in visibleQuestions"
                      :key="num"
                      @click="goToQuestion(num - 1)"
                      class="grid-btn"
                      :class="{
                        'current': currentIndex === num - 1,
                        'answered': userAnswers[num - 1] !== undefined
                      }">
                {{ num }}
              </button>
            </div>
          </div>

          <!-- Answer Controls -->
          <div class="panel-section">
            <div class="section-title">

              <FontAwesomeIcon :icon="faCheckCircle" class="icon" />
              <span v-if="currentLanguage === 'en'">Answer Controls</span>
              <span v-else>उत्तर नियंत्रण</span>
            </div>

            <div class="controls-grid">
              <button class="control-btn answer" @click="showAnswer = !showAnswer">
                <FontAwesomeIcon :icon="showAnswer ? faEyeSlash : faEye" />
                <span v-if="showAnswer">
                  <span v-if="currentLanguage === 'en'">Hide Answer</span>
                  <span v-else>उत्तर छिपाएं</span>
                </span>
                <span v-else>
                  <span v-if="currentLanguage === 'en'">Show Answer</span>
                  <span v-else>उत्तर दिखाएं</span>
                </span>
              </button>

              <button class="control-btn clear" @click="clearSelection">

                <FontAwesomeIcon :icon="faEraser" class="icon" />

                <span v-if="currentLanguage === 'en'">Clear</span>
                <span v-else>साफ़ करें</span>
              </button>

              <button class="control-btn"
                      :class="showSolution ? 'start' : ''"
                      @click="showSolution = !showSolution">
                <FontAwesomeIcon :icon="showSolution ? faBook : faBookOpen" class="icon"/>
                <span v-if="showSolution">
                  <span v-if="currentLanguage === 'en'">Hide Solution</span>
                  <span v-else>समाधान छिपाएं</span>
                </span>
                <span v-else>
                  <span v-if="currentLanguage === 'en'">Show Solution</span>
                  <span v-else>समाधान दिखाएं</span>
                </span>
              </button>
            </div>

            <div v-if="showAnswer" class="answer-display">
              <span v-if="currentLanguage === 'en'">Correct answer:</span>
              <span v-else>सही उत्तर:</span>
              <strong>{{currentQuestion.answer}}</strong>
            </div>
          </div>

          <!-- Display Settings -->
          <!-- <div class="panel-section">
            <div class="section-title">
              <FontAwesomeIcon :icon="faSlidersH"  class="icon"/>
              <span v-if="currentLanguage === 'en'">Display Settings</span>
              <span v-else>डिस्प्ले सेटिंग्स</span>
            </div>

            <div class="font-controls">
              <select class="font-select" v-model="fontFamily">
                <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">Sans-serif</option>
                <option value="Georgia, 'Times New Roman', Times, serif">Serif</option>
                <option value="'Courier New', Courier, monospace">Monospace</option>
              </select>
            </div>

            <div class="size-control">
              <span>Aa</span>
              <input type="range" min="14" max="30" v-model="fontSize">
              <span>AA</span>
            </div>
          </div> -->

           <!-- Mirrorn Settings -->
          <div class="panel-section">
            <div class="section-title">
              <FontAwesomeIcon :icon="faSlidersH"  class="icon"/>
              <span v-if="currentLanguage === 'en'">Mirror</span>
              <span v-else">डिस्प्ले सेटिंग्स</span>
            </div>
            <div class="controls-grid">
              <button class="control-btn start"  v-if="!mirror_key"
                      @click="createMirror"
                      :disabled="timerActive">
                 <FontAwesomeIcon :icon="faDesktopAlt" class="icon" />
                <span v-if="currentLanguage === 'en'">Create</span>
                <span v-else>शुरू</span>
              </button>

              <div class="control-btn clipboard"  v-if="!!mirror_key"
                      @click="copyToClipboard"
                      :disabled="!timerActive">

                 <FontAwesomeIcon :icon="faClipboardList" class="icon" />
                <span v-if="currentLanguage === 'en'">{{ mirror_key }}</span>
              </div>
            </div>
          </div>

          <!-- Drawing Tools Settings -->
          <div class="panel-section">
            <div class="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="icon">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              <span v-if="currentLanguage === 'en'">Drawing Tools</span>
              <span v-else>ड्राइंग टूल्स</span>
            </div>
            <div class="controls-grid">
              <button class="control-btn" 
                      :class="showDrawingTools ? 'start' : 'pause'"
                      @click="showDrawingTools = !showDrawingTools">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="icon">
                  <path v-if="showDrawingTools" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  <path v-else d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span v-if="showDrawingTools">
                  <span v-if="currentLanguage === 'en'">Hide Tools</span>
                  <span v-else>टूल्स छिपाएं</span>
                </span>
                <span v-else>
                  <span v-if="currentLanguage === 'en'">Show Tools</span>
                  <span v-else>टूल्स दिखाएं</span>
                </span>
              </button>

              <button class="control-btn clear" 
                      @click="clearCanvas"
                      :disabled="!drawingMode">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="icon">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                <span v-if="currentLanguage === 'en'">Clear</span>
                <span v-else>साफ़ करें</span>
              </button>
            </div>
          </div>

          <!-- Screen Controls -->
          <div class="panel-section">
             <div class="section-title">
              <FontAwesomeIcon :icon="faDesktopAlt"  class="icon"/>

              <span v-if="currentLanguage === 'en'">Screen Appearance Settings</span>
              <span v-else>स्क्रीन सेटिंग्स</span>
            </div>
            <div class="bg-white p-6 rounded-lg col-span-1">

              <!-- Board Background -->
              <div class="flex items-center justify-between mb-6">
                  <h6 class="w-90font-medium mb-2 text-gray-700" >Main Screen Background</h6>
                      <input type="color" v-model="boardBgColor" class="w-10 h-10 rounded border-gray-300">
                      <!-- <input type="text" v-model="boardBgColor" class="ml-2 px-2 py-1 border rounded w-24"> -->
              </div>
              <div class="flex items-center justify-between mb-6">
                  <h6 class="w-90font-medium mb-2 text-gray-700" style="margin-right: 10px;">Text Font Style</h6>
                    <!-- <div class="font-controls"> -->
                        <select class="select-option" v-model="fontFamily">
                            <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">Sans-serif</option>
                            <option value="Georgia, 'Times New Roman', Times, serif">Serif</option>
                            <option value="'Courier New', Courier, monospace">Monospace</option>
                        </select>
                    <!-- </div> -->
              </div>
              <div class="separation-line"></div>
              <!-- Question Styling -->
              <div class="mb-6">
                  <h5 class="font-medium mb-2 text-gray-700">Question Text Style</h5>
                  <div class="flex items-center justify-between mb-2">
                      <span class="w-90">Background Color:</span>
                      <input type="color" v-model="questionBgColor" class="w-10 h-10 rounded border-gray-300">
                      <!-- <input type="text" v-model="questionBgColor" class="ml-2 px-2 py-1 border rounded w-24"> -->
                  </div>
                  <div class="flex items-center justify-between mb-2">
                      <span class="w-90">Text Color:</span>
                      <input type="color" v-model="questionColor" class="w-10 h-10 rounded border-gray-300">
                      <!-- <input type="text" v-model="questionColor" class="ml-2 px-2 py-1 border rounded w-24"> -->
                  </div>
                  <div class="flex items-center justify-between mb-2">
                      <span class="w-90">Text Size:</span>
                      <input type="range" min="12" max="36" v-model="questionFontSize" class="w-32">
                      <!-- <span class="ml-2 w-10">{{ questionFontSize }}px</span> -->
                  </div>
                  <div class="flex items-center justify-between mb-2">
                      <span class="w-25" style="margin-right: 10px;">Text Style:</span>
                      <select v-model="questionFontWeight" class="select-option border rounded px-2 py-1" style="text-transform: capitalize;">
                          <option v-for="weight in fontWeights" :value="weight">{{ weight }}</option>
                      </select>
                  </div>
              </div>
              <div class="separation-line"></div>
              <!-- Options Styling -->
              <div class="mb-6">
                  <h5 class="font-medium mb-2 text-gray-700">Answer Options Style</h5>
                  <div class="flex items-center justify-between mb-2">
                      <span class="w-90">Background Color:</span>
                      <input type="color" v-model="optionBgColor" class="w-10 h-10 rounded border-gray-300">
                      <!-- <input type="text" v-model="optionBgColor" class="ml-2 px-2 py-1 border rounded w-24"> -->
                  </div>
                  <div class="flex items-center justify-between mb-2">
                      <span class="w-90">Text Color:</span>
                      <input type="color" v-model="optionColor" class="w-10 h-10 rounded border-gray-300">
                      <!-- <input type="text" v-model="optionColor" class="ml-2 px-2 py-1 border rounded w-24"> -->
                  </div>
                  <div class="flex items-center justify-between mb-2">
                      <span class="w-90">Text Size:</span>
                      <input type="range" min="12" max="30" v-model="optionFontSize" class="w-32">
                      <!-- <span class="ml-2 w-10">{{ optionFontSize }}px</span> -->
                  </div>
                  <div class="flex items-center justify-between mb-2">
                      <span class="w-25" style="margin-right: 10px;">Text Style:</span>
                      <select v-model="optionFontWeight" class="select-option border rounded px-2 py-1" style="text-transform: capitalize;">
                          <option v-for="weight in fontWeights" :value="weight">{{ weight }}</option>
                      </select>
                  </div>
              </div>
              <div class="separation-line"></div>
              <!-- Reset Button -->
               <div class="flex justify-end">
                    <button @click="resetStyles" class="bg-red-500 hover:bg-red-600 text-white rounded reset-btn">
                        Reset to Defaults
                    </button>
              </div>
            </div>
          </div>


        </div>
      </div>
      <!-- Zoom Controls -->
      <div class="zoom-controls">
          <button class="zoom-btn zoom-out" @click="zoomOut">
            <FontAwesomeIcon :icon="faSearchMinus"  class="icon"/>
          </button>
          <button class="zoom-btn zoom-reset" @click="resetZoom">
            {{ zoomLevel }}%
          </button>
          <button class="zoom-btn zoom-in" @click="zoomIn">

            <FontAwesomeIcon :icon="faSearchPlus"  class="icon"/>
          </button>
          <button class="zoom-btn fullscreen" @click="toggleFullscreen">
            <FontAwesomeIcon :icon="faExpand"  class="icon"/>

          </button>
      </div>


      <!-- Navigation Buttons -->
      <div class="nav-buttons">
        <button class="nav-button"
                @click="goToQuestion(currentIndex - 1)"
                :disabled="currentIndex === 0">

          <FontAwesomeIcon :icon="faChevronLeft"  class="icon"/>
        </button>
        <button class="nav-button"
                @click="goToQuestion(currentIndex + 1)"
                :disabled="currentIndex === questions.length - 1">

          <FontAwesomeIcon :icon="faChevronRight"  class="icon"/>
        </button>
      </div>
    </div>
  </div>

</template>


<style scoped>
  .teaching-board * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .teacher-board-frame {
    background: linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    color: #333;
  }

  .teaching-board {
    width: 95%;
    max-width: 1600px;
    height: 90vh;
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  /* Top Bar */
  .top-bar {
    background: linear-gradient(90deg, #0f4c75, #1b262c);
    color: white;
    padding: 15px 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    z-index: 10;
  }

  .app-title {
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
  }

  .app-title .icon {
    margin-right: 12px;
    color: #bbe1fa;
  }

  .top-controls {
    display: flex;
    align-items: center;
    gap: 25px;
  }

  .language-selector {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .language-selector select {
    background: #3282b8;
    color: white;
    border: 2px solid #0f4c75;
    padding: 8px 15px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .language-selector select:hover {
    background: #1b6ca8;
  }

  .question-counter {
    background: #0f4c75;
    padding: 8px 20px;
    border-radius: 30px;
    font-size: 1.1rem;
    font-weight: 600;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  }

  /* Main Content */
  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* Floating Draggable Elements */
  .floating-draggable {
    cursor: move;
    user-select: none;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    position: relative;
    transition: box-shadow 0.2s ease, transform 0.1s ease;
    max-width: 90vw;
    max-height: 80vh;
    overflow: auto;
  }

  .floating-draggable:hover {
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
    transform: translateY(-2px);
  }

  .drag-handle {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    background: rgba(108, 117, 125, 0.8);
    color: white;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: grab;
    opacity: 0.6;
    transition: opacity 0.2s ease;
    z-index: 10;
  }

  .drag-handle:hover {
    opacity: 1;
    background: rgba(108, 117, 125, 1);
  }

  .floating-draggable:active .drag-handle {
    cursor: grabbing;
  }

  /* Keep original designs for all elements */
  .floating-draggable.question-box {
    width: fit-content;
    border-radius: 0 0 5px 5px;
    border-top: none;
    padding: 20px;
    background: white;
  }

  .floating-draggable.options-container {
    display: grid;
    gap: 15px;
    width: fit-content;
    border-radius: 5px;
    padding: 15px;
    background: white;
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
    transition: opacity 1.5s ease-out, transform 1.5s ease-out, box-shadow 0.2s ease;
    opacity: 1;
    transform: scale(1);
  }

  .floating-draggable.question-timer.fade-out {
    opacity: 0.3;
    transform: scale(0.95);
  }

  /* Drawing Canvas */
  .drawing-canvas {
    pointer-events: none;
    background: transparent;
  }

  /* Drawing Toolbar */
  .drawing-toolbar {
    background: white;
    border-radius: 12px;
    padding: 15px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border: 2px solid #e9ecef;
    min-width: 60px;
    max-width: 300px;
  }

  .toolbar-content {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .tool-btn {
    width: 40px;
    height: 40px;
    border: 2px solid #dee2e6;
    background: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #495057;
  }

  .tool-btn:hover {
    border-color: #4d96ff;
    background: #f8f9fa;
    transform: translateY(-2px);
  }

  .tool-btn.active {
    border-color: #4d96ff;
    background: #4d96ff;
    color: white;
  }

  .tool-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .tool-btn.clear-btn {
    border-color: #dc3545;
    color: #dc3545;
  }

  .tool-btn.clear-btn:hover {
    background: #dc3545;
    color: white;
  }

  .color-picker-container {
    position: relative;
  }

  .color-picker {
    width: 40px;
    height: 40px;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    cursor: pointer;
    background: none;
    padding: 0;
  }

  .color-picker::-webkit-color-swatch-wrapper {
    padding: 0;
    border-radius: 6px;
  }

  .color-picker::-webkit-color-swatch {
    border: none;
    border-radius: 6px;
  }

  .brush-size-container {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-direction: column;
    min-width: 60px;
  }

  .brush-size-slider {
    width: 50px;
    height: 5px;
    border-radius: 3px;
    background: #dee2e6;
    outline: none;
    cursor: pointer;
  }

  .brush-size-slider::-webkit-slider-thumb {
    appearance: none;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #4d96ff;
    cursor: pointer;
  }

  .brush-size-indicator {
    background: #495057;
    border-radius: 50%;
    min-width: 4px;
    min-height: 4px;
    max-width: 20px;
    max-height: 20px;
  }

  /* Question Area (now empty but maintains structure) */
  .question-area {
    flex: 1;
    background: white;
    padding: 25px;
    overflow-y: auto;
    transition: all 0.3s ease;
    position: relative;
  }

  .question-content {
    max-width: 1000px;
    margin: 0 auto;
    transition: all 0.3s ease;
  }

  .question-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e9ecef;
    background: #e9ecef;
    border-radius: 15px 15px 0 0;
    padding: 15px;
    border-left: 5px solid #104c74;
  }

  .question-number {
    font-size: 1.1rem;
    color: #495057;
    font-weight: 700;
  }

  .question-timer {
    position: absolute;
    top: 40px;
    right: 0;
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
    transition: opacity 1.5s ease-out, transform 1.5s ease-out;
    opacity: 1;
    transform: scale(1);
  }

  .question-timer.fade-out {
    opacity: 0;
    transform: scale(0.8);
  }
  .timer{
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .question-box{
    width: fit-content;
    border-radius: 0 0 5px 5px;
    border-top: none;
  }

  .question-text {
    font-size: 1.3rem;
    line-height: 1.7;
    /* margin-bottom: 5px; */
    color: #212529;
    font-weight: 500;
    margin: 6px 10px;
  }

  .question-hindi-text{
    border-top: 1px solid #dfe3e7;
    padding-top: 6px;
  }

  .question-image {
    text-align: center;
    margin: 25px 0;
  }

  .question-image img {
    max-height: 300px;
    max-width: 100%;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  .options-container {
    display: grid;
    gap: 15px;
    margin: 30px 0;
    width: fit-content;
    border-radius: 5px;
    padding: 5px 0;
  }

  .option {
    padding: 0px 20px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: flex-start;
    /* border: 2px solid #dee2e6; */
  }

  /* .option:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.05);
  } */

  .option-letter {
    font-weight: 700;
    margin-right: 15px;
    min-width: 30px;
  }

  .option.selected {
    border-color: #4d96ff;
    background: #d7e6ff;
  }

  .option.correct {
    border-color: #51cf66;
    background: #d3f9d8;
  }

  .option.incorrect {
    border-color: #ff6b6b;
    background: #ffe3e3;
  }

  .explanation-box {
    background: #fff9db;
    border-left: 4px solid #ffd43b;
    padding: 20px;
    border-radius: 0 8px 8px 0;
    margin: 25px 0;
  }

  .explanation-title {
    font-weight: 700;
    color: #e67700;
    margin-bottom: 10px;
    font-size: 1.1rem;
  }

  /* Control Panel */
  .control-panel {
    width: 330px;
    background: #f8f9fa;
    border-left: 1px solid #e9ecef;
    padding: 20px 7px;
    overflow-y: auto;
    transition: all 0.3s ease;
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.05);
  }

  .panel-section {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 25px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  }

  .section-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: #0f4c75;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 15px;
    border-bottom: 1px solid #dddddd;
  }

  .section-title .icon {
    color: #3282b8;
  }

  .controls-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 15px;
  }

  .control-btn {
    padding: 12px 5px;
    border-radius: 8px;
    background: #e9ecef;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }

  .control-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .control-btn.start {
    background: #40c057;
    color: white;
  }

  .control-btn.pause {
    background: #ffd43b;
    color: #333;
  }
  .control-btn.clipboard {
    background: #336931;
    color: white;
  }

  .control-btn.reset {
    background: #fa5252;
    color: white;
  }

  .control-btn.answer {
    background: #4d96ff;
    color: white;
  }

  .control-btn.clear {
    background: #868e96;
    color: white;
  }

.header-line-separator {
    border-right: 2px solid white;
    padding: 0 10px;
}
.header-line-separator:last-child {
    border-right: none;
    padding-right: 0;
}

  .reset-btn{
    padding: 10px 20px;
    margin-top: 10px;
  }

  .separation-line{
    width: 100%;
    /* height: 1px;
    background-color: #e9ecef; */
    margin: 10px 0;
    border-style: dashed;
    border-width: 1px;
    border-color: #e9ecef;
  }

  .timer-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
  }

  .timer-controls input {
    width: 70px;
    padding: 8px 12px;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    text-align: center;
    font-weight: 600;
  }

  /* Question Navigation */
  .nav-controls {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .nav-btn {
    background: #e9ecef;
    border: none;
    padding: 8px 15px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nav-btn:hover {
    background: #dee2e6;
  }

  .question-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }

  .grid-btn {
    aspect-ratio: 1;
    border-radius: 8px;
    border: 2px solid #e9ecef;
    background: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .grid-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .grid-btn.current {
    background: #4d96ff;
    color: white;
    border-color: #4d96ff;
  }

  .grid-btn.answered {
    background: #d3f9d8;
    border-color: #51cf66;
  }

  /* Display Settings */
  .font-controls {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
  }

  .select-option {
    flex: 1;
    padding: 10px;
    border: 2px solid #dee2e6;
    border-radius: 8px;
    font-weight: 500;
  }

  .select-option:focus{
    border: 1px solid #dee2e6 !important;
    outline: 1px solid #dee2e6 !important;
 }
 .select-option:active{
    border: 1px solid #dee2e6 !important;
    outline: 1px solid #dee2e6 !important;
 }

  .size-control {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .size-control input {
    width: 100%;
  }

  /* Zoom Controls */
  .zoom-controls {
    /* position: absolute; */
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 50px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    display: flex;
    overflow: hidden;
    z-index: 5;
  }

  .zoom-btn {
    width: 55px;
    height: 55px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #adb5bd;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.2s ease;
  }


  .zoom-btn:hover {
    background: #e9ecef;
  }

  .zoom-btn.fullscreen {
    background: #4d96ff;
    color: white;
  }

  .zoom-btn.fullscreen:hover {
    background: #3d85eb;
  }
  .zoom-out{
    border-radius: 10px 0 0 10px;
    border-right: 1px solid #989b9e
  }
  .zoom-in{
    border-radius: 0 20px 20px 0;
    border-left: 1px solid #989b9e;
    margin-right: 10px;
  }
  .fullscreen{
    border-radius: 10px;
  }
  .zoom-reset{
    background: #adb5bd;
  }

  /* Navigation Buttons */
  .nav-buttons {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 15px;
    background: white;
    padding: 12px 20px;
    border-radius: 50px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
    z-index: 5;
  }

  .nav-button {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    background: #4d96ff;
    color: white;
    font-size: 1.4rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-button:hover {
    transform: translateY(-5px) scale(1.1);
    box-shadow: 0 7px 15px rgba(77, 150, 255, 0.4);
  }

  .nav-button:disabled {
    background: #adb5bd;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Toggle Button */
  .toggle-panel {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    width: 40px;
    height: 80px;
    background: #0f4c75;
    border-radius: 10px 0 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 20;
    transition: all 0.3s ease;
  }

  .toggle-panel:hover {
    background: #1b6ca8;
  }

  /* Responsive */
  @media (max-width: 1000px) {
    .control-panel {
      width: 280px;
    }

    .question-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (max-width: 768px) {
    .main-content {
      flex-direction: column;
    }

    .control-panel {
      width: 100%;
      height: 300px;
    }

    .toggle-panel {
      top: auto;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 40px;
      border-radius: 10px 10px 0 0;
    }
  }
</style>
