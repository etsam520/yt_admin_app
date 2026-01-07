<script setup>
import { ref, onMounted } from 'vue';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import katex from 'katex';
import axios from 'axios';

const latexRegex = /(\$\$.*?\$\$|\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]|\\begin\{([a-z]*\*?)\}.*?\\end\{\2\}|\\[a-zA-Z]+\{.*?\}|[a-zA-Z0-9]+\^\{?[a-zA-Z0-9]+\}?|\_[a-zA-Z0-9]+|\\frac\{.*?\}\{.*?\}|\\sqrt\{.*?\})/gs;

const questionData = ref({
    question: '',
    questionImage: null,
    options: ['', '', '', ''],
    optionImages: [null, null, null, null],
    correctAnswer: null,
    explanation: '',
    explanationImage: null
});

const preview = ref({
    question: '',
    options: ['', '', '', ''],
    explanation: ''
});

const fullPreview = ref(false);
const savedQuestions = ref([]);
const editingId = ref(null);

const renderLatex = (text) => {
    if (!text) return '';
    return text.replace(latexRegex, (match) => {
        const latexContent = match
            .replace(/^\$\$|\$\$/g, '')
            .replace(/^\$|\$/g, '')
            .replace(/^\\\(|\\\)$/g, '')
            .replace(/^\\\[|\\\]$/g, '')
            .replace(/^\\begin\{equation\}|\\end\{equation\}$/g, '');

        try {
            return katex.renderToString(latexContent, { throwOnError: false });
        } catch (e) {
            console.error('KaTeX error:', e);
            return `<span class="text-red-500">${match}</span>`;
        }
    });
};

const renderPreview = () => {
    preview.value.question = renderLatex(questionData.value.question);
    preview.value.options = questionData.value.options.map((opt) => renderLatex(opt));
    preview.value.explanation = renderLatex(questionData.value.explanation);
};

const renderFullPreview = () => {
    renderPreview();
    fullPreview.value = true;
};

const handleFileUpload = (field, event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        if (field === 'question') {
            questionData.value.questionImage = e.target.result;
        } else if (field.startsWith('option')) {
            const index = parseInt(field.replace('option', ''));
            questionData.value.optionImages[index] = e.target.result;
        } else if (field === 'explanation') {
            questionData.value.explanationImage = e.target.result;
        }
        renderPreview();
    };
    reader.readAsDataURL(file);
};

const removeImage = (field) => {
    if (field === 'question') {
        questionData.value.questionImage = null;
    } else if (field.startsWith('option')) {
        const index = parseInt(field.replace('option', ''));
        questionData.value.optionImages[index] = null;
    } else if (field === 'explanation') {
        questionData.value.explanationImage = null;
    }
    renderPreview();
};

const resetForm = () => {
    questionData.value = {
        question: '',
        questionImage: null,
        options: ['', '', '', ''],
        optionImages: [null, null, null, null],
        correctAnswer: null,
        explanation: '',
        explanationImage: null
    };
    preview.value = {
        question: '',
        options: ['', '', '', ''],
        explanation: ''
    };
    fullPreview.value = false;
    editingId.value = null;
};

const saveQuestion = async () => {
    if (!questionData.value.question || !questionData.value.correctAnswer) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const payload = {
            ...questionData.value,
            // Convert images to base64 strings for saving
            questionImage: questionData.value.questionImage,
            optionImages: questionData.value.optionImages,
            explanationImage: questionData.value.explanationImage
        };

        const response = await axios.post('/api/questions', payload);
        savedQuestions.value.push(response.data);
        resetForm();
        fetchQuestions();
    } catch (error) {
        console.error('Error saving question:', error);
        alert('Failed to save question');
    }
};

const updateQuestion = async () => {
    if (!editingId.value) return;

    try {
        const payload = {
            ...questionData.value,
            id: editingId.value
        };

        await axios.put(`/api/questions/${editingId.value}`, payload);
        resetForm();
        fetchQuestions();
    } catch (error) {
        console.error('Error updating question:', error);
        alert('Failed to update question');
    }
};

