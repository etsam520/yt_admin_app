<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';
import { apiClient } from '@/service/apiService';

onMounted(() => {
    users.value = [];
});

const toast = useToast();
const dt = ref();
const users = ref();

const pagination = ref({
    page: 1,
    perPage: 15,
    total: 0
});
const sort = ref({
    sortBy: 'created_at',
    sortOrder: 'desc'
});

const userDialog = ref(false);

const user = ref({
    name: '',
    phone: '',
    email: '',
    image: null, // base64 image string
    imageFile: null,
    password: '',
    confirmPassword: '',
    role: ''
});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    email: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    role: { value: null, matchMode: FilterMatchMode.EQUALS }
});
const submitted = ref(false);
const errors = ref({});
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
            user.value.image = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

const submitUserForm = async () => {
    submitted.value = true; // Trigger client-side validation

    // Clear previous backend errors
    errors.value = {};

    // Basic client-side validation (optional, as backend validates too)
    let hasClientErrors = false;
    if (!user.value.name) errors.value.name = ['Name is required.'];
    if (!user.value.email) errors.value.email = ['Email is required.'];
    if (!user.value.password) errors.value.password = ['Password is required.'];
    if (user.value.password !== user.value.confirmPassword) errors.value.confirmPassword = ['Passwords do not match.'];
    if (!user.value.role) errors.value.role = ['Role is required.'];

    // You can add more robust client-side validation here if needed
    // For now, we'll rely heavily on backend errors for precise messages

    if (Object.keys(errors.value).length > 0) {
        toast.add({ severity: 'error', summary: 'Validation Failed', detail: 'Please correct the highlighted fields.', life: 3000 });
        return; // Stop submission if client-side errors exist
    }

    try {
        const formData = new FormData();
        formData.append('name', user.value.name);
        formData.append('phone', user.value.phone || ''); // Append empty string if optional
        formData.append('email', user.value.email);
        formData.append('password', user.value.password);
        formData.append('password_confirmation', user.value.confirmPassword);
        formData.append('role', user.value.role);

        if (user.value.imageFile) {
            formData.append('image', user.value.imageFile);
        }

        const response = await apiClient.post('/admin/users', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        toast.add({ severity: 'success', summary: 'Success', detail: 'User created successfully!', life: 3000 });

        hideDialog(); // Close dialog on success
    } catch (error) {
        console.error('Error saving user:', error.response?.data || error.message);

        if (error.response && error.response.status === 422 && error.response.data && error.response.data.errors) {
            errors.value = error.response.data.errors;
            toast.add({ severity: 'error', summary: 'Validation Error', detail: error.response.data.message || 'Please check the form for errors.', life: 5000 });
        } else {
            // General error toast
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save user. Please try again.', life: 5000 });
        }
    }
};

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
const _editUser = (user) => {
    console.log('Edit user:', user);
    // Implement navigation to edit form or open a dialog
};

const _confirmDelete = (user) => {
    console.log('Confirm delete for user:', user);
    // Implement a confirmation dialog and then call a delete API
};
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
                    <Button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                    <Button label="Delete" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedProducts || !selectedProducts.length" />
                </template>

                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedProducts"
                :value="users"
                dataKey="id"
                :paginator="true"
                :rows="10"
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

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="name" header="Username" sortable style="min-width: 12rem"></Column>
                <!-- <Column field="phone" header="Phone" sortable style="min-width: 16rem"></Column> -->
                <!-- <Column field="email" header="Email" sortable style="min-width: 16rem"></Column> -->
                <!-- <Column header="Image">
                    <template #body="slotProps">
                        <img :src="`https://primefaces.org/cdn/primevue/images/product/${slotProps.data.image}`" :alt="slotProps.data.image" class="rounded" style="width: 64px" />
                    </template>
                </Column> -->

                <!-- <Column field="inventoryStatus" header="Status" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.inventoryStatus" :severity="getStatusLabel(slotProps.data.inventoryStatus)" />
                    </template>
                </Column> -->
                <Column :exportable="false" style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editUser(slotProps.data)" />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteProduct(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>

            <DataTable
                :value="users"
                lazy
                paginator
                :rows="pagination.perPage"
                :totalRecords="pagination.total"
                :loading="loading"
                @page="onPageChange"
                @sort="onSortChange"
                v-model:filters="filters"
                filterDisplay="row"
                :globalFilterFields="['name', 'email', 'phone']"
                showGridlines
                dataKey="id"
            >
                <template #header>
                    <div class="flex justify-content-between flex-column sm:flex-row">
                        <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter()" />
                        <span class="p-input-icon-left">
                            <i class="pi pi-search" />
                            <InputText v-model="filters.global.value" placeholder="Keyword Search" @input="onGlobalFilterChange" />
                        </span>
                    </div>
                </template>
                <template #empty> No users found. </template>
                <template #loading> Loading users data. Please wait. </template>

                <Column field="image_url" header="Image">
                    <template #body="slotProps">
                        <img :src="slotProps.data.image_url" :alt="slotProps.data.name" class="user-image" />
                    </template>
                </Column>
                <Column field="name" header="Name" sortable filter filterPlaceholder="Search by name">
                    <template #filter="{ filterModel, filterCallback }">
                        <InputText v-model="filterModel.value" type="text" @keydown.enter="filterCallback()" class="p-column-filter" placeholder="Search by name" />
                    </template>
                </Column>
                <Column field="email" header="Email" sortable filter filterPlaceholder="Search by email">
                    <template #filter="{ filterModel, filterCallback }">
                        <InputText v-model="filterModel.value" type="text" @keydown.enter="filterCallback()" class="p-column-filter" placeholder="Search by email" />
                    </template>
                </Column>
                <Column field="phone" header="Phone"></Column>
                <Column field="role" header="Role" sortable filter>
                    <template #filter="{ filterModel, filterCallback }">
                        <Dropdown v-model="filterModel.value" :options="roleOptions" placeholder="Select a Role" class="p-column-filter" @change="filterCallback()">
                            <template #option="slotProps">
                                {{ slotProps.option.label }}
                            </template>
                        </Dropdown>
                    </template>
                </Column>
                <Column field="created_at" header="Created At" sortable></Column>
                <Column header="Actions">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-primary" @click="editUser(slotProps.data)" />
                        <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger ml-2" @click="confirmDelete(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="userDialog" :style="{ width: '500px' }" header="User Details" :modal="true">
            <div class="flex flex-col gap-6 p-4">
                <div>
                    <label class="block font-semibold mb-2">Profile Image</label>
                    <div class="flex flex-col items-center gap-4">
                        <div v-if="user.image" class="w-24 h-24 rounded-full overflow-hidden border">
                            <img :src="user.image" alt="User Image" class="w-full h-full object-cover" />
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
                    <Password id="password" v-model="user.password" :feedback="false" toggleMask :invalid="(submitted && !user.password) || errors.password" class="w-full" />
                    <small v-if="submitted && !user.password" class="text-red-500">Password is required.</small>
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

        <Dialog v-model:visible="deleteProductsDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="product">Are you sure you want to delete the selected products?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteProductsDialog = false" />
                <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedProducts" />
            </template>
        </Dialog>
    </div>
</template>
