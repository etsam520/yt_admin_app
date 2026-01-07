<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import NodeItem from './NodeItem.vue';
import NodeForm from './NodeForm.vue';
import { apiClient } from '@/service/apiService';
import { parse } from 'vue/compiler-sfc';

const toast = useToast();

// Main NodeManager App Component
// https://g.co/gemini/share/dd2de9341ae5 reference
// Represents a hierarchical node management system allowing creation, reading, updating, and deletion of nodes at arbitrary depths.
// This version uses in-memory dummy JSON data instead of a database.

// --- Dummy Data Initialization ---
const dummyNodesData = [
    { id: 'node-1', name: 'Base Node Alpha', parentId: null },
    { id: 'node-2', name: 'Base Node Beta', parentId: null },
    { id: 'node-3', name: 'Child of Alpha (Level 1)', parentId: 'node-1' },
    { id: 'node-4', name: 'Grandchild of Alpha (Level 2)', parentId: 'node-3' },
    { id: 'node-5', name: 'Another Child of Alpha', parentId: 'node-1' },
    { id: 'node-6', name: 'Child of Beta', parentId: 'node-2' },
    { id: 'node-7', name: 'Great-Grandchild (Level 3)', parentId: 'node-4' },
    { id: 'node-8', name: 'Base Node Gamma', parentId: null },
    { id: 'node-9', name: 'Child of Gamma', parentId: 'node-8' },
    { id: 'node-10', name: 'Another Grandchild of Alpha', parentId: 'node-4' }
];
const flatNodes = ref([]);

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
        flatNodes.value = nodes; // Initialize with fetched or dummy data
    });
});

// Dummy user ID (no actual authentication in this version)
const userId = ref('dummy-user-id-12345');
const error = ref(null); // State to store any errors (e.g., form validation)

// --- Node Data Management ---

// Computed property to build the hierarchical tree structure from the flat nodes.
// This re-calculates whenever `flatNodes.value` changes.
const treeNodes = computed(() => {
    return buildTree(flatNodes.value);
});

/**
 * Recursively builds a tree structure from a flat list of nodes.
 * @param {Array} nodes - The flat array of node objects.
 * @param {string|null} parentId - The ID of the parent node to find children for (null for top-level nodes).
 * @returns {Array} The hierarchical tree structure.
 */
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

// --- Form State Management ---
const showNodeForm = ref(false); // Controls visibility of the NodeForm modal
const currentEditingNode = ref(null); // Holds the node object if currently editing, otherwise null
const parentNodeForNewChild = ref(null); // Holds the parentId if creating a child node

/**
 * Opens the form for creating a new base node.
 */
const openCreateBaseNodeForm = () => {
    toast.add({ severity: 'info', summary: 'Create Base Node', detail: 'Creating a new base node.', life: 3000 });
    currentEditingNode.value = null;
    parentNodeForNewChild.value = null;
    showNodeForm.value = true;
};

/**
 * Opens the form for creating a new child node under a specific parent.
 * @param {string} parentId - The ID of the parent node.
 */
const openCreateChildNodeForm = (parentId) => {
    // toast.add({severity: 'info',summary: 'Create Child Node',detail: `Creating a new child node under parent ID: ${parentId}`,life: 3000});
    currentEditingNode.value = null;
    parentNodeForNewChild.value = parentId;
    showNodeForm.value = true;
};

/**
 * Opens the form for editing an existing node.
 * @param {Object} node - The node object to be edited.
 */
const openEditNodeForm = (node) => {
    currentEditingNode.value = node;
    parentNodeForNewChild.value = node.parentId; // Retain existing parentId if editing
    showNodeForm.value = true;
};

/**
 * Closes the node creation/editing form and resets its state.
 */
const closeNodeForm = () => {
    showNodeForm.value = false;
    currentEditingNode.value = null;
    parentNodeForNewChild.value = null;
    error.value = null; // Clear any form-related errors
};

// --- CRUD Operations (In-Memory) ---

