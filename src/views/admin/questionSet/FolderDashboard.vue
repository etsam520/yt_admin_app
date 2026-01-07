<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useRoute, useRouter } from 'vue-router';
import SetForm from './SetForm.vue';
import AddQuestionsToSet from './AddQuestionsToSet.vue';
import FolderForm from './FolderForm.vue';
import PdfList from './PdfList.vue';
import { apiClient } from '@/service/apiService';

const confirm = useConfirm();
const toast = useToast();
const route = useRoute();
const router = useRouter();

// Layout options
const viewMode = ref('grid'); // 'grid' | 'list'
const itemSize = ref('medium'); // 'small' | 'medium' | 'large'

// Data
const folders = ref([]);
const sets = ref([]);
const currentFolder = ref(null);
const breadcrumbs = ref([]);
const loading = ref(false);

// Dialogs
const showCreateSetDialog = ref(false);
const showCreateFolderDialog = ref(false);
const showAddQuestionsDialog = ref(false);
const showPdfListDialog = ref(false);
const editingSet = ref(null);
const editingFolder = ref(null);
const selectedSetId = ref(null);
const selectedSetName = ref('');
const setViewMode = ref(null);

// Context menu
const contextMenu = ref(null);
const contextMenuItems = ref([]);
const selectedItem = ref(null);

// Filters
const filters = reactive({
    global: '',
    organization: null,
    subject: null
});

const organizations = ref([]);
const subjects = ref([]);

// Computed
const currentItems = computed(() => {
    const folderItems = folders.value.map(folder => ({
        ...folder,
        type: 'folder',
        icon: 'folder',
        displayName: folder.name
    }));
    
    const setItems = sets.value.map(set => ({
        ...set,
        type: 'set',
        icon: 'file-text',
        displayName: set.name,
        organization_name: organizations.value.find((o) => o.id === set.organization_id)?.name || 'Unknown'
    }));
    
    const allItems = [...folderItems, ...setItems];
    
    return allItems.filter(item => {
        const matchesSearch = !filters.global || 
            item.displayName.toLowerCase().includes(filters.global.toLowerCase()) ||
            (item.organization_name && item.organization_name.toLowerCase().includes(filters.global.toLowerCase()));
        
        const matchesOrg = !filters.organization || item.organization_id === filters.organization;
        const matchesSubject = !filters.subject || item.subject_id === filters.subject;
        
        return matchesSearch && matchesOrg && matchesSubject;
    });
});

const gridClasses = computed(() => {
    const sizeClasses = {
        small: 'grid-cols-8 md:grid-cols-12 lg:grid-cols-16',
        medium: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
        large: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    };
    return `grid gap-4 ${sizeClasses[itemSize.value]}`;
});

// Methods
const fetchCurrentFolderData = async (folderId = null) => {
    loading.value = true;
    try {
        // Fetch folders in current directory
        const foldersResponse = await apiClient.get('/admin/set-folder', {
            params: { parent_id: folderId }
        });
        folders.value = foldersResponse.data.data.folders || [];
        breadcrumbs.value = foldersResponse.data.data.breadcrumbs || [];

        // Fetch sets in current directory
        const setsResponse = await apiClient.get('/admin/question-sets', {
            params: { folder_id: folderId??'_blank' }
        });

        sets.value = setsResponse.data.data || [];folderId

        // Update current folder info
        if (folderId) {
            const folderResponse = await apiClient.get(`/admin/set-folder/current/${folderId}`);
            currentFolder.value = folderResponse.data.data.folder;
            // await buildBreadcrumbs(folderId);
        } else {
            currentFolder.value = null;
            breadcrumbs.value = [{ name: 'Question Sets', path: null }];
        }
        
    } catch (error) {
        showError('Failed to fetch folder data', error);
    } finally {
        loading.value = false;
    }
};

