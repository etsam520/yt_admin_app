<script>
import { ref, computed, toRaw } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { apiClient } from '@/service/apiService';
import { usePermissionStore, RESOURCE, ACTIONS } from '@/stores/permissionStore';

export default {
    setup() {
        const toast = useToast();
        const confirm = useConfirm();
        const permissionStore = usePermissionStore();

        const hierarchy = ref([]);
        const expandedKeys = ref({});
        const categories = ref([]);
        const parentOptions = ref([]);
        const categoryDialog = ref(false);
        const submitted = ref(false);
        const selectedCategory = ref(null);
        const parentCategory = ref(null);

        const category = ref({
            id: null,
            name: '',
            slug: '',
            icon: '',
            depth_index: 'subject',
            parent_id: null
        });

        const depthOptions = ref([
            { label: 'Subject', value: 'subject' },
            { label: 'Chapter', value: 'chapter' },
            { label: 'Topic', value: 'topic' }
        ]);

        const dialogTitle = computed(() => {
            if (parentCategory.value) {
                return `Add ${nextDepthType.value} to ${parentCategory.value.name}`;
            }
            return category.value.id ? 'Edit Category' : 'New Category';
        });

        const nextDepthType = computed(() => {
            if (!parentCategory.value) return '';
            return parentCategory.value.depth_index === 'subject' ? 'chapter' : 'topic';
        });

        const showParentField = computed(() => {
            return !parentCategory.value || category.value.depth_index === 'topic';
        });

        return {
            hierarchy,
            expandedKeys,
            categories,
            parentOptions,
            categoryDialog,
            submitted,
            selectedCategory,
            parentCategory,
            category,
            depthOptions,
            dialogTitle,
            nextDepthType,
            showParentField,
            toast,
            confirm,
            canCreate: () => permissionStore.has(RESOURCE.CATEGORY, ACTIONS.CREATE),
            canDelete: () => permissionStore.has(RESOURCE.CATEGORY, ACTIONS.DELETE),
            canUpdate: () => permissionStore.has(RESOURCE.CATEGORY, ACTIONS.UPDATE)
        };
    },
    created() {
        this.fetchCategories();
    },
    methods: {
        async fetchCategories() {
            try {
                const response = await apiClient.get('/admin/categories');
                console.log(response.data);

                this.hierarchy = this.transformHierarchy(response.data.data);
                this.expandAll();

                console.log('Hierarchy:', this.hierarchy);

                // Flatten categories for parent options
                this.categories = this.flattenCategories(response.data.data);
                console.log('Categories:', this.categories);
                this.parentOptions = this.categories.filter((cat) => cat.depth_index === 'subject' || cat.depth_index === 'chapter');
                console.log('Parent Options:', this.parentOptions);
            } catch (error) {
                this.showError('Failed to fetch categories', error);
            }
        },

        transformHierarchy(nodes) {
            return nodes.map((node) => {
                const newNode = {
                    key: node.id.toString(),
                    data: { ...node },
                    children: node.children ? this.transformHierarchy(node.children) : []
                };
                return newNode;
            });
        },

        flattenCategories(nodes, result = []) {
            nodes.forEach((node) => {
                result.push(node);
                if (node.children) {
                    this.flattenCategories(node.children, result);
                }
            });
            return result;
        },

        expandAll() {
            this.expandedKeys = this.hierarchy.reduce((acc, node) => {
                acc[node.key] = true;
                if (node.children && node.children.length) {
                    Object.assign(acc, this.expandChildren(node.children));
                }
                return acc;
            }, {});
            console.log('Expanded keys:', this.expandedKeys);
        },

        expandChildren(nodes) {
            return nodes.reduce((acc, node) => {
                acc[node.key] = true;
                if (node.children && node.children.length) {
                    Object.assign(acc, this.expandChildren(node.children));
                }
                return acc;
            }, {});
        },

        onNodeExpand(node) {
            this.expandedKeys[node.key] = true;
        },

        onNodeCollapse(node) {
            delete this.expandedKeys[node.key];
        },

        openNew() {
            this.category = {
                id: null,
                name: '',
                slug: '',
                icon: '',
                depth_index: 'subject',
                parent_id: null
            };
            this.parentCategory = null;
            this.submitted = false;
            this.categoryDialog = true;
        },

        openNewChild(parent) {
            this.category = {
                id: null,
                name: '',
                slug: '',
                icon: '',
                depth_index: parent.depth_index === 'subject' ? 'chapter' : 'topic',
                parent_id: parent.id
            };
            this.parentCategory = parent;
            this.submitted = false;
            this.categoryDialog = true;
        },

        editCategory(cat) {
            this.category = { ...cat };
            this.parentCategory = null;
            this.submitted = false;
            this.categoryDialog = true;
        },

        hideDialog() {
            this.categoryDialog = false;
            this.submitted = false;
            this.parentCategory = null;
        },

        async saveCategory() {
            this.submitted = true;

            // Validate
            if (!this.category.name || !this.category.slug) return;
            if (this.category.depth_index !== 'subject' && !this.category.parent_id) return;

            try {
                if (this.category.id) {
                    const _cat = { ...toRaw(this.category) };
                    _cat._method = 'PUT';
                    await apiClient.post(`/admin/categories/${this.category.id}`, _cat);
                    this.toast.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Category Updated',
                        life: 3000
                    });
                } else {
                    await apiClient.post('/admin/categories', this.category);
                    this.toast.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Category Created',
                        life: 3000
                    });
                }

                this.categoryDialog = false;
                this.fetchCategories();
            } catch (error) {
                this.showError('Failed to save category', error);
            }
        },

        confirmDelete(category) {
            this.confirm.require({
                message: `Are you sure you want to delete ${category.name}?`,
                header: 'Confirm Deletion',
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteCategory(category.id)
            });
        },

        async deleteCategory(id) {
            try {
                const _cat = { _method: 'DELETE' };
                await apiClient.post(`/admin/categories/${id}`, _cat);
                this.toast.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Category Deleted',
                    life: 3000
                });
                this.fetchCategories();
            } catch (error) {
                this.showError('Failed to delete category', error);
            }
        },

        getSeverity(depthIndex) {
            switch (depthIndex) {
                case 'subject':
                    return 'primary';
                case 'chapter':
                    return 'success';
                case 'topic':
                    return 'info';
                default:
                    return null;
            }
        },

        showError(summary, error) {
            console.error(error);
            this.toast.add({
                severity: 'error',
                summary: summary,
                detail: error.response?.data?.message || error.message,
                life: 5000
            });
        }
    }
};
</script>

