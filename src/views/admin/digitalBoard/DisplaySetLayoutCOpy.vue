<script>
export default {
    name: 'TeachingBoard',
    data() {
        return {
            currentLanguage: 'en',
            currentIndex: 0,
            currentPage: 0,
            questionsPerPage: 30,
            selectedOption: null,
            showAnswer: false,
            userAnswers: [],
            timerActive: false,
            currentQuestionTime: 0,
            examMeta: {
                timePerQuestion: 60 // seconds
            },
            questions: this.generateSampleQuestions(200) // Generate 200 sample questions
        };
    },
    computed: {
        currentQuestion() {
            return this.questions[this.currentIndex];
        },
        totalPages() {
            return Math.ceil(this.questions.length / this.questionsPerPage);
        },
        visibleQuestions() {
            const start = this.currentPage * this.questionsPerPage;
            const end = Math.min(start + this.questionsPerPage, this.questions.length);
            return Array.from({ length: end - start }, (_, i) => start + i + 1);
        }
    },
    methods: {
        generateSampleQuestions(count) {
            const questions = [];
            const topics = [
                { en: 'Mathematics', hi: 'गणित' },
                { en: 'Science', hi: 'विज्ञान' },
                { en: 'History', hi: 'इतिहास' },
                { en: 'Geography', hi: 'भूगोल' },
                { en: 'English', hi: 'अंग्रेज़ी' }
            ];

            for (let i = 0; i < count; i++) {
                const topic = topics[i % topics.length];
                const qNum = i + 1;

                questions.push({
                    en: {
                        text: `Sample question ${qNum} in ${topic.en}? This is a longer question text to demonstrate how the interface handles multi-line questions in the teaching board.`,
                        options: ['Option A', 'Option B', 'Option C', 'Option D']
                    },
                    hi: {
                        text: `नमूना प्रश्न ${qNum} ${topic.hi} में? यह एक लंबा प्रश्न पाठ है जो यह प्रदर्शित करने के लिए है कि शिक्षण बोर्ड में बहु-पंक्ति प्रश्नों को कैसे संभाला जाता है।`,
                        options: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D']
                    },
                    marks: Math.floor(Math.random() * 3) + 1, // 1-3 marks
                    negative_mark: Math.random() > 0.7 ? 0.25 : 0, // 30% chance of negative marking
                    correct_answer: Math.floor(Math.random() * 4), // 0-3
                    explanation: {
                        en: `This is the teaching explanation for question ${qNum}. You can explain concepts, common mistakes, or additional context here.`,
                        hi: `यह प्रश्न ${qNum} के लिए शिक्षण स्पष्टीकरण है। आप यहां अवधारणाओं, सामान्य गलतियों या अतिरिक्त संदर्भ को समझा सकते हैं।`
                    },
                    image: i % 10 === 0 ? `https://picsum.photos/400/200?random=${i}` : null // 10% chance of image
                });
            }
            return questions;
        },
        selectOption(optionIndex) {
            this.selectedOption = optionIndex;
            this.$set(this.userAnswers, this.currentIndex, optionIndex);
        },
        clearSelection() {
            this.selectedOption = null;
            this.$set(this.userAnswers, this.currentIndex, undefined);
        },
        goToQuestion(index) {
            this.currentIndex = index;
            this.currentPage = Math.floor(index / this.questionsPerPage);
            this.resetTimer();
            this.selectedOption = this.userAnswers[index] !== undefined ? this.userAnswers[index] : null;
        },
        nextPage() {
            if (this.currentPage < this.totalPages - 1) {
                this.currentPage++;
                this.currentIndex = this.currentPage * this.questionsPerPage;
                this.resetTimer();
            }
        },
        prevPage() {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.currentIndex = this.currentPage * this.questionsPerPage;
                this.resetTimer();
            }
        },
        startTimer() {
            if (!this.timerActive) {
                this.timerActive = true;
                this.timerInterval = setInterval(() => {
                    if (this.currentQuestionTime > 0) {
                        this.currentQuestionTime--;
                    } else {
                        clearInterval(this.timerInterval);
                        this.timerActive = false;
                    }
                }, 1000);
            }
        },
        pauseTimer() {
            clearInterval(this.timerInterval);
            this.timerActive = false;
        },
        resetTimer() {
            this.pauseTimer();
            this.currentQuestionTime = this.examMeta.timePerQuestion;
            this.selectedOption = this.userAnswers[this.currentIndex] !== undefined ? this.userAnswers[this.currentIndex] : null;
        },
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
    },
    mounted() {
        this.resetTimer();
    },
    beforeUnmount() {
        clearInterval(this.timerInterval);
    }
};
</script>

