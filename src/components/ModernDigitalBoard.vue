
<template>
    <div class="modern-digital-board">
        <CustomAdStrip 
            @edit-mode-changed="handleAdEditModeChanged" 
            :class="{ 'fullscreen-ad-strip': isFullscreen }"
        />

        <div class="main-board-content" v-if="!adEditMode">
            <!-- Top Navigation Bar -->
        <div class="top-navigation" style="display: none">
            <div class="nav-left">
                <div class="app-title">
                    <FontAwesomeIcon :icon="faChalkboardTeacher" class="icon" />
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

            <div class="nav-right">
                <!-- View Controls - moved to bottom left -->
            </div>
        </div>

        <!-- Main Board Area -->
        <div class="board-container" :class="{ fullscreen: isFullscreen, 'dark-mode': darkMode }" :style="{ backgroundColor: boardBgColor }">
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
                :class="{ 'excalidraw-hidden': !excalidrawMode }"
                v-show="!loading && !boardError"
                :style="{
                    backgroundColor: boardBgColor,
                    fontSize: fontSize + 'px',
                    fontFamily: fontFamily
                }"
            ></div>

            <!-- Floating Draggable Question Box (from DisplaySet.vue) -->
            <div
                v-if="showQuestion && currentQuestion && !loading"
                class="question-box floating-draggable resizable"
                :style="{
                    position: 'fixed',
                    left: questionPosition.x + 'px',
                    top: questionPosition.y + 'px',
                    width: questionSize.width + 'px',
                    height: questionSize.height + 'px',
                    zIndex: draggingElement === 'question' ? 1003 : 1001,
                    backgroundColor: questionBgColor,
                    color: questionColor,
                    fontSize: questionFontSize + 'px',
                    fontWeight: questionFontWeight,
                    fontFamily: questionFontFamily,
                    transform: 'scale(' + zoomLevel / 100 + ')'
                }"
                @mousedown="startDragging('question', $event)"
                @touchstart="startDragging('question', $event)"
            >
                <div class="drag-handle" title="Drag to move">⋮⋮</div>

                <!-- Resize handles -->
                <div class="resize-handle resize-handle-right" @mousedown="startResizing('question', 'right', $event)" @touchstart="startResizing('question', 'right', $event)"></div>
                <div class="resize-handle resize-handle-bottom" @mousedown="startResizing('question', 'bottom', $event)" @touchstart="startResizing('question', 'bottom', $event)"></div>
                <div class="resize-handle resize-handle-corner" @mousedown="startResizing('question', 'corner', $event)" @touchstart="startResizing('question', 'corner', $event)"></div>

                <div class="question-content" :style="questionDynamicStyles">
                    <div class="flex" :style="{ gap: Math.round(8 * questionContentScale) + 'px' }">
                        <div
                            class="question-number flex"
                            :style="{
                                alignItems: 'center',
                                borderRight: Math.round(1 * questionContentScale) + 'px solid #dfe3e7',
                                paddingRight: Math.round(10 * questionContentScale) + 'px',
                                marginRight: Math.round(8 * questionContentScale) + 'px',
                                fontSize: 'inherit',
                                fontWeight: 'bold',
                                gap: Math.round(4 * questionContentScale) + 'px'
                            }"
                        >
                            <span v-if="currentLanguage === 'en'">Q.</span>
                            <span v-else>प्रश्न</span> {{ currentIndex + 1 }}
                            <span v-if="currentQuestion.marks">
                                |
                                <span v-if="currentLanguage === 'en'">Marks:</span>
                                <span v-else>अंक:</span> {{ currentQuestion.marks }}
                            </span>
                        </div>
                        <div style="flex: 1">
                            <div
                                class="question-text question-hindi-text"
                                v-if="currentLanguage !== 'en' && currentQuestion.question?.text?.hi"
                                :style="{
                                    fontSize: Math.round(questionFontSize * questionContentScale * 0.9) + 'px',
                                    lineHeight: 'inherit',
                                    opacity: '0.9',
                                    fontStyle: 'italic',
                                    wordWrap: 'break-word'
                                }"
                            >
                                {{ currentQuestion.question.text.hi }}
                            </div>
                            <div
                                class="question-text"
                                :style="{
                                    fontSize: 'inherit',
                                    lineHeight: 'inherit',
                                    opacity: '0.9',
                                    fontStyle: 'italic',
                                    marginBottom: Math.round(questionFontSize * questionContentScale *0.9) + 'px',
                                    wordWrap: 'break-word'
                                }"
                            >
                                {{ currentQuestion.question?.text?.en }}
                            </div>
                            
                        </div>
                    </div>

                    <!-- Question Image -->
                    <div v-if="currentQuestion.image" class="question-image" :style="{ marginTop: 12 * questionContentScale + 'px' }">
                        <img
                            :src="currentQuestion.image"
                            :alt="currentLanguage === 'en' ? 'Question diagram' : 'प्रश्न आरेख'"
                            :style="{
                                maxWidth: '100%',
                                height: 'auto',
                                borderRadius: 8 * questionContentScale + 'px'
                            }"
                        />
                    </div>
                </div>
            </div>

            <!-- Floating Draggable Options Container (from DisplaySet.vue) -->
            <div
                v-if="showOptions && currentQuestion && !loading"
                class="options-container floating-draggable resizable"
                :style="{
                    position: 'fixed',
                    left: optionsPosition.x + 'px',
                    top: optionsPosition.y + 'px',
                    width: optionsSize.width + 'px',
                    height: optionsSize.height + 'px',
                    zIndex: draggingElement === 'options' ? 1003 : 1001,
                    backgroundColor: optionBgColor,
                    color: optionColor,
                    fontSize: optionFontSize + 'px',
                    fontWeight: optionFontWeight,
                    transform: 'scale(' + zoomLevel / 100 + ')'
                }"
                @mousedown="startDragging('options', $event)"
                @touchstart="startDragging('options', $event)"
            >
                <div class="drag-handle" title="Drag to move">
                    <i class="pi pi-arrows-alt"></i>
                </div>

                <!-- Resize handles -->
                <div class="resize-handle resize-handle-right" @mousedown="startResizing('options', 'right', $event)" @touchstart="startResizing('options', 'right', $event)"></div>
                <div class="resize-handle resize-handle-bottom" @mousedown="startResizing('options', 'bottom', $event)" @touchstart="startResizing('options', 'bottom', $event)"></div>
                <div class="resize-handle resize-handle-corner" @mousedown="startResizing('options', 'corner', $event)" @touchstart="startResizing('options', 'corner', $event)"></div>

                <div class="options-content" :style="optionsDynamicStyles">
                    <div
                        v-for="(option, idx) in currentOptions"
                        :key="idx"
                        class="option"
                        :class="{
                            selected: selectedOption === idx,
                            correct: showAnswer && correctAnswerIndex === idx,
                            incorrect: showAnswer && selectedOption === idx && selectedOption !== correctAnswerIndex
                        }"
                        :style="{
                            fontSize: 'inherit',
                            lineHeight: 'inherit',
                            padding: Math.round(8 * optionsContentScale) + 'px ' + Math.round(12 * optionsContentScale) + 'px',
                            marginBottom: Math.round(6 * optionsContentScale) + 'px',
                            borderRadius: Math.round(6 * optionsContentScale) + 'px',
                            transition: 'all 0.2s ease',
                            minHeight: Math.round(40 * optionsContentScale) + 'px',
                            display: 'flex',
                            alignItems: 'center'
                        }"
                        @click="selectOption(idx)"
                    >
                        <div
                            class="option-letter"
                            :style="{
                                fontSize: 'inherit',
                                marginRight: Math.round(8 * optionsContentScale) + 'px',
                                minWidth: Math.round(25 * optionsContentScale) + 'px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }"
                        >
                            {{ String.fromCharCode(65 + idx) }}.
                        </div>
                        <div
                            class="option-text"
                            :style="{
                                fontSize: 'inherit',
                                lineHeight: 'inherit',
                                flex: '1',
                                wordWrap: 'break-word'
                            }"
                        >
                            {{ currentLanguage == 'en' ? option.text?.en : (option.text?.hi + " ┃ " + option.text?.en) }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Floating Draggable Solution Box -->
            <div
                v-if="showSolution && currentQuestion && currentQuestion.solution && !loading"
                class="solution-box floating-draggable resizable"
                :style="{
                    position: 'fixed',
                    left: solutionPosition.x + 'px',
                    top: solutionPosition.y + 'px',
                    width: solutionSize.width + 'px',
                    height: solutionSize.height + 'px',
                    zIndex: draggingElement === 'solution' ? 1003 : 1001,
                    backgroundColor: solutionBgColor,
                    color: solutionColor,
                    fontSize: solutionFontSize + 'px',
                    fontWeight: solutionFontWeight,
                    fontFamily: solutionFontFamily,
                    transform: 'scale(' + zoomLevel / 100 + ')'
                }"
                @mousedown="startDragging('solution', $event)"
                @touchstart="startDragging('solution', $event)"
            >
                <div class="drag-handle" title="Drag to move">⋮⋮</div>

                <!-- Resize handles -->
                <div class="resize-handle resize-handle-right" @mousedown="startResizing('solution', 'right', $event)" @touchstart="startResizing('solution', 'right', $event)"></div>
                <div class="resize-handle resize-handle-bottom" @mousedown="startResizing('solution', 'bottom', $event)" @touchstart="startResizing('solution', 'bottom', $event)"></div>
                <div class="resize-handle resize-handle-corner" @mousedown="startResizing('solution', 'corner', $event)" @touchstart="startResizing('solution', 'corner', $event)"></div>

                <div class="solution-content" :style="solutionDynamicStyles">
                    <div class="flex" :style="{ gap: Math.round(8 * solutionContentScale) + 'px' }">
                        <div
                            class="solution-header flex"
                            :style="{
                                alignItems: 'center',
                                borderRight: Math.round(1 * solutionContentScale) + 'px solid #dfe3e7',
                                paddingRight: Math.round(10 * solutionContentScale) + 'px',
                                marginRight: Math.round(8 * solutionContentScale) + 'px',
                                fontSize: 'inherit',
                                fontWeight: 'bold',
                                gap: Math.round(4 * solutionContentScale) + 'px',
                                color: '#059669'
                            }"
                        >
                            <FontAwesomeIcon :icon="faBookOpen" class="text-emerald-600" />
                            <span v-if="currentLanguage === 'en'">Solution</span>
                            <span v-else>समाधान</span>
                        </div>
                        <div style="flex: 1">
                            <div
                                class="solution-text"
                                :style="{
                                    fontSize: 'inherit',
                                    lineHeight: 'inherit',
                                    marginBottom: Math.round(6 * solutionContentScale) + 'px',
                                    wordWrap: 'break-word'
                                }"
                            >
                                {{ currentQuestion.solution?.text?.[currentLanguage] || currentQuestion.solution?.text?.en }}
                            </div>
                            <div
                                class="solution-text solution-hindi-text"
                                v-if="currentLanguage !== 'en' && currentQuestion.solution?.text?.hi && currentLanguage === 'hi'"
                                :style="{
                                    fontSize: Math.round(solutionFontSize * solutionContentScale * 0.9) + 'px',
                                    lineHeight: 'inherit',
                                    opacity: '0.8',
                                    fontStyle: 'italic',
                                    wordWrap: 'break-word'
                                }"
                            >
                                {{ currentQuestion.solution.text.hi }}
                            </div>
                        </div>
                    </div>

                    <!-- Solution Images -->
                    <div v-if="currentQuestion.solution?.images && currentQuestion.solution.images.length > 0" class="solution-images" :style="{ marginTop: 12 * solutionContentScale + 'px' }">
                        <div v-for="(image, idx) in currentQuestion.solution.images" :key="idx" class="solution-image" :style="{ marginBottom: 8 * solutionContentScale + 'px' }">
                            <img
                                :src="image"
                                :alt="currentLanguage === 'en' ? 'Solution diagram' : 'समाधान आरेख'"
                                :style="{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    borderRadius: 8 * solutionContentScale + 'px'
                                }"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Floating Draggable Timer (from DisplaySet.vue) -->
            <div
                class="question-timer floating-draggable"
                :class="{
                    'fade-out': !timerFeatureEnabled || !showTimer,
                    'timer-warning': currentQuestionTime <= 10 && currentQuestionTime > 0 && showTimer && timerFeatureEnabled,
                    'timer-critical': currentQuestionTime <= 5 && currentQuestionTime > 0 && showTimer && timerFeatureEnabled
                }"
                :style="{
                    position: 'fixed',
                    left: timerPosition.x + 'px',
                    top: timerPosition.y + 'px',
                    zIndex: draggingElement === 'timer' ? 1003 : 1002
                }"
                @mousedown="startDragging('timer', $event)"
                @touchstart="startDragging('timer', $event)"
            >
                <!-- <div class="drag-handle">⋮⋮</div> -->
                <div class="timer">
                    {{ formatTime(currentQuestionTime) }}
                </div>
            </div>

            <!-- Explanation Box (for teacher) -->
            <div v-if="showSolution && currentQuestion?.explanation" class="explanation-box">
                <div class="explanation-title">
                    <span v-if="currentLanguage === 'en'">Teaching Notes:</span>
                    <span v-else>शिक्षण नोट्स:</span>
                </div>
                <p>{{ currentQuestion.explanation[currentLanguage] || currentQuestion.explanation.en }}</p>
            </div>
        </div>

        <!-- Persistent Question Navigation Arrows -->
        <div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[10001] flex items-center gap-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-2 shadow-xl hover:shadow-2xl transition-all duration-200">
            <button
                class="w-10 h-10 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                @click="previousQuestion"
                :disabled="currentIndex === 0"
                :title="currentLanguage === 'en' ? 'Previous Question' : 'पिछला प्रश्न'"
            >
                <FontAwesomeIcon :icon="faChevronLeft" class="text-sm" />
            </button>

            <div class="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 rounded-full px-4 py-2">
                <span class="text-sm font-bold text-cyan-700">{{ currentIndex + 1 }}/{{ questions.length }}</span>
            </div>

            <button
                class="w-10 h-10 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                @click="nextQuestion"
                :disabled="currentIndex === questions.length - 1"
                :title="currentLanguage === 'en' ? 'Next Question' : 'अगला प्रश्न'"
            >
                <FontAwesomeIcon :icon="faChevronRight" class="text-sm" />
            </button>
        </div>

        <!-- Bottom Left View Controls -->
        <div class="fixed bottom-4 left-4 z-[10001] flex items-center gap-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200">
            <button
                class="w-10 h-10 bg-gradient-to-r from-slate-400 to-gray-500 hover:from-slate-500 hover:to-gray-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                @click="zoomOut"
                :disabled="zoomLevel <= 50"
                title="Zoom Out Questions & Options"
            >
                <FontAwesomeIcon :icon="faSearchMinus" class="text-sm" />
            </button>

            <div class="bg-gradient-to-r from-slate-50 to-gray-100 border border-slate-200 rounded-lg px-3 py-1.5 min-w-[60px] text-center">
                <span class="text-sm font-semibold text-slate-700">{{ zoomLevel }}%</span>
            </div>

            <button
                class="w-10 h-10 bg-gradient-to-r from-slate-400 to-gray-500 hover:from-slate-500 hover:to-gray-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                @click="zoomIn"
                :disabled="zoomLevel >= 200"
                title="Zoom In Questions & Options"
            >
                <FontAwesomeIcon :icon="faSearchPlus" class="text-sm" />
            </button>

            <div class="w-px h-6 bg-slate-300"></div>

            <button
                class="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg"
                @click="toggleFullscreen"
                :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'"
            >
                <FontAwesomeIcon :icon="isFullscreen ? faCompress : faExpand" class="text-sm" />
            </button>
        </div>

        <!-- Exit Fullscreen Button (only visible in fullscreen) -->
        <div v-if="isFullscreen" class="fixed top-4 right-4 z-[10001] flex gap-3">
            <!-- Exit Fullscreen -->
            <button @click="toggleFullscreen" class="bg-black/50 hover:bg-black/70 text-white p-3 rounded-xl backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:shadow-lg" title="Exit Fullscreen">
                <FontAwesomeIcon :icon="faCompress" class="text-xl" />
            </button>

            <!-- Show Controls in Fullscreen -->
            <button v-if="!showControls" @click="showControls = true" class="bg-indigo-600/50 hover:bg-indigo-600/70 text-white p-3 rounded-xl backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:shadow-lg" title="Show Controls">
                <FontAwesomeIcon :icon="faSlidersH" class="text-xl" />
            </button>
        </div>

        <!-- Control Panel Toggle (from DisplaySet.vue) -->
        <div class="fixed top-1/2 transform -translate-y-1/2 z-[10002] group transition-all duration-300" :class="{ 'right-80': showControls, 'right-0': !showControls }" @click="showControls = !showControls">
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-l-xl shadow-lg cursor-pointer transition-all duration-300 hover:from-indigo-700 hover:to-purple-700 hover:scale-110 hover:shadow-xl">
                <FontAwesomeIcon v-if="showControls" :icon="faChevronRight" class="text-lg" />
                <FontAwesomeIcon v-else :icon="faChevronLeft" class="text-lg" />
            </div>

            <!-- Tooltip -->
            <div class="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[10003]">
                {{ showControls ? 'Hide Controls' : 'Show Controls' }}
            </div>
        </div>

        <!-- Control Panel (from DisplaySet.vue) -->
        <div
            class="fixed top-0 right-0 h-full w-80 bg-white/95 backdrop-blur-sm shadow-2xl transform transition-transform duration-300 z-[10000] overflow-y-auto"
            :class="{ 'translate-x-0': showControls, 'translate-x-full': !showControls }"
            v-if="true"
        >
            <!-- Control Panel Header -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 sticky top-0 z-10">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <FontAwesomeIcon :icon="faSlidersH" class="text-lg" />
                        </div>
                        <div>
                            <h3 class="text-xl font-bold tracking-wide">Control Panel</h3>
                            <p class="text-sm text-white/80">Teaching Board Controls</p>
                        </div>
                    </div>
                    <button @click="showControls = false" class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
                        <FontAwesomeIcon :icon="faChevronRight" class="text-sm" />
                    </button>
                </div>
            </div>

            <div class="p-4 space-y-4">
                <div class="nav-center">
                    <!-- Language and Question Counter -->
                    <div class="top-controls">
                        <div class="language-selector">
                            <div class="bg-gradient-to-r from-slate-50 to-gray-100 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-200">
                                <div class="flex items-center gap-2">
                                    <div class="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                                        <span class="text-white text-xs font-bold">🌐</span>
                                    </div>
                                    <span class="text-sm font-semibold text-slate-700">
                                        <span v-if="currentLanguage === 'en'">Language:</span>
                                        <span v-else>भाषा:</span>
                                    </span>
                                </div>
                                <select
                                    v-model="currentLanguage"
                                    @change="switchLanguage(currentLanguage)"
                                    class="bg-white border-2 border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 cursor-pointer hover:border-indigo-300"
                                >
                                    <option value="en" class="font-medium">🇬🇧 English</option>
                                    <option value="hi" class="font-medium">🇮🇳 हिंदी</option>
                                </select>
                            </div>
                        </div>

                        <!-- Subject Filter -->
                        <div class="subject-filter mt-3">
                            <div class="bg-gradient-to-r from-slate-50 to-gray-100 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-200">
                                <div class="flex items-center gap-2">
                                    <div class="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                                        <span class="text-white text-xs font-bold">📚</span>
                                    </div>
                                    <span class="text-sm font-semibold text-slate-700">
                                        <span v-if="currentLanguage === 'en'">Subject:</span>
                                        <span v-else>विषय:</span>
                                    </span>
                                </div>
                                <select
                                    v-model="selectedSubject"
                                    @change="filterBySubject"
                                    class="bg-white border-2 border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 cursor-pointer hover:border-emerald-300"
                                >
                                    <option value="" class="font-medium">
                                        {{ currentLanguage === 'en' ? 'All Subjects' : 'सभी विषय' }}
                                    </option>
                                    <option v-for="subject in availableSubjects" :key="subject" :value="subject" class="font-medium">
                                        {{ subject }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Timer Controls -->
                <div class="panel-section compact bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 mb-4">
                    <div class="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-3 rounded-t-2xl flex items-center gap-3">
                        <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon :icon="faClock" class="text-sm" />
                        </div>
                        <span class="font-semibold text-sm tracking-wide">Timer Controls</span>
                    </div>

                    <div class="p-5 space-y-4">
                        <!-- Timer Control Buttons -->
                        <div class="grid grid-cols-2 gap-3 mb-3">
                            <button
                                class="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl px-4 py-3 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                @click="startTimer"
                                :disabled="timerActive || !timerFeatureEnabled"
                                :class="{ 'ring-2 ring-emerald-300 bg-gradient-to-r from-emerald-600 to-green-600': timerActive }"
                            >
                                <FontAwesomeIcon :icon="faPlay" class="text-lg" />
                                <span class="text-xs font-semibold">Start</span>
                            </button>

                            <button
                                class="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl px-4 py-3 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                @click="pauseTimer"
                                :disabled="!timerActive || !timerFeatureEnabled"
                            >
                                <FontAwesomeIcon :icon="faPause" class="text-lg" />
                                <span class="text-xs font-semibold">Pause</span>
                            </button>

                            <button
                                class="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl px-4 py-3 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                @click="resetQuestionTimer"
                                :disabled="!timerFeatureEnabled"
                            >
                                <FontAwesomeIcon :icon="faRedo" class="text-lg" />
                                <span class="text-xs font-semibold">Reset</span>
                            </button>

                            <button
                                class="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl px-4 py-3 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                                @click="toggleTimerVisibility"
                                :class="{ 'ring-2 ring-indigo-300 bg-gradient-to-r from-indigo-600 to-purple-600': timerFeatureEnabled }"
                            >
                                <FontAwesomeIcon :icon="timerFeatureEnabled ? faEye : faEyeSlash" class="text-lg" />
                                <span class="text-xs font-semibold">{{ timerFeatureEnabled ? 'Hide' : 'Show' }}</span>
                            </button>
                        </div>

                        <div class="bg-gradient-to-r from-slate-50 to-gray-100 border border-slate-200 rounded-xl p-4">
                            <div class="flex items-center gap-2 mb-3 text-slate-600">
                                <FontAwesomeIcon :icon="faClock" class="text-violet-600" />
                                <span class="text-sm font-semibold">Timer Duration</span>
                            </div>

                            <!-- Quick Selection Info -->
                            <div class="text-xs text-slate-500 mb-3 bg-blue-50 border border-blue-200 rounded-lg p-2"><span class="font-medium text-blue-700">💡 Quick Select:</span> Click any time option below or enter a custom duration</div>

                            <!-- Timer Feature Status Info -->
                            <div v-if="!timerFeatureEnabled" class="text-xs text-orange-600 mb-3 bg-orange-50 border border-orange-200 rounded-lg p-2">
                                <span class="font-medium text-orange-700">⚠️ Timer Feature Disabled:</span> Enable timer feature to use these controls
                            </div>

                            <!-- Time Selection Boxes -->
                            <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                                <button
                                    v-for="timeOption in timeOptions"
                                    :key="timeOption.value"
                                    @click="selectTimeOption(timeOption.value)"
                                    :disabled="!timerFeatureEnabled"
                                    :class="{
                                        'bg-gradient-to-r from-violet-500 to-purple-500 text-white border-violet-500 shadow-lg transform scale-105 ring-2 ring-violet-300': selectedTimeOption === timeOption.value && timerFeatureEnabled,
                                        'bg-white text-slate-700 border-slate-200 hover:border-violet-300 hover:bg-violet-50 hover:shadow-md': selectedTimeOption !== timeOption.value && timerFeatureEnabled,
                                        'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed': !timerFeatureEnabled
                                    }"
                                    class="time-option-btn border-2 rounded-lg px-2 py-3 text-xs font-semibold transition-all duration-200 hover:scale-105 flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    <span class="text-base">{{ timeOption.icon }}</span>
                                    <span class="leading-tight">{{ timeOption.label }}</span>
                                </button>
                            </div>

                            <!-- Manual Input (Optional) -->
                            <div class="flex items-center gap-3">
                                <div class="flex-1 relative">
                                    <input
                                        type="number"
                                        v-model="examMeta.timePerQuestion"
                                        @input="selectedTimeOption = examMeta.timePerQuestion"
                                        :disabled="!timerFeatureEnabled"
                                        min="10"
                                        max="900"
                                        class="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-lg focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200 text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                        :class="{
                                            'border-amber-400 bg-amber-50': selectedTimeOption === null && timerFeatureEnabled,
                                            'border-gray-200 bg-gray-100': !timerFeatureEnabled
                                        }"
                                    />
                                    <div v-if="selectedTimeOption === null" class="absolute -top-1 -right-1">
                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"> Custom </span>
                                    </div>
                                </div>
                                <span class="text-sm text-slate-500 font-medium">seconds</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Question Navigation -->
                <div class="bg-gradient-to-br from-white to-cyan-50 border border-cyan-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 mb-4">
                    <div class="bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-4 py-3 rounded-t-2xl flex items-center gap-3">
                        <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon :icon="faCompass" class="text-sm" />
                        </div>
                        <span class="font-semibold text-sm tracking-wide">Question Navigation</span>
                    </div>

                    <div class="p-5 space-y-4">
                        <div class="flex items-center justify-center gap-4 bg-gradient-to-r from-slate-50 to-gray-100 rounded-xl p-3">
                            <button
                                class="w-10 h-10 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                @click="prevPage"
                                :disabled="currentPage === 0"
                            >
                                <FontAwesomeIcon :icon="faChevronLeft" class="text-sm" />
                            </button>

                            <div class="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                <span class="text-xl font-bold text-cyan-600">{{ currentPage + 1 }}</span>
                                <span class="text-slate-400 text-lg">/</span>
                                <span class="text-lg text-slate-600 font-medium">{{ totalPages }}</span>
                            </div>

                            <button
                                class="w-10 h-10 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                @click="nextPage"
                                :disabled="currentPage === totalPages - 1"
                            >
                                <FontAwesomeIcon :icon="faChevronRight" class="text-sm" />
                            </button>
                        </div>

                        <div class="grid grid-cols-5 gap-2">
                            <button
                                v-for="num in visibleQuestions"
                                :key="num"
                                @click="goToQuestion(num - 1)"
                                class="relative w-11 h-11 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
                                :class="{
                                    'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg ring-2 ring-cyan-300': currentIndex === num - 1,
                                    'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md': userAnswers[num - 1] !== undefined && currentIndex !== num - 1,
                                    'bg-white border-2 border-slate-200 text-slate-600 hover:border-cyan-300': userAnswers[num - 1] === undefined && currentIndex !== num - 1
                                }"
                            >
                                <span>{{ num }}</span>
                                <div v-if="userAnswers[num - 1] !== undefined && currentIndex !== num - 1" class="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <FontAwesomeIcon :icon="faCheck" class="text-emerald-500 text-xs" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Answer Controls -->
                <div class="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 mb-4">
                    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-t-2xl flex items-center gap-3">
                        <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon :icon="faEye" class="text-sm" />
                        </div>
                        <span class="font-semibold text-sm tracking-wide">Answer Controls</span>
                    </div>

                    <div class="p-5 space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <button
                                class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl px-4 py-3 flex items-center gap-2 justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                                @click="toggleAnswer"
                                :class="{ 'ring-2 ring-blue-300 bg-gradient-to-r from-blue-600 to-indigo-600': showAnswer }"
                            >
                                <FontAwesomeIcon :icon="faEye" class="text-sm" />
                                <span class="text-sm font-semibold">Show Answer</span>
                            </button>

                            <button
                                class="bg-gradient-to-r from-slate-400 to-gray-500 hover:from-slate-500 hover:to-gray-600 text-white rounded-xl px-4 py-3 flex items-center gap-2 justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
                                @click="clearSelection"
                            >
                                <FontAwesomeIcon :icon="faEraser" class="text-sm" />
                                <span class="text-sm font-semibold">Clear</span>
                            </button>
                        </div>

                        <button
                            class="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl px-4 py-3 flex items-center gap-2 justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
                            @click="toggleSolution"
                            :class="{ 'ring-2 ring-teal-300 bg-gradient-to-r from-teal-600 to-cyan-600': showSolution }"
                        >
                            <FontAwesomeIcon :icon="showSolution ? faBook : faBookOpen" class="text-sm" />
                            <span class="text-sm font-semibold">{{ showSolution ? 'Hide Solution' : 'Show Solution' }}</span>
                        </button>

                        <div v-if="showAnswer && currentQuestion" class="mt-4">
                            <div class="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-lg">
                                <span class="text-sm font-semibold">Correct Answer:</span>
                                <div class="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                                    <span class="text-lg font-bold">{{ currentQuestion.answer }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Mirror Settings -->
                <div class="bg-gradient-to-br from-white to-pink-50 border border-pink-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 mb-4">
                    <div class="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-4 py-3 rounded-t-2xl flex items-center gap-3">
                        <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon :icon="faDesktopAlt" class="text-sm" />
                        </div>
                        <span class="font-semibold text-sm tracking-wide">Mirror Display</span>
                    </div>

                    <div class="p-5">
                        <button
                            v-if="!mirror_key"
                            class="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl px-4 py-4 flex items-center gap-3 justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                            @click="createMirror"
                        >
                            <FontAwesomeIcon :icon="faDesktopAlt" class="text-lg" />
                            <span class="text-sm font-semibold">Create Mirror</span>
                        </button>

                        <div
                            v-if="!!mirror_key"
                            class="bg-gradient-to-r from-slate-50 to-gray-100 border border-slate-200 rounded-xl p-4 cursor-pointer hover:bg-gradient-to-r hover:from-gray-100 hover:to-slate-200 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                            @click="copyToClipboard"
                        >
                            <div class="flex items-center gap-2 mb-2 text-slate-600">
                                <FontAwesomeIcon :icon="faClipboard" class="text-pink-600" />
                                <span class="text-sm font-semibold">Mirror Key</span>
                            </div>
                            <div class="bg-white px-3 py-2 rounded-lg border border-slate-200">
                                <div class="font-mono text-sm font-bold text-slate-800">{{ mirror_key }}</div>
                                <div class="text-xs text-slate-500 mt-1">Click to copy</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Screen Appearance Settings -->
                <div class="bg-gradient-to-br from-white to-amber-50 border border-amber-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 mb-4">
                    <div class="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-3 rounded-t-2xl flex items-center gap-3">
                        <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon :icon="faSlidersH" class="text-sm" />
                        </div>
                        <span class="font-semibold text-sm tracking-wide">Appearance Settings</span>
                    </div>

                    <div class="p-5 space-y-4">
                        <!-- Main Screen Background -->
                        <div class="bg-gradient-to-r from-slate-50 to-gray-100 border border-slate-200 rounded-xl overflow-hidden">
                            <div class="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-3 py-2 text-sm font-semibold">Main Background</div>
                            <div class="p-3">
                                <div class="flex items-center gap-3">
                                    <input type="color" v-model="boardBgColor" class="w-10 h-10 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-amber-400 transition-colors duration-200" />
                                    <span class="text-xs font-mono text-slate-600 bg-white px-2 py-1 rounded border">{{ boardBgColor }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Question Text Style -->
                        <div class="bg-gradient-to-r from-slate-50 to-gray-100 border border-slate-200 rounded-xl overflow-hidden">
                            <div class="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-3 py-2 text-sm font-semibold">Question Style</div>
                            <div class="p-3 space-y-3">
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="space-y-2">
                                        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Background</label>
                                        <input type="color" v-model="questionBgColor" class="w-full h-8 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-amber-400 transition-colors duration-200" />
                                    </div>
                                    <div class="space-y-2">
                                        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Text Color</label>
                                        <input type="color" v-model="questionColor" class="w-full h-8 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-amber-400 transition-colors duration-200" />
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3">
                                    <div class="space-y-2">
                                        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Size: {{ questionFontSize }}px</label>
                                        <input type="range" min="12" max="36" v-model="questionFontSize" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider" />
                                    </div>
                                    <div class="space-y-2">
                                        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Weight</label>
                                        <select
                                            v-model="questionFontWeight"
                                            class="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                                        >
                                            <option v-for="weight in fontWeights" :key="weight" :value="weight">{{ weight }}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Answer Options Style -->
                        <div class="bg-gradient-to-r from-slate-50 to-gray-100 border border-slate-200 rounded-xl overflow-hidden">
                            <div class="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-3 py-2 text-sm font-semibold">Options Style</div>
                            <div class="p-3 space-y-3">
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="space-y-2">
                                        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Background</label>
                                        <input type="color" v-model="optionBgColor" class="w-full h-8 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-amber-400 transition-colors duration-200" />
                                    </div>
                                    <div class="space-y-2">
                                        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Text Color</label>
                                        <input type="color" v-model="optionColor" class="w-full h-8 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-amber-400 transition-colors duration-200" />
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3">
                                    <div class="space-y-2">
                                        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Size: {{ optionFontSize }}px</label>
                                        <input type="range" min="12" max="30" v-model="optionFontSize" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider" />
                                    </div>
                                    <div class="space-y-2">
                                        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Weight</label>
                                        <select
                                            v-model="optionFontWeight"
                                            class="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                                        >
                                            <option v-for="weight in fontWeights" :key="weight" :value="weight">{{ weight }}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Solution Style -->
                        <div class="bg-gradient-to-r from-slate-50 to-gray-100 border border-slate-200 rounded-xl overflow-hidden">
                            <div class="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 px-3 py-2 text-sm font-semibold">Solution Style</div>
                            <div class="p-3 space-y-3">
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="space-y-2">
                                        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Background</label>
                                        <input type="color" v-model="solutionBgColor" class="w-full h-8 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-amber-400 transition-colors duration-200" />
                                    </div>
                                    <div class="space-y-2">
                                        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Text Color</label>
                                        <input type="color" v-model="solutionColor" class="w-full h-8 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-amber-400 transition-colors duration-200" />
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3">
                                    <div class="space-y-2">
                                        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Size: {{ solutionFontSize }}px</label>
                                        <input type="range" min="12" max="30" v-model="solutionFontSize" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider" />
                                    </div>
                                    <div class="space-y-2">
                                        <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Weight</label>
                                        <select
                                            v-model="solutionFontWeight"
                                            class="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                                        >
                                            <option v-for="weight in fontWeights" :key="weight" :value="weight">{{ weight }}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Reset Button -->
                        <button
                            @click="resetDefaults"
                            class="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl px-4 py-3 flex items-center gap-2 justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                        >
                            <FontAwesomeIcon :icon="faRedo" class="text-sm" />
                            <span class="text-sm font-semibold">Reset to Defaults</span>
                        </button>
                    </div>
                </div>

                <!-- Settings Management -->
                <div class="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 mb-4">
                    <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-t-2xl flex items-center gap-3">
                        <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon :icon="faCog" class="text-sm" />
                        </div>
                        <span class="font-semibold text-sm tracking-wide">Settings Management</span>
                    </div>

                    <div class="p-5 space-y-4">
                        <!-- Settings Status -->
                        <div class="bg-gradient-to-r from-slate-50 to-gray-100 border border-slate-200 rounded-xl p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <span class="text-sm font-semibold text-slate-700">Auto-Save Enabled</span>
                            </div>
                            <p class="text-xs text-slate-600">Your panel positions, sizes, and customizations are automatically saved.</p>
                            <div class="text-xs text-slate-500 mt-2" v-if="lastSaved">Last saved: {{ lastSaved }}</div>
                        </div>

                        <!-- Settings Actions -->
                        <div class="grid grid-cols-2 gap-3">
                            <!-- Export Settings -->
                            <button
                                @click="exportSettings"
                                class="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl px-3 py-3 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                            >
                                <FontAwesomeIcon :icon="faDownload" class="text-sm" />
                                <span class="text-xs font-semibold">Export</span>
                            </button>

                            <!-- Import Settings -->
                            <label
                                class="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl px-3 py-3 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer"
                            >
                                <FontAwesomeIcon :icon="faUpload" class="text-sm" />
                                <span class="text-xs font-semibold">Import</span>
                                <input type="file" accept=".json" @change="importSettings" class="hidden" />
                            </label>
                        </div>

                        <!-- Reset All Settings -->
                        <button
                            @click="resetToDefaults"
                            class="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl px-4 py-3 flex items-center gap-2 justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                        >
                            <FontAwesomeIcon :icon="faTrash" class="text-sm" />
                            <span class="text-sm font-semibold">Reset All Settings</span>
                        </button>

                        <!-- Info -->
                        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3">
                            <div class="text-xs text-blue-700 font-medium mb-1">💡 Settings Include:</div>
                            <div class="text-xs text-blue-600 space-y-1">
                                <div>• Panel positions & sizes</div>
                                <div>• Colors & typography</div>
                                <div>• UI preferences</div>
                                <div>• Timer settings</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Floating Excalidraw Toggle Button -->
        <div class="fixed bottom-6 right-6 z-[1000]">
            <button
                @click="toggleExcalidraw"
                :class="{
                    'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-green-200': excalidrawMode,
                    'bg-gradient-to-r from-slate-600 to-gray-600 text-white shadow-gray-200': !excalidrawMode
                }"
                class="w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group relative overflow-hidden border-3 border-white"
                :title="excalidrawMode ? 'Hide Drawing Tools (Ctrl+D)' : 'Show Drawing Tools (Ctrl+D)'"
            >
                <!-- Background animation -->
                <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <!-- Icon -->
                <div class="relative z-10 flex flex-col items-center">
                    <FontAwesomeIcon :icon="excalidrawMode ? faEyeSlash : faPencilAlt" class="text-xl mb-1 transform transition-transform duration-300 group-hover:scale-110" />
                    <span class="text-xs font-semibold">
                        {{ excalidrawMode ? 'Hide' : 'Draw' }}
                    </span>
                </div>

                <!-- Pulse effect when active -->
                <div v-if="excalidrawMode" class="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping"></div>
            </button>
        </div>

        <!-- Drawing Canvas Overlay (inspired by DisplaySet.vue) -->
        <canvas ref="drawingCanvas" class="drawing-canvas" v-show="drawingMode" @mousedown="startDrawing" @mousemove="draw" @mouseup="stopDrawing" @mouseleave="stopDrawing"></canvas>

        <!-- Export Dialog -->
        <div v-if="showExportDialog" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click="showExportDialog = false">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100" @click.stop>
                <!-- Header -->
                <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <FontAwesomeIcon :icon="faDesktopAlt" class="text-lg" />
                        </div>
                        <h3 class="text-xl font-bold tracking-wide">Export Board</h3>
                    </div>
                    <button @click="showExportDialog = false" class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
                        <FontAwesomeIcon :icon="faChevronRight" class="text-sm rotate-45" />
                    </button>
                </div>

                <!-- Body -->
                <div class="p-6 space-y-6">
                    <!-- Format Selection -->
                    <div class="space-y-2">
                        <label class="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <FontAwesomeIcon :icon="faDesktopAlt" class="text-indigo-600" />
                            Export Format
                        </label>
                        <select
                            v-model="exportFormat"
                            class="w-full px-4 py-3 bg-gradient-to-r from-slate-50 to-gray-100 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                        >
                            <option value="png">🖼️ PNG Image</option>
                            <option value="svg">🎨 SVG Vector</option>
                            <option value="json">📄 JSON Data</option>
                            <option value="pdf">📋 PDF Document</option>
                        </select>
                    </div>

                    <!-- Quality Selection -->
                    <div class="space-y-2">
                        <label class="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <FontAwesomeIcon :icon="faSlidersH" class="text-indigo-600" />
                            Export Quality
                        </label>
                        <select
                            v-model="exportQuality"
                            class="w-full px-4 py-3 bg-gradient-to-r from-slate-50 to-gray-100 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                        >
                            <option value="low">⚡ Low (Fast)</option>
                            <option value="medium">⚖️ Medium</option>
                            <option value="high">💎 High (Slow)</option>
                        </select>
                    </div>

                    <!-- Include Background Toggle -->
                    <div class="bg-gradient-to-r from-slate-50 to-gray-100 border border-gray-200 rounded-xl p-4">
                        <label class="flex items-center justify-between cursor-pointer">
                            <div class="flex items-center gap-3">
                                <FontAwesomeIcon :icon="faEye" class="text-indigo-600" />
                                <div>
                                    <div class="text-sm font-semibold text-gray-700">Include Background</div>
                                    <div class="text-xs text-gray-500">Export with board background</div>
                                </div>
                            </div>
                            <div class="relative">
                                <input type="checkbox" v-model="includeBackground" class="sr-only" />
                                <div class="w-12 h-6 bg-gray-300 rounded-full transition-colors duration-200" :class="{ 'bg-indigo-500': includeBackground }">
                                    <div class="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 translate-x-0.5 translate-y-0.5" :class="{ 'translate-x-6': includeBackground }"></div>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Footer -->
                <div class="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3">
                    <button
                        @click="showExportDialog = false"
                        class="flex-1 bg-gradient-to-r from-gray-400 to-slate-500 hover:from-gray-500 hover:to-slate-600 text-white rounded-xl px-4 py-3 flex items-center gap-2 justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg font-semibold text-sm"
                    >
                        <FontAwesomeIcon :icon="faChevronLeft" />
                        Cancel
                    </button>
                    <button
                        @click="performExport"
                        :disabled="exporting"
                        class="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl px-4 py-3 flex items-center gap-2 justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-sm"
                    >
                        <FontAwesomeIcon v-if="exporting" :icon="faClock" class="animate-spin" />
                        <FontAwesomeIcon v-else :icon="faDesktopAlt" />
                        {{ exporting ? 'Exporting...' : 'Export' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Save Dialog -->
        <div v-if="showSaveDialog" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click="showSaveDialog = false">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100" @click.stop>
                <!-- Header -->
                <div class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <FontAwesomeIcon :icon="faClipboard" class="text-lg" />
                        </div>
                        <h3 class="text-xl font-bold tracking-wide">Save Board</h3>
                    </div>
                    <button @click="showSaveDialog = false" class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110">
                        <FontAwesomeIcon :icon="faChevronRight" class="text-sm rotate-45" />
                    </button>
                </div>

                <!-- Body -->
                <div class="p-6 space-y-6">
                    <!-- Board Name Input -->
                    <div class="space-y-2">
                        <label for="boardName" class="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <FontAwesomeIcon :icon="faBook" class="text-emerald-600" />
                            Board Name
                        </label>
                        <input
                            id="boardName"
                            type="text"
                            v-model="boardName"
                            placeholder="Enter a memorable board name..."
                            class="w-full px-4 py-3 bg-gradient-to-r from-slate-50 to-gray-100 border-2 border-gray-200 rounded-xl text-sm font-medium placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                            maxlength="50"
                        />
                        <div class="text-xs text-gray-500 text-right">{{ boardName?.length || 0 }}/50</div>
                    </div>

                    <!-- Description Input -->
                    <div class="space-y-2">
                        <label for="boardDescription" class="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <FontAwesomeIcon :icon="faBookOpen" class="text-emerald-600" />
                            Description <span class="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            id="boardDescription"
                            v-model="boardDescription"
                            placeholder="Brief description of the board content and purpose..."
                            class="w-full px-4 py-3 bg-gradient-to-r from-slate-50 to-gray-100 border-2 border-gray-200 rounded-xl text-sm font-medium placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 resize-none"
                            rows="3"
                            maxlength="200"
                        ></textarea>
                        <div class="text-xs text-gray-500 text-right">{{ boardDescription?.length || 0 }}/200</div>
                    </div>

                    <!-- Save Info Card -->
                    <div class="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FontAwesomeIcon :icon="faClipboard" class="text-emerald-600 text-sm" />
                            </div>
                            <div class="text-sm">
                                <div class="font-semibold text-emerald-800">Save Information</div>
                                <div class="text-emerald-600 mt-1">Board will be saved with current question state, drawing content, and all visual configurations.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3">
                    <button
                        @click="showSaveDialog = false"
                        class="flex-1 bg-gradient-to-r from-gray-400 to-slate-500 hover:from-gray-500 hover:to-slate-600 text-white rounded-xl px-4 py-3 flex items-center gap-2 justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg font-semibold text-sm"
                    >
                        <FontAwesomeIcon :icon="faChevronLeft" />
                        Cancel
                    </button>
                    <button
                        @click="performSave"
                        :disabled="!boardName || saving"
                        class="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl px-4 py-3 flex items-center gap-2 justify-center transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-sm"
                    >
                        <FontAwesomeIcon v-if="saving" :icon="faClock" class="animate-spin" />
                        <FontAwesomeIcon v-else :icon="faClipboard" />
                        {{ saving ? 'Saving...' : 'Save Board' }}
                    </button>
                </div>
            </div>
        </div>
        </div> <!-- End main-board-content -->
    </div> <!-- End modern-digital-board -->
</template>
<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { apiClient } from '@/service/apiService';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
    faChalkboardTeacher,
    faChevronLeft,
    faChevronRight,
    faExpand,
    faCompress,
    faPlay,
    faPause,
    faRedo,
    faClock,
    faEye,
    faEyeSlash,
    faEraser,
    faClipboard,
    faDesktopAlt,
    faSlidersH,
    faBook,
    faBookOpen,
    faCompass,
    faCheck,
    faSearchPlus,
    faSearchMinus,
    faPencilAlt,
    faCog,
    faDownload,
    faUpload,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import '@excalidraw/excalidraw/index.css';
import CustomAdStrip from './CustomAdStrip.vue';

// Route and utilities
const route = useRoute();
const toast = useToast();

const adEditMode = ref(false);

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

// Question Management State (from DisplaySet.vue)
const setId = ref(route.params.id);
const mirror_key = ref(null);
const currentLanguage = ref('en');
const currentIndex = ref(0);
const currentPage = ref(0);
const questionsPerPage = ref(10);
const selectedOption = ref(null);
const showAnswer = ref(false);
const showSolution = ref(false);
const userAnswers = ref([]);

// Subject Filter State
const selectedSubject = ref('');
const allQuestions = ref([]);
const questions = ref([
    {
        id: 1,
        question: {
            text: {
                en: 'What is the primary function of the mitochondria in a cell?',
                hi: 'कोशिका में माइटोकॉन्ड्रिया का प्राथमिक कार्य क्या है?'
            }
        },
        options: [
            { text: { en: 'Protein synthesis', hi: 'प्रोटीन संश्लेषण' } },
            { text: { en: 'Energy production', hi: 'ऊर्जा उत्पादन' } },
            { text: { en: 'Cell division', hi: 'कोशिका विभाजन' } },
            { text: { en: 'Waste elimination', hi: 'अपशिष्ट उन्मूलन' } }
        ],
        marks: 1,
        negative_mark: 0.25,
        correct_answer: 1,
        explanation: {
            en: 'Mitochondria are known as the powerhouses of the cell.',
            hi: 'माइटोकॉन्ड्रिया को कोशिका का पावरहाउस कहा जाता है।'
        },
        image: null
    }
]);

// Timer State (from DisplaySet.vue)
const timerInterval = ref(null);
const timerActive = ref(false);
const currentQuestionTime = ref(30);
const examMeta = ref({ timePerQuestion: 30 });
const showTimer = ref(true);
const timerFeatureEnabled = ref(false); // Default to false, timer hidden until user enables

function handleAdEditModeChanged(isEditing) {
    adEditMode.value = isEditing;
}

// Time selection options
const timeOptions = ref([
    { label: '15sec', value: 15, icon: '⏱️' },
    { label: '30sec', value: 30, icon: '⏰' },
    { label: '45sec', value: 45, icon: '⏲️' },
    { label: '1min', value: 60, icon: '🕐' },
    { label: '2min', value: 120, icon: '🕑' },
    { label: '5min', value: 300, icon: '🕔' },
    { label: '15min', value: 900, icon: '🕘' }
]);
const selectedTimeOption = ref(30);

// Board customization (from DisplaySet.vue)
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
const solutionBgColor = ref('#f0fdf4');
const solutionColor = ref('#166534');
const solutionFontSize = ref(16);
const solutionFontWeight = ref('normal');
const solutionFontFamily = ref("'Segoe UI', Tahoma, Geneva, Verdana, sans-serif");

// Floating panel positions (from DisplaySet.vue)
const questionPosition = ref({ x: 50, y: 150 });
const optionsPosition = ref({ x: 50, y: 350 });
const solutionPosition = ref({ x: 550, y: 150 });
const timerPosition = ref({ x: window.innerWidth - 250, y: 50 });
const toolbarPosition = ref({ x: 20, y: 300 });

// Panel sizes
const questionSize = ref({ width: 500, height: 250 });
const optionsSize = ref({ width: 450, height: 320 });
const solutionSize = ref({ width: 480, height: 200 });
const timerSize = ref({ width: 120, height: 120 });

// Default panel sizes for scaling calculations
const defaultQuestionSize = { width: 500, height: 250 };
const defaultOptionsSize = { width: 450, height: 320 };
const defaultSolutionSize = { width: 480, height: 200 };
const defaultTimerSize = { width: 120, height: 120 };

// Panel visibility
const showQuestion = ref(true);
const showOptions = ref(true);
const showControls = ref(true);
const showDrawingTools = ref(true);

// Additional constants from DisplaySet.vue
const fontWeights = ['lighter', 'normal', 'bold', 'bolder'];
const fontSize = ref(18);
const fontFamily = ref("'Segoe UI', Tahoma, Geneva, Verdana, sans-serif");
const zoomLevel = ref(100);

// UI state
const darkMode = ref(false);
const isFullscreen = ref(false);
const showFloatingTools = ref(true);
const showStatusPanel = ref(false);
const excalidrawMode = ref(false); // Controls Excalidraw visibility

// Drawing state (inspired by DisplaySet.vue)
const drawingMode = ref(false);
const currentTool = ref('pen');
const drawingColor = ref('#ff0000');
const brushSize = ref(3);
const isDrawing = ref(false);
const drawingHistory = ref([]);
let drawingContext = null;

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

// Resizing state
let isResizing = false;
let resizingElement = ref(null);
let resizeDirection = ref(null);
let resizeStartData = { x: 0, y: 0, width: 0, height: 0 };

// LocalStorage key for board settings
const STORAGE_KEY = 'modernDigitalBoard_settings';

// Settings that should be persisted
const persistentSettings = {
    // Panel positions
    questionPosition,
    optionsPosition,
    solutionPosition,
    timerPosition,
    toolbarPosition,

    // Panel sizes
    questionSize,
    optionsSize,
    solutionSize,
    timerSize,

    // Panel visibility
    showQuestion,
    showOptions,
    showTimer,
    showControls,

    // Appearance settings
    boardBgColor,
    questionBgColor,
    questionColor,
    questionFontSize,
    questionFontWeight,
    questionFontFamily,
    optionBgColor,
    optionColor,
    optionFontSize,
    optionFontWeight,
    solutionBgColor,
    solutionColor,
    solutionFontSize,
    solutionFontWeight,
    solutionFontFamily,

    // UI settings
    darkMode,
    excalidrawMode,
    drawingMode,
    currentTool,
    drawingColor,
    brushSize,

    // Timer settings
    selectedTimeOption,

    // Display settings
    zoomLevel,
    fontSize,
    fontFamily,
    currentLanguage
};

// Computed properties
const currentQuestion = computed(() => {
    return questions.value[currentIndex.value] || null;
});

const currentQuestionText = computed(() => {
    return currentQuestion.value?.question?.text?.[currentLanguage.value] || '';
});

const currentOptions = computed(() => {
    return currentQuestion.value?.options || [];
});

const correctAnswerIndex = computed(() => {
    if (!currentQuestion.value?.answer) return -1;

    // Convert letter answer (A, B, C, D) to index (0, 1, 2, 3)
    const answerLetter = currentQuestion.value.answer.toUpperCase();
    return answerLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
});

const totalQuestions = computed(() => {
    return questions.value.length;
});

const totalPages = computed(() => {
    return Math.ceil(questions.value.length / questionsPerPage.value);
});

const visibleQuestions = computed(() => {
    const start = currentPage.value * questionsPerPage.value;
    const end = Math.min(start + questionsPerPage.value, questions.value.length);
    return Array.from({ length: end - start }, (_, i) => start + i + 1);
});

const questionStats = computed(() => {
    const answered = userAnswers.value.filter((a) => a !== null && a !== undefined).length;
    return {
        total: totalQuestions.value,
        answered,
        remaining: totalQuestions.value - answered,
        current: currentIndex.value + 1
    };
});

const timerDisplayTime = computed(() => {
    return formatTime(currentQuestionTime.value);
});

const currentAnswer = computed({
    get: () => userAnswers.value[currentIndex.value],
    set: (value) => {
        userAnswers.value[currentIndex.value] = value;
    }
});

// Subject Filter Computed Properties
const availableSubjects = computed(() => {
    const subjects = [...new Set(allQuestions.value.map((q) => q.subject_name).filter((s) => s))];
    return subjects.sort();
});

const filteredQuestions = computed(() => {
    if (!selectedSubject.value) {
        return allQuestions.value;
    }
    return allQuestions.value.filter((q) => q.subject_name === selectedSubject.value);
});

// Content scaling computed properties
const questionContentScale = computed(() => {
    const widthScale = questionSize.value.width / defaultQuestionSize.width;
    const heightScale = questionSize.value.height / defaultQuestionSize.height;
    // Use average of both scales for more proportional scaling
    const avgScale = (widthScale + heightScale) / 2;
    return Math.max(0.5, Math.min(avgScale, 2.0)); // Better range for readability
});

const optionsContentScale = computed(() => {
    const widthScale = optionsSize.value.width / defaultOptionsSize.width;
    const heightScale = optionsSize.value.height / defaultOptionsSize.height;
    // Use average of both scales for more proportional scaling
    const avgScale = (widthScale + heightScale) / 2;
    return Math.max(0.5, Math.min(avgScale, 2.0)); // Better range for readability
});

const solutionContentScale = computed(() => {
    const widthScale = solutionSize.value.width / defaultSolutionSize.width;
    const heightScale = solutionSize.value.height / defaultSolutionSize.height;
    // Use average of both scales for more proportional scaling
    const avgScale = (widthScale + heightScale) / 2;
    return Math.max(0.5, Math.min(avgScale, 2.0)); // Better range for readability
});

const questionDynamicStyles = computed(() => ({
    fontSize: Math.round(questionFontSize.value * questionContentScale.value) + 'px',
    padding: Math.round(16 * questionContentScale.value) + 'px',
    lineHeight: (1.4 + questionContentScale.value * 0.2).toFixed(2),
    gap: Math.round(8 * questionContentScale.value) + 'px'
}));

const optionsDynamicStyles = computed(() => ({
    fontSize: Math.round(optionFontSize.value * optionsContentScale.value) + 'px',
    padding: Math.round(12 * optionsContentScale.value) + 'px',
    lineHeight: (1.4 + optionsContentScale.value * 0.2).toFixed(2),
    gap: Math.round(6 * optionsContentScale.value) + 'px'
}));

const solutionDynamicStyles = computed(() => ({
    fontSize: Math.round(solutionFontSize.value * solutionContentScale.value) + 'px',
    padding: Math.round(12 * solutionContentScale.value) + 'px',
    lineHeight: (1.4 + solutionContentScale.value * 0.2).toFixed(2),
    gap: Math.round(6 * solutionContentScale.value) + 'px'
}));

// Timer computed properties
const timerSvgSize = computed(() => Math.min(timerSize.value.width, timerSize.value.height) - 10);
const timerRadius = computed(() => timerSvgSize.value / 2 - 15);
const timerStrokeWidth = computed(() => Math.max(2, timerSvgSize.value / 30));
const timerCircumference = computed(() => 2 * Math.PI * timerRadius.value);
const timerOffset = computed(() => {
    if (currentQuestionTime.value <= 0) return timerCircumference.value;
    const progress = currentQuestionTime.value / examMeta.value.timePerQuestion;
    return timerCircumference.value * (1 - progress);
});
const circularTimerStyles = computed(() => ({
    width: timerSize.value.width + 'px',
    height: timerSize.value.height + 'px'
}));

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

        // Create Excalidraw element with minimal configuration to show default toolbar
        const excalidrawElement = React.createElement(Excalidraw, {
            initialData: {
                elements: [],
                appState: {
                    theme: darkMode.value ? 'dark' : 'light',
                    viewBackgroundColor: darkMode.value ? '#1e1e1e' : '#ffffff'
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
    // Don't start dragging if clicking on resize handles or buttons
    if (event.target.closest('.resize-handle') || event.target.closest('.tool-btn') || event.target.closest('.option') || event.target.closest('.timer-btn')) return;

    event.preventDefault();
    event.stopPropagation();

    isDragging = true;
    draggingElement.value = elementType;

    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();

    // Handle both mouse and touch events
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    dragOffset.x = clientX - rect.left;
    dragOffset.y = clientY - rect.top;

    // Add both mouse and touch event listeners
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', stopDragging);

    element.style.cursor = 'grabbing';
};

const onDrag = (event) => {
    if (!isDragging || !draggingElement.value) return;

    // Prevent default for touch events to avoid scrolling
    if (event.type === 'touchmove') {
        event.preventDefault();
    }

    // Handle both mouse and touch events
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const x = clientX - dragOffset.x;
    const y = clientY - dragOffset.y;

    const maxX = window.innerWidth - 100; // Allow more room
    const maxY = window.innerHeight - 100; // Allow more room

    const boundedX = Math.max(0, Math.min(x, maxX));
    const boundedY = Math.max(0, Math.min(y, maxY));

    if (draggingElement.value === 'question') {
        questionPosition.value = { x: boundedX, y: boundedY };
    } else if (draggingElement.value === 'options') {
        optionsPosition.value = { x: boundedX, y: boundedY };
    } else if (draggingElement.value === 'solution') {
        solutionPosition.value = { x: boundedX, y: boundedY };
    } else if (draggingElement.value === 'timer') {
        timerPosition.value = { x: boundedX, y: boundedY };
    } else if (draggingElement.value === 'toolbar') {
        toolbarPosition.value = { x: boundedX, y: boundedY };
    }
};

const stopDragging = () => {
    isDragging = false;
    draggingElement.value = null;
    dragOffset = { x: 0, y: 0 };

    // Remove both mouse and touch event listeners
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDragging);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDragging);
};

// Resizing functionality
const startResizing = (elementType, direction, event) => {
    event.preventDefault();
    event.stopPropagation();

    isResizing = true;
    resizingElement.value = elementType;
    resizeDirection.value = direction;

    const currentSize = elementType === 'question' ? questionSize.value : elementType === 'options' ? optionsSize.value : elementType === 'solution' ? solutionSize.value : timerSize.value;

    // Handle both mouse and touch events
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    resizeStartData = {
        x: clientX,
        y: clientY,
        width: currentSize.width,
        height: currentSize.height
    };

    // Add both mouse and touch event listeners
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', stopResizing);
    document.addEventListener('touchmove', onResize, { passive: false });
    document.addEventListener('touchend', stopResizing);

    event.currentTarget.style.cursor = direction === 'right' ? 'ew-resize' : direction === 'bottom' ? 'ns-resize' : 'nwse-resize';
};

const onResize = (event) => {
    if (!isResizing || !resizingElement.value || !resizeDirection.value) return;

    // Prevent default for touch events to avoid scrolling
    if (event.type === 'touchmove') {
        event.preventDefault();
    }

    // Handle both mouse and touch events
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const deltaX = clientX - resizeStartData.x;
    const deltaY = clientY - resizeStartData.y;

    // Different constraints for timer (square and smaller)
    let minWidth, minHeight, maxWidth, maxHeight;

    if (resizingElement.value === 'timer') {
        minWidth = 80;
        minHeight = 80;
        maxWidth = 300;
        maxHeight = 300;
    } else {
        minWidth = 200;
        minHeight = 100;
        maxWidth = window.innerWidth - 20;
        maxHeight = window.innerHeight - 50;
    }

    let newWidth = resizeStartData.width;
    let newHeight = resizeStartData.height;

    if (resizeDirection.value === 'right' || resizeDirection.value === 'corner') {
        newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStartData.width + deltaX));
    }

    if (resizeDirection.value === 'bottom' || resizeDirection.value === 'corner') {
        newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStartData.height + deltaY));
    }

    // For timer, keep it square when resizing corner
    if (resizingElement.value === 'timer' && resizeDirection.value === 'corner') {
        const size = Math.min(newWidth, newHeight);
        newWidth = size;
        newHeight = size;
    }

    if (resizingElement.value === 'question') {
        questionSize.value = { width: newWidth, height: newHeight };
    } else if (resizingElement.value === 'options') {
        optionsSize.value = { width: newWidth, height: newHeight };
    } else if (resizingElement.value === 'solution') {
        solutionSize.value = { width: newWidth, height: newHeight };
    } else if (resizingElement.value === 'timer') {
        timerSize.value = { width: newWidth, height: newHeight };
    }
};

