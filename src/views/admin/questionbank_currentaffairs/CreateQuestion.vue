<script>
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { apiClient } from '@/service/apiService';
// import QuestionCreate from '@/views/admin/streamContent/QuetionCreate.vue';
import QuestionForm from '@/views/admin/question/QuestionForm.vue';
import Bulkimportfile from '../bulkimport/Bulkimportfile.vue';
import { QUESTION_GROUPS } from '@/utils/helpers.js';

export default {
    components: { QuestionForm, Bulkimportfile },

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

        const canOpenQuestionForm = computed(() => {
            return true;
        });

        return {
            dateInput,
            question,
            submitted,
            organizations,
            toast,
            canOpenQuestionForm,
            QUESTION_GROUPS
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
        <div class="p-4">
            <QuestionForm
                v-if="canOpenQuestionForm"
                :questionMeta="{
                    organisationId: question.organization,
                    subjectId: question.subject_id,
                    chapterId: question.chapter_id,
                    topicId: question.topic_id,
                    ca_date: dateInput,
                    questionGroup: QUESTION_GROUPS.find((group) => group.key == 'CA').value
                }"
            />
        </div>
    </div>
</template>

<style scoped>
.p-editor-container ::v-deep(.p-editor-content) {
    min-height: 120px;
}
</style>
