<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { apiClient } from '@/service/apiService'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { 
  faChalkboardTeacher, faChevronLeft, faChevronRight, faExpand, 
  faPlay, faPause, faRedo, faClock, faEye, faEyeSlash, faEraser, 
  faClipboard, faDesktopAlt, faSlidersH, faBook
} from '@fortawesome/free-solid-svg-icons'
import '@excalidraw/excalidraw/index.css'

// Route and utilities
const route = useRoute()
const toast = useToast()

// Reactive data
const excalidrawContainer = ref(null)
const excalidrawAPI = ref(null)
const drawingCanvas = ref(null)

// Board state
const loading = ref(true)
const boardError = ref(null)
const loadingMessage = ref('Loading board components...')
const boardStatus = ref('Ready')
const elementCount = ref(0)
const lastSaved = ref(null)

// Question Management State (from DisplaySet.vue)
const setId = ref(route.params.id)
const mirror_key = ref(null)
const currentLanguage = ref('en')
const currentIndex = ref(0)
const currentPage = ref(0)
const questionsPerPage = ref(10)
const selectedOption = ref(null)
const showAnswer = ref(false)
const showSolution = ref(false)
const userAnswers = ref([])
const questions = ref([
  {
    id: 1,
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
      en: "Mitochondria are known as the powerhouses of the cell.",
      hi: "माइटोकॉन्ड्रिया को कोशिका का पावरहाउस कहा जाता है।"
    },
    image: null
  }
])

// Timer State (from DisplaySet.vue)
const timerInterval = ref(null)
const timerActive = ref(false)
const currentQuestionTime = ref(30)
const examMeta = ref({ timePerQuestion: 30 })
const showTimer = ref(true)

// Board customization (from DisplaySet.vue)
const boardBgColor = ref('#ffffff')
const questionBgColor = ref('#ffffff')
const questionColor = ref('#1f2937')
const questionFontSize = ref(20)
const questionFontWeight = ref('bold')
const questionFontFamily = ref("'Segoe UI', Tahoma, Geneva, Verdana, sans-serif")
const optionBgColor = ref('#ffffff')
const optionColor = ref('#4b5563')
const optionFontSize = ref(16)
const optionFontWeight = ref('normal')

// Floating panel positions (from DisplaySet.vue)
const questionPosition = ref({ x: 50, y: 150 })
const optionsPosition = ref({ x: 50, y: 350 })
const timerPosition = ref({ x: window.innerWidth - 250, y: 50 })
const toolbarPosition = ref({ x: 20, y: 300 })

// Panel visibility
const showQuestion = ref(true)
const showOptions = ref(true)
const showControls = ref(true)
const showDrawingTools = ref(true)

// Additional constants from DisplaySet.vue
const fontWeights = ['lighter', 'normal', 'bold', 'bolder']
const fontSize = ref(18)
const fontFamily = ref("'Segoe UI', Tahoma, Geneva, Verdana, sans-serif")
const zoomLevel = ref(100)

// UI state
const darkMode = ref(false)
const isFullscreen = ref(false)
const showFloatingTools = ref(true)
const showStatusPanel = ref(false)

// Drawing state (inspired by DisplaySet.vue)
const drawingMode = ref(false)
const currentTool = ref('pen')
const drawingColor = ref('#ff0000')
const brushSize = ref(3)
const isDrawing = ref(false)
const drawingHistory = ref([])
let drawingContext = null

// Modal states
const showExportDialog = ref(false)
const showSaveDialog = ref(false)
const saving = ref(false)
const exporting = ref(false)

// Form data
const boardName = ref('')
const boardDescription = ref('')
const exportFormat = ref('png')
const exportQuality = ref('medium')
const includeBackground = ref(true)

// Dragging state (from DisplaySet.vue)
let isDragging = false
let draggingElement = ref(null)
let dragOffset = { x: 0, y: 0 }

// Computed properties
const currentQuestion = computed(() => {
  return questions.value[currentIndex.value] || null
})

const currentQuestionText = computed(() => {
  return currentQuestion.value?.question?.text?.[currentLanguage.value] || ''
})

const currentOptions = computed(() => {
  return currentQuestion.value?.options || []
})

const totalQuestions = computed(() => {
  return questions.value.length
})

const totalPages = computed(() => {
  return Math.ceil(questions.value.length / questionsPerPage.value)
})

const visibleQuestions = computed(() => {
  const start = currentPage.value * questionsPerPage.value
  const end = Math.min(start + questionsPerPage.value, questions.value.length)
  return Array.from({ length: end - start }, (_, i) => start + i + 1)
})

