<script setup>
import { ref, onMounted } from 'vue';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { apiClient } from '@/service/apiService';

const questionData = ref({
    question: {
        text: '',
        images: []
    },
    type: 'multiple_choice',
    options: [
        { text: '', images: [] },
        { text: '', images: [] },
        { text: '', images: [] },
        { text: '', images: [] }
    ],
    answer: {
        text: '',
        images: []
    },
    solution: {
        text: '',
        images: []
    },
    positive_marks: '4',
    negative_marks: '1'
});

const previewData = ref(null);
const savedQuestions = ref([]);
const editingId = ref(null);
const showPreviewSection = ref(false);
const previewMode = ref('web'); // 'web' or 'json'
const expandedQuestions = ref([]);

const renderLatex = (text) => {
    if (!text) return '';

    // Split text into parts that are LaTeX and parts that are not
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/gs);

    return parts
        .map((part) => {
            if (part.startsWith('$$') && part.endsWith('$$')) {
                const latexContent = part.slice(2, -2);
                try {
                    return katex.renderToString(latexContent, {
                        throwOnError: false,
                        displayMode: true
                    });
                } catch (e) {
                    console.error('KaTeX error:', e);
                    return `<span class="text-red-500">${part}</span>`;
                }
            } else if (part.startsWith('$') && part.endsWith('$')) {
                const latexContent = part.slice(1, -1);
                try {
                    return katex.renderToString(latexContent, {
                        throwOnError: false,
                        displayMode: false
                    });
                } catch (e) {
                    console.error('KaTeX error:', e);
                    return `<span class="text-red-500">${part}</span>`;
                }
            }
            return part.replace(/\n/g, '<br>');
        })
        .join('');
};

const handleFileUpload = async (field, event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const newImages = files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name
    }));

    if (field === 'question') {
        questionData.value.question.images.push(...newImages);
    } else if (field.startsWith('option')) {
        const index = parseInt(field.replace('option', ''));
        questionData.value.options[index].images.push(...newImages);
    } else if (field === 'answer') {
        questionData.value.answer.images.push(...newImages);
    } else if (field === 'solution') {
        questionData.value.solution.images.push(...newImages);
    }

    event.target.value = '';
};

const removeImage = (field, index) => {
    if (field === 'question') {
        questionData.value.question.images.splice(index, 1);
    } else if (field.startsWith('option')) {
        const optionIndex = parseInt(field.replace('option', ''));
        questionData.value.options[optionIndex].images.splice(index, 1);
    } else if (field === 'answer') {
        questionData.value.answer.images.splice(index, 1);
    } else if (field === 'solution') {
        questionData.value.solution.images.splice(index, 1);
    }
};

const resetForm = () => {
    questionData.value = {
        question: {
            text: '',
            images: []
        },
        type: 'multiple_choice',
        options: [
            { text: '', images: [] },
            { text: '', images: [] },
            { text: '', images: [] },
            { text: '', images: [] }
        ],
        answer: {
            text: '',
            images: []
        },
        solution: {
            text: '',
            images: []
        },
        positive_marks: '4',
        negative_marks: '1'
    };
    previewData.value = null;
    editingId.value = null;
    showPreviewSection.value = false;
};

const preparePayload = () => {
    const payload = JSON.parse(JSON.stringify(questionData.value));

    // Convert images to the format Laravel would return
    payload.question.images = payload.question.images.map((img, i) => `./media/image${i + 1}.jpeg`);
    payload.options.forEach((opt, optIdx) => {
        opt.images = opt.images.map((img, i) => `./media/option${optIdx}-image${i + 1}.png`);
    });
    payload.answer.images = payload.answer.images.map((img, i) => `./media/answer-image${i + 1}.png`);
    payload.solution.images = payload.solution.images.map((img, i) => `./media/solution-image${i + 1}.png`);

    return payload;
};

const showPreview = () => {
    previewData.value = preparePayload();
    showPreviewSection.value = true;
};

const saveQuestion = async () => {
    const payload = preparePayload();

    try {
        // In a real app, you would POST to Laravel endpoint
        const response = apiClient.post('admin/questions', payload, {
            headers: {
                'Content-Type': 'application/json',
                Accept: '*/*'
            }
        });

        // Mock response
        const mockResponse = {
            data: {
                ...payload,
                id: Math.random().toString(36).substring(2, 9)
            }
        };

        savedQuestions.value.push(mockResponse.data);
        resetForm();
    } catch (error) {
        console.error('Error saving question:', error);
        alert('Failed to save question');
    }
};

