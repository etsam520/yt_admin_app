<script setup>
import { ref, onMounted } from 'vue';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

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

const handleFileUpload = async (field, event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // In a real app, you would upload to Laravel backend here
    // For demo, we'll just create object URLs
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

    // Reset file input
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
};

const preparePayload = () => {
    // In a real app, you would upload files to Laravel first
    // and get back the paths like "./media/image1.jpeg"
    // For demo, we'll just mock this

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

const saveQuestion = async () => {
    const payload = preparePayload();
    previewData.value = payload;

    try {
        // In a real app, you would POST to Laravel endpoint
        // const response = await axios.post('/api/questions', payload)

        // Mock response
        const mockResponse = {
            data: {
                ...payload,
                id: Math.random().toString(36).substring(2, 9)
            }
        };

        savedQuestions.value.push(mockResponse.data);
        // resetForm() // Optional: clear form after save
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
    // Clone the question to edit
    questionData.value = JSON.parse(JSON.stringify(question));
    editingId.value = question.id;

    // In a real app, you would need to handle image URLs properly
    // For demo, we'll just reset images array
    questionData.value.question.images = question.question.images.map((img) => ({
        url: img // This would normally be a full URL from your backend
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
};

const deleteQuestion = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
        // In a real app, you would DELETE to Laravel endpoint
        // await axios.delete(`/api/questions/${id}`)

        // Update local state for demo
        savedQuestions.value = savedQuestions.value.filter((q) => q.id !== id);
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
            <div class="flex gap-2">
                <Button label="Save Question" icon="pi pi-save" severity="success" @click="saveQuestion" />
                <Button v-if="editingId" label="Update Question" icon="pi pi-pencil" severity="warning" @click="updateQuestion" />
                <Button label="Reset Form" icon="pi pi-refresh" severity="secondary" @click="resetForm" />
            </div>

            <!-- Preview Section -->
            <div v-if="previewData" class="mt-6 p-4 border rounded-md bg-gray-50">
                <h3 class="font-bold text-xl mb-4">Question Preview</h3>
                <pre>{{ JSON.stringify(previewData, null, 2) }}</pre>
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

                    <pre>{{ JSON.stringify(q, null, 2) }}</pre>
                </div>
            </div>
        </template>
    </Card>
</template>
