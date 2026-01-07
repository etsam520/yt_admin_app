<script>
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { apiClient } from '@/service/apiService';
import QuestionCreate from '@/views/admin/streamContent/QuetionCreate.vue';

export default {
    setup() {
        const toast = useToast();

        const question = ref({
            organization: null,
            subject_id: null,
            chapter_id: null,
            topic_id: null,
            text: '',
            type: null,
            options: [
                { text: '', is_correct: false },
                { text: '', is_correct: false }
            ],
            answer: '',
            difficulty: null,
            explanation: ''
        });

        const submitted = ref(false);
        const subjects = ref([]);
        const chapters = ref([]);
        const topics = ref([]);

        const organizations = ref([
            { name: 'Banking', value: 'banking' },
            { name: 'SSC', value: 'ssc' },
            { name: 'ETS', value: 'ets' }
        ]);

        const questionTypes = ref([
            { name: 'Multiple Choice (MCQ)', value: 'mcq' },
            { name: 'True/False', value: 'true_false' },
            { name: 'Short Answer', value: 'short_answer' },
            { name: 'Essay', value: 'essay' }
        ]);

        const difficultyLevels = ref([
            { name: 'Easy', value: 'easy' },
            { name: 'Medium', value: 'medium' },
            { name: 'Hard', value: 'hard' }
        ]);

        const requireChapter = computed(() => {
            if (!question.value.subject_id) return false;
            const subject = subjects.value.find((s) => s.id === question.value.subject_id);
            return subject?.has_chapters || false;
        });

        const requireTopic = computed(() => {
            if (!question.value.chapter_id) return false;
            const chapter = chapters.value.find((c) => c.id === question.value.chapter_id);
            return chapter?.has_topics || false;
        });

        return {
            question,
            submitted,
            subjects,
            chapters,
            topics,
            organizations,
            questionTypes,
            difficultyLevels,
            requireChapter,
            requireTopic,
            toast
        };
    },
    created() {
        this.loadSubjects();
    },
    methods: {
        async loadSubjects() {
            try {
                const response = await apiClient.get('/admin/category-by-depth-index', {
                    params: { depth_index: 'subject' }
                });
                this.subjects = response.data.data.map((subject) => ({
                    ...subject,
                    has_chapters: subject.children && subject.children.length > 0
                }));
            } catch (error) {
                this.showError('Failed to load subjects', error);
            }
        },

        async loadChapters() {
            this.question.chapter_id = null;
            this.question.topic_id = null;
            this.chapters = [];
            this.topics = [];

            if (!this.question.subject_id) return;

            try {
                const response = await apiClient.get('/admin/category-by-depth-index', {
                    params: {
                        parent_id: this.question.subject_id,
                        depth_index: 'chapter'
                    }
                });
                this.chapters = response.data.data.map((chapter) => ({
                    ...chapter,
                    has_topics: chapter.children && chapter.children.length > 0
                }));
            } catch (error) {
                this.showError('Failed to load chapters', error);
            }
        },

        async loadTopics() {
            this.question.topic_id = null;
            this.topics = [];

            if (!this.question.chapter_id) return;

            try {
                const response = await apiClient.get('/admin/category-by-depth-index', {
                    params: {
                        parent_id: this.question.chapter_id,
                        depth_index: 'topic'
                    }
                });
                this.topics = response.data.data;
            } catch (error) {
                this.showError('Failed to load topics', error);
            }
        },
        /////////////////////////////////////////////////////////////////////////////
        // Validation and Submission Logic

        /////////////////////////////////////////////////////////////////////////////

        validateForm() {
            this.submitted = true;

            // Basic validations
            if (!this.question.organization) return false;
            if (!this.question.subject_id) return false;
            if (this.requireChapter && !this.question.chapter_id) return false;
            if (this.requireTopic && !this.question.topic_id) return false;
            if (!this.question.text) return false;
            if (!this.question.type) return false;
            if (!this.question.difficulty) return false;

            // Type-specific validations
            if (this.question.type === 'mcq') {
                if (this.question.options.length < 2) {
                    this.toast.add({
                        severity: 'error',
                        summary: 'Validation Error',
                        detail: 'At least 2 options are required for MCQ',
                        life: 5000
                    });
                    return false;
                }

                const emptyOption = this.question.options.some((opt) => !opt.text);
                if (emptyOption) {
                    this.toast.add({
                        severity: 'error',
                        summary: 'Validation Error',
                        detail: 'All options must have text',
                        life: 5000
                    });
                    return false;
                }

                const correctOptions = this.question.options.filter((opt) => opt.is_correct).length;
                if (correctOptions === 0) {
                    this.toast.add({
                        severity: 'error',
                        summary: 'Validation Error',
                        detail: 'At least one option must be marked correct',
                        life: 5000
                    });
                    return false;
                }
            } else if (!this.question.answer) {
                return false;
            }

            return true;
        },

        async submitQuestion() {
            if (!this.validateForm()) return;

            try {
                const payload = {
                    ...this.question,
                    category_id: this.question.topic_id || this.question.chapter_id || this.question.subject_id,
                    organization: this.question.organization
                };

                await axios.post('/api/questions', payload);

                this.toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Question created successfully',
                    life: 3000
                });

                this.resetForm();
            } catch (error) {
                this.showError('Failed to create question', error);
            }
        },

        resetForm() {
            this.question = {
                organization: null,
                subject_id: null,
                chapter_id: null,
                topic_id: null,
                text: '',
                type: null,
                options: [
                    { text: '', is_correct: false },
                    { text: '', is_correct: false }
                ],
                answer: '',
                difficulty: null,
                explanation: ''
            };
            this.submitted = false;
            this.chapters = [];
            this.topics = [];
        },

        showError(summary, error) {
            console.error(error);
            this.toast.add({
                severity: 'error',
                summary: summary,
                detail: error.response?.data?.message || error.message,
                life: 5000
            });
        }
    }
};
</script>