const questionStats = computed(() => {
  const answered = userAnswers.value.filter(a => a !== null && a !== undefined).length
  return {
    total: totalQuestions.value,
    answered,
    remaining: totalQuestions.value - answered,
    current: currentIndex.value + 1
  }
})

const timerDisplayTime = computed(() => {
  return formatTime(currentQuestionTime.value)
})

const currentAnswer = computed({
  get: () => userAnswers.value[currentIndex.value],
  set: (value) => {
    userAnswers.value[currentIndex.value] = value
  }
})

// Methods
const initializeBoard = async () => {
  loading.value = true
  boardError.value = null
  loadingMessage.value = 'Initializing board components...'
  
  try {
    await nextTick()
    
    if (!excalidrawContainer.value) {
      throw new Error('Board container not found')
    }
    
    loadingMessage.value = 'Loading React modules...'
    
    // Clear container
    excalidrawContainer.value.innerHTML = ''
    
    // Create wrapper
    const wrapper = document.createElement('div')
    wrapper.id = 'excalidraw-modern-board'
    wrapper.style.height = '100%'
    wrapper.style.width = '100%'
    wrapper.className = 'excalidraw-modern-wrapper'
    excalidrawContainer.value.appendChild(wrapper)
    
    loadingMessage.value = 'Importing drawing engine...'
    
    // Import dependencies
    const React = await import('react')
    const { createRoot } = await import('react-dom/client')
    const { Excalidraw } = await import('@excalidraw/excalidraw')
    
    loadingMessage.value = 'Setting up drawing tools...'
    
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
        elementCount.value = elements ? elements.length : 0
        boardStatus.value = elementCount.value > 0 ? 'Modified' : 'Empty'
        
        // Auto-save functionality
        if (elements && elements.length > 0) {
          autoSave(elements, appState)
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
    })
    
    loadingMessage.value = 'Finalizing setup...'
    
    // Render
    const root = createRoot(wrapper)
    root.render(excalidrawElement)
    
    // Store API reference
    excalidrawAPI.value = { root, wrapper }
    
    // Initialize drawing canvas
    initDrawingCanvas()
    
    boardStatus.value = 'Ready'
    
  } catch (error) {
    console.error('❌ Board initialization failed:', error)
    boardError.value = error.message
    boardStatus.value = 'Error'
  } finally {
    loading.value = false
  }
}

// Drawing functions (inspired by DisplaySet.vue)
const initDrawingCanvas = () => {
  if (drawingCanvas.value) {
    drawingContext = drawingCanvas.value.getContext('2d')
    drawingCanvas.value.width = window.innerWidth
    drawingCanvas.value.height = window.innerHeight
    drawingContext.lineCap = 'round'
    drawingContext.lineJoin = 'round'
  }
}

const setTool = (tool) => {
  currentTool.value = tool
}

const startDrawing = (event) => {
  if (!drawingMode.value || !drawingContext) return
  
  saveCanvasState()
  isDrawing.value = true
  
  const rect = drawingCanvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  if (currentTool.value === 'pen' || currentTool.value === 'highlighter') {
    drawingContext.beginPath()
    drawingContext.moveTo(x, y)
  }
}

const draw = (event) => {
  if (!isDrawing.value || !drawingMode.value || !drawingContext) return
  
  const rect = drawingCanvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  drawingContext.lineWidth = brushSize.value
  drawingContext.strokeStyle = drawingColor.value
  
  if (currentTool.value === 'pen') {
    drawingContext.globalCompositeOperation = 'source-over'
    drawingContext.lineTo(x, y)
    drawingContext.stroke()
  } else if (currentTool.value === 'highlighter') {
    drawingContext.globalCompositeOperation = 'multiply'
    drawingContext.globalAlpha = 0.3
    drawingContext.lineTo(x, y)
    drawingContext.stroke()
    drawingContext.globalAlpha = 1
  } else if (currentTool.value === 'eraser') {
    drawingContext.globalCompositeOperation = 'destination-out'
    drawingContext.beginPath()
    drawingContext.arc(x, y, brushSize.value, 0, Math.PI * 2)
    drawingContext.fill()
  }
}

const stopDrawing = () => {
  if (!isDrawing.value) return
  isDrawing.value = false
  drawingContext.globalCompositeOperation = 'source-over'
}

const saveCanvasState = () => {
  if (drawingCanvas.value) {
    drawingHistory.value.push(drawingCanvas.value.toDataURL())
    if (drawingHistory.value.length > 20) {
      drawingHistory.value = drawingHistory.value.slice(-20)
    }
  }
}

const clearDrawing = () => {
  if (drawingContext && drawingCanvas.value) {
    saveCanvasState()
    drawingContext.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height)
  }
}

