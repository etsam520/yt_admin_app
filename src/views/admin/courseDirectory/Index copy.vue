<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Tree from 'primevue/tree';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog'; // Add this
import InputText from 'primevue/inputtext'; // Add this
import { apiClient } from '@/service/apiService';

// Initialize useRoute
const route = useRoute();
const courseId = ref(null); // Renamed from 'id' to avoid potential confusion with prop 'id' if you used it later
const toast = useToast();
const selectedDirectoryKey = ref(null);
const selectedDirectory = ref(null);
const displayCreateDirectoryDialog = ref(false);
const newDirectoryName = ref('');

const course = ref({
    name: 'Loading Course...', // Initial state
    status: 'draft',
    image: '',
    trade_node_name: '',
    slug: '',
    description: ''
});

const directoryTree = ref([]); // Initialize as an empty array

// Function to fetch course details from the API
const fetchCourseDetails = async (id) => {
    // Ensure this function is async
    try {
        const response = await apiClient.get(`/admin/courses/${id}`); // Add await here!

        if (!response || !response.data) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch course details: No data received', life: 3000 });
            return;
        }

        console.log(`Fetched course details for ID: ${id}`, response.data);

        course.value = {
            id: response.data.id,
            name: response.data.name || `Course ${id}`,
            status: response.data.status || 'inactive',
            image: response.data.image || null,
            trade_node_name: response.data.trade_node_name || 'Default Trade Node',
            slug: response.data.slug || `course-${id}`,
            description: response.data.description || 'No description available'
        };
    } catch (error) {
        console.error('Error fetching course details:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: `Failed to fetch course details: ${error.message || 'Network error'}`, life: 3000 });
        course.value = {
            name: 'Error Loading Course',
            status: 'error',
            image: '',
            trade_node_name: '',
            slug: '',
            description: 'Could not load course details. Please try again.'
        };
    }
};

const fetchDirectoryTree = async () => {
    try {
        const response = await apiClient.get(`/admin/courses/${courseId.value}/directories`);
        if (response.data && Array.isArray(response.data)) {
            directoryTree.value = buildTree(
                response.data.map((dir) => ({
                    id: dir.id,
                    label: dir.name,
                    parentId: dir.parent_id || null
                }))
            );
        } else {
            console.warn('Unexpected data format for directories:', response.data);
        }
    } catch (error) {
        console.error('Error fetching directory tree:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch directory tree', life: 3000 });
    }
};

// Lifecycle hook to fetch data when component is mounted
onMounted(() => {
    courseId.value = route.params.id; // Get the 'id' from the route parameters
    if (courseId.value) {
        fetchCourseDetails(courseId.value);
        fetchDirectoryTree(); // Fetch the directory tree for the course
    }
});

// Watch for changes in route.params.id if you navigate between courses
// within the same component instance (e.g., /courses/1/intro to /courses/2/advanced)
watch(
    () => route.params.id,
    async (newId) => {
        if (newId && newId !== courseId.value) {
            courseId.value = newId;
            await fetchCourseDetails(newId);
        }
    }
);

const buildTree = (nodes, parentId = null) => {
    const tree = [];
    const children = nodes.filter((node) => node.parentId === parentId);

    // Sort children by name for consistent display (optional)
    children.sort((a, b) => a.name.localeCompare(b.name));

    for (const child of children) {
        const nodeWithChildren = { ...child };
        // Recursively find children for the current node
        nodeWithChildren.children = buildTree(nodes, child.id);
        tree.push(nodeWithChildren);
    }
    return tree;
};
const statusSeverity = (status) => {
    switch (status) {
        case 'draft':
            return 'info';
        case 'published':
            return 'success';
        case 'archived':
            return 'warning';
        default:
            return null;
    }
};

const onSelectDirectory = (event) => {
    selectedDirectoryKey.value = { [event.node.key]: true };
    selectedDirectory.value = event.node;
};

const editDirectory = (node) => {
    toast.add({ severity: 'info', summary: 'Edit', detail: `Edit directory: ${node.label}`, life: 3000 });
    // Open edit modal here
};

const removeDirectory = (node) => {
    toast.add({ severity: 'warn', summary: 'Delete', detail: `Deleted: ${node.label}`, life: 3000 });
    // Send delete request
};

const createContent = (type) => {
    if (!selectedDirectory.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Please select a directory first!', life: 3000 });
        return;
    }
    toast.add({ severity: 'success', summary: 'Create', detail: `Create ${type} for ${selectedDirectory.value.label}`, life: 3000 });
    // Trigger content creation modal / route
};

const openCreateDirectoryDialog = () => {
    newDirectoryName.value = ''; // Clear previous input
    displayCreateDirectoryDialog.value = true;
};
</script>

<template>
    <Card class="mb-4">
        <template #title>
            <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold">{{ course.name }}</h2>
                <Tag :value="course.status" :severity="statusSeverity(course.status)" />
            </div>
        </template>

        <template #content>
            <div class="flex flex-col lg:flex-row gap-6">
                <img v-if="course.image" :src="course.image" alt="Course Image" class="rounded-lg w-full lg:w-1/3 object-cover" />

                <div class="flex-1">
                    <p class="mb-2"><strong>Trade Node:</strong> {{ course.trade_node_name }}</p>
                    <p class="mb-2"><strong>Slug:</strong> {{ course.slug }}</p>
                    <p class="mb-4"><strong>Description:</strong> {{ course.description }}</p>

                    <h3 class="text-lg font-semibold mb-2">Course Directory</h3>

                    <Button label="Add New Directory" icon="pi pi-folder-open" class="mb-3" @click="openCreateDirectoryDialog" />
                    <div v-for="directory in directoryTree" :key="directory.key" class="mb-4">
                        <Tree :value="directoryTree" :expandedKeys="expandedKeys" selectionMode="single" :selectionKeys="selectedDirectoryKey" @node-select="onSelectDirectory">
                            <template #default="{ node }">
                                <div class="flex items-center gap-2">
                                    <span>{{ node.label }}</span>
                                    <Button icon="pi pi-pencil" text @click.stop="editDirectory(node)" />
                                    <Button icon="pi pi-trash" text @click.stop="removeDirectory(node)" severity="danger" />
                                </div>
                            </template>
                        </Tree>

                        <div v-if="selectedDirectory">
                            <h4 class="mt-4 text-md font-medium">Add Content to: {{ selectedDirectory.label }}</h4>
                            <div class="flex flex-col gap-2 mt-2">
                                <Button label="Add Video" icon="pi pi-video" @click="() => createContent('video')" outlined />
                                <Button label="Add PDF" icon="pi pi-file-pdf" @click="() => createContent('pdf')" outlined />
                                <Button label="Add PPT" icon="pi pi-file" @click="() => createContent('ppt')" outlined />
                                <Button label="Add Question Set" icon="pi pi-question-circle" @click="() => createContent('question')" outlined />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Card>

    <Dialog v-model:visible="displayCreateDirectoryDialog" modal :header="selectedDirectory ? `Add Sub-directory to '${selectedDirectory.label}'` : 'Add New Root Directory'" :style="{ width: '30vw' }">
        <div class="p-fluid">
            <div class="field mb-3">
                <label for="newDirectoryName" class="font-bold mb-2">Directory Name</label>
                <InputText id="newDirectoryName" v-model="newDirectoryName" autocomplete="off" @keyup.enter="handleCreateDirectory" />
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="displayCreateDirectoryDialog = false" />
            <Button label="Create" icon="pi pi-check" @click="handleCreateDirectory" />
        </template>
    </Dialog>
</template>

<style scoped>
img {
    max-height: 200px;
}
</style>
