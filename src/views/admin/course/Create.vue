<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import { apiClient } from '@/service/apiService'; // replace with your axios config

const props = defineProps({
    tradeNodeId: {
        type: Number,
        default: null
    },
    isEdit: {
        type: Boolean,
        default: false
    },
    courseData: {
        type: Object,
        default: () => ({
            id: null,
            name: '',
            slug: '',
            description: '',
            image: '',
            status: 'active',
            imagePreviewUrl: null,
            trade_node_id: null
        })
    }
});

// Define emits
const emit = defineEmits(['close', 'table-refresh']);

// const route = useRoute()
// const router = useRouter()

const isEdit = computed(() => props.courseData.id != null);

const statuses = [
    { label: 'Avtive', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
];

const tradeNodes = ref([]);
const toast = useToast();

const handleSubmit = async () => {
    try {
        const formdata = new FormData();

        // Required fields from Laravel validation
        formdata.append('name', props.courseData.name || '');
        formdata.append('description', props.courseData.description || '');
        formdata.append('slug', props.courseData.slug || '');
        formdata.append('status', props.courseData.status || 'draft');
        formdata.append('trade_node_id', props.courseData.trade_node_id || '');

        // Handle image (only if it's a File object)
        if (props.courseData.image instanceof File) {
            formdata.append('image', props.courseData.image);
        } else if (isEdit.value && props.courseData.image) {
            // For edits, if image is a string (existing URL), don't send it
            // Or send as null if you want to remove it
            // formdata.append('image', '');
        }

        let response;
        if (isEdit.value) {
            // Laravel-style PUT with FormData
            formdata.append('_method', 'PUT');
            response = await apiClient.post(`/admin/courses/${props.courseData.id}`, formdata, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        } else {
            response = await apiClient.post('/admin/courses/', formdata, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        }

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: isEdit.value ? 'Course updated successfully!' : 'Course created successfully!',
            life: 3000
        });

        emit('close');
        emit('table-refresh');
    } catch (error) {
        console.error('Submission error:', error.response?.data);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Operation failed',
            life: 3000
        });
    }
};
//  courseData
const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this course?')) {
        const _course = { _method: 'DELETE' };
        await apiClient.post(`/admin/courses/${route.params.id}`, _course);
        alert('Deleted successfully');
        router.push('/admin/courses');
    }
};

// --- Lifecycle Hook ---
onMounted(() => {
    // These calls will now have their errors caught and logged
});

// Watch for changes in tradeNodeId prop if the form is reused
// (e.g., if selectedNodeId in parent changes while Create is open)
watch(
    () => props.tradeNodeId,
    (newId) => {
        props.courseData.value.trade_node_id = newId;
    }
);

function onImageSelected(event) {
    const file = event.target.files[0];
    props.courseData.image = file;

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            props.courseData.imagePreviewUrl = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}
</script>

<template>
    <div class="p-4 space-y-4">
        <h2 class="text-xl font-semibold">{{ isEdit ? 'Edit Course' : 'Add New Course' }}</h2>

        <!-- Name -->
        <div class="p-float-label">
            <label for="name">Course Name</label>
            <InputText v-model="props.courseData.name" id="name" class="w-full" />
        </div>

        <!-- Slug -->
        <div class="p-float-label">
            <label for="slug">Slug</label>
            <InputText v-model="props.courseData.slug" id="slug" class="w-full" />
        </div>

        <!-- Description -->
        <div class="p-float-label">
            <label for="desc">Description</label>
            <Textarea v-model="props.courseData.description" id="desc" rows="4" class="w-full" />
        </div>

        <!-- Image -->

        <div class="card mt-8">
            <div class="font-semibold text-xl mb-4">Image</div>
            <div class="flex flex-col md:flex-row">
                <div class="w-full md:w-5/12 flex flex-col items-center justify-center gap-3 py-5">
                    <input type="file" accept="image/*" @change="onImageSelected" class="file:px-4 file:py-2 file:border-0 file:bg-blue-600 file:text-white file:rounded cursor-pointer" />
                </div>
                <div class="w-full md:w-2/12">
                    <Divider layout="vertical" class="!hidden md:!flex"><b>Preview</b></Divider>
                    <Divider layout="horizontal" class="!flex md:!hidden" align="center"><b>OR</b></Divider>
                </div>
                <div class="w-full md:w-5/12 flex items-center justify-center py-5">
                    <div v-if="props.courseData.imagePreviewUrl" class="w-50 h-50 overflow-hidden border">
                        <img :src="props.courseData.imagePreviewUrl" alt="User Image" class="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Status -->
        <div class="p-float-label">
            <label>Status</label>
            <Select v-model="props.courseData.status" :options="statuses" optionLabel="label" optionValue="value" class="w-full" />
        </div>

        <!-- Buttons -->
        <div class="flex gap-3">
            <Button label="Save" icon="pi pi-check" @click="handleSubmit" />
            <Button v-if="isEdit" label="Delete" icon="pi pi-trash" severity="danger" @click="handleDelete" />
        </div>
    </div>
</template>