/**
 * Handles saving (creating or updating) a node in the in-memory array.
 * @param {Object} nodeData - The data for the node to be saved.
 */
const handleSaveNode = (nodeData) => {
    try {
        if (nodeData.id) {
            // Update existing node
            apiClient
                .post(`/admin/trade-nodes/${nodeData.id}`, {
                    name: nodeData.name,
                    parent_id: nodeData.parentId || null, // Use null if parentId is empty
                    _method: 'PUT' // Use PUT method for updates
                })
                .then((response) => {
                    const updatedNode = response.data; // Assuming the API returns the updated node

                    // Update the flatNodes array with the new data
                    const index = flatNodes.value.findIndex((n) => n.id === updatedNode.id);
                    if (index !== -1) {
                        flatNodes.value[index] = {
                            ...flatNodes.value[index],
                            name: updatedNode.name,
                            parentId: updatedNode.parent_id || null // Ensure parentId is null if not set
                        };
                    }
                })
                .catch((error) => {
                    console.error('Error updating node:', error);
                    toast.add({ severity: 'error', summary: 'Node Update Error', detail: error?.response?.data?.message || 'Please check the form for errors.', life: 5000 });
                    error.value = `Failed to update node: ${error.message}`;
                });
            toast.add({ severity: 'success', summary: 'Node Updating', detail: `Node "${nodeData.name}" updated ${nodeData.id} successfully.`, life: 4000 });
        } else {
            // Create new node with a unique ID

            apiClient
                .post('/admin/trade-nodes', {
                    name: nodeData.name,
                    parent_id: nodeData.parentId || null // Use null if parentId is empty
                })
                .then((response) => {
                    const newNode = response.data; // Assuming the API returns the created node

                    flatNodes.value.push({
                        id: newNode.id,
                        name: newNode.name,
                        parentId: newNode.parent_id || null, // Ensure parentId is null if not set
                        createdBy: userId.value,
                        createdAt: new Date().toISOString()
                    });
                    error.value = null; // Clear any previous error
                    // Close the form after successful save
                    console.log('New node created:', newNode.id);
                    toast.add({ severity: 'success', summary: 'Node Created', detail: `Node "${newNode.name}" created successfully.`, life: 4000 });
                })
                .catch((error) => {
                    console.error('Error creating node:', error);
                    toast.add({ severity: 'error', summary: 'Node Creation Error', detail: error?.response?.data?.message || 'Please check the form for errors.', life: 5000 });
                    error.value = `Failed to create node: ${error.message}`;
                });
        }

        closeNodeForm(); // Close form on successful save
        error.value = null; // Clear any previous error
    } catch (e) {
        console.error('Error saving node:', e);
        error.value = `Failed to save node: ${e.message}`;
    }
};

/*const handleSaveNode = (nodeData) => {
  try {
    if (nodeData.id) {
      // Update existing node
      const index = flatNodes.value.findIndex(n => n.id === nodeData.id);
      if (index !== -1) {
        // Ensure parentId is null if empty string
        flatNodes.value[index] = { ...flatNodes.value[index], name: nodeData.name, parentId: nodeData.parentId === '' ? null : nodeData.parentId };
      }
      console.log("Node updated:", nodeData.id);
    } else {
      // Create new node with a unique ID
      const newId = crypto.randomUUID(); // Generate a unique ID for the new node
      const newNode = {
        id: newId,
        name: nodeData.name,
        // Ensure parentId is null if empty string
        parentId: nodeData.parentId === '' ? null : nodeData.parentId,
        createdBy: userId.value,
        createdAt: new Date().toISOString(),
      };
      flatNodes.value.push(newNode);
      console.log("New node created:", newId);
    }
    closeNodeForm(); // Close form on successful save
    error.value = null; // Clear any previous error
  } catch (e) {
    console.error("Error saving node:", e);
    error.value = `Failed to save node: ${e.message}`;
  }
};*/

/**
 * Recursively identifies all descendants of a node.
 * @param {string} nodeId - The ID of the node.
 * @param {Array} allNodes - The flat array of all nodes.
 * @param {Set<string>} descendants - A set to store the IDs of descendants (used internally for recursion).
 */