const updateQuestion = async () => {
    if (!editingId.value) return;

    const payload = preparePayload();
    payload.id = editingId.value;

    try {
        // In a real app, you would PUT to Laravel endpoint
        // await axios.put(`/api/questions/${editingId.value}`, payload)

        // Update local state for demo
        const index = savedQuestions.value.findIndex((q) => q.id === editingId.value);
        if (index !== -1) {
            savedQuestions.value[index] = payload;
        }

        resetForm();
    } catch (error) {
        console.error('Error updating question:', error);
        alert('Failed to update question');
    }
};

const loadQuestionForEdit = (question) => {
    questionData.value = JSON.parse(JSON.stringify(question));
    editingId.value = question.id;

    // Convert stored image paths to preview objects
    questionData.value.question.images = question.question.images.map((img) => ({
        url: img // In real app, you might need to prepend the base URL
    }));

    questionData.value.options.forEach((opt) => {
        opt.images = opt.images.map((img) => ({
            url: img
        }));
    });

    questionData.value.answer.images = question.answer.images.map((img) => ({
        url: img
    }));

    questionData.value.solution.images = question.solution.images.map((img) => ({
        url: img
    }));

    showPreviewSection.value = false;
};

const viewQuestion = (question) => {
    const index = expandedQuestions.value.indexOf(question.id);
    if (index === -1) {
        expandedQuestions.value.push(question.id);
    } else {
        expandedQuestions.value.splice(index, 1);
    }
};

const deleteQuestion = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
        // In a real app, you would DELETE to Laravel endpoint
        // await axios.delete(`/api/questions/${id}`)

        // Update local state for demo
        savedQuestions.value = savedQuestions.value.filter((q) => q.id !== id);
        expandedQuestions.value = expandedQuestions.value.filter((qId) => qId !== id);
    } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question');
    }
};

