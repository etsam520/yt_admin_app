<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Calendar from 'primevue/calendar';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { apiClient } from '@/service/apiService';
import SetForm from '../questionSet/SetForm.vue';
import CreateQuestion from '@/views/admin/question/CreateQuestion.vue';
import { Toast, useToast } from 'primevue';
import { QUESTION_GROUPS } from '@/utils/helpers';
import { useSettings } from '@/composables/useSettings';

const props = defineProps({
    setId: {
        type: Number,
        required: true
    },
    createMode: {
        type: Boolean,
        default: true // 'add' or 'edit'
    },
    viewMode: {
        type: Boolean,
        default: false // 'view' mode
    }
    // selectedQuestions: {
    //     type: Array,
    //     default: () => []
    // },
    // expandedRows: {
    //     type: Array,
    //     default: () => []
    // }
});
const filters = reactive({
    global: '',
    organization: null,
    group: null,
    subject: null,
    chapter: null,
    topic: null,
    start_date: null,
    end_date: null,
    start_month: null,
    start_day: null,
    end_month: null,
    end_day: null
});
const organizations = ref([]);
const groups = ref(QUESTION_GROUPS);
const subjects = ref([]);
const chapters = ref([]);
const topics = ref([]);

// Month and day options for Current Affairs date filtering
const monthOptions = ref([
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 }
]);

const dayOptions = ref([
    ...Array.from({ length: 31 }, (_, i) => ({ 
        label: (i + 1).toString(), 
        value: i + 1 
    }))
]);

const questions = ref([]);
const selectedQuestions = ref([]);
const edit = ref(null);
const expandedRows = ref([]);
const showDeleteConfirm = ref(false);
const deleteSingleId = ref(null);
const createBatch = ref(false);
const showQuestionsTable = ref(true);
const createQuestion = ref(false);
const createSet = ref(false);
const removeSet = ref(false);

const toast = useToast();
const loading = ref(false);

const { settings, loading: settingsLoading, getSettings } = useSettings();
const emit = defineEmits(['add-to-set', 'toast']);

// Computed property to check if Current Affairs is selected
const isCurrentAffairs = computed(() => {
    return filters.group === QUESTION_GROUPS.find((g) => g.key === 'CA')?.value;
});

const fetchQuestionsAvalableForSet = async () => {
    try {
        const response = await apiClient.post('/admin/questionsAvalableForSet', {
            setId: props.setId,
            filters: { ...filters }
        });
        questions.value = response.data.data.map((q) => ({
            ...q,
            id: q.id || generateUniqueId()
        }));
        console.log(questions.value);
    } catch (error) {
        console.error('Error fetching questions:', error);
    }
};

const fetchQuestionsOfSet = async () => {
    try {
        const response = await apiClient.get('/admin/questionsOfSet/' + props.setId);
        questions.value = response.data.data.map((q) => ({
            ...q,
            id: q.id || generateUniqueId()
        }));
        console.log(questions.value);
    } catch (error) {
        console.error('Error fetching questions:', error);
    }
};

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

const handleAddToSet = async () => {
    const selectedIds = selectedQuestions.value.map((q) => q.id);
    if (selectedIds.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'No Questions Selected',
            detail: 'Please select at least one question to add to the set.',
            life: 3000
        });
        return;
    }
    try {
        const response = await apiClient.post(`/admin/questionsStoreToSet/${props.setId}`, { questionIds: selectedIds, setId: props.setId });
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: response.data.message,
            life: 3000
        });
        selectedQuestions.value = []; // Clear selected questions after adding
        // this.fetchQuestionsAvalableForSet(); // Refresh the questions list
        // fetchQuestionsOfSet();
        resetFilters();
    } catch (error) {
        console.error('Error adding questions to set:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add questions to the set.',
            life: 3000
        });
    }
    emit('add-to-set', selectedQuestions.value);
};

const handleAddQuestion = () => {
    showQuestionsTable.value = false;
    createQuestion.value = true;
    createSet.value = false;
    createBatch.value = false;
};