const stopResizing = () => {
    isResizing = false;
    resizingElement.value = null;
    resizeDirection.value = null;
    resizeStartData = { x: 0, y: 0, width: 0, height: 0 };

    // Remove both mouse and touch event listeners
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', stopResizing);
    document.removeEventListener('touchmove', onResize);
    document.removeEventListener('touchend', stopResizing);
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
        // Enter fullscreen
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        isFullscreen.value = true;
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        isFullscreen.value = false;
    }
};

const toggleExcalidraw = () => {
    excalidrawMode.value = !excalidrawMode.value;

    // Add visual feedback
    const excalidrawContainer = document.querySelector('.excalidraw-container');
    if (excalidrawContainer) {
        if (excalidrawMode.value) {
            excalidrawContainer.classList.add('excalidraw-fade-in');
            setTimeout(() => {
                excalidrawContainer.classList.remove('excalidraw-fade-in');
            }, 300);
        } else {
            excalidrawContainer.classList.add('excalidraw-fade-out');
            setTimeout(() => {
                excalidrawContainer.classList.remove('excalidraw-fade-out');
            }, 300);
        }
    }

    // Show toast notification
    toast.add({
        severity: excalidrawMode.value ? 'success' : 'info',
        summary: excalidrawMode.value ? 'Drawing Mode Enabled' : 'Drawing Mode Disabled',
        detail: excalidrawMode.value ? 'Excalidraw tools are now active' : 'Excalidraw tools are now hidden',
        life: 2000
    });
};

