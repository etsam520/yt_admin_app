<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';
import { apiClient } from '@/service/apiService';
import { DynamicDialog } from 'primevue';
import { usePermissionStore, RESOURCE, ACTIONS } from '@/stores/permissionStore';

const toast = useToast();
const permissionStore = usePermissionStore();
const canCreate = () => permissionStore.has(RESOURCE.USER, ACTIONS.CREATE);
const canDelete = () => permissionStore.has(RESOURCE.USER, ACTIONS.DELETE);
const canUpdate = () => permissionStore.has(RESOURCE.USER, ACTIONS.UPDATE);
const dt = ref();
const users = ref();
const loading = ref(true);
const pagination = ref({
    page: 1,
    perPage: 15,
    total: 0
});
const sort = ref({
    sortBy: 'created_at',
    sortOrder: 'desc'
});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    email: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    role: { value: null, matchMode: FilterMatchMode.EQUALS }
});
const roleOptions = ref([
    { label: 'All Roles', value: null }, // Option to clear role filter
    { label: 'Teacher', value: 'teacher' },
    { label: 'Student', value: 'student' },
    { label: 'Admin', value: 'admin' }
]);
const statuses = ref([
    { label: 'INSTOCK', value: 'instock' },
    { label: 'LOWSTOCK', value: 'lowstock' },
    { label: 'OUTOFSTOCK', value: 'outofstock' }
]);

// State variables for Add/Edit User Dialog
const userDialog = ref(false);
const dialogMode = ref('add'); // 'add' or 'edit'
const deleteUserDialog = ref(false);
const deleteUsersDialog = ref(false);
const submitted = ref(false); // For client-side validation
const errors = ref({}); // For backend validation errors
const selectedUsers = ref();

const user = ref({
    id: null, // New: To store user ID for edit mode
    name: '',
    phone: '',
    email: '',
    imageFile: null, // Stores the actual File object for upload
    imagePreviewUrl: null, // Stores the Data URL for preview
    image_url: null, // Stores the existing image URL when editing
    password: null,
    confirmPassword: null,
    role: null
});

const originalEmail = ref(null); // To store original email for unique validation on backend
const originalPhone = ref(null); // To store original phone for unique validation on backend

onMounted(() => {
    fetchUsers();
});

function openNew() {
    submitted.value = false;
    userDialog.value = true;
}

const hideDialog = () => {
    userDialog.value = false;
    // Optionally reset form and errors when dialog is hidden
    user.value = {
        id: null,
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        image: null,
        imageFile: null
    };
    errors.value = {}; // Clear errors
    submitted.value = false;
};

const openEditUserDialog = (userData) => {
    dialogMode.value = 'edit';
    // Populate the user object with existing data
    user.value = {
        ...userData,
        imageFile: null, // Ensure imageFile is null, only set if a new file is chosen
        imagePreviewUrl: userData.image_url, // Use existing image_url for preview
        password: '',
        confirmPassword: ''
    };
    originalEmail.value = userData.email; // Store original email
    originalPhone.value = userData.phone; // Store original phone
    errors.value = {}; // Clear errors
    submitted.value = false;
    userDialog.value = true;
};

