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
        const dateInput = ref(new Date().toISOString().split('T')[0]); // '2025-09-02

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

        const organizations = ref([
            { name: 'Banking', value: 'banking' },
            { name: 'SSC', value: 'ssc' },
            { name: 'ETS', value: 'ets' }
        ]);

        const canOpenBulkImportFile = computed(() => {
            return true;
        });

        return {
            question,
            dateInput,
            submitted,
            organizations,
            toast,
            QUESTION_GROUPS,
            canOpenBulkImportFile
        };
    },
    mounted() {
        this.loadOrganizations();
    },
    methods: {
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
                <div class="flex p-3 ring-1 ring-green-100 rounded-md bg-green-50 justify-between gap-x-3">
                    <!-- Organization Selection -->
                    <!-- Organization Selection -->
                    <div class="field mb-4 flex p-3">
                        <label for="organization">Organization</label>
                        <Select id="organization" v-model="question.organization" :options="organizations" optionLabel="name" optionValue="value" placeholder="Select Organization" :class="{ 'p-invalid': submitted && !question.organization }" />
                        <small class="p-error" v-if="submitted && !question.organization"> Organization is required. </small>
                    </div>
                    <div class="field mb-4">
                        <label for="date">Date</label>
                        <input id="date" type="date" v-model="dateInput" class="p-inputtext w-full" :class="{ 'p-invalid': submitted && !dateInput }" />
                        <small class="p-error" v-if="submitted && !dateInput"> Date is required. </small>
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
                :extra-data="{
                    organisationId: question.organization,
                    subjectId: question.subject_id,
                    chapterId: question.chapter_id,
                    topicId: question.topic_id,
                    ca_date: dateInput,
                    questionGroup: QUESTION_GROUPS.find((group) => group.key == 'CA').value
                }"
                auth-token="YOUR_TOKEN"
                @uploaded="handleUploadedSuccess"
                @error="handleUploadError"
                @change="(files) => console.log('selected', files.length)"
            />
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