<template>
    <div class="p-4">
        <Card>
            <template #title>Add New Question</template>
            <template #content>
                <form @submit.prevent="submitQuestion" class="p-fluid">
                    <div class="flex p-3 ring-1 ring-green-100 rounded-md bg-green-50 justify-between gap-x-3">
                        <!-- Organization Selection -->
                        <!-- Organization Selection -->
                        <div class="field mb-4 flex p-3">
                            <label for="organization">Organization</label>
                            <Select id="organization" v-model="question.organization" :options="organizations" optionLabel="name" optionValue="value" placeholder="Select Organization" :class="{ 'p-invalid': submitted && !question.organization }" />
                            <small class="p-error" v-if="submitted && !question.organization"> Organization is required. </small>
                        </div>

                        <!-- Subject Selection -->
                        <div class="field mb-4">
                            <label for="subject">Subject</label>
                            <Select id="subject" v-model="question.subject_id" :options="subjects" optionLabel="name" optionValue="id" placeholder="Select Subject" :class="{ 'p-invalid': submitted && !question.subject_id }" @change="loadChapters" />
                            <small class="p-error" v-if="submitted && !question.subject_id"> Subject is required. </small>
                        </div>

                        <!-- Chapter Selection (if available) -->
                        <div class="field mb-4" v-if="chapters.length">
                            <label for="chapter">Chapter</label>
                            <Select
                                id="chapter"
                                v-model="question.chapter_id"
                                :options="chapters"
                                optionLabel="name"
                                optionValue="id"
                                placeholder="Select Chapter"
                                :class="{ 'p-invalid': submitted && requireChapter && !question.chapter_id }"
                                @change="loadTopics"
                            />
                            <small class="p-error" v-if="submitted && requireChapter && !question.chapter_id"> Chapter is required for this subject. </small>
                        </div>

                        <!-- Topic Selection (if available) -->
                        <div class="field mb-4" v-if="topics.length">
                            <label for="topic">Topic</label>
                            <Select id="topic" v-model="question.topic_id" :options="topics" optionLabel="name" optionValue="id" placeholder="Select Topic" :class="{ 'p-invalid': submitted && requireTopic && !question.topic_id }" />
                            <small class="p-error" v-if="submitted && requireTopic && !question.topic_id"> Topic is required for this chapter. </small>
                        </div>
                    </div>

                    <!-- Question Content -->

                    <!-- Question Content -->
                </form>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.p-editor-container ::v-deep(.p-editor-content) {
    min-height: 120px;
}
</style>
