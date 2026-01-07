<script setup>
import { ref, onMounted, computed } from 'vue';
import { apiClient } from '@/service/apiService';
import TreeNode from '../tradeNodes/trv/TreeNode.vue';
import { useToast } from 'primevue/usetoast';
import Create from './Create.vue';
import Table from './Table.vue';

const toast = useToast();

const flatNodes = ref([]); // fetch this from API
const selectedNodeId = ref(null);

//dialog==============
const displayCourseForm = ref(false);
const displayCourseTable = ref(false);
//===================
const courseData = ref({
    id: null,
    name: '',
    description: '',
    image: null,
    status: 'active', // Default status
    imagePreviewUrl: null,
    trade_node_id: null
});

function fetchNodes() {
    return apiClient
        .get('/admin/trade-nodes')
        .then((response) => {
            return response.data.map((node) => ({
                id: node.id,
                name: node.name,
                parentId: node.parent_id || null, // Ensure parentId is null if not set,
                createdAt: node.createdAt || new Date().toISOString()
            }));
        })
        .catch((error) => {
            console.error('Error fetching nodes:', error);
            return null; // Fallback to dummy data on error
        });
}

onMounted(() => {
    fetchNodes().then((nodes) => {
        // console.log(nodes);
        flatNodes.value = nodes || []; // Initialize with fetched or dummy data
    });
});

const treeNodes = computed(() => {
    if (!flatNodes.value || flatNodes.value.length === 0) {
        return []; // Return empty array if no nodes are available
    }
    // const mt  = buildTree(flatNodes.value);
    // console.log("Tree Nodes:", mt);
    // return mt;
    return buildTree(flatNodes.value);
});

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

const handleSelect = (id) => {
    selectedNodeId.value = id;
    courseData.value.trade_node_id = id;
    displayCourseForm.value = false;
    displayCourseTable.value = false;
};

const submitCourse = () => {
    if (!selectedNodeId.value) return toast.add({ severity: 'info', summary: 'Strictly', detail: 'Select Trade', life: 3000 });
    displayCourseTable.value = false;
    displayCourseForm.value = true;
};
const getCourseTable = () => {
    if (!selectedNodeId.value) return toast.add({ severity: 'info', summary: 'Strictly', detail: 'Select Trade', life: 3000 });
    displayCourseForm.value = false;
    displayCourseTable.value = true;
};
const handleEditCourse = (course) => {
    if (!course.trade_node_id) {
        return toast.add({ severity: 'error', summary: 'Error', detail: 'Course does not have a trade node associated.', life: 3000 });
    }

    courseData.value = {
        id: course.id,
        name: course.name,
        description: course.description,
        imagePreviewUrl: course.image,
        status: course.status || 'active',
        trade_node_id: course.trade_node_id,
        image: null,
        slug: course.slug || ''
    };
    selectedNodeId.value = course.trade_node_id; // Set the selected node ID to the
    displayCourseForm.value = true;
    displayCourseTable.value = false;
};
</script>

<template>
    <div class="p-4">
        <button class="mt-4 bg-green-500 text-white px-4 py-2 rounded" @click="submitCourse">Create Course</button>
        <button class="mt-4 bg-green-500 text-white px-4 py-2 rounded" @click="getCourseTable">Table</button>
        <h2 class="text-lg font-bold mb-4">Select Trade Node</h2>
        <div v-for="node in treeNodes" :key="node.id">
            <TreeNode :node="node" :selected-id="selectedNodeId" @select="handleSelect" />
        </div>
        <div v-if="displayCourseForm">
            <Create v-model:course-data="courseData" :trade-node-id="selectedNodeId" @close="displayCourseForm = false" @table-refresh="displayCourseTable = true" />
        </div>
        <div v-if="displayCourseTable">
            <Table :trade-node-id="selectedNodeId" @edit-course="handleEditCourse" @close="displayCourseTable = false" />
        </div>
    </div>

    <!-- <Dialog header="Confirmation" v-model:visible="displayConfirmation" :style="{ width: '350px' }" :modal="true">
        <div class="flex items-center justify-center">
            <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem" />
            <span>Are you sure you want to proceed?</span>
        </div>
        <template #footer>
            <Button label="No" icon="pi pi-times" @click="closeConfirmation" text severity="secondary" />
            <Button label="Yes" icon="pi pi-check" @click="closeConfirmation" severity="danger" outlined autofocus />
        </template>
    </Dialog> -->
</template>