const buildBreadcrumbs = async (folderId) => {
    const crumbs = [{ name: 'Question Sets', path: null }];
    
    if (folderId) {
        try {
            const response = await apiClient.get(`/admin/folders/${folderId}/breadcrumbs`);
            const folderPath = response.data.data || [];
            folderPath.forEach(folder => {
                crumbs.push({
                    name: folder.name,
                    path: folder.id
                });
            });
        } catch (error) {
            console.warn('Could not build breadcrumbs:', error);
        }
    }
    
    breadcrumbs.value = crumbs;
};

const navigateToFolder = (folderId) => {
    const query = folderId ? { folder: folderId } : {};
    router.push({ name: 'question-set', query });
};

const handleItemDoubleClick = (item) => {
    if (item.type === 'folder') {
        navigateToFolder(item.id);
    } else if (item.type === 'set') {
        viewSet(item);
    }
};

const handleItemRightClick = (event, item) => {
    event.preventDefault();
    selectedItem.value = item;
    
    if (item.type === 'folder') {
        contextMenuItems.value = [
            { label: 'Open', icon: 'pi pi-folder-open', command: () => navigateToFolder(item.id) },
            { label: 'Rename', icon: 'pi pi-pencil', command: () => editFolder(item) },
            { separator: true },
            { label: 'Delete', icon: 'pi pi-trash', command: () => confirmDeleteFolder(item) }
        ];
    } else {
        contextMenuItems.value = [
            { label: 'View', icon: 'pi pi-eye', command: () => viewSet(item) },
            { label: 'Edit', icon: 'pi pi-pencil', command: () => editSet(item) },
            { label: 'Add Questions', icon: 'pi pi-plus', command: () => showAddQuestionsDialogHandler(item) },
            { label: 'Manage PDFs', icon: 'pi pi-file-pdf', command: () => showPdfListDialogHandler(item) },
            { label: 'Open Board', icon: 'pi pi-external-link', command: () => openDigitalBoardHandler(item) },
            { separator: true },
            { label: 'Delete', icon: 'pi pi-trash', command: () => confirmDeleteSet(item) }
        ];
    }
    
    contextMenu.value.show(event);
};

// Folder operations
const createFolder = () => {
    editingFolder.value = null;
    showCreateFolderDialog.value = true;
};

const editFolder = (folder) => {
    editingFolder.value = { ...folder };
    showCreateFolderDialog.value = true;
};

const confirmDeleteFolder = (folder) => {
    confirm.require({
        message: `Are you sure you want to delete folder "${folder.name}" and all its contents?`,
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        accept: () => deleteFolder(folder.id),
        reject: () => {}
    });
};

const deleteFolder = async (id) => {
    try {
        await apiClient.delete(`/admin/folders/${id}`);
        await fetchCurrentFolderData(currentFolder.value?.id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Folder deleted successfully',
            life: 3000
        });
    } catch (error) {
        showError('Failed to delete folder', error);
    }
};

// Set operations
const createSet = () => {
    editingSet.value = null;
    showCreateSetDialog.value = true;
};

const editSet = (set) => {
    editingSet.value = {
        ...set,
        folder_id: currentFolder.value?.id || null,
        total_marks: set.meta?.find((meta) => meta.meta_key === 'total_marks')?.meta_value || 0,
        negative_mark: set.meta?.find((meta) => meta.meta_key === 'negative_mark')?.meta_value || 0
    };
    showCreateSetDialog.value = true;
    
};

const viewSet = (set) => {
    selectedSetId.value = set.id;
    setViewMode.value = 'view';
    showAddQuestionsDialog.value = true;
};

const confirmDeleteSet = (set) => {
    confirm.require({
        message: `Are you sure you want to delete "${set.name}"?`,
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        accept: () => deleteSet(set.id),
        reject: () => {}
    });
};

const deleteSet = async (id) => {
    try {
        await apiClient.delete(`/admin/question-sets/${id}`);
        await fetchCurrentFolderData(currentFolder.value?.id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Set deleted successfully',
            life: 3000
        });
    } catch (error) {
        showError('Failed to delete set', error);
    }
};

