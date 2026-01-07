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
        const chapters = ref([]);
        const topics = ref([]);
        const expandedKeys = ref({});
        const categories = ref([]);
        const parentOptions = ref([]);
        const categoryDialog = ref(false);
        const submitted = ref(false);
        const selectedSubjectId = ref(null);
        const selectedChapterId = ref(null);
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

        const selectedSubjectOption = ref(null);
        const selectedChapterOption = ref(null);
        const subjectDropDownOptions = ref([
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' }
        ]);
        const chapterDropDownOptions = ref([
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' }
        ]);

        const dialogTitle = computed(() => {
            return category.value.id ? 'Edit Category' : 'New Category';
        });

        return {
            selectedSubjectOption,
            selectedChapterOption,
            subjectDropDownOptions,
            chapterDropDownOptions,
            hierarchy,
            chapters,
            topics,
            expandedKeys,
            categories,
            parentOptions,
            categoryDialog,
            submitted,
            selectedSubjectId,
            selectedChapterId,
            category,
            depthOptions,
            dialogTitle,
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

                this.hierarchy = this.transformHierarchy(response.data.data);
                this.expandAll();

                const subjectNodes = this.transformSubjectNodes(this.hierarchy);

                this.subjectDropDownOptions = (subjectNodes.toList ? subjectNodes.toList() : subjectNodes).map((node) => ({
                    label: node.name,
                    value: node.key
                }));
                // console.log('Hierarchy:', this.hierarchy);

                // Flatten categories for parent options
                this.categories = this.flattenCategories(response.data.data);
                this.parentOptions = this.categories.filter((cat) => cat.depth_index === 'subject' || cat.depth_index === 'chapter');
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

        transformSubjectNodes(nodes) {
            return nodes.map((node) => {
                return {
                    key: node.data.id,
                    name: node.data.name
                };
            });
        },

        transformChapterNodes(nodes, $subjectId) {
            const filteredNodes = nodes.find((node) => node.data.id == $subjectId && node.data.depth_index === 'subject')?.children || [];
            return filteredNodes;
        },

        onSubjectChange() {
            this.selectedSubjectId = this.selectedSubjectOption.value;
            this.chapters = this.transformChapterNodes(this.hierarchy, this.selectedSubjectId);
            this.topics = [];
            this.selectedChapterId = null;
            this.selectedChapterOption = null;
            this.chapterDropDownOptions = this.chapters.map((node) => ({
                label: node.data.name,
                value: node.data.id
            }));
        },

        onChapterChange() {
            this.selectedChapterId = this.selectedChapterOption.value;
            this.category.parent_id = this.selectedChapterId;
            const filteredNodes = this.chapters.find((node) => node.data.id == this.selectedChapterId && node.data.depth_index === 'chapter')?.children || [];
            console.log('Topics:', filteredNodes);
            this.topics = filteredNodes;
        },

        expandAll() {
            this.expandedKeys = this.hierarchy.reduce((acc, node) => {
                acc[node.key] = true;
                if (node.children && node.children.length) {
                    Object.assign(acc, this.expandChildren(node.children));
                }
                return acc;
            }, {});
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

        openNew() {
            this.category = {
                id: null,
                name: '',
                slug: '',
                icon: '',
                depth_index: 'topic',
                parent_id: this.selectedChapterId
            };
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
            const subjectId = this.selectedSubjectId;
            const chapterId = this.selectedChapterId;
            (console.log('chapterId', chapterId), console.log('subjectId', subjectId));

            console.log('category', this.category);
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
                await this.fetchCategories();
                this.chapters = await this.transformChapterNodes(this.hierarchy, subjectId);
                this.topics = (await this.chapters.find((node) => node.data.id == chapterId && node.data.depth_index === 'chapter')?.children) || [];
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
                        <div class="flex flex-column gap-2 w-full">
                            <div class="text-lg font-medium">Question Subject :: :: Chapter :: :: Topic</div>
                        </div>
                        <div class="flex align-items-center justify-content-between w-full mt-3">
                            <Dropdown v-model="selectedSubjectOption" :options="subjectDropDownOptions" optionLabel="label" placeholder="Select Subject" class="w-full md:w-14rem" @change="onSubjectChange" />

                            <Dropdown :disabled="selectedSubjectOption == null" v-model="selectedChapterOption" :options="chapterDropDownOptions" optionLabel="label" placeholder="Select Chapter" class="w-full md:w-14rem" @change="onChapterChange" />
                            <Button v-if="canCreate()" label="Add New" icon="pi pi-plus" :disabled="selectedChapterOption == null" @click="openNew" class="p-button-sm ml-2" />
                        </div>
                    </template>
                    <template #content>
                        <TreeTable tableStyle="min-width: 50rem" :value="topics">
                            <Column field="name" header="Name"></Column>
                            <Column field="depth_index" header="Type">
                                <template #body="{ node }">
                                    <Tag :value="node.data.depth_index" :severity="getSeverity(node.data.depth_index)" />
                                </template>
                            </Column>
                            <Column header="Actions" :style="{ width: '180px' }">
                                <template #body="{ node }">
                                    <Button v-if="canUpdate()" v-tooltip.top="'Edit category'" icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm mr-2" @click="editCategory(node.data)" />
                                    <Button icon="pi pi-trash" v-if="canDelete()" v-tooltip.top="'Delete category'" class="p-button-rounded p-button-text p-button-sm p-button-danger" @click="confirmDelete(node.data)" />
                                </template>
                            </Column>
                        </TreeTable>
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