<template>
    <div class="p-4">
        <div class="grid">
            <div class="col-12 md:col-8">
                <Card>
                    <template #title>
                        <div class="flex align-items-center justify-content-between">
                            <span>Question Categories</span>
                            <Button v-if="canCreate() && false" label="Add New" icon="pi pi-plus" @click="openNew" class="p-button-sm" />
                        </div>
                    </template>
                    <template #content>
                        <TreeTable :value="hierarchy" :expandedKeys="expandedKeys" @nodeExpand="onNodeExpand" @nodeCollapse="onNodeCollapse">
                            <Column field="name" header="Name" expander></Column>
                            <Column field="depth_index" header="Type">
                                <template #body="{ node }">
                                    <Tag :value="node.data.depth_index" :severity="getSeverity(node.data.depth_index)" />
                                </template>
                            </Column>
                            <Column header="Actions" :style="{ width: '180px' }" v-if="false">
                                <template #body="{ node }">
                                    <Button v-if="canUpdate()" v-tooltip.top="'Edit category'" icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm mr-2" @click="editCategory(node.data)" />
                                    <Button icon="pi pi-trash" v-if="canDelete()" v-tooltip.top="'Delete category'" class="p-button-rounded p-button-text p-button-sm p-button-danger" @click="confirmDelete(node.data)" />
                                    <Button
                                        v-if="node.data.depth_index !== 'topic' && canCreate()"
                                        icon="pi pi-plus"
                                        class="p-button-rounded p-button-text p-button-sm p-button-success ml-2"
                                        @click="openNewChild(node.data)"
                                        v-tooltip.top="'Add child category'"
                                    />
                                </template>
                            </Column>
                        </TreeTable>
                    </template>
                </Card>
            </div>

            <div class="col-12 md:col-4">
                <Card>
                    <template #title>Category Details</template>
                    <template #content>
                        <div v-if="selectedCategory" class="p-3 border-round surface-card">
                            <div class="text-xl font-bold mb-2">{{ selectedCategory.name }}</div>
                            <div class="flex align-items-center mb-2">
                                <span class="font-medium mr-2">Type:</span>
                                <Tag :value="selectedCategory.depth_index" :severity="getSeverity(selectedCategory.depth_index)" />
                            </div>
                            <div v-if="selectedCategory.parent" class="mb-2">
                                <span class="font-medium mr-2">Parent:</span>
                                {{ selectedCategory.parent.name }}
                            </div>
                            <div class="mb-2">
                                <span class="font-medium mr-2">Slug:</span>
                                {{ selectedCategory.slug }}
                            </div>
                            <div v-if="selectedCategory.icon" class="mb-2">
                                <span class="font-medium mr-2">Icon:</span>
                                <i :class="selectedCategory.icon"></i>
                            </div>
                        </div>
                        <div v-else class="p-3 text-center text-color-secondary">Select a category to view details</div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Category Dialog -->
        <Dialog v-model:visible="categoryDialog" :style="{ width: '450px' }" :header="dialogTitle" :modal="true">
            <div class="p-fluid">
                <div class="field mb-4">
                    <label for="name">Name</label>
                    <InputText id="name" v-model.trim="category.name" required="true" autofocus :class="{ 'p-invalid': submitted && !category.name }" />
                    <small class="p-error" v-if="submitted && !category.name"> Name is required. </small>
                </div>

                <div class="field mb-4">
                    <label for="slug">Slug</label>
                    <InputText id="slug" v-model.trim="category.slug" required="true" :class="{ 'p-invalid': submitted && !category.slug }" />
                    <small class="p-error" v-if="submitted && !category.slug"> Slug is required. </small>
                </div>

                <div class="field mb-4">
                    <label for="icon">Icon (optional)</label>
                    <InputText id="icon" v-model.trim="category.icon" />
                </div>

                <div class="field mb-4">
                    <label for="depth_index">Category Type</label>
                    <Dropdown id="depth_index" v-model="category.depth_index" :options="depthOptions" optionLabel="label" optionValue="value" placeholder="Select a type" :disabled="!!parentCategory" />
                    <small v-if="parentCategory" class="text-color-secondary"> Type is determined by parent ({{ parentCategory.depth_index }} → {{ nextDepthType }}) </small>
                </div>

                <div class="field mb-4" v-if="showParentField">
                    <label for="parent_id">Parent Category</label>
                    <!-- <TreeSelect 
            id="parent_id" 
            v-model="category.parent_id" 
            :options="parentOptions"
            optionLabel="name"
            optionValue="id" 
            placeholder="Select parent"
            :selectionMode="'single'"
            :metaKeySelection="false"
            :class="{'p-invalid': submitted && category.depth_index !== 'subject' && !category.parent_id}"
          /> -->
                    <CascadeSelect
                        v-model="category.parent_id"
                        :options="hierarchy"
                        optionLabel="name"
                        optionValue="id"
                        optionGroupLabel="name"
                        optionGroupChildren="children"
                        placeholder="Select Parent Category"
                        :class="{ 'p-invalid': submitted && category.depth_index !== 'subject' && !category.parent_id }"
                    />
                    <small class="p-error" v-if="submitted && category.depth_index !== 'subject' && !category.parent_id"> Parent is required for chapters and topics. </small>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" @click="hideDialog" class="p-button-text" />
                <Button label="Save" icon="pi pi-check" @click="saveCategory" class="p-button-text" />
            </template>
        </Dialog>

        <ConfirmDialog></ConfirmDialog>
        <Toast />
    </div>
</template>

<style scoped>
.p-treetable ::v-deep(.p-treetable-tbody) tr:hover {
    background-color: rgba(0, 0, 0, 0.03);
}

.p-treetable ::v-deep(.p-treetable-tbody) tr td {
    padding: 0.5rem 1rem;
}

.category-details {
    border-left: 1px solid #dee2e6;
}
</style>