const handleRemoveQuestionsOfSet = async (setId) => {
    try {
        const response = await apiClient.post(`/admin/question-sets/${props.setId}/questions`, {
                setId: props.setId,
                questions: selectedQuestions.value.map((q) => q.id),
                _method: 'DELETE'
        });
        emit('toast', {
            severity: 'success',
            summary: 'Success',
            detail: response.data.message,
            life: 3000
        });

        selectedQuestions.value = []; // Clear selected questions after removal
        fetchQuestionsOfSet(); // Refresh the questions list
    } catch (error) {
        console.error('Error removing questions from set:', error);
        toa.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to remove questions from the set.',
            life: 3000
        });
    }
};

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
    async () => {
        filters.chapter = null;
        filters.topic = null;
        fetchChapters();

        if (props.createMode) {
            await fetchQuestionsAvalableForSet();
        } else {
            await fetchQuestionsOfSet();
        }
    }
);
watch(
    () => filters.group,
    async () => {
        console.log('group changed', filters.group, QUESTION_GROUPS.find((g) => g.key == 'CA').value);
        
        // Reset subject/chapter/topic when switching groups
        if (filters.group === QUESTION_GROUPS.find((g) => g.key == 'CA').value) {
            // Current Affairs selected - reset academic filters
            filters.subject = null;
            filters.chapter = null;
            filters.topic = null;
            subjects.value = [];
            chapters.value = [];
            topics.value = [];
            
            if (props.createMode) {
                await fetchQuestionsAvalableForSet();
            } else {
                await fetchQuestionsOfSet();
            }
        } else {
            // Other groups selected - reset date filters
            filters.start_date = null;
            filters.end_date = null;
            filters.start_month = null;
            filters.start_day = null;
            filters.end_month = null;
            filters.end_day = null;
            questions.value = [];
        }
    }
);
watch(
    () => filters.chapter,
    () => {
        filters.topic = null;
        fetchTopics();
    }
);

// Watch for date changes (Current Affairs)
watch(
    () => [filters.start_month, filters.start_day, filters.end_month, filters.end_day],
    async () => {
        if (isCurrentAffairs.value) {
            if (props.createMode) {
                await fetchQuestionsAvalableForSet();
            } else {
                await fetchQuestionsOfSet();
            }
        }
    }
);

const filteredQuestions = computed(() => {
    return questions.value.filter((q) => {
        // console.log('q', q);
        const matchesSearch =
            !filters.global ||
            q.question_text_en.toLowerCase().includes(filters.global.toLowerCase()) ||
            // q.question_text_hi.toLowerCase().includes(filters.global.toLowerCase()) ||
            normalizeText(q.question_text_hi).includes(normalizeText(filters.global)) ||
            q.subject_name?.toLowerCase().includes(filters.global.toLowerCase()) ||
            q.topic_name?.toLowerCase().includes(filters.global.toLowerCase()) ||
            q.chapter_name?.toLowerCase().includes(filters.global.toLowerCase());
        //

        // const matchesOrg = !filters.organization || q.test.organization_id === filters.organization
        const matchesOrg = true;
        // console.log('filter subject', filters.subject, typeof filters.subject, 'qeu sub id ',q.formattedQuestion.meta.subjectId, typeof q.formattedQuestion.meta.subjectId); ;
        const matchesSubject = !filters.subject || parseInt(q.formattedQuestion.meta.subjectId) === filters.subject;
        const matchesChapter = !filters.chapter || parseInt(q.formattedQuestion.meta.chapterId) === filters.chapter;
        const matchesTopic = !filters.topic || parseInt(q.formattedQuestion.meta.topicId) === filters.topic;

        return matchesSearch && matchesOrg && matchesSubject && matchesChapter && matchesTopic;
    });
});

// let debounceTimer = null
// watch(filters, () => {
//   if (debounceTimer) clearTimeout(debounceTimer)
//   debounceTimer = setTimeout(async () => {
//     if (props.createMode) {
//       await fetchQuestionsAvalableForSet()
//     } else {
//       await fetchQuestionsOfSet()
//     }
//   }, 500) // adjust delay (ms) as needed
// }, { deep: true })

const resetFilters = () => {
    filters.global = '';
    filters.organization = null;
    filters.group = null;
    filters.subject = null;
    filters.chapter = null;
    filters.topic = null;
    filters.start_date = null;
    filters.end_date = null;
    filters.start_month = null;
    filters.start_day = null;
    filters.end_month = null;
    filters.end_day = null;
};