// Listen for fullscreen changes to sync the state
const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement;
};

onMounted(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    // Load saved settings on component mount
    loadSettings();

    // Initialize the board after settings are loaded
    nextTick(() => {
        initializeBoard();
    });
});

onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('msfullscreenchange', handleFullscreenChange);
});

// Auto-save functionality
const autoSave = (elements, appState) => {
    try {
        const autoSaveData = {
            elements: elements || [],
            appState: appState || {},
            timestamp: Date.now()
        };
        localStorage.setItem('board-autosave', JSON.stringify(autoSaveData));
        lastSaved.value = new Date().toLocaleTimeString();
    } catch (error) {
        console.error('Auto-save failed:', error);
    }
};

// Load settings from localStorage
const loadSettings = () => {
    try {
        const savedSettings = localStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);

            // Validate settings structure
            if (!settings || typeof settings !== 'object') {
                console.warn('Invalid settings format, using defaults');
                return;
            }

            // Restore panel positions with bounds checking
            const maxX = window.innerWidth - 100;
            const maxY = window.innerHeight - 100;

            if (settings.questionPosition && typeof settings.questionPosition === 'object') {
                questionPosition.value = {
                    x: Math.max(0, Math.min(settings.questionPosition.x || 50, maxX)),
                    y: Math.max(0, Math.min(settings.questionPosition.y || 150, maxY))
                };
            }
            if (settings.optionsPosition && typeof settings.optionsPosition === 'object') {
                optionsPosition.value = {
                    x: Math.max(0, Math.min(settings.optionsPosition.x || 50, maxX)),
                    y: Math.max(0, Math.min(settings.optionsPosition.y || 350, maxY))
                };
            }
            if (settings.solutionPosition && typeof settings.solutionPosition === 'object') {
                solutionPosition.value = {
                    x: Math.max(0, Math.min(settings.solutionPosition.x || 550, maxX)),
                    y: Math.max(0, Math.min(settings.solutionPosition.y || 150, maxY))
                };
            }
            if (settings.timerPosition && typeof settings.timerPosition === 'object') {
                timerPosition.value = {
                    x: Math.max(0, Math.min(settings.timerPosition.x || window.innerWidth - 250, maxX)),
                    y: Math.max(0, Math.min(settings.timerPosition.y || 50, maxY))
                };
            }
            if (settings.toolbarPosition && typeof settings.toolbarPosition === 'object') {
                toolbarPosition.value = {
                    x: Math.max(0, Math.min(settings.toolbarPosition.x || 20, maxX)),
                    y: Math.max(0, Math.min(settings.toolbarPosition.y || 300, maxY))
                };
            }

            // Restore panel sizes with validation
            if (settings.questionSize && typeof settings.questionSize === 'object' && settings.questionSize.width && settings.questionSize.height) {
                questionSize.value = {
                    width: Math.max(200, Math.min(settings.questionSize.width, window.innerWidth - 20)),
                    height: Math.max(100, Math.min(settings.questionSize.height, window.innerHeight - 50))
                };
            }
            if (settings.optionsSize && typeof settings.optionsSize === 'object' && settings.optionsSize.width && settings.optionsSize.height) {
                optionsSize.value = {
                    width: Math.max(200, Math.min(settings.optionsSize.width, window.innerWidth - 20)),
                    height: Math.max(100, Math.min(settings.optionsSize.height, window.innerHeight - 50))
                };
            }
            if (settings.solutionSize && typeof settings.solutionSize === 'object' && settings.solutionSize.width && settings.solutionSize.height) {
                solutionSize.value = {
                    width: Math.max(200, Math.min(settings.solutionSize.width, window.innerWidth - 20)),
                    height: Math.max(100, Math.min(settings.solutionSize.height, window.innerHeight - 50))
                };
            }
            if (settings.timerSize && typeof settings.timerSize === 'object' && settings.timerSize.width && settings.timerSize.height) {
                timerSize.value = {
                    width: Math.max(80, Math.min(settings.timerSize.width, 300)),
                    height: Math.max(80, Math.min(settings.timerSize.height, 300))
                };
            }

            // Restore panel visibility
            if (settings.showQuestion !== undefined) showQuestion.value = settings.showQuestion;
            if (settings.showOptions !== undefined) showOptions.value = settings.showOptions;
            if (settings.showTimer !== undefined) showTimer.value = settings.showTimer;
            if (settings.timerFeatureEnabled !== undefined) timerFeatureEnabled.value = settings.timerFeatureEnabled;
            if (settings.showControls !== undefined) showControls.value = settings.showControls;

            // Restore appearance settings
            if (settings.boardBgColor) boardBgColor.value = settings.boardBgColor;
            if (settings.questionBgColor) questionBgColor.value = settings.questionBgColor;
            if (settings.questionColor) questionColor.value = settings.questionColor;
            if (settings.questionFontSize) questionFontSize.value = settings.questionFontSize;
            if (settings.questionFontWeight) questionFontWeight.value = settings.questionFontWeight;
            if (settings.questionFontFamily) questionFontFamily.value = settings.questionFontFamily;
            if (settings.optionBgColor) optionBgColor.value = settings.optionBgColor;
            if (settings.optionColor) optionColor.value = settings.optionColor;
            if (settings.optionFontSize) optionFontSize.value = settings.optionFontSize;
            if (settings.optionFontWeight) optionFontWeight.value = settings.optionFontWeight;
            if (settings.solutionBgColor) solutionBgColor.value = settings.solutionBgColor;
            if (settings.solutionColor) solutionColor.value = settings.solutionColor;
            if (settings.solutionFontSize) solutionFontSize.value = settings.solutionFontSize;
            if (settings.solutionFontWeight) solutionFontWeight.value = settings.solutionFontWeight;
            if (settings.solutionFontFamily) solutionFontFamily.value = settings.solutionFontFamily;

            // Restore UI settings
            if (settings.darkMode !== undefined) darkMode.value = settings.darkMode;
            if (settings.excalidrawMode !== undefined) excalidrawMode.value = settings.excalidrawMode;
            if (settings.drawingMode !== undefined) drawingMode.value = settings.drawingMode;
            if (settings.currentTool) currentTool.value = settings.currentTool;
            if (settings.drawingColor) drawingColor.value = settings.drawingColor;
            if (settings.brushSize) brushSize.value = settings.brushSize;

            // Restore timer settings
            if (settings.selectedTimeOption) selectedTimeOption.value = settings.selectedTimeOption;

            // Restore display settings
            if (settings.zoomLevel) zoomLevel.value = settings.zoomLevel;
            if (settings.fontSize) fontSize.value = settings.fontSize;
            if (settings.fontFamily) fontFamily.value = settings.fontFamily;
            if (settings.currentLanguage) currentLanguage.value = settings.currentLanguage;

            console.log('✅ Settings loaded from localStorage');
        }
    } catch (error) {
        console.error('❌ Failed to load settings from localStorage:', error);
    }
};

