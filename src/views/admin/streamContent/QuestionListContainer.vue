<script setup>
// Setup event listeners
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { apiClient } from '@/service/apiService';
import QuestionList from './QuestionList.vue';
import QuetionCreate from './QuetionCreate.vue';

const savedQuestions = ref([]);
const toast = useToast();
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
    positive_marks: 4,
    negative_marks: 1
});
const editingId = ref(null);
const showPreviewSection = ref(false);

defineProps({
    directoryMeta: {
        type: Object,
        required: true
    }
});

defineEmits(['questionCreated', 'questionUpdated', 'questionDeleted', 'close']);

const fetchQuestions = async () => {
    try {
        // In a real app, you would GET from Laravel endpoint
        const response = await apiClient.get('/admin/questions'); //

        // Mock response with sample data matching your format
        const mockResponse = {
            data: [
                {
                    id: 'q1',
                    question: {
                        text: 'The hybridization of the central carbon in CH3C≡N and\nthe bond angle CCN are',
                        images: [
                            { id: 'img1', path: './media/image1.jpeg' },
                            { id: 'img2', path: './media/image2.png' },
                            { id: 'img3', path: './media/image3.png' }
                        ]
                    },
                    type: 'multiple_choice',
                    options: [
                        {
                            text: 'sp2 , 180°',
                            images: [{ id: 'img4', path: './media/image4.png' }]
                        },
                        {
                            text: 'Sp, 180°',
                            images: [{ id: 'img5', path: './media/image5.png' }]
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
                        images: [
                            { id: 'img6', path: './media/image6.jpeg' },
                            { id: 'img7', path: './media/image7.png' }
                        ]
                    },
                    positive_marks: 4,
                    negative_marks: 1,
                    created_at: '2023-01-01T00:00:00Z',
                    updated_at: '2023-01-01T00:00:00Z'
                }
            ]
        };

        savedQuestions.value = response.data;
    } catch (error) {
        console.error('Error fetching questions:', error);
        toast.add({
            severity: 'error',
            summary: 'Fetch Failed',
            detail: 'Failed to load questions',
            life: 3000
        });
    }
};
const loadQuestionForEdit = (question) => {
    // Clone the question to edit
    questionData.value = JSON.parse(JSON.stringify(question));
    editingId.value = question.id;

    // Convert stored image paths to preview objects
    questionData.value.question.images = question.question.images.map((img) => ({
        preview: getHostname() + img.path,
        filename: img.path.split('/').pop(),
        serverId: img.serverId,
        saved: true
    }));

    questionData.value.options.forEach((opt, idx) => {
        opt.images = question.options[idx].images.map((img) => ({
            preview: getHostname() + img.path,
            filename: img.path.split('/').pop(),
            serverId: img.serverId,
            saved: true
        }));
    });

    questionData.value.answer.images = question.answer.images.map((img) => ({
        preview: getHostname() + img.path,
        filename: img.path.split('/').pop(),
        serverId: img.serverId,
        saved: true
    }));

    questionData.value.solution.images = question.solution.images.map((img) => ({
        preview: getHostname() + img.path,
        // preview: `/storage${img.path.replace('./media', '')}`,
        filename: img.path.split('/').pop(),
        serverId: img.serverId,
        saved: true
    }));

    // showPreviewSection.value = false
};

const deleteQuestion = async (id) => {
    confirm.require({
        message: 'Are you sure you want to delete this question?',
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                // In a real app, you would DELETE to Laravel endpoint
                // await axios.delete(`/api/ques2tions/${id}`)

                // Get question to delete for image cleanup
                const questionToDelete = savedQuestions.value.find((q) => q.id === id);

                // Update local state for demo
                savedQuestions.value = savedQuestions.value.filter((q) => q.id !== id);

                // Cleanup images from server
                if (questionToDelete) {
                    const allImages = [...questionToDelete.question.images, ...questionToDelete.options.flatMap((opt) => opt.images), ...questionToDelete.answer.images, ...questionToDelete.solution.images];

                    await Promise.all(allImages.map((img) => deleteFile(img.id)));
                }

                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Question deleted successfully',
                    life: 3000
                });
            } catch (error) {
                console.error('Error deleting question:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Delete Failed',
                    detail: 'Failed to delete question',
                    life: 3000
                });
            }
        }
    });
};
const viewQuestion = (question) => {
    previewData.value = question;
    previewMode.value = 'web';
    showPreviewSection.value = true;
};

const hasUnsavedChanges = () => {
    return (
        questionData.value.question.text ||
        questionData.value.question.images.length > 0 ||
        questionData.value.options.some((opt) => opt.text || opt.images.length > 0) ||
        questionData.value.answer.text ||
        questionData.value.answer.images.length > 0 ||
        questionData.value.solution.text ||
        questionData.value.solution.images.length > 0
    );
};

// Handle page refresh/close
const questionCreatedAction = () => {
    editingId.value = null;
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
        positive_marks: 4,
        negative_marks: 1
    };
    showPreviewSection.value = false;
    fetchQuestions();
    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Question saved successfully',
        life: 3000
    });
    // Optionally, you can scroll to the top or reset any other state
    window.scrollTo(0, 0);
    // Or emit an event to parent component if needed
    // emit('questionCreated', questionData.value)
};

onMounted(() => {
    window.addEventListener('beforeunload', beforeUnloadHandler);
    fetchQuestions();
});
const beforeUnloadHandler = (e) => {
    if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
    }
};
</script>
<template>
    <!-- Saved Questions -->
    <div v-if="savedQuestions.length && !editingId" class="mt-8">
        <h3 class="font-bold text-xl mb-4">Saved Questions</h3>
        <QuestionList :questions="savedQuestions" :directoryMeta="directoryMeta" @edit="loadQuestionForEdit" @delete="deleteQuestion" @view="viewQuestion" />
    </div>
    <QuetionCreate
        v-if="editingId"
        :qData="questionData"
        :eId="editingId"
        :directoryMeta="directoryMeta"
        @close="
            editingId = null;
            questionData = { ...defaultQuestionData };
        "
        @saved="questionCreatedAction"
    />
</template>
<style scoped></style>