const normalizeText = (text) => (text ? text.toString().normalize('NFC').toLowerCase() : '');

const handleEdit = (question) => {
    editQuestion.value = question;
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

const handleImageError = (event) => {
    event.target.src = '/images/image-placeholder.png';
};

onMounted(async function () {
    await getSettings('questions');
    if(!props.createMode) {
      fetchQuestionsOfSet()
    }

    fetchSubjects();
    loadOrganizations();
});
</script>

<template>
    <div class="question-table-container">
        <!-- Action Toolbar  -->
        <div class="action-toolbar mb-4 p-3 bg-gray-50 rounded-md flex flex-wrap gap-2">
            <Button v-if="!!createMode" label="Add to Set" icon="pi pi-folder-plus" class="p-button-sm" :disabled="selectedQuestions.length === 0" @click="handleAddToSet" />
            <Button v-if="!!viewMode" label="Remove from Set" icon="pi pi-folder-minus" class="p-button-sm" :disabled="selectedQuestions.length === 0" @click="handleRemoveQuestionsOfSet" />

            <span class="ml-auto text-sm text-gray-600"> {{ selectedQuestions.length }} selected </span>
        </div>

        <!-- question filter -->
        <div class="bg-white shadow rounded-lg p-4 mb-6">
            <div class="flex flex-wrap gap-4 mb-4">
                <div class="flex-1 min-w-[200px]">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <InputText v-model="filters.global" placeholder="Search..." class="w-full" />
                </div>
                <div class="flex-1 min-w-[200px]" v-if="createMode">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                    <Dropdown v-model="filters.organization" :options="organizations" optionLabel="name" optionValue="id" placeholder="All Organizations" class="w-full" />
                </div>
                <div class="flex-1 min-w-[200px]" v-if="createMode">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Groups</label>
                    <Dropdown v-model="filters.group" :options="groups" optionLabel="label" optionValue="value" placeholder="All Groups" class="w-full" />
                </div>
                <!-- Academic Fields (hidden for Current Affairs) -->
                <div class="flex-1 min-w-[200px]" v-if="createMode && !isCurrentAffairs">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <Dropdown v-model="filters.subject" :options="subjects" optionLabel="name" optionValue="id" placeholder="All Subjects" class="w-full" />
                </div>
                <div class="flex-1 min-w-[200px]" v-if="createMode && !isCurrentAffairs">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
                    <Dropdown v-model="filters.chapter" :options="chapters" optionLabel="name" optionValue="id" placeholder="All Chapters" class="w-full" />
                </div>
                <div class="flex-1 min-w-[200px]" v-if="createMode && !isCurrentAffairs">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                    <Dropdown v-model="filters.topic" :options="topics" optionLabel="name" optionValue="id" placeholder="All Topics" class="w-full" />
                </div>
                
                <!-- Date Range Fields (only for Current Affairs) -->
                <div class="flex-1 min-w-[200px]" v-if="createMode && isCurrentAffairs">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Start Date (Month-Day)</label>
                    <div class="flex gap-2">
                        <Dropdown 
                            v-model="filters.start_month" 
                            :options="monthOptions" 
                            optionLabel="label" 
                            optionValue="value" 
                            placeholder="Month" 
                            class="flex-1" 
                        />
                        <Dropdown 
                            v-model="filters.start_day" 
                            :options="dayOptions" 
                            optionLabel="label" 
                            optionValue="value" 
                            placeholder="Day" 
                            class="flex-1" 
                        />
                    </div>
                </div>
                <div class="flex-1 min-w-[200px]" v-if="createMode && isCurrentAffairs">
                    <label class="block text-sm font-medium text-gray-700 mb-1">End Date (Month-Day)</label>
                    <div class="flex gap-2">
                        <Dropdown 
                            v-model="filters.end_month" 
                            :options="monthOptions" 
                            optionLabel="label" 
                            optionValue="value" 
                            placeholder="Month" 
                            class="flex-1" 
                        />
                        <Dropdown 
                            v-model="filters.end_day" 
                            :options="dayOptions" 
                            optionLabel="label" 
                            optionValue="value" 
                            placeholder="Day" 
                            class="flex-1" 
                        />
                    </div>
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
            <Column field="serialNo" header="S.No" headerStyle="width: 5rem">
                <template #body="{ index }">
                    {{ index + 1 }}
                </template>
            </Column>
            <Column field="title" header="Question Title" headerStyle="min-width: 200px">
                <template #body="{ data }">
                     <div class="whitespace-pre-wrap" v-html="renderLatex(settings?.questions?.displayLanguagePreference === 'en' 
                    ? (data.question_text_en || data.question_text_hi || '')
                    : data.question_text_hi || data.question_text_en || '')"></div>
                </template>
            </Column>
            <Column field="organisation" header="Organisation" headerStyle="min-width: 120px">
            <template #body="{ data }">
                {{ data.organisation_name || '-' }}
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
            <Column field="createdBy" header="Created By" headerStyle="min-width: 120px">
                <template #body> - Admin </template>
            </Column>
            <!-- <Column :expander="true" headerStyle="width: 4rem" /> -->
            <Column :expander="false" headerStyle="width: 4rem" />

            <!-- Expanded Row Content -->
            <template #expansion="slotProps">
                <div class="p-4 bg-gray-50">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h5 class="font-semibold mb-2">Options:</h5>
                            <template v-if="slotProps.data.options && slotProps.data.options.length">
                                <div v-for="(opt, optIdx) in slotProps.data.options" :key="optIdx" class="mb-3">
                                    <div class="flex">
                                        <span class="font-medium mr-2">{{ String.fromCharCode(65 + optIdx) }}.</span>
                                        <div class="whitespace-pre-wrap" v-html="renderLatex((opt.text && opt.text.en) || '')"></div>
                                    </div>
                                    <div v-if="opt.images && opt.images.length" class="flex flex-wrap gap-2 mt-1 ml-6">
                                        <img v-for="(img, imgIdx) in opt.images" :key="imgIdx" :src="getImagePath(img.path)" class="max-h-24" @error="handleImageError" />
                                    </div>
                                </div>
                            </template>
                            <div v-else class="text-gray-500">No options available</div>
                        </div>

                        <div>
                            <div class="mb-3">
                                <h5 class="font-semibold">Correct Answer:</h5>
                                <div class="whitespace-pre-wrap" v-html="renderLatex((slotProps.data.answer && slotProps.data.answer.text && slotProps.data.answer.text.en) || '')"></div>
                                <div v-if="slotProps.data.answer && slotProps.data.answer.images && slotProps.data.answer.images.length" class="flex flex-wrap gap-2 mt-2">
                                    <img v-for="(img, imgIdx) in slotProps.data.answer.images" :key="imgIdx" :src="getImagePath(img.path)" class="max-h-24" @error="handleImageError" />
                                </div>
                            </div>

                            <div v-if="slotProps.data.formattedQuestion?.solution?.text?.en || slotProps.data.formattedQuestion?.solution?.images?.length" class="mb-3">
                                <h5 class="font-semibold">Solution:</h5>
                                <div class="whitespace-pre-wrap" v-html="renderLatex(slotProps.data.formattedQuestion?.solution?.text?.en || '')"></div>
                                <div v-if="slotProps.data.formattedQuestion?.solution?.images?.length" class="flex flex-wrap gap-2 mt-2">
                                    <img v-for="(img, imgIdx) in slotProps.data.formattedQuestion.solution.images" :key="imgIdx" :src="getImagePath(img.path)" class="max-h-24" @error="handleImageError" />
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <h5 class="font-semibold">Positive Marks:</h5>
                                    <p>{{ slotProps.data.formattedQuestion.positive_marks || '0' }}</p>
                                </div>
                                <div>
                                    <h5 class="font-semibold">Negative Marks:</h5>
                                    <p>{{ slotProps.data.formattedQuestion.negative_marks || 25 }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2 mt-4">
                        <Button label="View" icon="pi pi-eye" class="p-button-sm" @click="$emit('view', slotProps.data)" />
                        <Button label="Edit" icon="pi pi-pencil" class="p-button-sm p-button-warning" @click="$emit('edit', slotProps.data)" />
                        <Button label="Delete" icon="pi pi-trash" class="p-button-sm p-button-danger" @click="$emit('delete', slotProps.data.id)" />
                    </div>
                </div>
            </template>
        </DataTable>

        <SetForm v-if="!!createSet" />

        <CreateQuestion v-if="!!createQuestion" />

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