// Save settings to localStorage
const saveSettings = () => {
    try {
        const settings = {
            // Panel positions
            questionPosition: questionPosition.value,
            optionsPosition: optionsPosition.value,
            solutionPosition: solutionPosition.value,
            timerPosition: timerPosition.value,
            toolbarPosition: toolbarPosition.value,

            // Panel sizes
            questionSize: questionSize.value,
            optionsSize: optionsSize.value,
            solutionSize: solutionSize.value,
            timerSize: timerSize.value,

            // Panel visibility
            showQuestion: showQuestion.value,
            showOptions: showOptions.value,
            showTimer: showTimer.value,
            timerFeatureEnabled: timerFeatureEnabled.value,
            showControls: showControls.value,

            // Appearance settings
            boardBgColor: boardBgColor.value,
            questionBgColor: questionBgColor.value,
            questionColor: questionColor.value,
            questionFontSize: questionFontSize.value,
            questionFontWeight: questionFontWeight.value,
            questionFontFamily: questionFontFamily.value,
            optionBgColor: optionBgColor.value,
            optionColor: optionColor.value,
            optionFontSize: optionFontSize.value,
            optionFontWeight: optionFontWeight.value,
            solutionBgColor: solutionBgColor.value,
            solutionColor: solutionColor.value,
            solutionFontSize: solutionFontSize.value,
            solutionFontWeight: solutionFontWeight.value,
            solutionFontFamily: solutionFontFamily.value,

            // UI settings
            darkMode: darkMode.value,
            excalidrawMode: excalidrawMode.value,
            drawingMode: drawingMode.value,
            currentTool: currentTool.value,
            drawingColor: drawingColor.value,
            brushSize: brushSize.value,

            // Timer settings
            selectedTimeOption: selectedTimeOption.value,

            // Display settings
            zoomLevel: zoomLevel.value,
            fontSize: fontSize.value,
            fontFamily: fontFamily.value,
            currentLanguage: currentLanguage.value,

            // Metadata
            lastSaved: Date.now(),
            version: '1.0'
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        console.log('✅ Settings saved to localStorage');
    } catch (error) {
        console.error('❌ Failed to save settings to localStorage:', error);
    }
};

// Debounced save function to avoid excessive saves
let saveTimeout = null;
const debouncedSaveSettings = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveSettings, 500); // Save after 500ms of no changes
};

