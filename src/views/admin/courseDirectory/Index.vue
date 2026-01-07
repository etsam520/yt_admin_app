<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Tree from 'primevue/tree';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { apiClient } from '@/service/apiService';
import DirectoryFrame from './DirectoryFrame.vue';

const route = useRoute();
const toast = useToast();

const courseId = ref(null);
const selectedDirectoryKey = ref(null);
const selectedDirectory = ref(null);
const expandedKeys = ref({});
const directoryTree = ref([]);
const isVisibleDirectory = ref(true);
const isVisibleDirectoryFragment = ref(false);

const displayDirectoryDialog = ref(false);
const selectedParentNode = ref(null);
const isEditingDirectory = ref(false);
const editingNode = ref(null);

const newDirectory = ref({ name: '', status: 'active' });

const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
];

const course = ref({
    name: 'Loading Course...',
    status: 'active',
    image: '',
    trade_node_name: '',
    slug: '',
    description: ''
});

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

const fetchCourseDetails = async (id) => {
    try {
        const { data } = await apiClient.get(`/admin/courses/${id}`);
        course.value = { ...course.value, ...data };
    } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch course details', life: 3000 });
    }
};

const buildTree = (nodes, parentId = null) => {
    return nodes
        .filter((n) => n.parent_id === parentId)
        .map((n) => {
            const node = { key: String(n.id), label: n.name, data: n };
            const children = buildTree(nodes, n.id);
            if (children.length) node.children = children;
            return node;
        });
};

const fetchDirectoryTree = async () => {
    try {
        const { data } = await apiClient.get(`/admin/courses/${courseId.value}/directories`);
        directoryTree.value = buildTree(data);
    } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch directory tree', life: 3000 });
    }
};

const onSelectDirectory = (e) => {
    selectedDirectoryKey.value = { [e.node.key]: true };
    selectedDirectory.value = e.node;
};

const openDirectoryDialog = (node = null, editMode = false) => {
    isEditingDirectory.value = editMode;
    editingNode.value = editMode ? node : null;
    selectedParentNode.value = !editMode ? node : null;

    if (editMode && node) {
        newDirectory.value = {
            name: node.label,
            status: node.data.status,
            id: node.data.id
        };
    } else {
        newDirectory.value = { name: '', status: 'active' };
    }

    displayDirectoryDialog.value = true;
};

const handleSaveDirectory = async () => {
    const payload = {
        name: newDirectory.value.name.trim(),
        status: newDirectory.value.status,
        parent_id: selectedParentNode.value?.data?.id || null,
        course_id: courseId.value
    };

    try {
        if (isEditingDirectory.value && editingNode.value) {
            const _dir = { ...toRaw(newDirectory.value) };
            _dir._method = 'PUT';
            const { data } = await apiClient.post(`/admin/directory/${newDirectory.value.id}`, _dir);
            editingNode.value.label = data.name;
            editingNode.value.data = data;
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Directory updated successfully', life: 3000 });
        } else {
            const { data } = await apiClient.post(`/admin/directory`, payload);
            const newNode = {
                key: String(data.id),
                label: data.name,
                data,
                children: []
            };
            if (selectedParentNode.value) {
                const addNodeToTree = (nodes, parentKey, newNode) => {
                    for (const node of nodes) {
                        if (node.key === parentKey) {
                            node.children = node.children || [];
                            node.children.push(newNode);
                            return true;
                        }
                        if (node.children && addNodeToTree(node.children, parentKey, newNode)) return true;
                    }
                    return false;
                };
                addNodeToTree(directoryTree.value, selectedParentNode.value.key, newNode);
                expandedKeys.value[selectedParentNode.value.key] = true;
            } else {
                directoryTree.value.push(newNode);
            }
            toast.add({ severity: 'success', summary: 'Created', detail: 'Directory created successfully', life: 3000 });
        }

        displayDirectoryDialog.value = false;
        newDirectory.value = { name: '', status: 'active' };
        selectedParentNode.value = null;
        editingNode.value = null;
    } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save directory', life: 3000 });
    }
};