const undoDrawing = () => {
  if (drawingHistory.value.length > 0 && drawingContext && drawingCanvas.value) {
    const lastState = drawingHistory.value.pop()
    const img = new Image()
    img.onload = () => {
      drawingContext.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height)
      drawingContext.drawImage(img, 0, 0)
    }
    img.src = lastState
  }
}

// Dragging functionality (from DisplaySet.vue)
const startDragging = (elementType, event) => {
  if (event.target.closest('.tool-btn') && elementType === 'toolbar') return
  
  event.preventDefault()
  event.stopPropagation()
  
  isDragging = true
  draggingElement.value = elementType
  
  const element = event.currentTarget
  const rect = element.getBoundingClientRect()
  dragOffset.x = event.clientX - rect.left
  dragOffset.y = event.clientY - rect.top

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDragging)
  
  element.style.cursor = 'grabbing'
}

const onDrag = (event) => {
  if (!isDragging || !draggingElement.value) return

  const x = event.clientX - dragOffset.x
  const y = event.clientY - dragOffset.y
  
  const maxX = window.innerWidth - 300
  const maxY = window.innerHeight - 200
  
  const boundedX = Math.max(0, Math.min(x, maxX))
  const boundedY = Math.max(0, Math.min(y, maxY))

  if (draggingElement.value === 'toolbar') {
    toolbarPosition.value.x = boundedX
    toolbarPosition.value.y = boundedY
  }
}

const stopDragging = () => {
  isDragging = false
  draggingElement.value = null
  dragOffset = { x: 0, y: 0 }

  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDragging)
}

// Board actions
const newBoard = () => {
  if (confirm('Create a new board? All unsaved changes will be lost.')) {
    initializeBoard()
    elementCount.value = 0
    boardStatus.value = 'Ready'
    lastSaved.value = null
  }
}

const saveBoard = () => {
  showSaveDialog.value = true
}

const performSave = async () => {
  saving.value = true
  try {
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const saveData = {
      name: boardName.value,
      description: boardDescription.value,
      timestamp: new Date().toISOString(),
      elements: elementCount.value
    }
    
    localStorage.setItem(`board-${Date.now()}`, JSON.stringify(saveData))
    
    lastSaved.value = new Date().toLocaleString()
    boardStatus.value = 'Saved'
    showSaveDialog.value = false
    boardName.value = ''
    boardDescription.value = ''
  } catch (error) {
    console.error('Save failed:', error)
  } finally {
    saving.value = false
  }
}

const loadBoard = () => {
  // Implementation for loading saved boards
  console.log('Load board functionality')
}

const exportBoard = () => {
  showExportDialog.value = true
}

const performExport = async () => {
  exporting.value = true
  try {
    // Simulate export operation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log(`Exporting as ${exportFormat.value} with ${exportQuality.value} quality`)
    
    showExportDialog.value = false
  } catch (error) {
    console.error('Export failed:', error)
  } finally {
    exporting.value = false
  }
}

// View controls
const zoomIn = () => {
  if (zoomLevel.value < 200) {
    zoomLevel.value += 10
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 50) {
    zoomLevel.value -= 10
  }
}

const resetZoom = () => {
  zoomLevel.value = 100
}

const toggleTheme = () => {
  darkMode.value = !darkMode.value
  // Update Excalidraw theme if available
  if (excalidrawAPI.value) {
    // Theme switching implementation
  }
}

const toggleFullscreen = () => {
  const elem = document.querySelector('.modern-digital-board')
  if (!document.fullscreenElement) {
    elem.requestFullscreen?.()
    isFullscreen.value = true
  } else {
    document.exitFullscreen?.()
    isFullscreen.value = false
  }
}

// Auto-save functionality
const autoSave = (elements, appState) => {
  try {
    const autoSaveData = {
      elements,
      appState,
      timestamp: Date.now()
    }
    localStorage.setItem('board-autosave', JSON.stringify(autoSaveData))
  } catch (error) {
    console.error('Auto-save failed:', error)
  }
}

// Question Management Methods (from DisplaySet.vue)
const loadQuestions = async () => {
  try {
    loading.value = true
    loadingMessage.value = 'Loading questions...'
    
    const response = await apiClient.get(`/admin/digital-board/questions/${setId.value}`)
    if (response.data.data) {
      questions.value = response.data.data.map(q => q.formattedQuestion)
      userAnswers.value = new Array(questions.value.length).fill(null)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `${questions.value.length} questions loaded`,
        life: 3000
      })
    }
  } catch (error) {
    console.error('Failed to load questions:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load questions',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    resetQuestionTimer()
    selectedOption.value = userAnswers.value[currentIndex.value] !== undefined ? 
                           userAnswers.value[currentIndex.value] : null
  }
}

const previousQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    resetQuestionTimer()
    selectedOption.value = userAnswers.value[currentIndex.value] !== undefined ? 
                           userAnswers.value[currentIndex.value] : null
  }
}