const showAddQuestionsDialogHandler = (set) => {
    selectedSetId.value = set.id;
    setViewMode.value = 'add';
    showAddQuestionsDialog.value = true;
};

const openDigitalBoardHandler = (set) => {
    router.push(`/modern-digital-board/sets/${set.id}`);
};

const showPdfListDialogHandler = (set) => {
    selectedSetId.value = set.id;
    selectedSetName.value = set.name;
    showPdfListDialog.value = true;
};

// Event handlers
const handleFolderSave = () => {
    fetchCurrentFolderData(currentFolder.value?.id);
    showCreateFolderDialog.value = false;
};

const handleSetSave = () => {
    fetchCurrentFolderData(currentFolder.value?.id);
    showCreateSetDialog.value = false;
};

const handleQuestionsAdded = (count) => {
    showAddQuestionsDialog.value = false;
    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `${count} questions added to set`,
        life: 3000
    });
};

const resetFilters = () => {
    filters.global = '';
    filters.organization = null;
    filters.subject = null;
};

const showError = (message, error) => {
    console.error(error);
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000
    });
};

const loadOrganizations = async () => {
    try {
        const response = await apiClient.get('/admin/organizations');
        organizations.value = response.data.data;
    } catch (error) {
        showError('Failed to load organizations', error);
    }
};

const loadSubjects = async () => {
    try {
        const response = await apiClient.get('/admin/category-by-depth-index?depth_index=subject');
        subjects.value = response.data.data;
    } catch (error) {
        showError('Failed to load subjects', error);
    }
};

// Watch route changes
watch(
    () => route.query.folder,
    (folderId) => {
        fetchCurrentFolderData(folderId || null);
    },
    { immediate: true }
);

// Lifecycle
onMounted(() => {
    loadOrganizations();
    loadSubjects();
});
</script>

