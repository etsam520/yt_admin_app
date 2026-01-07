<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { apiClient } from '@/service/apiService';
import SetForm from '../questionSet/SetForm.vue';
import CreateQuestion from './CreateQuestion.vue';
import QuestionImportBulk from './QuestionImportBulk.vue';
import QuestionForm from '@/views/admin/question/QuestionForm.vue';
import { QUESTION_GROUPS } from '@/utils/helpers';
import { ROLES, usePermissionStore } from '@/stores/permissionStore';
import { useToast } from 'primevue';

const permissionStore = usePermissionStore();


const questions = ref([]);
const selectedQuestions = ref([]);
const edit = ref(false);
const editQuestion = ref(null);
const expandedRows = ref([]);
const showDeleteConfirm = ref(false);
const deleteSingleId = ref(null);
const createBatch = ref(false);
const createSet = ref(false);
const showQuestionsTable = ref(true);
const createQuestion = ref(false);
const bulkImportQuestion = ref(false);
const toast = useToast();

const loading = ref(false);
const filters = reactive({
    global: '',
    organization: null,
    subject: null,
    chapter: null,
    topic: null
});

const organizations = ref([
    { id: 1, name: 'Banking' },
    { id: 2, name: 'SSC' },
    { id: 3, name: 'ETS' },
    { id: 4, name: 'Railway' }
]);

const subjects = ref([]);
const chapters = ref([]);
const topics = ref([]);