const goToQuestion = (index) => {
  if (index >= 0 && index < questions.value.length) {
    currentIndex.value = index
    currentPage.value = Math.floor(index / questionsPerPage.value)
    resetQuestionTimer()
    startTimer()
    selectedOption.value = userAnswers.value[index] !== undefined ? userAnswers.value[index] : null
  }
}

const selectOption = (optionIndex) => {
  selectedOption.value = optionIndex
  userAnswers.value[currentIndex.value] = optionIndex
  sendToMirror()
}

const clearSelection = () => {
  selectedOption.value = null
  userAnswers.value[currentIndex.value] = undefined
}

const toggleAnswer = () => {
  showAnswer.value = !showAnswer.value
  sendToMirror()
}

const toggleSolution = () => {
  showSolution.value = !showSolution.value
  sendToMirror()
}

const nextPage = () => {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++
    currentIndex.value = currentPage.value * questionsPerPage.value
    resetQuestionTimer()
  }
}

const prevPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--
    currentIndex.value = currentPage.value * questionsPerPage.value
    resetQuestionTimer()
  }
}

// Timer Methods (from DisplaySet.vue)
const startTimer = () => {
  if (!timerActive.value) {
    showTimer.value = true
    timerActive.value = true
    timerInterval.value = setInterval(() => {
      if (currentQuestionTime.value > 0) {
        currentQuestionTime.value--
      } else {
        pauseTimer()
        showTimer.value = false
        // Auto advance to next question
        setTimeout(() => {
          nextQuestion()
        }, 1000)
      }
    }, 1000)
  }
}

const pauseTimer = () => {
  timerActive.value = false
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

const resetQuestionTimer = () => {
  currentQuestionTime.value = examMeta.value.timePerQuestion || 30
  pauseTimer()
  showTimer.value = true
}

const toggleTimer = () => {
  if (timerActive.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

// Mirror Functionality (from DisplaySet.vue)
const sendToMirror = async (data = {}) => {
  try {
    if (mirror_key.value) {
      const mirrorData = {
        question_id: currentQuestion.value?.id,
        set_id: setId.value,
        currentQuestion: currentQuestion.value,
        currentIndex: currentIndex.value,
        showAnswer: showAnswer.value,
        showSolution: showSolution.value,
        selectedOption: selectedOption.value,
        timerActive: timerActive.value,
        currentQuestionTime: currentQuestionTime.value,
        currentLanguage: currentLanguage.value,
        ...data
      }
      await apiClient.post('/admin/digital-board/mirror-the-question', mirrorData)
    }
  } catch (error) {
    console.error('Mirror update failed:', error)
  }
}

const initializeMirror = async () => {
  try {
    // First try to fetch existing mirror key
    const fetchResponse = await apiClient.get(`/admin/digital-board/mirror-key/${setId.value}`)
    if (fetchResponse.data.data?.mirror_key) {
      mirror_key.value = fetchResponse.data.data.mirror_key
    }
  } catch (error) {
    console.log('No existing mirror key, will create new one if needed')
  }
}

const createMirror = async () => {
  try {
    const response = await apiClient.post('/admin/digital-board/create-mirror', {
      setId: setId.value
    })
    if (response.data.data?.mirror_key) {
      mirror_key.value = response.data.data.mirror_key
      toast.add({
        severity: 'success',
        summary: 'Mirror Ready',
        detail: 'Screen mirroring activated',
        life: 3000
      })
    }
  } catch (error) {
    console.error('Mirror creation failed:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create mirror',
      life: 3000
    })
  }
}

const copyToClipboard = async () => {
  if (!mirror_key.value) return
  
  try {
    await navigator.clipboard.writeText(mirror_key.value)
    toast.add({
      severity: 'success',
      summary: 'Copied!',
      detail: 'Mirror key copied to clipboard',
      life: 2000
    })
  } catch (err) {
    console.error('Failed to copy:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to copy to clipboard',
      life: 3000
    })
  }
}

// Language switching
const switchLanguage = (lang) => {
  currentLanguage.value = lang
  sendToMirror({ currentLanguage: lang })
}

// Reset styles functionality
const resetStyles = () => {
  boardBgColor.value = '#ffffff'
  questionBgColor.value = '#ffffff'
  questionColor.value = '#1f2937'
  questionFontSize.value = 20
  questionFontWeight.value = 'bold'
  questionFontFamily.value = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  
  optionBgColor.value = '#ffffff'
  optionColor.value = '#4b5563'
  optionFontSize.value = 16
  optionFontWeight.value = 'normal'
  
  // Reset positions to default
  questionPosition.value = { x: 50, y: 150 }
  optionsPosition.value = { x: 50, y: 350 }
  timerPosition.value = { x: window.innerWidth - 250, y: 50 }
  toolbarPosition.value = { x: 20, y: 300 }
}

// Watchers for mirror updates and route changes
watch([currentIndex, showAnswer, showSolution, selectedOption], () => {
  sendToMirror()
}, { deep: true })

watch(currentQuestion, (newQuestion) => {
  if (newQuestion) {
    sendToMirror()
  }
}, { deep: true })

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      setId.value = newId
      loadQuestions()
      initializeMirror()
    }
  },
  { immediate: true }
)

