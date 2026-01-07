<!-- NodeForm.vue component -->
<script>
// Define and export NodeForm component
import { defineComponent, ref, watch } from 'vue';

export default defineComponent({
    name: 'NodeForm',
    props: {
        node: {
            type: Object,
            default: null // Null if creating, object if editing
        },
        parentId: {
            type: Number,
            default: null // Parent ID for new child nodes
        }
    },
    emits: ['save', 'cancel'],
    setup(props, { emit }) {
        const name = ref(props.node ? props.node.name : '');
        const formError = ref('');

        // Watch for changes in the 'node' prop to reset the form when editing a different node
        watch(
            () => props.node,
            (newNode) => {
                name.value = newNode ? newNode.name : '';
                formError.value = ''; // Clear error when node prop changes
            }
        );

        /**
         * Handles the form submission for saving a node.
         * @param {Event} e - The form submission event.
         */
        const handleSubmit = (e) => {
            e.preventDefault();
            if (!name.value.trim()) {
                formError.value = 'Node name cannot be empty.';
                return;
            }
            formError.value = ''; // Clear error

            const nodeData = {
                id: props.node ? props.node.id : null, // Include ID if editing
                name: name.value.trim(),
                parentId: props.parentId || (props.node ? props.node.parentId : null)
            };
            //   console.log(nodeData);
            emit('save', nodeData); // Emit save event to parent
        };

        /**
         * Emits the cancel event to the parent component.
         */
        const handleCancel = () => {
            emit('cancel');
        };

        return {
            name,
            formError,
            handleSubmit,
            handleCancel
        };
    }
});
</script>

<template>
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 transform scale-100 animate-fade-in-up">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
                {{ node ? 'Edit Node' : parentId ? 'Create Child Node' : 'Create Base Node' }}
            </h2>
            <form @submit="handleSubmit">
                <div class="mb-5">
                    <label for="nodeName" class="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2"> Node Name: </label>
                    <input
                        type="text"
                        id="nodeName"
                        v-model="name"
                        class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 transition duration-150 ease-in-out"
                        placeholder="Enter node name"
                        required
                    />
                    <p v-if="formError" class="text-red-500 text-xs mt-2">{{ formError }}</p>
                </div>

                <div class="flex justify-end space-x-3">
                    <button
                        type="button"
                        @click="handleCancel"
                        class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg shadow-md transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
                    >
                        Cancel
                    </button>
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75">
                        {{ node ? 'Update Node' : 'Create Node' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>