<template>
    <div class="p-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Question Sets</h1>
                <!-- Breadcrumbs -->
                <div class="flex items-center mt-2 text-sm text-gray-600">
                    <template v-for="(crumb, index) in breadcrumbs" :key="index">
                        <button 
                            v-if="index < breadcrumbs.length - 1"
                            @click="navigateToFolder(crumb.path)"
                            class="hover:text-blue-600 hover:underline"
                        >
                            {{ crumb.name }}
                        </button>
                        <span v-else class="text-gray-800 font-medium">{{ crumb.name }}</span>
                        <i v-if="index < breadcrumbs.length - 1" class="pi pi-chevron-right mx-2 text-gray-400"></i>
                    </template>
                </div>
            </div>
            
            <div class="flex gap-2">
                <Button 
                    label="New Folder" 
                    icon="pi pi-folder" 
                    class="p-button-outlined" 
                    @click="createFolder" 
                />
                <Button 
                    label="New Set" 
                    icon="pi pi-plus" 
                    class="p-button-primary" 
                    @click="createSet" 
                />
            </div>
        </div>

        <!-- Toolbar -->
        <div class="bg-white shadow rounded-lg p-4 mb-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <!-- Filters -->
                <div class="flex flex-wrap gap-4 flex-1">
                    <div class="min-w-[200px]">
                        <InputText 
                            v-model="filters.global" 
                            placeholder="Search folders and sets..." 
                            class="w-full"
                        />
                    </div>
                    <div class="min-w-[150px]">
                        <Dropdown 
                            v-model="filters.organization" 
                            :options="organizations" 
                            optionLabel="name" 
                            optionValue="id" 
                            placeholder="Organization" 
                            class="w-full" 
                        />
                    </div>
                    <Button 
                        label="Reset" 
                        icon="pi pi-filter-slash" 
                        class="p-button-outlined" 
                        @click="resetFilters" 
                    />
                </div>

                <!-- View Controls -->
                <div class="flex items-center gap-2">
                    <SelectButton 
                        v-model="viewMode" 
                        :options="[
                            { label: 'Grid', value: 'grid', icon: 'pi pi-th-large' },
                            { label: 'List', value: 'list', icon: 'pi pi-list' }
                        ]" 
                        optionLabel="label" 
                        optionValue="value"
                    >
                        <template #option="{ option }">
                            <i :class="option.icon"></i>
                        </template>
                    </SelectButton>
                    
                    <Dropdown 
                        v-model="itemSize" 
                        :options="[
                            { label: 'Small', value: 'small' },
                            { label: 'Medium', value: 'medium' },
                            { label: 'Large', value: 'large' }
                        ]" 
                        optionLabel="label" 
                        optionValue="value" 
                        class="w-32"
                    />
                </div>
            </div>
        </div>

        <!-- Content Area -->
        <div class="bg-white shadow rounded-lg p-6">
            <div v-if="loading" class="flex justify-center items-center h-64">
                <ProgressSpinner />
            </div>
            
            <!-- Grid View -->
            <div v-else-if="viewMode === 'grid'" :class="gridClasses">
                <div 
                    v-for="item in currentItems" 
                    :key="`${item.type}-${item.id}`"
                    class="item-card"
                    @dblclick="handleItemDoubleClick(item)"
                    @contextmenu="handleItemRightClick($event, item)"
                >
                    <div class="item-icon">
                        <FolderIcon v-if="item.type === 'folder'" :size="itemSize" />
                        <i v-else class="pi pi-file-text text-4xl text-blue-500"></i>
                    </div>
                    <div class="item-info">
                        <p class="item-name" :title="item.displayName">{{ item.displayName }}</p>
                        <p v-if="item.type === 'set'" class="item-meta">
                            {{ item.organization_name }} • {{ item.question_count || 0 }} questions
                        </p>
                        <p v-else class="item-meta">
                            {{ folders.filter(f => f.parent_id === item.id).length }} folders, 
                            {{ sets.filter(s => s.folder_id === item.id).length }} sets
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- List View -->
            <DataTable 
                v-else
                :value="currentItems"
                :paginator="true"
                :rows="25"
                :loading="loading"
                responsiveLayout="scroll"
                stripedRows
                @row-dblclick="({ data }) => handleItemDoubleClick(data)"
            >
                <Column field="displayName" header="Name" :sortable="true">
                    <template #body="{ data }">
                        <div class="flex items-center gap-3">
                            <FolderIcon v-if="data.type === 'folder'" size="small" />
                            <i v-else class="pi pi-file-text text-blue-500"></i>
                            <span class="font-medium">{{ data.displayName }}</span>
                        </div>
                    </template>
                </Column>
                
                <Column field="type" header="Type" :sortable="true">
                    <template #body="{ data }">
                        <Tag 
                            :value="data.type === 'folder' ? 'Folder' : 'Question Set'" 
                            :severity="data.type === 'folder' ? 'info' : 'success'" 
                        />
                    </template>
                </Column>
                
                <Column field="organization_name" header="Organization" :sortable="true">
                    <template #body="{ data }">
                        <span v-if="data.type === 'set'">{{ data.organization_name }}</span>
                        <span v-else class="text-gray-400">—</span>
                    </template>
                </Column>
                
                <Column field="question_count" header="Questions" :sortable="true">
                    <template #body="{ data }">
                        <Tag v-if="data.type === 'set'" :value="data.question_count || 0" severity="info" />
                        <span v-else class="text-gray-400">—</span>
                    </template>
                </Column>
                
                <Column header="Actions" headerStyle="width: 150px">
                    <template #body="{ data }">
                        <div class="flex gap-1">
                            <Button 
                                v-if="data.type === 'folder'"
                                icon="pi pi-folder-open" 
                                class="p-button-rounded p-button-text p-button-info" 
                                v-tooltip.top="'Open Folder'"
                                @click="navigateToFolder(data.id)" 
                            />
                            <template v-else>
                                <Button 
                                    icon="pi pi-eye" 
                                    class="p-button-rounded p-button-text p-button-info" 
                                    v-tooltip.top="'View Set'"
                                    @click="viewSet(data)" 
                                />
                                <Button 
                                    icon="pi pi-external-link" 
                                    class="p-button-rounded p-button-text p-button-success" 
                                    v-tooltip.top="'Open Board'"
                                    @click="openDigitalBoardHandler(data)" 
                                />
                            </template>
                            <Button 
                                icon="pi pi-ellipsis-v" 
                                class="p-button-rounded p-button-text" 
                                @click="handleItemRightClick($event, data)"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
            
            <!-- Empty State -->
            <div v-if="!loading && currentItems.length === 0" class="text-center py-12">
                <i class="pi pi-folder-open text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-medium text-gray-600 mb-2">No items found</h3>
                <p class="text-gray-500 mb-4">
                    {{ filters.global ? 'No items match your search criteria.' : 'This folder is empty.' }}
                </p>
                <div class="flex justify-center gap-2">
                    <Button 
                        label="Create Folder" 
                        icon="pi pi-folder" 
                        class="p-button-outlined" 
                        @click="createFolder" 
                    />
                    <Button 
                        label="Create Set" 
                        icon="pi pi-plus" 
                        @click="createSet" 
                    />
                </div>
            </div>
        </div>

        <!-- Context Menu -->
        <ContextMenu ref="contextMenu" :model="contextMenuItems" />

        <!-- Dialogs -->
        <Dialog 
            v-model:visible="showCreateFolderDialog" 
            :header="editingFolder ? 'Edit Folder' : 'Create New Folder'" 
            :modal="true" 
            :style="{ width: '400px' }"
        >
            <FolderForm 
                :isEdit="!!editingFolder" 
                :initialData="editingFolder || { parent_id: currentFolder?.id }" 
                @save="handleFolderSave" 
                @cancel="showCreateFolderDialog = false" 
            />
        </Dialog>

        <Dialog 
            v-model:visible="showCreateSetDialog" 
            :header="editingSet ? 'Edit Set' : 'Create New Set'" 
            :modal="true" 
            :style="{ width: '50vw' }" 
            :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
        >
            <SetForm 
                :isEdit="!!editingSet" 
                :initialData="editingSet || { folder_id: currentFolder?.id }" 
                @save="handleSetSave" 
                @update="handleSetSave"
                @cancel="showCreateSetDialog = false" 
            />
        </Dialog>

        <Dialog 
            v-model:visible="showAddQuestionsDialog" 
            header="View Questions in Set" 
            :modal="true" 
            :style="{ width: '80vw' }" 
            :breakpoints="{ '960px': '90vw', '640px': '95vw' }"
        >
            <AddQuestionsToSet 
                :setId="selectedSetId" 
                :viewMode="true"
                :createMode="setViewMode === 'add'"
                @questions-added="handleQuestionsAdded" 
                @cancel="showAddQuestionsDialog = false" 
            />
        </Dialog>

        <Dialog 
            v-model:visible="showPdfListDialog" 
            header="Manage PDFs" 
            :modal="true" 
            :style="{ width: '90vw', maxWidth: '1200px' }" 
            :breakpoints="{ '960px': '95vw', '640px': '98vw' }"
        >
            <PdfList 
                :setId="selectedSetId" 
                :setName="selectedSetName"
                @close="showPdfListDialog = false" 
            />
        </Dialog>

        <!-- Confirmation Dialog -->
        <ConfirmDialog />
    </div>
</template>

<style scoped>
.item-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s;
}

.item-card:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-color: #93c5fd;
}

.item-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 0.75rem;
}

.item-info {
    text-align: center;
}

.item-name {
    font-weight: 500;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 0.25rem;
}

.item-meta {
    font-size: 0.75rem;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Grid responsive adjustments */
@media (max-width: 768px) {
    .grid-cols-8 { 
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .grid-cols-4 { 
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .grid-cols-2 { 
        grid-template-columns: repeat(1, minmax(0, 1fr));
    }
}
</style>