function editUser(prod) {
    console.log(prod);
    user.value = { ...prod };
    userDialog.value = true;
}
function onImageSelected(event) {
    const file = event.target.files[0];
    user.value.imageFile = file;

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            user.value.imagePreviewUrl = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

const submitUserForm = async () => {
    submitted.value = true; // Trigger client-side validation
    errors.value = {}; // Clear previous backend errors

    // Basic client-side validation
    if (!user.value.name) errors.value.name = ['Name is required.'];
    if (!user.value.email) errors.value.email = ['Email is required.'];
    if (!user.value.phone) errors.value.email = ['Phone is required.'];
    if (!user.value.role) errors.value.role = ['Role is required.'];

    // Password validation conditional on dialog mode and if password is provided
    console.info('pass vale: ', user.value.password);
    if (dialogMode.value == 'add' || user.value.password) {
        console.info('pass inside: ', user.value.password);
        if (!user.value.password) errors.value.password = ['Password is required.'];
        if (user.value.password !== user.value.confirmPassword) errors.value.confirmPassword = ['Passwords do not match.'];
    }

    if (Object.keys(errors.value).length > 0) {
        toast.add({ severity: 'error', summary: 'Validation Failed', detail: 'Please correct the highlighted fields.', life: 3000 });
        return;
    }

    try {
        const formData = new FormData();
        formData.append('name', user.value.name);
        formData.append('phone', user.value.phone || '');
        formData.append('email', user.value.email);
        formData.append('role', user.value.role);

        // Or if in add mode (they are required)
        if (user.value.password) {
            formData.append('password', user.value.password);
            formData.append('password_confirmation', user.value.confirmPassword);
        }

        // Handle image upload
        if (user.value.imageFile) {
            formData.append('image', user.value.imageFile);
        }

        let response;
        if (dialogMode.value === 'add') {
            response = await apiClient.post('/admin/users', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.add({ severity: 'success', summary: 'Success', detail: 'User created successfully!', life: 3000 });
        } else {
            formData.append('_method', 'PUT'); // Or 'PATCH'originalEmail.value
            if (user.value.email !== originalEmail.value) {
                formData.set('email', user.value.email || originalEmail.value);
            }

            if (user.value.phone !== originalPhone.value) {
                formData.set('phone', user.value.phone || originalPhone.value);
            }
            response = await apiClient.post(`/admin/users/${user.value.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.add({ severity: 'success', summary: 'Success', detail: 'User updated successfully!', life: 3000 });
        }

        console.log('User saved/updated:', response.data);
        hideDialog(); // Close dialog on success
        fetchUsers(); // Refresh the user list after save/update
    } catch (error) {
        console.log(error);
        console.error('Error saving/updating user:', error.response?.data || error.message);
        if (error.response && error.response.status === 422 && error.response.data && error.response.data.errors) {
            errors.value = error.response.data.errors;
            toast.add({ severity: 'error', summary: 'Validation Error', detail: error.response.data.message || 'Please check the form for errors.', life: 5000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save/update user. Please try again.', life: 5000 });
        }
    }
};
function confirmDeleteUser(prod) {
    user.value = prod;
    deleteUserDialog.value = true;
}
function confirmDeleteSelected() {
    deleteUsersDialog.value = true;
}

// Function to fetch users from the API
const fetchUsers = async () => {
    loading.value = true;
    try {
        const params = {
            page: pagination.value.page,
            per_page: pagination.value.perPage,
            sort_by: sort.value.sortBy,
            sort_order: sort.value.sortOrder
        };

        // Add filters to params if they have values
        if (filters.value.global.value) {
            params.search = filters.value.global.value;
        }
        if (filters.value.name.value) {
            params.name = filters.value.name.value; // Backend would need to handle this as specific filter
        }
        if (filters.value.email.value) {
            params.email = filters.value.email.value; // Backend would need to handle this
        }
        if (filters.value.role.value) {
            params.role = filters.value.role.value;
        }

        const response = await apiClient.get('/admin/users', {
            params: params
        });

        users.value = response.data.data; // The actual user data is in response.data.data
        pagination.value.total = response.data.meta.total;
        pagination.value.perPage = response.data.meta.per_page;
        pagination.value.page = response.data.meta.current_page;
    } catch (error) {
        console.error('Error fetching users:', error);
        // Optionally show a toast message for the error
    } finally {
        loading.value = false;
    }
};
const onPageChange = (event) => {
    pagination.value.page = event.page + 1; // PrimeVue's page is 0-indexed
    pagination.value.perPage = event.rows;
    fetchUsers();
};

const onSortChange = (event) => {
    sort.value.sortBy = event.sortField;
    sort.value.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc'; // 1 for asc, -1 for desc
    fetchUsers();
};
let debounceTimeout = null;
const onGlobalFilterChange = () => {
    if (debounceTimeout) {
        clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => {
        pagination.value.page = 1; // Reset to first page on search
        fetchUsers();
    }, 300); // Debounce for 300ms
};
const clearFilter = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        email: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        role: { value: null, matchMode: FilterMatchMode.EQUALS }
    };
    pagination.value.page = 1; // Reset to first page
    sort.value.sortBy = 'created_at';
    sort.value.sortOrder = 'desc';
    fetchUsers();
};
// Action button handlers (placeholders)
function deleteUser() {
    if (!user.value || !user.value.id) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No user selected for deletion.', life: 3000 });
        return;
    }
    const _user = { _method: 'DELETE' };
    apiClient
        .post(`/admin/users/${user.value.id}`, _user)
        .then(() => {
            fetchUsers();
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Deleted', life: 3000 });
            deleteUserDialog.value = false;
        })
        .catch((error) => {
            console.error('Error deleting user:', error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete user. Please try again.', life: 5000 });
        });
}

watch(
    () => filters.value.role.value,
    () => {
        pagination.value.page = 1; // Reset to first page when role filter changes
        fetchUsers();
    }
);
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="New" v-if="canCreate()" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                    <Button label="Delete" v-if="canDelete()" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedUsers || !selectedUsers.length" />
                </template>

                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedUsers"
                :value="users"
                dataKey="id"
                paginator
                :rows="pagination.perPage"
                :totalRecords="pagination.total"
                :loading="loading"
                @page="onPageChange"
                @sort="onSortChange"
                :filters="filters"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manage Users</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </IconField>
                    </div>
                </template>
                <template #empty> No users found. </template>
                <template #loading> Loading users data. Please wait. </template>
                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="name" header="Username" sortable style="min-width: 12rem"></Column>
                <Column field="phone" header="Phone" sortable style="min-width: 16rem"></Column>
                <Column field="email" header="Email" sortable style="min-width: 16rem"></Column>
                <Column header="Image">
                    <template #body="slotProps">
                        <img :src="slotProps.data.image_url" :alt="slotProps.data.name" class="rounded" style="width: 64px" />
                    </template>
                </Column>

                <!-- <Column field="inventoryStatus" header="Status" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.inventoryStatus" :severity="getStatusLabel(slotProps.data.inventoryStatus)" />
                    </template>
                </Column> -->
                <Column :exportable="false" style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button v-if="canUpdate()" icon="pi pi-pencil" outlined rounded class="mr-2" @click="openEditUserDialog(slotProps.data)" />
                        <Button v-if="canDelete()" icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteUser(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="userDialog" :style="{ width: '500px' }" :header="dialogMode === 'add' ? 'Add New User' : 'Edit User'" :modal="true">
            <div class="flex flex-col gap-6 p-4">
                <div>
                    <label class="block font-semibold mb-2">Profile Image</label>
                    <div class="flex flex-col items-center gap-4">
                        <div v-if="user.imagePreviewUrl" class="w-24 h-24 rounded-full overflow-hidden border">
                            <img :src="user.imagePreviewUrl" alt="User Image" class="w-full h-full object-cover" />
                        </div>
                        <input type="file" accept="image/*" @change="onImageSelected" class="file:px-4 file:py-2 file:border-0 file:bg-blue-600 file:text-white file:rounded cursor-pointer" />
                    </div>
                    <small v-if="errors.image" class="text-red-500">{{ errors.image[0] }}</small>
                </div>

                <div>
                    <label for="name" class="block font-semibold mb-1">Name</label>
                    <InputText id="name" v-model.trim="user.name" :invalid="(submitted && !user.name) || errors.name" class="w-full" />
                    <small v-if="submitted && !user.name" class="text-red-500">Name is required.</small>
                    <small v-else-if="errors.name" class="text-red-500">{{ errors.name[0] }}</small>
                </div>

                <div>
                    <label for="phone" class="block font-semibold mb-1">Phone</label>
                    <InputText id="phone" v-model.trim="user.phone" :invalid="(submitted && !user.phone) || errors.phone" class="w-full" />
                    <small v-if="submitted && !user.phone" class="text-red-500">Phone is required.</small>
                    <small v-else-if="errors.phone" class="text-red-500">{{ errors.phone[0] }}</small>
                </div>

                <div>
                    <label for="email" class="block font-semibold mb-1">Email</label>
                    <InputText id="email" v-model.trim="user.email" :invalid="(submitted && !user.email) || errors.email" class="w-full" />
                    <small v-if="submitted && !user.email" class="text-red-500">Email is required.</small>
                    <small v-else-if="errors.email" class="text-red-500">{{ errors.email[0] }}</small>
                </div>

                <div>
                    <label for="password" class="block font-semibold mb-1">Password</label>
                    <Password id="password" v-model="user.password" :feedback="false" toggleMask :invalid="(submitted && dialogMode.value == 'add' && !user.password) || errors.password" class="w-full" />
                    <small v-if="submitted && dialogMode.value == 'add' && !user.password" class="text-red-500">Password is required.</small>
                    <small v-else-if="errors.password" class="text-red-500">{{ errors.password[0] }}</small>
                </div>

                <div>
                    <label for="confirmPassword" class="block font-semibold mb-1">Confirm Password</label>
                    <Password id="confirmPassword" v-model="user.confirmPassword" :feedback="false" toggleMask :invalid="(submitted && user.password !== user.confirmPassword) || errors.confirmPassword" class="w-full" />
                    <small v-if="submitted && user.password !== user.confirmPassword" class="text-red-500">Passwords do not match.</small>
                    <small v-else-if="errors.confirmPassword" class="text-red-500">{{ errors.confirmPassword[0] }}</small>
                </div>

                <div>
                    <span class="block font-semibold mb-2">User Role</span>
                    <div class="flex gap-6">
                        <div class="flex items-center gap-2">
                            <RadioButton id="student" v-model="user.role" name="role" value="student" />
                            <label for="student">Student</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <RadioButton id="teacher" v-model="user.role" name="role" value="teacher" />
                            <label for="teacher">Teacher</label>
                        </div>
                    </div>
                    <small v-if="errors.role" class="text-red-500">{{ errors.role[0] }}</small>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2 px-4 pb-4">
                    <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
                    <Button label="Save" icon="pi pi-check" @click="submitUserForm" />
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteUserDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="user"
                    >Are you sure you want to delete <b>{{ user.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteUserDialog = false" />
                <Button label="Yes" icon="pi pi-check" @click="deleteUser" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteUsersDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="product">Are you sure you want to delete the selected products?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteUserDialog = false" />
                <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedProducts" />
            </template>
        </Dialog>
    </div>
</template>
