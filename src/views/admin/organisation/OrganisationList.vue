<script>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { apiClient } from '@/service/apiService';
import { usePermissionStore, RESOURCE, ACTIONS } from '@/stores/permissionStore';

export default {
    setup() {
        const toast = useToast();
        const organizations = ref([]);
        const organizationDialog = ref(false);
        const deleteOrganizationDialog = ref(false);
        const currentOrganization = ref({});
        const submitted = ref(false);

        onMounted(() => {
            console.log('Organizations mounted');
            loadOrganizations();
        });

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

        const openNew = () => {
            currentOrganization.value = {};
            submitted.value = false;
            organizationDialog.value = true;
        };

        const hideDialog = () => {
            organizationDialog.value = false;
            submitted.value = false;
        };

        const editOrganization = (cls) => {
            console.log(cls);
            currentOrganization.value = { ...cls };
            organizationDialog.value = true;
        };

        const saveOrganization = () => {
            submitted.value = true;

            if (currentOrganization.value.name) {
                if (currentOrganization.value.id) {
                    // Update existing class
                    //apiClient.put(`/admin/organizations/${currentOrganization.value.id}`, currentOrganization.value)
                    const _org = { ...currentOrganization.value };
                    _org._method = 'PUT';
                    apiClient
                        .post(`/admin/organizations/${currentOrganization.value.id}`, _org)
                        .then(() => {
                            toast.add({ severity: 'success', summary: 'Successful', detail: 'Organization Updated', life: 3000 });
                            loadOrganizations();
                            hideDialog();
                        })
                        .catch((error) => {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update organization', life: 3000 });
                        });
                } else {
                    // Create new class
                    apiClient
                        .post('/admin/organizations', currentOrganization.value)
                        .then(() => {
                            toast.add({ severity: 'success', summary: 'Successful', detail: 'Organization Created', life: 3000 });
                            loadOrganizations();
                            hideDialog();
                        })
                        .catch((error) => {
                            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create organization', life: 3000 });
                        });
                }
            }
        };

        const confirmDeleteOrganization = (cls) => {
            currentOrganization.value = cls;
            deleteOrganizationDialog.value = true;
        };

        const deleteOrganization = () => {
            const _org = { ...currentOrganization.value };
            _org._method = 'DELETE';
            apiClient
                .post(`/admin/organizations/${currentOrganization.value.id}`, _org)
                .then(() => {
                    toast.add({ severity: 'success', summary: 'Successful', detail: 'Organization Deleted', life: 3000 });
                    loadOrganizations();
                    deleteOrganizationDialog.value = false;
                    currentOrganization.value = {};
                })
                .catch((error) => {
                    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete organization', life: 3000 });
                });
        };

        const showError = (summary, error) => {
            toast.add({
                severity: 'error',
                summary: summary,
                detail: error.message || 'Unknown error occurred',
                life: 5000
            });
        };

        return {
            organizations,
            organizationDialog,
            deleteOrganizationDialog,
            currentOrganization,
            submitted,
            openNew,
            hideDialog,
            editOrganization,
            saveOrganization,
            confirmDeleteOrganization,
            deleteOrganization,
            canCreate: () => usePermissionStore().has(RESOURCE.ORGANIZATION, ACTIONS.CREATE),
            canDelete: () => usePermissionStore().has(RESOURCE.ORGANIZATION, ACTIONS.DELETE),
            canUpdate: () => usePermissionStore().has(RESOURCE.ORGANIZATION, ACTIONS.UPDATE)
        };
    }
};
</script>

<template>
    <div class="class-management">
        <div class="card">
            <Toolbar class="mb-4">
                <template #start>
                    <h1>Orgaization Management</h1>
                </template>
                <template #end v-if="canCreate()">
                    <Button label="Add Organization" icon="pi pi-plus" class="p-button-success" @click="openNew" />
                </template>
            </Toolbar>

            <DataTable
                :value="organizations"
                :paginator="true"
                :rows="10"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} organizations"
                responsiveLayout="scroll"
            >
                <Column field="id" header="ID" :sortable="true"></Column>
                <Column field="name" header="Organization Name" :sortable="true"></Column>
                <Column header="Actions">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" v-if="canUpdate()" class="p-button-rounded p-button-success mr-2" @click="editOrganization(slotProps.data)" />
                        <Button icon="pi pi-trash" v-if="canDelete()" class="p-button-rounded p-button-danger" @click="confirmDeleteOrganization(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Class Dialog -->
        <Dialog v-model:visible="organizationDialog" :style="{ width: '450px' }" header="Class Details" :modal="true" class="p-fluid">
            <div class="field">
                <label for="className">Organization Name</label>
                <InputText id="className" v-model.trim="currentOrganization.name" required="true" autofocus :class="{ 'p-invalid': submitted && !currentOrganization.name }" />
                <small class="p-error" v-if="submitted && !currentOrganization.name">Organization name is required.</small>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveOrganization" />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="deleteOrganizationDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="currentOrganization"
                    >Are you sure you want to delete <b>{{ currentOrganization.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteOrganizationDialog = false" />
                <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteOrganization" />
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
