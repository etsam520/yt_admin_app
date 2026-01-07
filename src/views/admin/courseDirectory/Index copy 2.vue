<script setup>
import { ref } from 'vue';
import Tree from 'primevue/tree';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';

// Sample initial directory tree
const directoryTree = ref([
    {
        key: '0',
        label: 'Introduction',
        children: []
    },
    {
        key: '1',
        label: 'Modules',
        children: [
            {
                key: '1-0',
                label: 'Lesson 1',
                children: []
            }
        ]
    },
    {
        key: '2',
        label: 'Conclusion',
        children: []
    }
]);

const expandedKeys = ref({});
const selectedDirectoryKey = ref({});
const selectedNode = ref(null);

const displayCreateDialog = ref(false);
const newDirectoryName = ref('');

const displayEditDialog = ref(false);
const editDirectoryName = ref('');

const openCreateDialog = (node) => {
    selectedNode.value = node;
    newDirectoryName.value = '';
    displayCreateDialog.value = true;
};

const openEditDialog = (node) => {
    selectedNode.value = node;
    editDirectoryName.value = node.label;
    displayEditDialog.value = true;
};

const onSelectDirectory = (event) => {
    selectedDirectoryKey.value = { [event.node.key]: true };
};

const createDirectory = () => {
    const newKey = generateUniqueKey();
    const newNode = {
        key: newKey,
        label: newDirectoryName.value,
        children: []
    };

    // Ensure parent has children array
    if (!selectedNode.value.children) {
        selectedNode.value.children = [];
    }

    selectedNode.value.children.push(newNode);
    expandedKeys.value = {
        ...expandedKeys.value,
        [selectedNode.value.key]: true
    };

    displayCreateDialog.value = false;
    newDirectoryName.value = '';
};

const saveEditedDirectory = () => {
    if (selectedNode.value) {
        selectedNode.value.label = editDirectoryName.value;
    }
    displayEditDialog.value = false;
};

const deleteDirectory = (nodeToDelete) => {
    const deleteRecursive = (nodes, key) => {
        return nodes.filter((node) => {
            if (node.key === key) return false;
            if (node.children) {
                node.children = deleteRecursive(node.children, key);
            }
            return true;
        });
    };

    directoryTree.value = deleteRecursive(directoryTree.value, nodeToDelete.key);
};

// Unique key generator
let idCounter = 3;
const generateUniqueKey = () => {
    return String(idCounter++);
};
</script>

<template>
    <div class="p-4">
        <h2 class="text-xl font-semibold mb-3">Course Directory</h2>

        <Tree :value="directoryTree" :expandedKeys="expandedKeys" selectionMode="single" :selectionKeys="selectedDirectoryKey" @node-select="onSelectDirectory">
            <template #default="{ node }">
                <div class="flex items-center gap-2">
                    <span>{{ node.label }}</span>
                    <Button icon="pi pi-pencil" text size="small" @click.stop="openEditDialog(node)" />
                    <Button icon="pi pi-trash" text size="small" severity="danger" @click.stop="deleteDirectory(node)" />
                    <Button icon="pi pi-plus" text size="small" class="text-green-500" @click.stop="openCreateDialog(node)" />
                </div>
            </template>
        </Tree>

        <Dialog v-model:visible="displayCreateDialog" modal header="Add New Directory" :style="{ width: '30vw' }">
            <div class="p-fluid">
                <div class="field">
                    <label for="dirName">Directory Name</label>
                    <InputText id="dirName" v-model="newDirectoryName" autofocus />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" text @click="displayCreateDialog = false" />
                <Button label="Create" icon="pi pi-check" @click="createDirectory" />
            </template>
        </Dialog>

        <Dialog v-model:visible="displayEditDialog" modal header="Edit Directory" :style="{ width: '30vw' }">
            <div class="p-fluid">
                <div class="field">
                    <label for="editDir">New Name</label>
                    <InputText id="editDir" v-model="editDirectoryName" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" text @click="displayEditDialog = false" />
                <Button label="Save" icon="pi pi-check" @click="saveEditedDirectory" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.p-tree {
    border: 1px solid #dcdcdc;
    border-radius: 4px;
    padding: 0.5rem;
}
</style>