// Reset settings to defaults and clear localStorage
const resetToDefaults = () => {
    // Confirm before resetting
    if (!confirm('Are you sure you want to reset ALL settings to defaults? This will clear all your customizations including panel positions, colors, and preferences.')) {
        return;
    }

    try {
        // Clear localStorage
        localStorage.removeItem(STORAGE_KEY);

        // Reset all settings to default values
        resetDefaults();

        console.log('✅ Settings reset to defaults and localStorage cleared');

        // Show success toast
        toast.add({
            severity: 'success',
            summary: 'Settings Reset',
            detail: 'All settings have been reset to default values',
            life: 3000
        });
    } catch (error) {
        console.error('❌ Failed to reset settings:', error);
        toast.add({
            severity: 'error',
            summary: 'Reset Failed',
            detail: 'Failed to reset settings to defaults',
            life: 3000
        });
    }
};

// Export settings as downloadable JSON file
const exportSettings = () => {
    try {
        const settings = localStorage.getItem(STORAGE_KEY);
        if (!settings) {
            toast.add({
                severity: 'warn',
                summary: 'No Settings',
                detail: 'No saved settings found to export',
                life: 3000
            });
            return;
        }

        const dataStr = JSON.stringify(JSON.parse(settings), null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `digital-board-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.add({
            severity: 'success',
            summary: 'Settings Exported',
            detail: 'Settings have been downloaded as JSON file',
            life: 3000
        });
    } catch (error) {
        console.error('❌ Failed to export settings:', error);
        toast.add({
            severity: 'error',
            summary: 'Export Failed',
            detail: 'Failed to export settings',
            life: 3000
        });
    }
};

// Import settings from JSON file
const importSettings = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const settings = JSON.parse(e.target.result);

            // Validate the settings object has expected structure
            if (!settings.version || !settings.lastSaved) {
                throw new Error('Invalid settings file format');
            }

            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

            // Reload settings
            loadSettings();

            toast.add({
                severity: 'success',
                summary: 'Settings Imported',
                detail: 'Settings have been successfully imported and applied',
                life: 3000
            });
        } catch (error) {
            console.error('❌ Failed to import settings:', error);
            toast.add({
                severity: 'error',
                summary: 'Import Failed',
                detail: 'Invalid settings file or corrupted data',
                life: 3000
            });
        }
    };
    reader.readAsText(file);

    // Reset the input
    event.target.value = '';
};

// Question Management Methods (from DisplaySet.vue)
const loadQuestions = async () => {
    try {
        loading.value = true;
        loadingMessage.value = 'Loading questions...';

        const response = await apiClient.get(`/admin/digital-board/questions/${setId.value}`);
        if (response.data.data) {
            // Store all questions with subject information
            allQuestions.value = response.data.data.map((q) => ({
                ...q.formattedQuestion,
                subject_name: q.subject_name,
                subject_id: q.subject_id,
                chapter_name: q.chapter_name
            }));

            // Initially show all questions (no filter)
            questions.value = allQuestions.value;
            userAnswers.value = new Array(questions.value.length).fill(null);

            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: `${questions.value.length} questions loaded`,
                life: 3000
            });
        }
    } catch (error) {
        console.error('Failed to load questions:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load questions',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const filterBySubject = () => {
    // Update filtered questions based on selected subject
    if (!selectedSubject.value) {
        questions.value = allQuestions.value;
    } else {
        questions.value = allQuestions.value.filter((q) => q.subject_name === selectedSubject.value);
    }

    // Reset navigation state
    currentIndex.value = 0;
    currentPage.value = 0;
    selectedOption.value = null;
    showAnswer.value = false;
    showSolution.value = false;

    // Reset user answers array to match filtered questions length
    userAnswers.value = new Array(questions.value.length).fill(null);

    // Show toast with filter info
    const filterMessage = selectedSubject.value ? `Showing ${questions.value.length} questions from ${selectedSubject.value}` : `Showing all ${questions.value.length} questions`;

    toast.add({
        severity: 'info',
        summary: 'Filter Applied',
        detail: filterMessage,
        life: 3000
    });
};

const nextQuestion = () => {
    if (currentIndex.value < questions.value.length - 1) {
        currentIndex.value++;
        resetQuestionTimer();
        selectedOption.value = userAnswers.value[currentIndex.value] !== undefined ? userAnswers.value[currentIndex.value] : null;
    }
};

const previousQuestion = () => {
    if (currentIndex.value > 0) {
        currentIndex.value--;
        resetQuestionTimer();
        selectedOption.value = userAnswers.value[currentIndex.value] !== undefined ? userAnswers.value[currentIndex.value] : null;
    }
};

const goToQuestion = (index) => {
    if (index >= 0 && index < questions.value.length) {
        currentIndex.value = index;
        currentPage.value = Math.floor(index / questionsPerPage.value);
        resetQuestionTimer();
        startTimer();
        selectedOption.value = userAnswers.value[index] !== undefined ? userAnswers.value[index] : null;
    }
};

const selectOption = (optionIndex) => {
    selectedOption.value = optionIndex;
    userAnswers.value[currentIndex.value] = optionIndex;
    sendToMirror();
};

const clearSelection = () => {
    selectedOption.value = null;
    userAnswers.value[currentIndex.value] = undefined;
};

const toggleAnswer = () => {
    showAnswer.value = !showAnswer.value;
    sendToMirror();
};

const toggleSolution = () => {
    showSolution.value = !showSolution.value;
    sendToMirror();
};

const nextPage = () => {
    if (currentPage.value < totalPages.value - 1) {
        currentPage.value++;
        currentIndex.value = currentPage.value * questionsPerPage.value;
        resetQuestionTimer();
    }
};

const prevPage = () => {
    if (currentPage.value > 0) {
        currentPage.value--;
        currentIndex.value = currentPage.value * questionsPerPage.value;
        resetQuestionTimer();
    }
};

// Timer Methods (from DisplaySet.vue)
const startTimer = () => {
    if (!timerActive.value && timerFeatureEnabled.value) {
        showTimer.value = true;
        timerActive.value = true;
        timerInterval.value = setInterval(() => {
            if (currentQuestionTime.value > 0) {
                currentQuestionTime.value--;
            } else {
                pauseTimer();
                // Delay hiding the timer to show "00:00" for a moment
                setTimeout(() => {
                    if (timerFeatureEnabled.value) {
                        showTimer.value = false;
                    }
                }, 1000);
            }
        }, 1000);
    } else if (!timerFeatureEnabled.value) {
        // Show message if timer feature is disabled
        toast.add({
            severity: 'warn',
            summary: 'Timer Disabled',
            detail: 'Please enable timer feature first',
            life: 2000
        });
    }
};

const pauseTimer = () => {
    timerActive.value = false;
    if (timerInterval.value) {
        clearInterval(timerInterval.value);
        timerInterval.value = null;
    }
};

const resetQuestionTimer = () => {
    currentQuestionTime.value = examMeta.value.timePerQuestion || 30;
    pauseTimer();

    // Only show timer if timer feature is enabled
    if (timerFeatureEnabled.value) {
        showTimer.value = true;

        // Add bounce-in animation when timer reappears
        setTimeout(() => {
            const timerElement = document.querySelector('.question-timer');
            if (timerElement) {
                timerElement.classList.add('timer-bounce-in');
                setTimeout(() => {
                    timerElement.classList.remove('timer-bounce-in');
                }, 600);
            }
        }, 50);
    } else {
        // Show message if timer feature is disabled
        toast.add({
            severity: 'info',
            summary: 'Timer Reset',
            detail: 'Timer reset but feature is disabled',
            life: 2000
        });
    }
};

// Time selection function
const selectTimeOption = (timeValue) => {
    selectedTimeOption.value = timeValue;
    examMeta.value.timePerQuestion = timeValue;
    currentQuestionTime.value = timeValue;
    pauseTimer(); // Stop any running timer

    // Only show timer if timer feature is enabled
    if (timerFeatureEnabled.value) {
        showTimer.value = true;

        // Visual feedback - briefly highlight the selected option and animate timer in
        setTimeout(() => {
            // Add a brief animation class for the timer when it appears
            const timerElement = document.querySelector('.question-timer');
            if (timerElement) {
                timerElement.classList.add('timer-bounce-in');
                setTimeout(() => {
                    timerElement.classList.remove('timer-bounce-in');
                }, 600);
            }
        }, 100);
    }
};

const toggleTimerVisibility = () => {
    // Toggle master timer feature enabled state
    timerFeatureEnabled.value = !timerFeatureEnabled.value;

    // When enabling timer feature, also enable showTimer
    if (timerFeatureEnabled.value) {
        showTimer.value = true;
    } else {
        // When disabling timer feature, pause any active timer
        pauseTimer();
    }

    // Save the timerFeatureEnabled state immediately to persist across refreshes
    saveSettings();

    // Add animation effect when showing timer
    if (timerFeatureEnabled.value && showTimer.value) {
        setTimeout(() => {
            const timerElement = document.querySelector('.question-timer');
            if (timerElement) {
                timerElement.classList.add('timer-fade-in');
                setTimeout(() => {
                    timerElement.classList.remove('timer-fade-in');
                }, 300);
            }
        }, 50);
    }

    // Show toast message
    toast.add({
        severity: 'info',
        summary: 'Timer Feature',
        detail: timerFeatureEnabled.value ? 'Timer feature enabled - will persist after refresh' : 'Timer feature disabled',
        life: 3000
    });
};

const toggleTimer = () => {
    if (timerActive.value) {
        pauseTimer();
    } else {
        startTimer();
    }
};

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Mirror Functionality (from DisplaySet.vue)
const sendToMirror = async (data = {}) => {
    try {
        if (mirror_key.value) {
            const mirrorData = {
                mirror_key: mirror_key.value,
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
            };
            await apiClient.post('/admin/digital-board/mirror-the-question', mirrorData);
        }
    } catch (error) {
        console.error('Mirror update failed:', error);
    }
};

const initializeMirror = async () => {
    try {
        // First try to fetch existing mirror key
        const fetchResponse = await apiClient.get(`/admin/digital-board/mirror-key/${setId.value}`);
        if (fetchResponse.data.data?.mirror_key) {
            mirror_key.value = fetchResponse.data.data.mirror_key;
        }
    } catch (error) {
        console.log('No existing mirror key, will create new one if needed');
    }
};

const createMirror = async () => {
    try {
        const response = await apiClient.post('/admin/digital-board/create-mirror', {
            setId: setId.value
        });
        if (response.data.data?.mirror_key) {
            mirror_key.value = response.data.data.mirror_key;
            toast.add({
                severity: 'success',
                summary: 'Mirror Ready',
                detail: 'Screen mirroring activated',
                life: 3000
            });
        }
    } catch (error) {
        console.error('Mirror creation failed:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create mirror',
            life: 3000
        });
    }
};

const copyToClipboard = async () => {
    if (!mirror_key.value) return;

    try {
        await navigator.clipboard.writeText(mirror_key.value);
        toast.add({
            severity: 'success',
            summary: 'Copied!',
            detail: 'Mirror key copied to clipboard',
            life: 2000
        });
    } catch (err) {
        console.error('Failed to copy:', err);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to copy to clipboard',
            life: 3000
        });
    }
};

// Language switching
const switchLanguage = (lang) => {
    currentLanguage.value = lang;
    sendToMirror({ currentLanguage: lang });
};

// Reset all settings to defaults
const resetDefaults = () => {
    // Reset appearance settings
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

    solutionBgColor.value = '#f0fdf4';
    solutionColor.value = '#166534';
    solutionFontSize.value = 16;
    solutionFontWeight.value = 'normal';
    solutionFontFamily.value = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

    // Reset positions to default (with bounds checking)
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;

    questionPosition.value = { x: 50, y: 150 };
    optionsPosition.value = { x: 50, y: 350 };
    solutionPosition.value = { x: Math.min(550, maxX), y: 150 };
    timerPosition.value = { x: Math.min(window.innerWidth - 250, maxX), y: 50 };
    toolbarPosition.value = { x: 20, y: 300 };

    // Reset sizes to default
    questionSize.value = { width: defaultQuestionSize.width, height: defaultQuestionSize.height };
    optionsSize.value = { width: defaultOptionsSize.width, height: defaultOptionsSize.height };
    solutionSize.value = { width: defaultSolutionSize.width, height: defaultSolutionSize.height };
    timerSize.value = { width: defaultTimerSize.width, height: defaultTimerSize.height };

    // Reset panel visibility
    showQuestion.value = true;
    showOptions.value = true;
    showTimer.value = true;
    timerFeatureEnabled.value = false; // Timer feature disabled by default
    showControls.value = true;

    // Reset UI settings
    darkMode.value = false;
    excalidrawMode.value = false;
    drawingMode.value = false;
    currentTool.value = 'pen';
    drawingColor.value = '#ff0000';
    brushSize.value = 3;

    // Reset timer settings
    selectedTimeOption.value = 30;
    examMeta.value.timePerQuestion = 30;

    // Reset display settings
    zoomLevel.value = 100;
    fontSize.value = 18;
    fontFamily.value = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    currentLanguage.value = 'en';

    // Save the reset settings immediately
    debouncedSaveSettings();
};

// Watchers for mirror updates and route changes
watch(
    [currentIndex, showAnswer, showSolution, selectedOption],
    () => {
        sendToMirror();
    },
    { deep: true }
);

watch(
    currentQuestion,
    (newQuestion) => {
        if (newQuestion) {
            sendToMirror();
        }
    },
    { deep: true }
);

watch(
    () => route.params.id,
    (newId) => {
        if (newId) {
            setId.value = newId;
            loadQuestions();
            initializeMirror();
        }
    },
    { immediate: true }
);

// Watch for manual timer input changes to update selected option
watch(
    () => examMeta.value.timePerQuestion,
    (newTime) => {
        currentQuestionTime.value = newTime;
        // Check if the new time matches any preset option
        const matchingOption = timeOptions.value.find((option) => option.value === newTime);
        if (matchingOption) {
            selectedTimeOption.value = newTime;
        } else {
            selectedTimeOption.value = null; // Custom time
        }
    }
);

// Lifecycle
onMounted(() => {
    console.log('Set ID:', setId.value);

    // Load questions and initialize mirror (but don't initialize board yet - that's done after settings load)
    loadQuestions();
    initializeMirror();
    resetQuestionTimer();

    // Initialize selected time option to match default timer value
    selectedTimeOption.value = examMeta.value.timePerQuestion;

    // Initialize drawing canvas
    setTimeout(() => {
        initDrawingCanvas();
    }, 100);

    // Handle window resize to keep elements in bounds
    const handleResize = () => {
        const maxX = window.innerWidth - 100; // More generous boundary
        const maxY = window.innerHeight - 100; // More generous boundary

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

    // Add keyboard shortcut for Excalidraw toggle (Ctrl/Cmd + D)
    const handleKeyDown = (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
            event.preventDefault();
            toggleExcalidraw();
        }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Clean up on unmount
    onUnmounted(() => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('keydown', handleKeyDown);
    });
});

onUnmounted(() => {
    // Save settings one final time before unmounting
    saveSettings();

    // Cleanup timer
    if (timerInterval.value) {
        clearInterval(timerInterval.value);
    }

    // Cleanup Excalidraw
    if (excalidrawAPI.value?.root) {
        excalidrawAPI.value.root.unmount();
    }

    // Cleanup event listeners
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDragging);
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', stopResizing);

    // Clear any pending save timeout
    if (saveTimeout) clearTimeout(saveTimeout);
});

// Watch for changes in panel positions and save them
watch(
    [questionPosition, optionsPosition, solutionPosition, timerPosition, toolbarPosition],
    () => {
        debouncedSaveSettings();
    },
    { deep: true }
);

// Watch for changes in panel sizes and save them
watch(
    [questionSize, optionsSize, solutionSize, timerSize],
    () => {
        debouncedSaveSettings();
    },
    { deep: true }
);

// Watch for changes in panel visibility and save them
watch([showQuestion, showOptions, showTimer, showControls, timerFeatureEnabled], () => {
    debouncedSaveSettings();
});

// Watch for changes in appearance settings and save them
watch(
    [
        boardBgColor,
        questionBgColor,
        questionColor,
        questionFontSize,
        questionFontWeight,
        questionFontFamily,
        optionBgColor,
        optionColor,
        optionFontSize,
        optionFontWeight,
        solutionBgColor,
        solutionColor,
        solutionFontSize,
        solutionFontWeight,
        solutionFontFamily
    ],
    () => {
        debouncedSaveSettings();
    }
);

// Watch for changes in UI settings and save them
watch([darkMode, excalidrawMode, drawingMode, currentTool, drawingColor, brushSize], () => {
    debouncedSaveSettings();
});

// Watch for changes in timer and display settings and save them
watch([selectedTimeOption, zoomLevel, fontSize, fontFamily, currentLanguage], () => {
    debouncedSaveSettings();
});
</script>


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

/* Hide Excalidraw's built-in zoom controls */
/* .modern-digital-board :deep(.excalidraw-zoom) {
  display: none !important;
}

.modern-digital-board :deep(.zoom-actions) {
  display: none !important;
} */

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
    top: 80px; /* Leave space for the ad strip */
    left: 0;
    width: 100vw;
    height: calc(100vh - 80px); /* Subtract ad strip height */
    z-index: 9999;
}

/* Ensure CustomAdStrip stays visible in fullscreen mode */
.fullscreen-ad-strip {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10000;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    min-height: 80px;
    display: flex;
    align-items: center;
}

.excalidraw-container {
    width: 100%;
    height: 100%;
    position: relative;
    transition:
        opacity 0.3s ease,
        transform 0.3s ease;
}

.excalidraw-container.excalidraw-hidden {
    opacity: 0;
    pointer-events: none;
    transform: scale(0.98);
}

.excalidraw-container.excalidraw-fade-in {
    animation: excalidraw-fade-in 0.3s ease-out;
}

.excalidraw-container.excalidraw-fade-out {
    animation: excalidraw-fade-out 0.3s ease-out;
}

@keyframes excalidraw-fade-in {
    from {
        opacity: 0.1;
        transform: scale(0.98);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes excalidraw-fade-out {
    from {
        opacity: 1;
        transform: scale(1);
    }
    to {
        opacity: 0.1;
        transform: scale(0.98);
    }
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

/* Drawing Canvas */
.drawing-canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: auto;
    z-index: 400;
    cursor: crosshair;
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

    .fab {
        bottom: 5rem;
    }

    .fab.fab-secondary {
        bottom: 5rem;
        right: 5rem;
    }
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
        opacity 0.8s ease-out,
        transform 0.8s ease-out,
        visibility 0.8s ease-out,
        box-shadow 0.2s ease;
    opacity: 1;
    transform: scale(1);
    visibility: visible;
    pointer-events: auto;
}
.floating-draggable.question-timer.fade-out {
    opacity: 0;
    transform: scale(0.8);
    pointer-events: none;
    visibility: hidden;
}

.floating-draggable.question-timer.timer-warning {
    border-color: #ff9800;
    animation: pulse-warning 1s ease-in-out infinite alternate;
}

.floating-draggable.question-timer.timer-critical {
    border-color: #f44336;
    animation: pulse-critical 0.5s ease-in-out infinite alternate;
    box-shadow: 0 0 20px rgba(244, 67, 54, 0.5);
}

@keyframes pulse-warning {
    from {
        transform: scale(1);
    }
    to {
        transform: scale(1.05);
    }
}

@keyframes pulse-critical {
    from {
        transform: scale(1);
        box-shadow: 0 0 20px rgba(244, 67, 54, 0.5);
    }
    to {
        transform: scale(1.08);
        box-shadow: 0 0 30px rgba(244, 67, 54, 0.8);
    }
}

.floating-draggable.question-timer.timer-bounce-in {
    animation: bounce-in 0.6s ease-out;
}

@keyframes bounce-in {
    0% {
        transform: scale(0.3);
        opacity: 0;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.8;
    }
    70% {
        transform: scale(0.9);
        opacity: 1;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.floating-draggable.question-timer.timer-fade-in {
    animation: fade-in 0.3s ease-out;
}

@keyframes fade-in {
    0% {
        opacity: 0;
        transform: translateY(-10px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
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

/* Time Option Buttons */
.time-option-btn {
    transition: all 0.2s ease;
    cursor: pointer;
    min-height: 60px;
    font-weight: 600;
    position: relative;
    overflow: hidden;
}

.time-option-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.time-option-btn:active {
    transform: scale(0.98);
}

.time-option-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.6s;
}

.time-option-btn:hover::before {
    left: 100%;
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

/* Glassmorphism Effect */

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

/* Custom Focus Ring */

/* Gradient Text */

/* Modern Card Hover Effect */

/* Loading Shimmer Effect */
@keyframes shimmer {
    0% {
        background-position: -200px 0;
    }
    100% {
        background-position: calc(200px + 100%) 0;
    }
}

/* Neon Glow Effect */

/* Smooth Scale Transition */
</style>