// Lifecycle
onMounted(() => {
  console.log("Set ID:", setId.value)
  
  // Initialize board components
  initializeBoard()
  loadQuestions()
  initializeMirror()
  resetQuestionTimer()
  
  // Initialize positions based on window size
  timerPosition.value.x = window.innerWidth - 250
  
  // Initialize drawing canvas
  setTimeout(() => {
    initDrawingCanvas()
  }, 100)
  
  // Handle window resize to keep elements in bounds
  const handleResize = () => {
    const maxX = window.innerWidth - 300
    const maxY = window.innerHeight - 200
    
    // Adjust positions if they're out of bounds
    if (timerPosition.value.x > maxX) timerPosition.value.x = maxX
    if (timerPosition.value.y > maxY) timerPosition.value.y = maxY
    if (questionPosition.value.x > maxX) questionPosition.value.x = maxX
    if (questionPosition.value.y > maxY) questionPosition.value.y = maxY
    if (optionsPosition.value.x > maxX) optionsPosition.value.x = maxX
    if (optionsPosition.value.y > maxY) optionsPosition.value.y = maxY
    if (toolbarPosition.value.x > maxX) toolbarPosition.value.x = maxX
    if (toolbarPosition.value.y > maxY) toolbarPosition.value.y = maxY
    
    // Resize canvas
    if (drawingCanvas.value) {
      drawingCanvas.value.width = window.innerWidth
      drawingCanvas.value.height = window.innerHeight
    }
  }
  
  window.addEventListener('resize', handleResize)
  
  // Clean up on unmount
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  // Cleanup timer
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  // Cleanup Excalidraw
  if (excalidrawAPI.value?.root) {
    excalidrawAPI.value.root.unmount()
  }
  
  // Cleanup event listeners
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDragging)
})
</script>

