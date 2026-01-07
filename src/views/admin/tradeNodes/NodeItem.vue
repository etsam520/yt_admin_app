<!-- NodeItem.vue component -->
<script>
// Define and export NodeItem component
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'NodeItem', // Important for recursive components to self-reference
    props: {
        node: {
            type: Object,
            required: true
        },
        level: {
            type: Number,
            default: 0
        }
    },
    emits: ['edit-node', 'delete-node', 'create-child-node'],
    setup(props, { emit }) {
        // Calculate margin for indentation based on the nesting level
        const marginLeft = `${props.level + 12}px`;

        // Emit events for parent component to handle CRUD operations
        const handleEdit = () => emit('edit-node', props.node);
        const handleDelete = () => emit('delete-node', props.node.id);
        const handleCreateChild = () => {
            // console.log('Creating child node for:', props.node);
            emit('create-child-node', props.node.id);
        };

        return {
            marginLeft,
            handleEdit,
            handleDelete,
            handleCreateChild
        };
    }
    //   beforeMount() {
    //     // Log the component's name for debugging purposes
    //     console.log('NodeItem component mounted:', this.node);
    //   },
});
</script>

<template>
    <li class="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 transform transition duration-200 ease-in-out hover:shadow-lg hover:-translate-y-0.5" :style="{ marginLeft }">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="font-medium text-lg text-gray-900 dark:text-gray-100 truncate flex-grow">{{ node.name }} </span>

            <div class="flex flex-wrap gap-2">
                <Button icon="pi pi-plus" @click="handleCreateChild" rounded outlined />
                <Button icon="pi pi-user-edit" @click="handleEdit" severity="secondary" rounded outlined />
                <Button icon="pi pi-times" @click="handleDelete" severity="danger" rounded outlined />
            </div>
        </div>
        <!-- Recursively render child nodes -->
        <ul v-if="node.children && node.children.length > 0" class="mt-3 space-y-3 border-l-4 border-gray-300 dark:border-gray-600 pl-1">
            <NodeItem
                v-for="child in node.children"
                :key="child.id"
                :node="child"
                :level="level + 1"
                @edit-node="(payload) => $emit('edit-node', payload)"
                @delete-node="(payload) => $emit('delete-node', payload)"
                @create-child-node="(payload) => $emit('create-child-node', payload)"
            />
        </ul>
    </li>
</template>
