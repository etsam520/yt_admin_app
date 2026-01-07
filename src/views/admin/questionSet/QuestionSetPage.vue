<script>
import SetForm from './SetForm.vue';
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

export default {
    components: { SetForm },
    setup() {
        const toast = useToast();
        const sets = ref({ data: [] });
        const loading = ref(false);
        const selectedSets = ref([]);
        const bulkAction = ref(null);
        const displayDialog = ref(false);
        const displayDeleteDialog = ref(false);
        const isEdit = ref(false);
        const selectedSet = ref(null);
        const setToDelete = ref(null);

        const bulkActions = [
            { label: 'Activate', value: 'activate' },
            { label: 'Deactivate', value: 'deactivate' },
            { label: 'Delete', value: 'delete' }
        ];

        const fetchSets = async () => {
            loading.value = true;
            try {
                const response = await axios.get('/api/sets');
                sets.value = response.data;
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to fetch sets',
                    life: 3000
                });
            } finally {
                loading.value = false;
            }
        };

        const openCreateDialog = () => {
            isEdit.value = false;
            selectedSet.value = null;
            displayDialog.value = true;
        };

        const editSet = (set) => {
            isEdit.value = true;
            selectedSet.value = { ...set };
            displayDialog.value = true;
        };

        const confirmDeleteSet = (id) => {
            setToDelete.value = id;
            displayDeleteDialog.value = true;
        };

        const deleteSet = async () => {
            try {
                await axios.delete(`/api/sets/${setToDelete.value}`);
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Set deleted successfully',
                    life: 3000
                });
                fetchSets();
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to delete set',
                    life: 3000
                });
            } finally {
                displayDeleteDialog.value = false;
                setToDelete.value = null;
            }
        };

        const applyBulkAction = async () => {
            if (!bulkAction.value || selectedSets.value.length === 0) return;

            try {
                await axios.post('/api/sets/bulk-action', {
                    ids: selectedSets.value.map((s) => s.id),
                    action: bulkAction.value
                });

                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Bulk ${bulkAction.value} completed`,
                    life: 3000
                });

                fetchSets();
                selectedSets.value = [];
                bulkAction.value = null;
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to perform bulk action',
                    life: 3000
                });
            }
        };

        const handleFormSubmit = () => {
            displayDialog.value = false;
            fetchSets();
        };

        onMounted(fetchSets);

        return {
            sets,
            loading,
            selectedSets,
            bulkAction,
            bulkActions,
            displayDialog,
            displayDeleteDialog,
            isEdit,
            selectedSet,
            setToDelete,
            openCreateDialog,
            editSet,
            confirmDeleteSet,
            deleteSet,
            applyBulkAction,
            handleFormSubmit
        };
    },
    filters: {
        truncate(text, length) {
            if (!text) return '';
            if (text.length <= length) return text;
            return text.substring(0, length) + '...';
        }
    }
};
</script>

<template>
    <div class="card p-4">
        <Toast />

        <div class="flex justify-content-between align-items-center mb-4">
            <h1 class="text-2xl font-bold">Sets Management</h1>
            <Button label="Create New Set" icon="pi pi-plus" @click="openCreateDialog" />
        </div>

        <div class="card">
            <div class="flex justify-content-between align-items-center p-4 border-bottom-1 surface-border">
                <h3 class="text-xl m-0">Sets List</h3>
                <div class="flex gap-2">
                    <Dropdown v-model="bulkAction" :options="bulkActions" optionLabel="label" optionValue="value" placeholder="Bulk Actions" class="w-10rem" />
                    <Button label="Apply" :disabled="!bulkAction || selectedSets.length === 0" @click="applyBulkAction" />
                </div>
            </div>

            <DataTable
                v-model:selection="selectedSets"
                :value="sets.data"
                :paginator="true"
                :rows="10"
                :loading="loading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} sets"
                responsiveLayout="scroll"
            >
                <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                <Column field="name" header="Name" sortable></Column>
                <Column field="description" header="Description">
                    <template #body="{ data }">
                        {{ data.description | truncate(50) }}
                    </template>
                </Column>
                <Column field="is_active" header="Status" sortable>
                    <template #body="{ data }">
                        <Tag :value="data.is_active ? 'Active' : 'Inactive'" :severity="data.is_active ? 'success' : 'danger'" />
                    </template>
                </Column>
                <Column field="is_public" header="Visibility" sortable>
                    <template #body="{ data }">
                        <Tag :value="data.is_public ? 'Public' : 'Private'" :severity="data.is_public ? 'info' : 'warning'" />
                    </template>
                </Column>
                <Column field="course.name" header="Course">
                    <template #body="{ data }">
                        {{ data.course?.name || 'N/A' }}
                    </template>
                </Column>
                <Column field="trade_node.name" header="Trade Node">
                    <template #body="{ data }">
                        {{ data.trade_node?.name || 'N/A' }}
                    </template>
                </Column>
                <Column header="Actions">
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success" @click="editSet(data)" />
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="confirmDeleteSet(data.id)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Create/Edit Dialog -->
        <Dialog v-model:visible="displayDialog" :header="isEdit ? 'Edit Set' : 'Create Set'" :modal="true" :style="{ width: '50vw' }">
            <SetForm :isEdit="isEdit" :existingSet="selectedSet" @submit="handleFormSubmit" @cancel="displayDialog = false" />
        </Dialog>

        <!-- Delete Confirmation -->
        <Dialog v-model:visible="displayDeleteDialog" header="Confirm Deletion" :modal="true" :style="{ width: '30vw' }">
            <p>Are you sure you want to delete this set?</p>
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="displayDeleteDialog = false" class="p-button-text" />
                <Button label="Yes" icon="pi pi-check" @click="deleteSet" class="p-button-danger" autofocus />
            </template>
        </Dialog>
    </div>
</template>
