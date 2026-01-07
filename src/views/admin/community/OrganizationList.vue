<script>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import ClassService from '@/services/ClassService';

export default {
    setup() {
        const toast = useToast();
        const classes = ref([]);
        const classDialog = ref(false);
        const deleteClassDialog = ref(false);
        const currentClass = ref({});
        const submitted = ref(false);
        const loading = ref(false);
        const saving = ref(false);
        const deleting = ref(false);

        onMounted(() => {
            loadClasses();
        });

        const loadClasses = async () => {
            loading.value = true;
            try {
                const response = await ClassService.getAll();
                classes.value = response.data;
            } catch (error) {
                showError('Failed to load classes', error);
            } finally {
                loading.value = false;
            }
        };

        const openNew = () => {
            currentClass.value = {};
            submitted.value = false;
            classDialog.value = true;
        };

        const hideDialog = () => {
            classDialog.value = false;
            submitted.value = false;
        };

        const editClass = (cls) => {
            currentClass.value = { ...cls };
            classDialog.value = true;
        };

        const saveClass = async () => {
            submitted.value = true;

            if (currentClass.value.className) {
                saving.value = true;
                try {
                    if (currentClass.value.id) {
                        // Update existing class
                        await ClassService.update(currentClass.value.id, currentClass.value);
                        toast.add({ severity: 'success', summary: 'Successful', detail: 'Class Updated', life: 3000 });
                    } else {
                        // Create new class
                        await ClassService.create(currentClass.value);
                        toast.add({ severity: 'success', summary: 'Successful', detail: 'Class Created', life: 3000 });
                    }
                    loadClasses();
                    hideDialog();
                } catch (error) {
                    showError('Failed to save class', error);
                } finally {
                    saving.value = false;
                }
            }
        };

        const confirmDeleteClass = (cls) => {
            currentClass.value = cls;
            deleteClassDialog.value = true;
        };

        const deleteClass = async () => {
            deleting.value = true;
            try {
                await ClassService.delete(currentClass.value.id);
                toast.add({ severity: 'success', summary: 'Successful', detail: 'Class Deleted', life: 3000 });
                loadClasses();
                deleteClassDialog.value = false;
                currentClass.value = {};
            } catch (error) {
                showError('Failed to delete class', error);
            } finally {
                deleting.value = false;
            }
        };

        const showError = (summary, error) => {
            toast.add({
                severity: 'error',
                summary: summary,
                detail: error.response?.data?.message || error.message || 'Unknown error occurred',
                life: 5000
            });
        };

        return {
            classes,
            classDialog,
            deleteClassDialog,
            currentClass,
            submitted,
            loading,
            saving,
            deleting,
            openNew,
            hideDialog,
            editClass,
            saveClass,
            confirmDeleteClass,
            deleteClass
        };
    }
};
</script>

<template>
    <div class="class-management">
        <div class="card">
            <Toolbar class="mb-4">
                <template #start>
                    <h1>Class Management</h1>
                </template>
                <template #end>
                    <Button label="Add Class" icon="pi pi-plus" class="p-button-success" @click="openNew" />
                </template>
            </Toolbar>

            <DataTable
                :value="classes"
                :loading="loading"
                :paginator="true"
                :rows="10"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} classes"
                responsiveLayout="scroll"
            >
                <Column field="id" header="ID" :sortable="true"></Column>
                <Column field="className" header="Class Name" :sortable="true"></Column>
                <Column header="Actions">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editClass(slotProps.data)" />
                        <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="confirmDeleteClass(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Class Dialog -->
        <Dialog v-model:visible="classDialog" :style="{ width: '450px' }" header="Class Details" :modal="true" class="p-fluid">
            <div class="field">
                <label for="className">Class Name</label>
                <InputText id="className" v-model.trim="currentClass.className" required="true" autofocus :class="{ 'p-invalid': submitted && !currentClass.className }" />
                <small class="p-error" v-if="submitted && !currentClass.className">Class name is required.</small>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveClass" :loading="saving" />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="deleteClassDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="currentClass"
                    >Are you sure you want to delete <b>{{ currentClass.className }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteClassDialog = false" />
                <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteClass" :loading="deleting" />
            </template>
        </Dialog>

        <Toast />
    </div>
</template>

<style scoped>
.class-management {
    padding: 2rem;
}
</style>

<!-- organizations -->