<template>
  <div class="modern-digital-board">
    <!-- Top Navigation Bar -->
    <div class="top-navigation">
      <div class="nav-left">
        <div class="app-title">
          <FontAwesomeIcon :icon="faChalkboardTeacher" class="icon"/>
          <div class="header-line-separator">
            <span v-if="currentLanguage === 'en'">Modern Digital Teaching Board</span>
            <span v-else>आधुनिक डिजिटल शिक्षण बोर्ड</span>
          </div>
        </div>
        <div class="board-info">
          <span class="element-count">{{ elementCount }} elements</span>
          <span class="separator">|</span>
          <span class="board-status">{{ boardStatus }}</span>
        </div>
      </div>
      
      <div class="nav-center">
        <!-- Language and Question Counter -->
        <div class="top-controls">
          <div class="language-selector">
            <span v-if="currentLanguage === 'en'">Language:</span>
            <span v-else">भाषा:</span>
            <select v-model="currentLanguage" @change="switchLanguage(currentLanguage)">
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>
          
          <div class="question-counter">
            Q{{ currentIndex + 1 }}/{{ questions.length }}
          </div>
        </div>
      </div>
      
      <div class="nav-right">
        <!-- View Controls -->
        <div class="view-controls">
          <button 
            class="control-btn"
            @click="zoomOut"
            :disabled="zoomLevel <= 50"
            title="Zoom Out"
          >
            <FontAwesomeIcon :icon="faSearchMinus" />
          </button>
          <span class="zoom-display">{{ zoomLevel }}%</span>
          <button 
            class="control-btn"
            @click="zoomIn"
            :disabled="zoomLevel >= 200"
            title="Zoom In"
          >
            <FontAwesomeIcon :icon="faSearchPlus" />
          </button>
          <button 
            class="control-btn"
            @click="resetZoom"
            title="Reset Zoom"
          >
            <FontAwesomeIcon :icon="faRedo" />
          </button>
          <div class="separator-vertical"></div>
          <button 
            class="control-btn"
            @click="toggleFullscreen"
            title="Fullscreen"
          >
            <FontAwesomeIcon :icon="faExpand" />
          </button>
        </div>
      </div>
    </div>

    <!-- Main Board Area -->
    <div class="board-container" :class="{ 'fullscreen': isFullscreen, 'dark-mode': darkMode }">
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
      <div 
        ref="excalidrawContainer" 
        class="excalidraw-container"
        v-show="!loading && !boardError"
        :style="{ 
          backgroundColor: boardBgColor,
          fontSize: fontSize + 'px', 
          fontFamily: fontFamily,
          transform: 'scale(' + (zoomLevel/100) + ')'
        }"
      ></div>

      <!-- Floating Draggable Question Box (from DisplaySet.vue) -->
      <div 
        v-if="showQuestion && currentQuestion && !loading"
        class="question-box floating-draggable" 
        :style="{
          position: 'fixed',
          left: questionPosition.x + 'px',
          top: questionPosition.y + 'px',
          zIndex: draggingElement === 'question' ? 1003 : 1001,
          backgroundColor: questionBgColor,
          color: questionColor,
          fontSize: questionFontSize + 'px',
          fontWeight: questionFontWeight,
          fontFamily: questionFontFamily
        }"
        @mousedown="startDragging('question', $event)"
      >
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
            <div class="question-text">
              {{ currentQuestion.question?.text?.[currentLanguage] || currentQuestion.question?.text?.en }}
            </div>
            <div class="question-text question-hindi-text" v-if="currentLanguage !== 'en' && currentQuestion.question?.text?.hi">
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

      <!-- Floating Draggable Options Container (from DisplaySet.vue) -->
      <div 
        v-if="showOptions && currentQuestion && !loading"
        class="options-container floating-draggable" 
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
        @mousedown="startDragging('options', $event)"
      >
        <div class="drag-handle">⋮⋮</div>
        <div v-for="(option, idx) in currentOptions" 
             :key="idx"
             class="option"
             :class="{
                'selected': selectedOption === idx,
                'correct': showAnswer && currentQuestion.correct_answer === idx,
                'incorrect': showAnswer && selectedOption === idx && selectedOption !== currentQuestion.correct_answer
              }"
              @click="selectOption(idx)">
          <div class="option-letter">{{ String.fromCharCode(65 + idx) }}.</div>
          <div class="option-text">{{ option.text?.[currentLanguage] || option.text?.en }}</div>
        </div>
      </div>

      <!-- Floating Draggable Timer (from DisplaySet.vue) -->
      <div 
        v-if="showTimer && !loading"
        class="question-timer floating-draggable" 
        :class="{ 'fade-out': !showTimer }" 
        :style="{
          position: 'fixed',
          left: timerPosition.x + 'px',
          top: timerPosition.y + 'px',
          zIndex: draggingElement === 'timer' ? 1003 : 1002
        }"
        @mousedown="startDragging('timer', $event)"
      >
        <div class="drag-handle">⋮⋮</div>
        <div class="timer-content">
          <div class="timer-display">
            {{ timerDisplayTime }}
          </div>
          <div class="timer-controls">
            <button class="timer-btn" @click="toggleTimer">
              <FontAwesomeIcon :icon="timerActive ? faPause : faPlay" />
            </button>
            <button class="timer-btn" @click="resetQuestionTimer">
              <FontAwesomeIcon :icon="faRedo" />
            </button>
          </div>
        </div>
      </div>

      <!-- Drawing Canvas Layer (from DisplaySet.vue) -->
      <canvas 
        ref="drawingCanvas" 
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
        @mouseleave="stopDrawing"
      ></canvas>

      <!-- Explanation Box (for teacher) -->
      <div v-if="showSolution && currentQuestion?.explanation" class="explanation-box">
        <div class="explanation-title">
          <span v-if="currentLanguage === 'en'">Teaching Notes:</span>
          <span v-else">शिक्षण नोट्स:</span>
        </div>
        <p>{{ currentQuestion.explanation[currentLanguage] || currentQuestion.explanation.en }}</p>
      </div>

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
            <button 
              class="tool-btn"
              :class="{ active: currentTool === 'pen' }"
              @click="setTool('pen')"
              title="Pen"
            >
              <i class="pi pi-pencil"></i>
            </button>
            <button 
              class="tool-btn"
              :class="{ active: currentTool === 'highlighter' }"
              @click="setTool('highlighter')"
              title="Highlighter"
            >
              <i class="pi pi-palette"></i>
            </button>
            <button 
              class="tool-btn"
              :class="{ active: currentTool === 'eraser' }"
              @click="setTool('eraser')"
              title="Eraser"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>
          
          <div class="tool-section">
            <div class="color-picker-wrapper">
              <input 
                type="color" 
                v-model="drawingColor" 
                class="color-picker"
                title="Color"
              />
            </div>
            <div class="size-control">
              <input 
                type="range" 
                v-model="brushSize" 
                min="1" 
                max="20" 
                class="size-slider"
                title="Brush Size"
              />
              <span class="size-indicator">{{ brushSize }}</span>
            </div>
          </div>
          
          <div class="tool-section">
            <button 
              class="tool-btn clear-btn"
              @click="clearDrawing"
              title="Clear Drawing"
            >
              <i class="pi pi-trash"></i>
            </button>
            <button 
              class="tool-btn"
              @click="undoDrawing"
              title="Undo"
            >
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

    <!-- Control Panel Toggle (from DisplaySet.vue) -->
    <div class="toggle-panel" @click="showControls = !showControls">
      <FontAwesomeIcon v-if="showControls" :icon="faChevronRight" />
      <FontAwesomeIcon v-else :icon="faChevronLeft" />
    </div>

    <!-- Control Panel (from DisplaySet.vue) -->
    <div class="control-panel" v-if="showControls">
      <!-- Timer Controls -->
      <div class="panel-section">
        <div class="section-title">
          <FontAwesomeIcon :icon="faClock" class="icon" />
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

          <button class="control-btn reset" @click="resetQuestionTimer">
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
          <FontAwesomeIcon :icon="faCompass" class="icon"/>
          <span v-if="currentLanguage === 'en'">Question Navigation</span>
          <span v-else>प्रश्न नेविगेशन</span>
        </div>

        <div class="nav-controls">
          <button class="nav-btn" @click="prevPage" :disabled="currentPage === 0">
            <FontAwesomeIcon :icon="faChevronLeft" class="icon"/>
          </button>

          <span class="page-info">
            <span v-if="currentLanguage === 'en'">Page</span>
            <span v-else>पृष्ठ</span> {{ currentPage + 1 }}/{{ totalPages }}
          </span>

          <button class="nav-btn" @click="nextPage" :disabled="currentPage === totalPages - 1">
            <FontAwesomeIcon :icon="faChevronRight" class="icon"/>
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
          <FontAwesomeIcon :icon="faEye" class="icon" />
          <span v-if="currentLanguage === 'en'">Answer Controls</span>
          <span v-else>उत्तर नियंत्रण</span>
        </div>

        <div class="controls-grid">
          <button class="control-btn answer" @click="toggleAnswer">
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
                  @click="toggleSolution">
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

        <div v-if="showAnswer && currentQuestion" class="answer-display">
          <span v-if="currentLanguage === 'en'">Correct answer:</span>
          <span v-else>सही उत्तर:</span>
          <strong>{{ String.fromCharCode(65 + currentQuestion.correct_answer) }}</strong>
        </div>
      </div>

      <!-- Mirror Settings -->
      <div class="panel-section">
        <div class="section-title">
          <FontAwesomeIcon :icon="faDesktopAlt" class="icon"/>
          <span v-if="currentLanguage === 'en'">Mirror</span>
          <span v-else>डिस्प्ले सेटिंग्स</span>
        </div>
        <div class="controls-grid">
          <button class="control-btn start" v-if="!mirror_key"
                  @click="createMirror">
            <FontAwesomeIcon :icon="faDesktopAlt" class="icon" />
            <span v-if="currentLanguage === 'en'">Create</span>
            <span v-else>शुरू</span>
          </button>

          <div class="control-btn clipboard" v-if="!!mirror_key"
                @click="copyToClipboard">
            <FontAwesomeIcon :icon="faClipboard" class="icon" />
            <span v-if="currentLanguage === 'en'">{{ mirror_key }}</span>
          </div>
        </div>
      </div>

      <!-- Screen Appearance Settings -->
      <div class="panel-section">
        <div class="section-title">
          <FontAwesomeIcon :icon="faSlidersH" class="icon"/>
          <span v-if="currentLanguage === 'en'">Screen Appearance Settings</span>
          <span v-else>स्क्रीन सेटिंग्स</span>
        </div>
        <div class="bg-white p-6 rounded-lg col-span-1">
          <!-- Board Background -->
          <div class="flex items-center justify-between mb-6">
            <h6 class="w-90font-medium mb-2 text-gray-700">Main Screen Background</h6>
            <input type="color" v-model="boardBgColor" class="w-10 h-10 rounded border-gray-300">
          </div>
          
          <!-- Question Styling -->
          <div class="mb-6">
            <h5 class="font-medium mb-2 text-gray-700">Question Text Style</h5>
            <div class="flex items-center justify-between mb-2">
              <span class="w-90">Background Color:</span>
              <input type="color" v-model="questionBgColor" class="w-10 h-10 rounded border-gray-300">
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="w-90">Text Color:</span>
              <input type="color" v-model="questionColor" class="w-10 h-10 rounded border-gray-300">
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="w-90">Text Size:</span>
              <input type="range" min="12" max="36" v-model="questionFontSize" class="w-32">
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="w-25" style="margin-right: 10px;">Text Style:</span>
              <select v-model="questionFontWeight" class="select-option border rounded px-2 py-1" style="text-transform: capitalize;">
                <option v-for="weight in fontWeights" :key="weight" :value="weight">{{ weight }}</option>
              </select>
            </div>
          </div>
          
          <!-- Options Styling -->
          <div class="mb-6">
            <h5 class="font-medium mb-2 text-gray-700">Answer Options Style</h5>
            <div class="flex items-center justify-between mb-2">
              <span class="w-90">Background Color:</span>
              <input type="color" v-model="optionBgColor" class="w-10 h-10 rounded border-gray-300">
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="w-90">Text Color:</span>
              <input type="color" v-model="optionColor" class="w-10 h-10 rounded border-gray-300">
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="w-90">Text Size:</span>
              <input type="range" min="12" max="30" v-model="optionFontSize" class="w-32">
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="w-25" style="margin-right: 10px;">Text Style:</span>
              <select v-model="optionFontWeight" class="select-option border rounded px-2 py-1" style="text-transform: capitalize;">
                <option v-for="weight in fontWeights" :key="weight" :value="weight">{{ weight }}</option>
              </select>
            </div>
          </div>
          
          <!-- Reset Button -->
          <div class="flex justify-end">
            <button @click="resetStyles" class="bg-red-500 hover:bg-red-600 text-white rounded reset-btn">
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons (from DisplaySet.vue) -->
    <div class="nav-buttons">
      <button class="nav-button"
              @click="previousQuestion"
              :disabled="currentIndex === 0">
        <FontAwesomeIcon :icon="faChevronLeft" class="icon"/>
      </button>
      <button class="nav-button"
              @click="nextQuestion"
              :disabled="currentIndex === questions.length - 1">
        <FontAwesomeIcon :icon="faChevronRight" class="icon"/>
      </button>
    </div>

    <!-- Drawing Canvas Overlay (inspired by DisplaySet.vue) -->
    <canvas 
      ref="drawingCanvas"
      class="drawing-canvas"
      v-show="drawingMode"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
    ></canvas>

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
              <input 
                type="checkbox" 
                v-model="includeBackground" 
                class="checkbox"
              />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showExportDialog = false" class="btn-secondary">
            Cancel
          </button>
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
            <input 
              id="boardName"
              type="text" 
              v-model="boardName" 
              placeholder="Enter board name"
              class="text-input"
            />
          </div>
          <div class="form-group">
            <label for="boardDescription">Description (optional):</label>
            <textarea 
              id="boardDescription"
              v-model="boardDescription" 
              placeholder="Brief description of the board"
              class="textarea-input"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showSaveDialog = false" class="btn-secondary">
            Cancel
          </button>
          <button @click="performSave" class="btn-primary" :disabled="!boardName || saving">
            <i v-if="saving" class="pi pi-spin pi-spinner"></i>
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Action Button -->
    <button 
      class="fab"
      @click="showStatusPanel = !showStatusPanel"
      title="Board Info"
    >
      <i class="pi pi-info"></i>
    </button>

    <!-- Toggle Floating Tools Button -->
    <button 
      class="fab fab-secondary"
      @click="showFloatingTools = !showFloatingTools"
      title="Toggle Drawing Tools"
      :style="{ right: '80px' }"
    >
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
.toggle-panel {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(59, 130, 246, 0.9);
  color: white;
  border: none;
  border-radius: 8px 0 0 8px;
  padding: 1rem 0.5rem;
  cursor: pointer;
  z-index: 1004;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
}

.toggle-panel:hover {
  background: rgba(37, 99, 235, 0.9);
  padding-left: 0.75rem;
}

.control-panel {
  position: fixed;
  right: 0;
  top: 80px;
  bottom: 80px;
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px 0 0 12px;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-right: none;
  z-index: 1003;
  overflow-y: auto;
  padding: 1rem;
  transform: translateX(100%);
  animation: slideInFromRight 0.3s ease forwards;
}

@keyframes slideInFromRight {
  to {
    transform: translateX(0);
  }
}

.panel-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(229, 231, 235, 0.8);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(59, 130, 246, 0.1);
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
}

.control-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
  transform: translateY(-1px);
}

.control-btn.start {
  border-color: #10b981;
  color: #10b981;
}

.control-btn.pause {
  border-color: #f59e0b;
  color: #f59e0b;
}

.control-btn.reset,
.control-btn.clear {
  border-color: #ef4444;
  color: #ef4444;
}

/* Navigation Buttons */
.nav-buttons {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  z-index: 1002;
}

.nav-button {
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.nav-button:hover:not(:disabled) {
  background: rgba(37, 99, 235, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