async function fetchQuestions() {
    try {
        const response = await apiClient.get('/admin/questions?group=' + QUESTION_GROUPS.find((g) => g.key == 'NPQ').value);
        questions.value = response.data.data.map((q) => ({
            ...q,
            id: q.id || generateUniqueId()
        }));
        console.log(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
    }
}
const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const toggleRowExpansion = (question) => {
    const index = expandedRows.value.findIndex((id) => id === question.id);
    if (index > -1) {
        expandedRows.value.splice(index, 1);
    } else {
        expandedRows.value = [question.id]; // Only expand one at a time
    }
};
const confirmDeleteSingle = (id) => {
    deleteSingleId.value = id;
    showDeleteConfirm.value = true;
};

const confirmDeleteSelected = () => {
    deleteSingleId.value = null;
    showDeleteConfirm.value = true;
};
const handleDelete = async() => {
    console.log('Deleting questions', deleteSingleId.value);
    if (deleteSingleId.value) {
       const response = await SingleDeleteFunction(deleteSingleId.value);
       console.log(response);
    } else {
       let  __deleting = true
       let  _message = 'Deleting selected questions...';
        let  _error = false;
        selectedQuestions.value.forEach(async(question) => {
            if(_error) return;
            const response = await SingleDeleteFunction(question.id);
            if(response.status == 200) {
                console.log(`Question ID ${question.id} deleted successfully.`);
            } else {
                _error = true;
                console.error(`Failed to delete Question ID ${question.id}.`);
            }
            
        });
        if(!_error) {
            toast.add({ severity: 'success', summary: 'Success', detail: 'Selected questions deleted successfully', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Some questions could not be deleted', life: 5000 });
        }
        await fetchQuestions();
        selectedQuestions.value = [];
    }
    showDeleteConfirm.value = false;
};

const SingleDeleteFunction = (id) => {
     const _user = { _method: 'DELETE' };
    const response = apiClient.post(`/admin/questions/${id}`, _user);
    return response;
};
const handleAddToSet = () => {
    emit('add-to-set', selectedQuestions.value);
};
const handleAddQuestion = () => {
    showQuestionsTable.value = false;
    createQuestion.value = true;
    createSet.value = false;
    edit.value = false;
    bulkImportQuestion.value = false;
};

const handleEditQuestion = (data) => {
    showQuestionsTable.value = false;
    createQuestion.value = false;
    createSet.value = false;
    edit.value = true;
    editQuestion.value = data;
};

const handleImportQuestion = () => {
    showQuestionsTable.value = false;
    createQuestion.value = false;
    createSet.value = false;
    bulkImportQuestion.value = true;
    edit.value = false;
};
const handleCreateNewSet = () => {
    showQuestionsTable.value = false;
    createSet.value = true;
    createQuestion.value = false;
    bulkImportQuestion.value = false;
    edit.value = false;
};
const handleQuestionsTableShow = () => {
    showQuestionsTable.value = true;
    createSet.value = false;
    createQuestion.value = false;
    bulkImportQuestion.value = false;
    edit.value = false;
};
const handleCreateNewBatch = () => {
    emit('create-batch', selectedQuestions.value);
};

const handleEdit = (question) => {
    edit.value = true;
    question.value = question;
};
const renderLatex = (text) => {
    if (!text) return '';

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
const getImagePath = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/')) {
        return path;
    }
    return `/storage/${path.replace('./media/', '')}`;
};

onMounted(() => {
    fetchQuestions();
    fetchSubjects();
    loadOrganizations();
});

// / Computed
const filteredQuestions = computed(() => {
    return questions.value.filter((q) => {
        // console.log('q', q);
        const matchesSearch =
            !filters.global ||
            q.question_text_en.toLowerCase().includes(filters.global.toLowerCase()) ||
            // q.question_text_hi.toLowerCase().includes(filters.global.toLowerCase()) ||
            normalizeText(q.question_text_hi).includes(normalizeText(filters.global)) ||
            q.subject_name.toLowerCase().includes(filters.global.toLowerCase()) ||
            q.topic_name.toLowerCase().includes(filters.global.toLowerCase()) ||
            q.chapter_name.toLowerCase().includes(filters.global.toLowerCase());
        //

        // const matchesOrg = !filters.organization || q.test.organization_id === filters.organization
        const matchesOrg = true;
        // console.log('filter subject', filters.subject, typeof filters.subject, 'qeu sub id ',q.formattedQuestion.meta.subjectId, typeof q.formattedQuestion.meta.subjectId); ;
        const matchesSubject = !filters.subject || parseInt(q.formattedQuestion.meta.subjectId) === filters.subject;
        const matchesChapter = !filters.chapter || parseInt(q.formattedQuestion.meta.chapterId) === filters.chapter;
        const matchesTopic = !filters.topic || parseInt(q.formattedQuestion.meta.topicId) === filters.topic;
        // console.log('matchserch', matchesSearch, matchesOrg, matchesSubject);

        return matchesSearch && matchesOrg && matchesSubject && matchesChapter && matchesTopic;
    });
});

const fetchSubjects = async () => {
    loading.value = true;
    try {
        const response = await apiClient.get('/admin/category-by-depth-index?depth_index=subject');
        subjects.value = response.data.data.map((subject) => ({
            ...subject,
            id: subject.id,
            name: subject.name
        }));
    } catch (error) {
        showError('Failed to fetch sets', error);
    } finally {
        loading.value = false;
    }
};
const fetchChapters = async () => {
    loading.value = true;
    const subjectId = filters.subject;
    if (!subjectId) {
        chapters.value = null;
        loading.value = false;
        return;
    }
    try {
        const response = await apiClient.get(`/admin/category-by-depth-index?depth_index=chapter&parent_id=${subjectId}`);
        chapters.value = response.data.data.map((chapter) => ({
            ...chapter,
            id: chapter.id,
            name: chapter.name
        }));
    } catch (error) {
        showError('Failed to fetch chapters', error);
    } finally {
        loading.value = false;
    }
};

const fetchTopics = async () => {
    loading.value = true;
    const chapterId = filters.chapter;
    if (!chapterId) {
        topics.value = null;
        loading.value = false;
        return;
    }
    try {
        const response = await apiClient.get(`/admin/category-by-depth-index?depth_index=topic&parent_id=${chapterId}`);
        topics.value = response.data.data.map((topic) => ({
            ...topic,
            id: topic.id,
            name: topic.name
        }));
    } catch (error) {
        showError('Failed to fetch topics', error);
    } finally {
        loading.value = false;
    }
};

const loadOrganizations = () => {
    // fetch data from API
    apiClient
        .get('/admin/organizations')
        .then((response) => {
            organizations.value = response.data.data;
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load organizations', life: 3000 });
        });
};

watch(
    () => filters.subject,
    () => {
        filters.chapter = null;
        filters.topic = null;
        fetchChapters();
    }
);
watch(
    () => filters.chapter,
    () => {
        filters.topic = null;
        fetchTopics();
    }
);

const resetFilters = () => {
    filters.global = '';
    filters.organization = null;
    filters.subject = null;
    filters.chapter = null;
    filters.topic = null;
};

const normalizeText = (text) => (text ? text.toString().normalize('NFC').toLowerCase() : '');
</script>

<template>
    <div class="question-table-container">
        <!-- Action Toolbar  -->
        <div class="action-toolbar mb-4 p-3 bg-gray-50 rounded-md flex flex-wrap gap-2">
            <Button label="Questions" icon="pi pi-question" class="p-button-sm" :disabled="showQuestionsTable" @click="handleQuestionsTableShow" />
            <!-- <Button label="Add to Set" icon="pi pi-folder-plus" class="p-button-sm" :disabled="selectedQuestions.length === 0" @click="handleAddToSet" /> -->
            <Button label="Create Question" icon="pi pi-layer-group" class="p-button-sm" @click="handleAddQuestion" />

            <Button label="Import Question" icon="pi pi-layer-group" class="p-button-sm" @click="handleImportQuestion" />
            <!-- <Button label="Create New Set" icon="pi pi-plus-circle" class="p-button-sm" @click="handleCreateNewSet" /> -->
            <!-- <Button 
        label="Create New Batch" 
        icon="pi pi-plus-circle" 
        class="p-button-sm"
        
        @click="handleCreateNewBatch"
      /> -->
            <Button label="Delete Selected" icon="pi pi-trash" class="p-button-sm p-button-danger" :disabled="selectedQuestions.length === 0" @click="confirmDeleteSelected" />
            <span class="ml-auto text-sm text-gray-600"> {{ selectedQuestions.length }} selected </span>
        </div>

        <!-- question filter -->
        <div class="bg-white shadow rounded-lg p-4 mb-6" v-if="showQuestionsTable">
            <div class="flex flex-wrap gap-4 mb-4">
                <div class="flex-1 min-w-[200px]">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <InputText v-model="filters.global" placeholder="Search..." class="w-full" />
                </div>
                <div class="flex-1 min-w-[200px]">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                    <Dropdown v-model="filters.organization" :options="organizations" optionLabel="name" optionValue="id" placeholder="All Organizations" class="w-full" />
                </div>
                <div class="flex-1 min-w-[200px]">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <Dropdown v-model="filters.subject" :options="subjects" optionLabel="name" optionValue="id" placeholder="All Subjects" class="w-full" />
                </div>
                <div class="flex-1 min-w-[200px]">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
                    <Dropdown v-model="filters.chapter" :options="chapters" optionLabel="name" optionValue="id" placeholder="All Subjects" class="w-full" />
                </div>
                <div class="flex-1 min-w-[200px]">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                    <Dropdown v-model="filters.topic" :options="topics" optionLabel="name" optionValue="id" placeholder="All Subjects" class="w-full" />
                </div>
                <div class="flex items-end">
                    <Button label="Reset" icon="pi pi-filter-slash" class="p-button-outlined" @click="resetFilters" />
                </div>
            </div>
        </div>

        <!-- DataTable -->
        <DataTable
            v-if="showQuestionsTable"
            :value="filteredQuestions"
            v-model:selection="selectedQuestions"
            v-model:expandedRows="expandedRows"
            selectionMode="multiple"
            dataKey="id"
            :paginator="true"
            :rows="10"
            responsiveLayout="scroll"
            class="p-datatable-sm"
        >
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <!-- <Column field="serialNo" header="S.No" headerStyle="width: 5rem">
        <template #body="{index}">
          {{ index + 1 }}
        </template>
      </Column> -->
            <Column field="id" header="Q.ID" headerStyle="width: 5rem">
                <template #body="{ data }">
                    {{ data.id }}
                </template>
            </Column>
            <Column field="title" header="Question Title" headerStyle="min-width: 200px">
                <template #body="{ data }">
                    <div class="whitespace-pre-wrap" v-html="renderLatex(data.question_text_en || data.question_text_hi || '')"></div>
                </template>
            </Column>
            <Column field="subject" header="Subject" headerStyle="min-width: 120px">
                <template #body="{ data }">
                    {{ data.subject_name || '-' }}
                </template>
            </Column>
            <Column field="chapter" header="Chapter" headerStyle="min-width: 120px">
                <template #body="{ data }">
                    {{ data.chapter_name || '-' }}
                </template>
            </Column>
            <Column field="topic" header="Topic" headerStyle="min-width: 120px">
                <template #body="{ data }">
                    {{ data.topic_name || '-' }}
                </template>
            </Column>
            <Column field="createdBy" header="Created By" headerStyle="min-width: 120px" v-if="permissionStore.hasRole(ROLES.ADMIN)">
                <template #body> - Admin </template>
            </Column>
            <Column :expander="true" headerStyle="width: 4rem" />

            <!-- Expanded Row Content -->
            <template #expansion="slotProps">
                <div class="p-4 bg-gray-50">
                    <div>
                        <div class="mb-6">
                            <h4 class="font-bold mb-2">Question</h4>
                            <div>
                                <div class="text-xl font-medium text-black dark:text-white" v-if="slotProps.data.formattedQuestion.question.text?.en != null" v-html="renderLatex(slotProps.data.formattedQuestion.question.text.en)"></div>
                                <p v-if="slotProps.data.formattedQuestion.question.text?.hi != null" class="text-gray-500 dark:text-gray-400 ms-2" v-html="renderLatex(slotProps.data.formattedQuestion.question.text.hi)"></p>
                            </div>
                            <div v-if="slotProps.data.formattedQuestion.question.images.length" class="flex flex-wrap gap-2 mt-2">
                                <img v-for="(img, idx) in slotProps.data.formattedQuestion.question.images" :key="'preview-q-img-' + idx" :src="getImagePath(img.path)" class="max-h-60" />
                            </div>
                        </div>

                        <div class="mb-6">
                            <h4 class="font-bold mb-2">Options:</h4>
                            <div v-for="(option, index) in slotProps.data.formattedQuestion.options" :key="'preview-opt-' + index" class="mb-3">
                                <div class="flex items-start">
                                    <span class="font-bold mr-2">{{ String.fromCharCode(65 + index) }}.</span>
                                    <div :class="String.fromCharCode(65 + index) === slotProps.data.formattedQuestion.answer.charAt(0).toUpperCase() ? 'bg-green-100' : ''">
                                        <div class="whitespace-pre-wrap">
                                            <span v-if="option.text.en">{{ renderLatex(option.text.en) }}</span> / <span v-if="option.text.hi">{{ renderLatex(option.text.hi) }}</span>
                                        </div>
                                        <div v-if="option.images.length" class="flex flex-wrap gap-2 mt-1">
                                            <img v-for="(img, idx) in option.images" :key="'preview-o-img-' + index + '-' + idx" :src="getImagePath(img.path)" class="max-h-40" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- <div v-if="question.solution.text || question.solution.images.length" class="mb-6">
              <h4 class="font-bold mb-2">Solution:</h4>
              <div class="whitespace-pre-wrap" v-html="renderLatex(question.solution.text.en)"></div>
              <div v-if="question.solution.images.length" class="flex flex-wrap gap-2 mt-2">
                <img 
                  v-for="(img, idx) in question.solution.images" 
                  :key="'preview-s-img-'+idx" 
                  :src="getImagePath(img.path)" 
                  class="max-h-60"
                >
              </div>
            </div> -->

                        <!-- <div class="p-4  shadow rounded-md w-fit">
              <h5 class="font-bold mb-2">Tags:</h5>
              <div class="flex gap-2 flex-wrap">
                <div v-for="tag in question.tags" :key="tag" class="flex items-center gap-2 px-3 py-1 rounded-full border border-gray-300 bg-gray-100 hover:bg-gray-200 cursor-pointer transition">
                  <span for="ingredient2" class="text-sm">{{ tag }}</span>
                </div>
              </div>
            </div> 
       -->
                    </div>

                    <div class="flex justify-end gap-2 mt-4">
                        <!-- <Button 
              label="View" 
              icon="pi pi-eye" 
              class="p-button-sm"
              @click="$emit('view', slotProps.data)"
            /> -->
                        <Button label="Edit" icon="pi pi-pencil" class="p-button-sm p-button-warning" @click="handleEditQuestion(slotProps.data.formattedQuestion)" />
                        <Button label="Delete" icon="pi pi-trash" class="p-button-sm p-button-danger" @click="$emit('delete', slotProps.data.id)" />
                    </div>
                    organizations
                </div>
            </template>
        </DataTable>

        <SetForm v-if="!!createSet" />

        <CreateQuestion v-if="!!createQuestion" />
        <QuestionImportBulk v-if="!!bulkImportQuestion" />
        <QuestionForm v-if="!!edit && editQuestion != null" :qData="editQuestion" />
        <!-- <Example  v-if="!!createQuestion"/> -->

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="showDeleteConfirm" header="Confirm Delete" :style="{ width: '450px' }" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="deleteSingleId"> Are you sure you want to delete this question? </span>
                <span v-else> Are you sure you want to delete {{ selectedQuestions.length }} selected questions? </span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="showDeleteConfirm = false" class="p-button-text" />
                <Button label="Yes" icon="pi pi-check" @click="handleDelete" severity="danger" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.question-table-container {
    width: 100%;
}

.action-toolbar {
    border: 1px solid #e5e7eb;
}

.p-datatable {
    font-size: 0.875rem;
}

.p-datatable-sm .p-datatable-tbody > tr > td {
    padding: 0.5rem 1rem;
}

.katex-display {
    margin: 0.5em 0;
    overflow-x: auto;
    overflow-y: hidden;
}

.katex {
    font-size: 1.1em;
}
</style>