<template>
    <div class="h-screen w-screen flex flex-col bg-gray-100 hindi-font full-screen-container" :class="{ 'hindi-active': currentLanguage === 'hi' }">
        <!-- Top Bar -->
        <div class="bg-indigo-800 text-white p-4 flex justify-between items-center">
            <h1 class="text-2xl font-bold">
                {{ currentLanguage === 'en' ? 'Digital Teaching Board' : 'डिजिटल शिक्षण बोर्ड' }}
            </h1>
            <div class="flex items-center space-x-4">
                <div class="flex items-center">
                    <span class="mr-2">{{ currentLanguage === 'en' ? 'Language:' : 'भाषा:' }}</span>
                    <select v-model="currentLanguage" class="bg-indigo-700 text-white p-2 rounded border border-indigo-600">
                        <option value="en">English</option>
                        <option value="hi">हिंदी</option>
                    </select>
                </div>
                <div class="text-xl font-mono bg-indigo-900 px-3 py-1 rounded">Q{{ currentIndex + 1 }}/{{ questions.length }}</div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="flex flex-1 overflow-hidden">
            <!-- Question Display (75%) -->
            <div class="w-3/4 bg-white p-6 overflow-y-auto">
                <div class="max-w-4xl mx-auto">
                    <!-- Question Meta -->
                    <div class="flex justify-between items-center mb-6">
                        <div class="text-sm text-gray-500">
                            {{ currentLanguage === 'en' ? 'Question' : 'प्रश्न' }} {{ currentIndex + 1 }}
                            <span v-if="currentQuestion.marks">
                                | {{ currentLanguage === 'en' ? 'Marks:' : 'अंक:' }} {{ currentQuestion.marks }}
                                <span v-if="currentQuestion.negative_mark > 0"> ({{ currentLanguage === 'en' ? 'Negative:' : 'नकारात्मक:' }} -{{ currentQuestion.negative_mark }}) </span>
                            </span>
                        </div>
                        <div class="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                            {{ formatTime(currentQuestionTime) }}
                        </div>
                    </div>

                    <!-- Question Text -->
                    <div class="text-2xl mb-6 leading-relaxed">
                        {{ currentQuestion[currentLanguage]?.text || currentQuestion.en.text }}
                    </div>

                    <!-- Question Image -->
                    <div v-if="currentQuestion.image" class="mb-8 flex justify-center">
                        <img :src="currentQuestion.image" :alt="currentLanguage === 'en' ? 'Question diagram' : 'प्रश्न आरेख'" class="max-h-64 rounded-lg shadow-md" />
                    </div>

                    <!-- Options -->
                    <div class="space-y-3 mb-8">
                        <div
                            v-for="(option, idx) in currentQuestion[currentLanguage]?.options || currentQuestion.en.options"
                            :key="idx"
                            class="p-4 border-2 rounded-lg cursor-pointer transition-all duration-200"
                            :class="{
                                'border-blue-500 bg-blue-50': selectedOption === idx,
                                'border-gray-200 hover:border-gray-300 hover:bg-gray-50': selectedOption !== idx,
                                'border-green-500 bg-green-50': showAnswer && currentQuestion.correct_answer === idx,
                                'border-red-500 bg-red-50': showAnswer && selectedOption === idx && selectedOption !== currentQuestion.correct_answer
                            }"
                            @click="selectOption(idx)"
                        >
                            <div class="flex items-start">
                                <span class="font-bold mr-3 text-gray-600">{{ String.fromCharCode(65 + idx) }}.</span>
                                <span class="flex-1">{{ option }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Explanation (for teacher) -->
                    <div v-if="currentQuestion.explanation" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <h3 class="font-bold text-yellow-800 mb-2">
                            {{ currentLanguage === 'en' ? 'Teaching Notes:' : 'शिक्षण नोट्स:' }}
                        </h3>
                        <p class="text-yellow-700">
                            {{ currentQuestion.explanation[currentLanguage] || currentQuestion.explanation.en }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Control Panel (25%) -->
            <div class="w-1/4 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto flex flex-col">
                <!-- Timer Controls -->
                <div class="bg-white rounded-lg shadow p-4 mb-4">
                    <h3 class="font-bold text-lg mb-3 text-gray-700">
                        {{ currentLanguage === 'en' ? 'Timer Controls' : 'टाइमर नियंत्रण' }}
                    </h3>
                    <div class="flex space-x-2 mb-3">
                        <button @click="startTimer" class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded" :disabled="timerActive">
                            {{ currentLanguage === 'en' ? 'Start' : 'शुरू' }}
                        </button>
                        <button @click="pauseTimer" class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-3 rounded" :disabled="!timerActive">
                            {{ currentLanguage === 'en' ? 'Pause' : 'रोकें' }}
                        </button>
                        <button @click="resetTimer" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded">
                            {{ currentLanguage === 'en' ? 'Reset' : 'रीसेट' }}
                        </button>
                    </div>
                    <div class="flex items-center">
                        <span class="mr-2 text-sm text-gray-600">
                            {{ currentLanguage === 'en' ? 'Set time:' : 'समय सेट करें:' }}
                        </span>
                        <input v-model="examMeta.timePerQuestion" type="number" min="10" class="w-20 p-1 border rounded text-center" />
                        <span class="ml-1 text-sm text-gray-600">sec</span>
                    </div>
                </div>

                <!-- Answer Controls -->
                <div class="bg-white rounded-lg shadow p-4 mb-4">
                    <h3 class="font-bold text-lg mb-3 text-gray-700">
                        {{ currentLanguage === 'en' ? 'Answer Controls' : 'उत्तर नियंत्रण' }}
                    </h3>
                    <div class="flex space-x-2 mb-3">
                        <button @click="showAnswer = !showAnswer" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded">
                            {{ showAnswer ? (currentLanguage === 'en' ? 'Hide Answer' : 'उत्तर छिपाएं') : currentLanguage === 'en' ? 'Show Answer' : 'उत्तर दिखाएं' }}
                        </button>
                        <button @click="clearSelection" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded">
                            {{ currentLanguage === 'en' ? 'Clear' : 'साफ़ करें' }}
                        </button>
                    </div>
                    <div v-if="showAnswer" class="mt-2 p-2 bg-green-50 rounded text-green-800 text-sm">
                        {{ currentLanguage === 'en' ? 'Correct answer:' : 'सही उत्तर:' }}
                        <span class="font-bold">{{ String.fromCharCode(65 + currentQuestion.correct_answer) }}</span>
                    </div>
                </div>

                <!-- Question Navigation -->
                <div class="bg-white rounded-lg shadow p-4 flex-1">
                    <h3 class="font-bold text-lg mb-3 text-gray-700">
                        {{ currentLanguage === 'en' ? 'Question Navigation' : 'प्रश्न नेविगेशन' }}
                    </h3>

                    <!-- Pagination Controls -->
                    <div class="flex justify-between mb-3">
                        <button @click="prevPage" :disabled="currentPage === 0" class="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded disabled:opacity-50">&lt;</button>
                        <span class="text-gray-600"> {{ currentLanguage === 'en' ? 'Page' : 'पृष्ठ' }} {{ currentPage + 1 }}/{{ totalPages }} </span>
                        <button @click="nextPage" :disabled="currentPage === totalPages - 1" class="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded disabled:opacity-50">&gt;</button>
                    </div>

                    <!-- Question Grid -->
                    <div class="grid grid-cols-5 gap-2">
                        <button
                            v-for="num in visibleQuestions"
                            :key="num"
                            @click="goToQuestion(num - 1)"
                            class="w-full aspect-square flex items-center justify-center rounded border transition-colors"
                            :class="{
                                'bg-indigo-600 text-white border-indigo-700': currentIndex === num - 1,
                                'bg-green-100 border-green-300': userAnswers[num - 1] !== undefined,
                                'bg-white border-gray-300 hover:bg-gray-100': currentIndex !== num - 1 && userAnswers[num - 1] === undefined
                            }"
                        >
                            {{ num }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
/* Hindi font support */
.hindi-font {
    font-family: 'Segoe UI', 'Nirmala UI', sans-serif;
}

.hindi-active {
    font-family: 'Nirmala UI', 'Arial Unicode MS', sans-serif;
}

/* Custom scrollbar */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

.full-screen-container {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}
</style>