const findAllDescendants = (nodeId, allNodes, descendants) => {
    const children = allNodes.filter((n) => n.parentId === nodeId);
    for (const child of children) {
        descendants.add(child.id);
        findAllDescendants(child.id, allNodes, descendants);
    }
};

/**
 * Handles the deletion of a node and all its children from the in-memory array.
 * @param {string} nodeId - The ID of the node to be deleted.
 */
const handleDeleteNode = (nodeId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this node and ALL its children? This action cannot be undone.');
    if (!confirmDelete) {
        return;
    }

    try {
        // Find all descendants of the node to be deleted
        console.log(`Deleting node and all its children: ${nodeId}`);
        const _node = { _method: 'DELETE' };
        apiClient
            .post(`/admin/trade-nodes/${nodeId}`, _node)
            .then(() => {
                console.log(`Node ${nodeId} deleted successfully.`);
                const nodesToDelete = new Set();
                nodesToDelete.add(nodeId); // Add the node itself
                findAllDescendants(nodeId, flatNodes.value, nodesToDelete); // Add all its descendants

                // Filter out all nodes marked for deletion
                flatNodes.value = flatNodes.value.filter((node) => !nodesToDelete.has(node.id));
                console.log(`Node and its children deleted: ${nodeId}`);
                error.value = null; // Clear any previous error
                toast.add({ severity: 'success', summary: 'Node Deleted', detail: `Node and all its children deleted successfully.`, life: 4000 });
            })
            .catch((error) => {
                console.error('Error deleting node:', error);
                toast.add({ severity: 'error', summary: 'Node Deletion Error', detail: error?.response?.data?.message || 'Failed to delete node.', life: 5000 });
                error.value = `Failed to delete node: ${error.message}`;
            });
    } catch (e) {
        console.error('Error deleting node:', e);
        error.value = `Failed to delete node: ${e.message}`;
    }
};
</script>

<template>
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans p-4 sm:p-6 md:p-8 rounded-lg shadow-xl">
        <div class="mx-auto rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-gray-800 p-6 sm:p-8 md:p-10">
            <h1 class="text-4xl sm:text-5xl font-extrabold text-center text-blue-700 dark:text-blue-400 mb-8 tracking-tight">Trade Group Tree Manager</h1>
            <div class="flex flex-col items-center mb-8">
                <button
                    @click="openCreateBaseNodeForm"
                    class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-700"
                >
                    + Create Base Node
                </button>
            </div>

            <NodeForm v-if="showNodeForm" :node="currentEditingNode" :parent-id="parentNodeForNewChild" @save="handleSaveNode" @cancel="closeNodeForm" />

            <h2 class="text-3xl font-semibold text-center text-gray-800 dark:text-gray-200 mt-10 mb-6 border-b-2 border-gray-300 dark:border-gray-700 pb-2">Base Nodes</h2>
            <p v-if="treeNodes.length === 0" class="text-center text-gray-600 dark:text-gray-400 text-lg mt-4">No nodes yet. Create one above!</p>
            <ul v-else class="space-y-4">
                <NodeItem v-for="node in treeNodes" :key="node.id" :node="node" :level="0" @edit-node="openEditNodeForm" @delete-node="handleDeleteNode" @create-child-node="openCreateChildNodeForm" />
            </ul>

            <div v-if="error" class="bg-red-100 text-red-700 p-4 rounded-lg mt-6 shadow-md border border-red-200" role="alert">
                <strong class="font-bold">Error:</strong>
                <span class="block sm:inline ml-2">{{ error }}</span>
            </div>
        </div>
    </div>
</template>

<style>
/* Basic Tailwind CSS setup for font-sans */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
body {
    font-family: 'Inter', sans-serif;
}

/* Custom fade-in-up animation for modals */
@keyframes fade-in-up {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in-up {
    animation: fade-in-up 0.3s ease-out forwards;
}
</style>