const removeDirectory = (node) => {
    const removeRecursive = (nodes, key) =>
        nodes.filter((n) => {
            if (n.key === key) return false;
            if (n.children) n.children = removeRecursive(n.children, key);
            return true;
        });
    directoryTree.value = removeRecursive(directoryTree.value, node.key);
    toast.add({ severity: 'warn', summary: 'Removed', detail: `Directory '${node.label}' deleted (simulated)`, life: 3000 });
};

const showDirectoryFragment = (node) => {
    isVisibleDirectoryFragment.value = true;
    selectedDirectory.value = node;
    isVisibleDirectory.value = false;
    selectedDirectoryKey.value = { [node.key]: true };
};

onMounted(() => {
    courseId.value = route.params.id;
    if (courseId.value) {
        fetchCourseDetails(courseId.value);
        fetchDirectoryTree();
    }
});

watch(
    () => route.params.id,
    (newId) => {
        if (newId && newId !== courseId.value) {
            courseId.value = newId;
            fetchCourseDetails(newId);
            fetchDirectoryTree();
        }
    }
);
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

                    <div v-if="isVisibleDirectory" class="mb-6">
                        <h3 class="text-lg font-semibold mb-2">Course Directory</h3>

                        <Button label="Add New Root Directory" icon="pi pi-folder-open" class="mb-3" @click="openDirectoryDialog(null, false)" />

                        <Tree :value="directoryTree" v-model:expandedKeys="expandedKeys" selectionMode="single" v-model:selectionKeys="selectedDirectoryKey" @node-select="onSelectDirectory">
                            <template #default="{ node }">
                                <div class="flex items-center gap-2">
                                    <span @click.stop="showDirectoryFragment(node)"> <span class="text-base">📁</span> {{ node.label }} </span>
                                    <div class="flex flex-wrap gap-2">
                                        <Button icon="pi pi-plus" severity="info" text raised rounded size="small" @click.stop="openDirectoryDialog(node, false)" />
                                        <Button icon="pi pi-pencil" severity="secondary" text raised rounded size="small" @click.stop="openDirectoryDialog(node, true)" />
                                        <Button icon="pi pi-trash" severity="danger" text raised rounded size="small" @click.stop="removeDirectory(node)" />
                                    </div>
                                </div>
                            </template>
                        </Tree>
                    </div>
                </div>
            </div>

            <DirectoryFrame
                v-if="isVisibleDirectoryFragment"
                :directory="selectedDirectory"
                :course-id="courseId"
                @close="
                    () => {
                        isVisibleDirectoryFragment = false;
                        isVisibleDirectory.value = true;
                        selectedDirectory.value = null;
                    }
                "
            />
        </template>
    </Card>

    <Dialog
        v-model:visible="displayDirectoryDialog"
        modal
        :header="isEditingDirectory ? `Edit Directory '${newDirectory.name}'` : selectedParentNode ? `Add Sub-directory to '${selectedParentNode.label}'` : 'Add New Root Directory'"
        :style="{ width: '30vw' }"
    >
        <div class="p-fluid">
            <div class="field mb-3">
                <label for="newDirectoryName" class="font-bold mb-2">Directory Name</label>
                <InputText id="newDirectoryName" v-model="newDirectory.name" autocomplete="off" @keyup.enter="handleSaveDirectory" />
            </div>

            <div class="field mb-3">
                <label for="directoryStatus" class="font-bold mb-2">Status</label>
                <Dropdown id="directoryStatus" v-model="newDirectory.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Select Status" />
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="displayDirectoryDialog = false" />
            <Button :label="isEditingDirectory ? 'Update' : 'Create'" icon="pi pi-check" @click="handleSaveDirectory" />
        </template>
    </Dialog>
</template>

<style scoped>
img {
    max-height: 200px;
}
</style>
