<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import SetForm from './SetForm.vue';
import { apiClient } from '@/service/apiService';
import AddQuestionsToSet from './AddQuestionsToSet.vue';
import DisplaySet from '../digitalBoard/DisplaySet.vue';
import { useRoute, useRouter } from 'vue-router';

const confirm = useConfirm();
const toast = useToast();

const route = useRoute();
const router = useRouter();

// Data
const sets = ref([]);
const loading = ref(false);
const showCreateDialog = ref(false);
const showAddQuestionsDialog = ref(false);
const editingSet = ref(null);
const selectedSetId = ref(null);
const openDigitalBoard = ref(false);
const digitalBoardSet = ref(null);

const questionViewMode = ref(false);
const questionCreateMode = ref(false);

// Filters
const filters = reactive({
    global: '',
    organization: null,
    subject: null
});

const organizations = ref([
    { id: 1, name: 'Banking' },
    { id: 2, name: 'SSC' },
    { id: 3, name: 'ETS' },
    { id: 4, name: 'Railway' }
]);

const subjects = ref([]);

// Computed
const filteredSets = computed(() => {
    return sets.value.filter((set) => {
        const matchesSearch = !filters.global || set.name.toLowerCase().includes(filters.global.toLowerCase()) || set.organization_name.toLowerCase().includes(filters.global.toLowerCase());
        // set?.subject_id.toLowerCase().includes(filters.subject.toLowerCase())

        const matchesOrg = !filters.organization || set.organization_id === filters.organization;
        const matchesSubject = !filters.subject || set.subject.id === filters.subject;
        console.log('matchserch', matchesSearch, matchesOrg, matchesSubject);

        return matchesSearch && matchesOrg && matchesSubject;
    });
});

// Methods
const fetchSets = async () => {
    loading.value = true;
    try {
        const response = await apiClient.get('/admin/question-sets');
        sets.value = response.data.data.map((set) => ({
            ...set,
            organization_name: organizations.value.find((o) => o.id === set.organization_id)?.name || 'Unknown',
            subject_name: subjects.value.find((s) => s.id === set.subject_id)?.name || 'Unknown'
        }));
    } catch (error) {
        showError('Failed to fetch sets', error);
    } finally {
        loading.value = false;
    }
};

const fetchSujects = async () => {
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

const resetFilters = () => {
    filters.global = '';
    filters.organization = null;
    filters.subject = null;
};

const viewSet = (set) => {
    // Navigate to set detail view or show in dialog
    questionViewMode.value = true;
    questionCreateMode.value = false;
    selectedSetId.value = set.id;
    showAddQuestionsDialog.value = true;
};

const editSet = (set) => {
    editingSet.value = {
        id: set.id,
        name: set.name,
        description: set.description,
        is_active: set.is_active,
        is_public: set.is_public,
        password: null, // reset to null explicitly
        total_marks: set.meta.find((meta) => meta.meta_key == 'total_marks')?.meta_value || 0,
        negative_mark: set.meta.find((meta) => meta.meta_key == 'negative_mark')?.meta_value || 0
    };

    console.log('editingSet.value', editingSet.value);
    console.log('set', set);
    showCreateDialog.value = true;
};

const confirmDeleteSet = (set) => {
    confirm.require({
        message: `Are you sure you want to delete "${set.name}"?`,
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        accept: () => deleteSet(set.id),
        reject: () => {}
    });
};

const deleteSet = async (id) => {
    try {
        const _set = { _method: 'DELETE' };
        await apiClient.post(`/admin/question-sets/${id}`, _set);
        sets.value = sets.value.filter((set) => set.id !== id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Set deleted successfully',
            life: 3000
        });
    } catch (error) {
        showError('Failed to delete set', error);
    }
};

const openDigitalBoardHandler = (set) => {
    // openDigitalBoard.value = true
    // router.push(`/admin/digital-board/${set.id}`)
    router.push(`/modern-digital-board/sets/${set.id}`);
    // digitalBoardSet.value = set
};

const showAddQuestionsDialogHandler = (set) => {
    selectedSetId.value = set.id;
    showAddQuestionsDialog.value = true;
    questionViewMode.value = false;
    questionCreateMode.value = true;
    editingSet.value = null; // Reset editing set
    // Reset question view mode
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

const handleSave = (newSet) => {
    // sets.value.unshift({
    //   ...newSet,
    //   organization_name: organizations.value.find(o => o.id === newSet.organization_id)?.name || 'Unknown',
    //   subject_name: subjects.value.find(s => s.id === newSet.subject_id)?.name || 'Unknown',
    //   question_count: 0
    // })
    fetchSets();
    showCreateDialog.value = false;
    // toast.add({
    //   severity: 'success',
    //   summary: 'Success',
    //   detail: 'Set created successfully',
    //   life: 3000
    // })
};

const handleUpdate = (updatedSet) => {
    fetchSets();

    // const index = sets.value.findIndex(s => s.id === updatedSet.id)
    // if (index !== -1) {
    //   sets.value[index] = {
    //     ...updatedSet,
    //     organization_name: organizations.value.find(o => o.id === updatedSet.organization_id)?.name || 'Unknown',
    //     subject_name: subjects.value.find(s => s.id === updatedSet.subject_id)?.name || 'Unknown'
    //   }
    // }
    showCreateDialog.value = false;
    // editingSet.value = null
    // toast.add({
    //   severity: 'success',
    //   summary: 'Success',
    //   detail: 'Set updated successfully',
    //   life: 3000
    // })
};

const handleQuestionsAdded = (count) => {
    const set = sets.value.find((s) => s.id === selectedSetId.value);
    if (set) {
        set.question_count += count;
    }
    showAddQuestionsDialog.value = false;
    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `${count} questions added to set`,
        life: 3000
    });
};