const loadQuestionForEdit = (question) => {
    questionData.value = {
        question: question.question,
        questionImage: question.questionImage,
        options: [...question.options],
        optionImages: question.optionImages ? [...question.optionImages] : [null, null, null, null],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '',
        explanationImage: question.explanationImage || null
    };
    editingId.value = question.id;
    renderPreview();
};

const deleteQuestion = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
        await axios.delete(`/api/questions/${id}`);
        fetchQuestions();
    } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question');
    }
};

const fetchQuestions = async () => {
    try {
        const response = await axios.get('/api/questions');
        savedQuestions.value = response.data;
    } catch (error) {
        console.error('Error fetching questions:', error);
    }
};

onMounted(() => {
    fetchQuestions();
});
</script>

<template>
    <Card class="p-4">
        <template #title>Add Question</template>

        <template #content>
            <!-- Question Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Question:</label>
                <Textarea v-model="questionData.question" rows="3" class="w-full mb-2" placeholder="Type your question here. Use $$...$$ for LaTeX." @input="renderPreview" />
                <input type="file" @change="handleFileUpload('question', $event)" accept="image/*" class="mb-4" />
                <div v-if="questionData.questionImage" class="mb-2">
                    <img :src="questionData.questionImage" class="max-h-40 mb-2" />
                    <Button label="Remove Image" icon="pi pi-times" severity="danger" @click="removeImage('question')" class="p-button-sm" />
                </div>
                <div v-if="preview.question" class="mb-4 p-3 border rounded-md">
                    <h3 class="font-bold mb-2">Question Preview:</h3>
                    <div v-html="preview.question"></div>
                    <img v-if="questionData.questionImage" :src="questionData.questionImage" class="max-h-40 mt-2" />
                </div>
            </div>

            <!-- Options Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Options:</label>
                <div v-for="(option, index) in questionData.options" :key="index" class="mb-4">
                    <label class="block mb-1">{{ String.fromCharCode(65 + index) }}:</label>
                    <Textarea v-model="questionData.options[index]" rows="2" class="w-full mb-2" :placeholder="'Option ' + String.fromCharCode(65 + index)" @input="renderPreview" />
                    <input type="file" @change="handleFileUpload('option' + index, $event)" accept="image/*" class="mb-2" />
                    <div v-if="questionData.optionImages[index]" class="mb-2">
                        <img :src="questionData.optionImages[index]" class="max-h-40 mb-2" />
                        <Button label="Remove Image" icon="pi pi-times" severity="danger" @click="removeImage('option' + index)" class="p-button-sm" />
                    </div>
                    <div v-if="preview.options[index]" class="p-2 border rounded-md">
                        <div v-html="preview.options[index]"></div>
                        <img v-if="questionData.optionImages[index]" :src="questionData.optionImages[index]" class="max-h-40 mt-2" />
                    </div>
                </div>
            </div>

            <!-- Correct Answer Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Correct Answer:</label>
                <Dropdown v-model="questionData.correctAnswer" :options="['A', 'B', 'C', 'D']" placeholder="Select correct option" class="w-full mb-4" />
            </div>

            <!-- Explanation Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Explanation:</label>
                <Textarea v-model="questionData.explanation" rows="3" class="w-full mb-2" placeholder="Type explanation here. Use $$...$$ for LaTeX." @input="renderPreview" />
                <input type="file" @change="handleFileUpload('explanation', $event)" accept="image/*" class="mb-2" />
                <div v-if="questionData.explanationImage" class="mb-2">
                    <img :src="questionData.explanationImage" class="max-h-40 mb-2" />
                    <Button label="Remove Image" icon="pi pi-times" severity="danger" @click="removeImage('explanation')" class="p-button-sm" />
                </div>
                <div v-if="preview.explanation" class="p-3 border rounded-md">
                    <h3 class="font-bold mb-2">Explanation Preview:</h3>
                    <div v-html="preview.explanation"></div>
                    <img v-if="questionData.explanationImage" :src="questionData.explanationImage" class="max-h-40 mt-2" />
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
                <Button label="Preview Question" icon="pi pi-eye" @click="renderFullPreview" />
                <Button label="Save Question" icon="pi pi-save" severity="success" @click="saveQuestion" />
                <Button v-if="editingId" label="Update Question" icon="pi pi-pencil" severity="warning" @click="updateQuestion" />
                <Button label="Reset Form" icon="pi pi-refresh" severity="secondary" @click="resetForm" />
            </div>

            <!-- Full Preview Section -->
            <div v-if="fullPreview" class="mt-6 p-4 border rounded-md bg-gray-50">
                <h3 class="font-bold text-xl mb-4">Full Question Preview</h3>

                <div class="mb-4">
                    <h4 class="font-bold mb-2">Question:</h4>
                    <div v-html="preview.question"></div>
                    <img v-if="questionData.questionImage" :src="questionData.questionImage" class="max-h-60 mt-2" />
                </div>

                <div class="mb-4">
                    <h4 class="font-bold mb-2">Options:</h4>
                    <div v-for="(option, index) in preview.options" :key="index" class="mb-2">
                        <span class="font-semibold">{{ String.fromCharCode(65 + index) }}:</span>
                        <div v-html="option" class="ml-2 inline-block"></div>
                        <img v-if="questionData.optionImages[index]" :src="questionData.optionImages[index]" class="max-h-40 mt-2" />
                    </div>
                </div>

                <div class="mb-4">
                    <h4 class="font-bold">Correct Answer:</h4>
                    <p>{{ questionData.correctAnswer }}</p>
                </div>

                <div v-if="preview.explanation">
                    <h4 class="font-bold mb-2">Explanation:</h4>
                    <div v-html="preview.explanation"></div>
                    <img v-if="questionData.explanationImage" :src="questionData.explanationImage" class="max-h-60 mt-2" />
                </div>
            </div>

            <!-- Saved Questions -->
            <div v-if="savedQuestions.length" class="mt-8">
                <h3 class="font-bold text-xl mb-4">Saved Questions</h3>
                <div v-for="(q, idx) in savedQuestions" :key="idx" class="mb-6 p-4 border rounded-md">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold">Question {{ idx + 1 }}</h4>
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" @click="loadQuestionForEdit(q)" class="p-button-sm p-button-warning" />
                            <Button icon="pi pi-trash" @click="deleteQuestion(q.id)" class="p-button-sm p-button-danger" />
                        </div>
                    </div>

                    <div class="mb-3" v-html="renderLatex(q.question)"></div>
                    <img v-if="q.questionImage" :src="q.questionImage" class="max-h-40 mb-3" />

                    <div class="mb-3">
                        <h5 class="font-semibold">Options:</h5>
                        <div v-for="(opt, optIdx) in q.options" :key="optIdx" class="ml-4">
                            <span class="font-semibold">{{ String.fromCharCode(65 + optIdx) }}:</span>
                            <span v-html="renderLatex(opt)" class="ml-2"></span>
                            <img v-if="q.optionImages && q.optionImages[optIdx]" :src="q.optionImages[optIdx]" class="max-h-32 mt-1" />
                        </div>
                    </div>

                    <div class="mb-3">
                        <h5 class="font-semibold">Correct Answer:</h5>
                        <p>{{ q.correctAnswer }}</p>
                    </div>

                    <div v-if="q.explanation">
                        <h5 class="font-semibold">Explanation:</h5>
                        <div v-html="renderLatex(q.explanation)"></div>
                        <img v-if="q.explanationImage" :src="q.explanationImage" class="max-h-40 mt-2" />
                    </div>
                </div>
            </div>
        </template>
    </Card>
</template>

<style>
@import 'katex/dist/katex.min.css';

/* Custom styles for better LaTeX rendering */
.katex {
    font-size: 1.1em;
}
.katex-display {
    margin: 0.5em 0;
}
</style>
