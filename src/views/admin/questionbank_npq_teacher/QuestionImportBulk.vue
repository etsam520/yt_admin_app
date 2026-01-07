<script>
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { apiClient } from '@/service/apiService';
// import QuestionCreate from '@/views/admin/streamContent/QuetionCreate.vue';
import QuestionForm from '@/views/admin/question/QuestionForm.vue';
import Bulkimportfile from '../bulkimport/Bulkimportfile.vue';
import BulkImportSIngleFIle from '../bulkimport/BulkImportSIngleFIle.vue';
import { QUESTION_GROUPS } from '@/utils/helpers';

export default {
    components: { QuestionForm, Bulkimportfile, BulkImportSIngleFIle },
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

        // const difficultyLevels = ref([
        //   { name: 'Easy', value: 'easy' },
        //   { name: 'Medium', value: 'medium' },
        //   { name: 'Hard', value: 'hard' }
        // ]);

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

        const canOpenBulkImportFile = computed(() => {
            return question.value.subject_id && question.value.chapter_id && question.value.topic_id;
        });

        return {
            question,
            submitted,
            subjects,
            chapters,
            topics,
            QUESTION_GROUPS,
            organizations,
            requireChapter,
            requireTopic,
            toast,
            canOpenBulkImportFile
        };
    },
    mounted() {
        this.loadSubjects();
        this.loadOrganizations();
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
        async loadOrganizations() {
            try {
                const response = await apiClient.get('/admin/organizations');
                this.organizations = response.data.data.map((oz) => {
                    return { name: oz.name, value: oz.id };
                });
            } catch (error) {
                this.toast({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load organizations',
                    life: 3000
                });
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

        handleUploadedSuccess(file, res) {
            this.toast.add({
                severity: 'success',
                summary: 'Upload Successful',
                detail: `File "${file.name}" uploaded successfully.`,
                life: 3000
            });
            // Optionally, you can refresh the question list or reset the form here
        },

        handleUploadError(file, msg) {
            this.toast.add({
                severity: 'error',
                summary: 'Upload Failed',
                detail: `File "${file ? file.name : ''}" failed to upload. ${msg}`,
                life: 5000
            });
        },

        /////////////////////////////////////////////////////////////////////////////

        downloadSampleFile() {
            // Path to the sample Word file in public directory
            const sampleFilePath = apiClient.defaults.baseURL + 'samples/sample-question-import';
            
            // Create a temporary anchor element to trigger download
            const link = document.createElement('a');
            link.href = sampleFilePath;
            link.download = 'sample-question-import.docx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.toast.add({
                severity: 'success',
                summary: 'Download Started',
                detail: 'Sample Word file download has started.',
                life: 3000
            });
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
                    <div class="field mb-4">
                        <label for="chapter">Chapter</label>
                        <Select
                            :disabled="chapters.length == 0"
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
                    <div class="field mb-4">
                        <label for="topic">Topic</label>
                        <Select
                            :disabled="topics.length == 0"
                            id="topic"
                            v-model="question.topic_id"
                            :options="topics"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Topic"
                            :class="{ 'p-invalid': submitted && requireTopic && !question.topic_id }"
                        />
                        <small class="p-error" v-if="submitted && requireTopic && !question.topic_id"> Topic is required for this chapter. </small>
                    </div>
                </div>
            </template>
        </Card>

        <!-- Sample File Download Section -->
        <Card class="mt-4" >
            <template #content>
                <div class="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div class="flex items-center gap-4">
                        <div class="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-lg shadow-md">
                            <i class="pi pi-file-word text-white text-2xl"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-1">Download Sample Template</h3>
                            <p class="text-sm text-gray-600">Download the sample Word file to see the correct format for bulk question import.</p>
                        </div>
                    </div>
                    <Button 
                        label="Download Sample" 
                        icon="pi pi-download" 
                        @click="downloadSampleFile"
                        class="p-button-raised p-button-info shadow-lg"
                        severity="info"
                    />
                </div>
            </template>
        </Card>

        <div class="p-4">
            <Bulkimportfile
                v-if="!!canOpenBulkImportFile"
                accept=".docx"
                :max-files="1"
                :max-size-m-b="20"
                :auto-upload="false"
                endpoint="admin/questions/bulk-import"
                :extra-data="{ organisationId: question.organization, subjectId: question.subject_id, chapterId: question.chapter_id, topicId: question.topic_id, questionGroup: QUESTION_GROUPS.find((group) => group.key == 'NPQ').value }"
                auth-token="YOUR_TOKEN"
                @uploaded="handleUploadedSuccess"
                @error="handleUploadError"
                @change="(files) => console.log('selected', files.length)"
            />

            <!-- <QuestionForm v-if="canOpenBulkImportFile"  :
      questionMeta="{organisationId: question.organization, subjectId: question.subject_id, chapterId: question.chapter_id, topicId: question.topic_id}"/> -->
        </div>
    </div>
</template>

<style scoped>
.p-editor-container ::v-deep(.p-editor-content) {
    min-height: 120px;
}

/* Custom styles for download section */
.bg-gradient-to-r {
    background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.from-blue-50 {
    --tw-gradient-from: #eff6ff;
    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgb(239 246 255 / 0));
}

.to-indigo-50 {
    --tw-gradient-to: #eef2ff;
}

.shadow-lg {
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
</style>

<!-- eXAMPLE -->
<!--  <Bulkimportfile
            v-if="!!canOpenBulkImportFile"
            accept=".csv,.xlsx,.zip"
            :max-files="50"
            :max-size-m-b="20"
            :auto-upload="false"
            endpoint="https://your.api/upload"
            :extra-data="{ folderId: '123' }"
            auth-token="YOUR_TOKEN"
            @uploaded="(file, res) => console.log('uploaded', file.name, res)"
            @error="(file, msg) => console.error('error', file?.name, msg)"
            @change="(files) => console.log('selected', files.length)"
          />
        <BulkImportSIngleFIle /> 
 -->
