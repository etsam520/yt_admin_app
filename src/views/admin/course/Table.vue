<script setup>
import { ref, onMounted } from 'vue';
import { apiClient } from '@/service/apiService'; // Your API client
import { useRouter } from 'vue-router'; // To navigate for editing
import { useToast } from 'primevue/usetoast'; // For notifications
import { useConfirm } from 'primevue/useconfirm'; // For confirmation dialog

// PrimeVue Component Imports
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog'; // For the confirmation dialog

const props = defineProps({
    tradeNodeId: {
        type: Number,
        default: null
    }
});

const emit = defineEmits(['edit-course']); // Define emits for editing course

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const courses = ref([]);
const loading = ref(true);

const fetchCourses = async () => {
    loading.value = true;
    try {
        const response = await apiClient.get('/admin/courses?trade_node=' + props.tradeNodeId); // Adjust this endpoint if needed
        courses.value = response.data;
    } catch (error) {
        console.error('Error fetching courses:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load courses.', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const editCourse = (course) => {
    emit('edit-course', course); // You'd need to define emits for this
};

const confirmDeleteCourse = (course) => {
    confirm.require({
        message: `Are you sure you want to delete the course "${course.name}"?`,
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            await deleteCourse(course.id);
        },
        reject: () => {
            toast.add({ severity: 'info', summary: 'Cancelled', detail: 'Deletion cancelled.', life: 3000 });
        }
    });
};

const deleteCourse = async (id) => {
    try {
        const _course = { _method: 'DELETE' };
        await apiClient.post(`/admin/courses/${id}`, _course);
        //
        toast.add({ severity: 'success', summary: 'Success', detail: 'Course deleted successfully.', life: 3000 });
        fetchCourses(); // Refresh the list after deletion
    } catch (error) {
        console.error('Error deleting course:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete course.', life: 3000 });
    }
};

onMounted(() => {
    fetchCourses();
});
</script>

<template>
    <div class="p-4">
        <h3 class="text-xl font-semibold mb-4">Course List</h3>

        <DataTable :value="courses" paginator :rows="10" :rowsPerPageOptions="[5, 10, 20, 50]" tableStyle="min-width: 50rem" stripedRows showGridlines :loading="loading">
            <Column field="id" header="ID"></Column>
            <Column field="name" header="Course Name"></Column>
            <Column field="directory" header="📁 Directory">
                <template #body="slotProps">
                    <a :href="`/courses/${slotProps.data.id}/${slotProps.data.directory_name}`" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer"> 📁 {{ slotProps.data.directory_name || 'N/A' }} </a>
                </template>
            </Column>
            <Column field="status" header="Status"></Column>
            <Column field="trade_node.name" header="Trade Node">
                <template #body="slotProps">
                    {{ slotProps.data.trade_node_name || 'N/A' }}
                </template>
            </Column>
            <Column header="Image">
                <template #body="slotProps">
                    <img v-if="slotProps.data.image" :src="slotProps.data.image" alt="Course Image" class="w-16 h-16 object-cover rounded-md shadow-md" />
                    <span v-else>No Image</span>
                </template>
            </Column>
            <Column header="Actions">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-success p-button-sm mr-2" @click="editCourse(slotProps.data)" />
                    <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-sm" @click="confirmDeleteCourse(slotProps.data)" />
                </template>
            </Column>
            <template #empty>
                <div class="text-center py-4">No courses found.</div>
            </template>
            <template #loading>
                <div class="text-center py-4">Loading courses, please wait...</div>
            </template>
        </DataTable>

        <ConfirmDialog></ConfirmDialog>
    </div>
</template>
