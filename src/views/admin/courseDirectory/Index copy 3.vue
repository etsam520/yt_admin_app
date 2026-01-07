<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Tree from 'primevue/tree';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { apiClient } from '@/service/apiService';

// Initialize useRoute
const route = useRoute();
const toast = useToast();

// Reactive states
const courseId = ref(null);
const selectedDirectoryKey = ref(null);
const selectedDirectory = ref(null);
const displayCreateDirectoryDialog = ref(false);
const newDirectoryName = ref('');
const expandedKeys = ref({}); // Re-add this ref for expanded state
const selectedParentNode = ref(null); // Re-add this ref to track parent for new directory

const course = ref({
    name: 'Loading Course...',
    status: 'draft',
    image: '',
    trade_node_name: '',
    slug: '',
    description: ''
});

const directoryTree = ref([]); // Initialize as an empty array

// --- Helper Functions ---

// Function to generate a unique key for new nodes (important for PrimeVue Tree)
const generateUniqueKey = () => {
    return Date.now().toString() + Math.random().toString(36).substring(2, 9);
};

// Recursive function to build PrimeVue compatible tree from flat data
const buildTree = (nodes, parentId = null) => {
    const tree = [];
    const children = nodes.filter((node) => node.parent_id === parentId); // Use node.parent_id here

    children.sort((a, b) => a.name.localeCompare(b.name));

    for (const child of children) {
        const primeVueNode = {
            key: String(child.id),
            label: child.name,
            data: { ...child }
        };

        const nestedChildren = buildTree(nodes, child.id); // Recursive call
        if (nestedChildren.length > 0) {
            primeVueNode.children = nestedChildren;
        }
        tree.push(primeVueNode);
    }
    return tree;
};

// Recursive function to add a node to the existing tree (for client-side updates)
const addNodeToTree = (nodes, parentKey, newNode) => {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].key === parentKey) {
            if (!nodes[i].children) {
                nodes[i].children = [];
            }
            nodes[i].children.push(newNode);
            return true;
        }
        if (nodes[i].children && nodes[i].children.length > 0) {
            if (addNodeToTree(nodes[i].children, parentKey, newNode)) {
                return true;
            }
        }
    }
    return false;
};

// --- API Fetching Functions ---

const fetchCourseDetails = async (id) => {
    try {
        const response = await apiClient.get(`/admin/courses/${id}`);
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
        // Ensure courseId.value is available before making the request
        if (!courseId.value) {
            console.warn('Course ID is not available for fetching directory tree.');
            return;
        }
        const response = await apiClient.get(`/admin/courses/${courseId.value}/directories`);

        // Assuming your API returns a flat array of objects with id, name, and parent_id
        if (response.data && Array.isArray(response.data)) {
            directoryTree.value = buildTree(response.data);
            // Optional: Expand all nodes initially for better visibility
            const allKeys = {};
            const collectKeys = (nodes) => {
                nodes.forEach((node) => {
                    allKeys[node.key] = true;
                    if (node.children && node.children.length > 0) {
                        collectKeys(node.children);
                    }
                });
            };
            collectKeys(directoryTree.value);
            expandedKeys.value = allKeys;
        } else {
            console.warn('Unexpected data format for directories:', response.data);
            directoryTree.value = []; // Clear tree if data is malformed
        }
    } catch (error) {
        console.error('Error fetching directory tree:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch directory tree', life: 3000 });
        directoryTree.value = []; // Clear tree on error
    }
};

// --- Lifecycle Hooks ---

onMounted(() => {
    courseId.value = route.params.id;
    if (courseId.value) {
        fetchCourseDetails(courseId.value);
        fetchDirectoryTree();
    }
});

watch(
    () => route.params.id,
    async (newId) => {
        if (newId && newId !== courseId.value) {
            courseId.value = newId;
            await fetchCourseDetails(newId);
            await fetchDirectoryTree(); // Re-fetch tree when courseId changes
        }
    }
);

// --- General UI & Action Functions ---

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
    // Implement actual edit logic here, e.g., open a dialog to edit node.label
};

const removeDirectory = (node) => {
    toast.add({ severity: 'warn', summary: 'Delete', detail: `Deleted: ${node.label} (simulated)`, life: 3000 });
    // In a real app, send DELETE request to API
    // On success, update local directoryTree.value by removing the node
    // This requires a recursive function to find and remove the node
    const removeNodeRecursive = (nodes, keyToRemove) => {
        return nodes.filter((n) => {
            if (n.key === keyToRemove) return false; // Remove this node
            if (n.children) {
                n.children = removeNodeRecursive(n.children, keyToRemove); // Recurse into children
            }
            return true; // Keep this node
        });
    };
    directoryTree.value = removeNodeRecursive(directoryTree.value, node.key);

    // If the deleted node was selected, unselect it
    if (selectedDirectory.value && selectedDirectory.value.key === node.key) {
        selectedDirectory.value = null;
        selectedDirectoryKey.value = null;
    }
};

