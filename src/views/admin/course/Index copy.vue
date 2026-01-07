<script setup>
import { ref, onMounted, computed } from 'vue';
import { apiClient } from '@/service/apiService';
import TreeNode from '../tradeNodes/trv/TreeNode.vue';

const flatNodes = ref([]); // fetch this from API
const selectedNodeId = ref(null);

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
};

const submitCourse = () => {
    if (!selectedNodeId.value) return alert('Select a trade node');
    // POST request with selectedNodeId and course data
};
</script>

<template>
    <div class="p-4">
        <h2 class="text-lg font-bold mb-4">Select Trade Node</h2>
        <div v-for="node in treeNodes" :key="node.id">
            <TreeNode :node="node" :selected-id="selectedNodeId" @select="handleSelect" />
        </div>
        <button class="mt-4 bg-green-500 text-white px-4 py-2 rounded" @click="submitCourse">Create Course</button>
    </div>
</template>