const fetchQuestions = async () => {
    try {
        // In a real app, you would GET from Laravel endpoint
        // const response = await axios.get('/api/questions')

        // Mock response with sample data matching your format
        const mockResponse = {
            data: [
                {
                    id: '1',
                    question: {
                        text: 'The hybridization of the central carbon in CH3C≡N and\nthe bond angle CCN are',
                        images: ['./media/image1.jpeg', './media/image2.png', './media/image3.png']
                    },
                    type: 'multiple_choice',
                    options: [
                        {
                            text: 'sp2 , 180°',
                            images: ['./media/image4.png']
                        },
                        {
                            text: 'Sp, 180°',
                            images: ['./media/image5.png']
                        },
                        {
                            text: 'sp2 , 120°.',
                            images: []
                        },
                        {
                            text: 'sp3 , 109°.$$\\lim_{n \\rightarrow\n\\infty}\\left( 1 + \\frac{1}{n} \\right)^{n}$$',
                            images: []
                        }
                    ],
                    answer: {
                        text: '1,2 $$(x + a)^{n} = \\sum_{k =\n0}^{n}{\\binom{n}{k}x^{k}a^{n - k}}$$',
                        images: []
                    },
                    solution: {
                        text: 'Sp, 180°',
                        images: ['./media/image6.jpeg', './media/image7.png']
                    },
                    positive_marks: '4',
                    negative_marks: '1'
                }
            ]
        };

        savedQuestions.value = mockResponse.data;
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
                <Textarea v-model="questionData.question.text" rows="3" class="w-full mb-2" placeholder="Type your question here. Use $$...$$ for LaTeX." />
                <input type="file" @change="handleFileUpload('question', $event)" accept="image/*" multiple class="mb-4" />
                <div v-if="questionData.question.images.length" class="mb-2">
                    <div v-for="(img, idx) in questionData.question.images" :key="'q-img-' + idx" class="mb-2">
                        <img :src="img.url" class="max-h-40 mb-2" />
                        <Button label="Remove Image" icon="pi pi-times" severity="danger" @click="removeImage('question', idx)" class="p-button-sm" />
                    </div>
                </div>
            </div>

            <!-- Options Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Options:</label>
                <div v-for="(option, index) in questionData.options" :key="index" class="mb-4">
                    <label class="block mb-1">{{ String.fromCharCode(65 + index) }}:</label>
                    <Textarea v-model="questionData.options[index].text" rows="2" class="w-full mb-2" :placeholder="'Option ' + String.fromCharCode(65 + index)" />
                    <input type="file" @change="handleFileUpload('option' + index, $event)" accept="image/*" multiple class="mb-2" />
                    <div v-if="questionData.options[index].images.length" class="mb-2">
                        <div v-for="(img, idx) in questionData.options[index].images" :key="'o-img-' + index + '-' + idx" class="mb-2">
                            <img :src="img.url" class="max-h-40 mb-2" />
                            <Button label="Remove Image" icon="pi pi-times" severity="danger" @click="removeImage('option' + index, idx)" class="p-button-sm" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Correct Answer Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Correct Answer:</label>
                <Textarea v-model="questionData.answer.text" rows="2" class="w-full mb-2" placeholder="Answer explanation with LaTeX support" />
                <input type="file" @change="handleFileUpload('answer', $event)" accept="image/*" multiple class="mb-2" />
                <div v-if="questionData.answer.images.length" class="mb-2">
                    <div v-for="(img, idx) in questionData.answer.images" :key="'a-img-' + idx" class="mb-2">
                        <img :src="img.url" class="max-h-40 mb-2" />
                        <Button label="Remove Image" icon="pi pi-times" severity="danger" @click="removeImage('answer', idx)" class="p-button-sm" />
                    </div>
                </div>
            </div>

            <!-- Solution Section -->
            <div class="mb-6">
                <label class="block font-bold mb-2">Solution:</label>
                <Textarea v-model="questionData.solution.text" rows="3" class="w-full mb-2" placeholder="Detailed solution with LaTeX support" />
                <input type="file" @change="handleFileUpload('solution', $event)" accept="image/*" multiple class="mb-2" />
                <div v-if="questionData.solution.images.length" class="mb-2">
                    <div v-for="(img, idx) in questionData.solution.images" :key="'s-img-' + idx" class="mb-2">
                        <img :src="img.url" class="max-h-40 mb-2" />
                        <Button label="Remove Image" icon="pi pi-times" severity="danger" @click="removeImage('solution', idx)" class="p-button-sm" />
                    </div>
                </div>
            </div>

            <!-- Marks Section -->
            <div class="mb-6 grid grid-cols-2 gap-4">
                <div>
                    <label class="block font-bold mb-2">Positive Marks:</label>
                    <InputText v-model="questionData.positive_marks" type="number" class="w-full" />
                </div>
                <div>
                    <label class="block font-bold mb-2">Negative Marks:</label>
                    <InputText v-model="questionData.negative_marks" type="number" class="w-full" />
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 flex-wrap">
                <Button label="Save Question" icon="pi pi-save" severity="success" @click="saveQuestion" />
                <Button v-if="editingId" label="Update Question" icon="pi pi-pencil" severity="warning" @click="updateQuestion" />
                <Button label="Reset Form" icon="pi pi-refresh" severity="secondary" @click="resetForm" />
                <Button label="Preview Question" icon="pi pi-eye" @click="showPreview" class="ml-auto" />
            </div>

            <!-- Preview Toggle Buttons -->
            <div v-if="showPreviewSection" class="flex justify-end gap-2 mt-4">
                <Button label="Web Format" :severity="previewMode === 'web' ? 'primary' : 'secondary'" @click="previewMode = 'web'" class="p-button-sm" />
                <Button label="JSON Format" :severity="previewMode === 'json' ? 'primary' : 'secondary'" @click="previewMode = 'json'" class="p-button-sm" />
            </div>

            <!-- Web Format Preview -->
            <div v-if="showPreviewSection && previewMode === 'web'" class="mt-6 p-4 border rounded-md bg-gray-50">
                <h3 class="font-bold text-xl mb-4">Question Preview</h3>

                <div class="mb-6">
                    <h4 class="font-bold mb-2">Question:</h4>
                    <div class="whitespace-pre-wrap" v-html="renderLatex(questionData.question.text)"></div>
                    <div v-if="questionData.question.images.length" class="flex flex-wrap gap-2 mt-2">
                        <img v-for="(img, idx) in questionData.question.images" :key="'preview-q-img-' + idx" :src="img.url" class="max-h-60" />
                    </div>
                </div>

                <div class="mb-6">
                    <h4 class="font-bold mb-2">Options:</h4>
                    <div v-for="(option, index) in questionData.options" :key="'preview-opt-' + index" class="mb-3">
                        <div class="flex items-start">
                            <span class="font-bold mr-2">{{ String.fromCharCode(65 + index) }}.</span>
                            <div>
                                <div class="whitespace-pre-wrap" v-html="renderLatex(option.text)"></div>
                                <div v-if="option.images.length" class="flex flex-wrap gap-2 mt-1">
                                    <img v-for="(img, idx) in option.images" :key="'preview-o-img-' + index + '-' + idx" :src="img.url" class="max-h-40" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mb-6">
                    <h4 class="font-bold mb-2">Correct Answer:</h4>
                    <div class="whitespace-pre-wrap" v-html="renderLatex(questionData.answer.text)"></div>
                    <div v-if="questionData.answer.images.length" class="flex flex-wrap gap-2 mt-2">
                        <img v-for="(img, idx) in questionData.answer.images" :key="'preview-a-img-' + idx" :src="img.url" class="max-h-60" />
                    </div>
                </div>

                <div v-if="questionData.solution.text || questionData.solution.images.length" class="mb-6">
                    <h4 class="font-bold mb-2">Solution:</h4>
                    <div class="whitespace-pre-wrap" v-html="renderLatex(questionData.solution.text)"></div>
                    <div v-if="questionData.solution.images.length" class="flex flex-wrap gap-2 mt-2">
                        <img v-for="(img, idx) in questionData.solution.images" :key="'preview-s-img-' + idx" :src="img.url" class="max-h-60" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-bold">Positive Marks:</h4>
                        <p>{{ questionData.positive_marks }}</p>
                    </div>
                    <div>
                        <h4 class="font-bold">Negative Marks:</h4>
                        <p>{{ questionData.negative_marks }}</p>
                    </div>
                </div>
            </div>

            <!-- JSON Format Preview -->
            <div v-if="showPreviewSection && previewMode === 'json'" class="mt-6 p-4 border rounded-md bg-gray-50">
                <h3 class="font-bold text-xl mb-4">JSON Preview</h3>
                <pre class="bg-white p-4 rounded overflow-auto max-h-96">{{ JSON.stringify(previewData, null, 2) }}</pre>
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
                            <Button icon="pi pi-eye" @click="viewQuestion(q)" class="p-button-sm p-button-info" v-tooltip="'View Question'" />
                        </div>
                    </div>

                    <!-- Collapsible question content -->
                    <div v-if="expandedQuestions.includes(q.id)" class="mt-3">
                        <div class="mb-3">
                            <h5 class="font-semibold">Question:</h5>
                            <div class="whitespace-pre-wrap" v-html="renderLatex(q.question.text)"></div>
                            <div v-if="q.question.images.length" class="flex flex-wrap gap-2 mt-2">
                                <img v-for="(img, imgIdx) in q.question.images" :key="'saved-q-img-' + imgIdx" :src="img" class="max-h-40" />
                            </div>
                        </div>

                        <div class="mb-3">
                            <h5 class="font-semibold">Options:</h5>
                            <div v-for="(opt, optIdx) in q.options" :key="'saved-opt-' + optIdx" class="ml-4 mb-2">
                                <div class="flex items-start">
                                    <span class="font-semibold mr-2">{{ String.fromCharCode(65 + optIdx) }}.</span>
                                    <div>
                                        <div class="whitespace-pre-wrap" v-html="renderLatex(opt.text)"></div>
                                        <div v-if="opt.images.length" class="flex flex-wrap gap-2 mt-1">
                                            <img v-for="(img, imgIdx) in opt.images" :key="'saved-o-img-' + optIdx + '-' + imgIdx" :src="img" class="max-h-32" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <h5 class="font-semibold">Correct Answer:</h5>
                            <div class="whitespace-pre-wrap" v-html="renderLatex(q.answer.text)"></div>
                            <div v-if="q.answer.images.length" class="flex flex-wrap gap-2 mt-2">
                                <img v-for="(img, imgIdx) in q.answer.images" :key="'saved-a-img-' + imgIdx" :src="img" class="max-h-40" />
                            </div>
                        </div>

                        <div v-if="q.solution.text || q.solution.images.length" class="mb-3">
                            <h5 class="font-semibold">Solution:</h5>
                            <div class="whitespace-pre-wrap" v-html="renderLatex(q.solution.text)"></div>
                            <div v-if="q.solution.images.length" class="flex flex-wrap gap-2 mt-2">
                                <img v-for="(img, imgIdx) in q.solution.images" :key="'saved-s-img-' + imgIdx" :src="img" class="max-h-40" />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <h5 class="font-semibold">Positive Marks:</h5>
                                <p>{{ q.positive_marks }}</p>
                            </div>
                            <div>
                                <h5 class="font-semibold">Negative Marks:</h5>
                                <p>{{ q.negative_marks }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Card>
</template>

<style>
.katex-display {
    margin: 0.5em 0;
    overflow-x: auto;
    overflow-y: hidden;
}

.katex {
    font-size: 1.1em;
}

/* Style for JSON preview */
pre {
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.9rem;
    line-height: 1.4;
    white-space: pre-wrap;
    word-wrap: break-word;
}

/* Style for web preview */
.whitespace-pre-wrap {
    white-space: pre-wrap;
}
</style>