const createContent = (type) => {
    if (!selectedDirectory.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Please select a directory first!', life: 3000 });
        return;
    }
    toast.add({ severity: 'success', summary: 'Create', detail: `Create ${type} for ${selectedDirectory.value.label}`, life: 3000 });
    // Logic to open content creation modal/form, potentially passing selectedDirectory.value.key as parentId
};

// --- Directory Creation Dialog Functions ---

// Renamed and modified to handle both root and sub-directory creation
const openDirectoryCreationDialog = (parentNode = null) => {
    newDirectoryName.value = ''; // Clear previous input
    selectedParentNode.value = parentNode; // Set the parent node (null for root, node object for sub-dir)
    displayCreateDirectoryDialog.value = true;
};

const handleCreateDirectory = async () => {
    // Made async for potential API call
    if (!newDirectoryName.value.trim()) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Directory name cannot be empty', life: 3000 });
        return;
    }

    const parentIdForApi = selectedParentNode.value ? selectedParentNode.value.data.id : null; // Use original ID for API payload
    console.log('Selected parent node for new directory:', selectedParentNode.value);
    const payload = {
        name: newDirectoryName.value.trim(),
        parent_id: parentIdForApi,
        course_id: courseId.value // Ensure you send the course ID
    };
    console.log('Creating directory with payload:', payload);
    try {
        // Replace with your actual API call to create the directory
        // const response = await apiClient.post(`/admin/directories`, payload);
        // const createdDirectory = response.data; // Assuming API returns the created directory with its ID

        // For demonstration, simulate success and create a dummy directory object
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay
        const createdDirectory = {
            id: generateUniqueKey(), // Use a generated key if API doesn't return one immediately, or use API's ID
            name: payload.name,
            parent_id: payload.parent_id
            // ... any other properties your API might return
        };

        const newPrimeVueNode = {
            key: String(createdDirectory.id),
            label: createdDirectory.name,
            children: [],
            data: { ...createdDirectory } // Store original API data
        };

        if (parentIdForApi) {
            const success = addNodeToTree(directoryTree.value, selectedParentNode.value.key, newPrimeVueNode);
            if (success) {
                expandedKeys.value = { ...expandedKeys.value, [selectedParentNode.value.key]: true };
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to find parent directory in tree locally.', life: 3000 });
                return; // Exit if local update failed
            }
        } else {
            directoryTree.value = [...directoryTree.value, newPrimeVueNode];
        }

        toast.add({ severity: 'success', summary: 'Success', detail: `Directory "${newPrimeVueNode.label}" created!`, life: 3000 });

        displayCreateDirectoryDialog.value = false;
        newDirectoryName.value = '';
        selectedParentNode.value = null; // Clear parent node selection after creation

        // Automatically select the newly created node
        selectedDirectoryKey.value = { [newPrimeVueNode.key]: true };
        selectedDirectory.value = newPrimeVueNode;
    } catch (error) {
        console.error('Error creating directory:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: `Failed to create directory: ${error.message || 'Network error'}`, life: 3000 });
    }
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

                    <Button label="Add New Root Directory" icon="pi pi-folder-open" class="mb-3" @click="openDirectoryCreationDialog(null)" />

                    <Tree :value="directoryTree" v-model:expandedKeys="expandedKeys" selectionMode="single" v-model:selectionKeys="selectedDirectoryKey" @node-select="onSelectDirectory">
                        <template #default="{ node }">
                            <div class="flex items-center gap-2">
                                <span>{{ node.label }}</span>
                                <Button icon="pi pi-plus" text size="small" @click.stop="openDirectoryCreationDialog(node)" />
                                <Button icon="pi pi-pencil" text size="small" @click.stop="editDirectory(node)" />
                                <Button icon="pi pi-trash" text size="small" severity="danger" @click.stop="removeDirectory(node)" />
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
        </template>
    </Card>

    <Dialog v-model:visible="displayCreateDirectoryDialog" modal :header="selectedParentNode ? `Add Sub-directory to '${selectedParentNode.label}'` : 'Add New Root Directory'" :style="{ width: '30vw' }">
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