const showError = (message, error) => {
    console.error(error);
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000
    });
};

// Lifecycle
onMounted(() => {
    fetchSets();
    fetchSujects();
    loadOrganizations();
});
</script>

<template>
    <div class="p-6" v-if="!openDigitalBoard">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-800">Question Sets</h1>
            <Button label="Add New Set" icon="pi pi-plus" class="p-button-primary" @click="showCreateDialog = true" />
        </div>

        <div class="bg-white shadow rounded-lg p-4 mb-6">
            <div class="flex flex-wrap gap-4 mb-4">
                <div class="flex-1 min-w-[200px]">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <InputText v-model="filters.global" placeholder="Search..." class="w-full" />
                </div>
                <div class="flex-1 min-w-[200px]">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                    <Dropdown v-model="filters.organization" :options="organizations" optionLabel="name" optionValue="id" placeholder="All Organizations" class="w-full" />
                </div>

                <div class="flex items-end">
                    <Button label="Reset" icon="pi pi-filter-slash" class="p-button-outlined" @click="resetFilters" />
                </div>
            </div>
        </div>

        <!-- Note: This component is being replaced by FolderDashboard.vue -->
        <!-- Use FolderDashboard for the new folder-based view -->
        <DataTable
            :value="filteredSets"
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[5, 10, 25, 50]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} sets"
            :loading="loading"
            responsiveLayout="scroll"
            stripedRows
        >
            <Column field="name" header="Set Name" :sortable="true">
                <template #body="{ data }">
                    <span class="font-medium">{{ data.name }}</span>
                </template>
            </Column>
            <Column field="organization_name" header="Organization" :sortable="true">
                <template #body="{ data }">
                    <span class="font-medium">{{ data.organization?.name || 'N/A' }}</span>
                </template>
            </Column>

            <Column field="question_count" header="Questions" :sortable="true">
                <template #body="{ data }">
                    <Tag :value="data.question_count" severity="info" />
                </template>
            </Column>
            <Column field="created_by" header="Created By" :sortable="true">
                <template #body="{ data }">
                    <span class="font-medium">{{ data.creator.name }}</span>
                </template>
            </Column>
            <Column header="Actions" headerStyle="width: 180px">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <Button icon="pi pi-external-link" class="p-button-rounded p-button-info p-button-text" v-tooltip.top="'Open Digital Board'" @click="openDigitalBoardHandler(data)" />
                        <Button icon="pi pi-eye" class="p-button-rounded p-button-info p-button-text" v-tooltip.top="'View Set'" @click="viewSet(data)" />
                        <Button icon="pi pi-pencil" class="p-button-rounded p-button-warning p-button-text" v-tooltip.top="'Edit Set'" @click="editSet(data)" />
                        <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text" v-tooltip.top="'Delete Set'" @click="confirmDeleteSet(data)" />
                        <Button icon="pi pi-plus" class="p-button-rounded p-button-success p-button-text" v-tooltip.top="'Add Questions'" @click="showAddQuestionsDialogHandler(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Create/Edit Dialog -->
        <Dialog v-model:visible="showCreateDialog" :header="editingSet ? 'Edit Set' : 'Create New Set'" :modal="true" :style="{ width: '50vw' }" :breakpoints="{ '960px': '75vw', '640px': '90vw' }">
            <SetForm :isEdit="!!editingSet" :initialData="editingSet || {}" @save="handleSave" @update="handleUpdate" @cancel="showCreateDialog = false" />
        </Dialog>

        <!-- Add Questions Dialog -->
        <Dialog v-model:visible="showAddQuestionsDialog" :header="questionCreateMode ? 'Add Questions to Set' : 'View Questions in Set'" :modal="true" :style="{ width: '80vw' }" :breakpoints="{ '960px': '90vw', '640px': '95vw' }">
            <AddQuestionsToSet :setId="selectedSetId" :createMode="!!questionCreateMode" :viewMode="!!questionViewMode" @questions-added="handleQuestionsAdded" @cancel="showAddQuestionsDialog = false" />
        </Dialog>

        <!-- Delete Confirmation -->
        <ConfirmDialog></ConfirmDialog>
    </div>

    <!-- <DisplaySet 
    v-if="openDigitalBoard"
    :set="digitalBoardSet"
    @close="openDigitalBoard = false"
  /> -->
</template>

<style scoped>
.p-datatable ::v-deep(.p-datatable-thead) th {
    background-color: #f9fafb;
    font-weight: 600;
}
</style>
