<script setup>
import { ref, computed } from 'vue';
import TreeNode from './TreeNode.vue';

const props = defineProps({
    node: Object,
    selectedId: Number
});

const emit = defineEmits(['select']);

const showChildren = ref(false);

const isSelected = computed(() => props.node.id === props.selectedId);

const toggle = () => {
    emit('select', props.node.id);
    showChildren.value = !showChildren.value;
};
</script>

<template>
    <div class="tree-node relative ml-4 mt-2">
        <!-- Circle node with connection line -->
        <div class="node relative inline-block px-4 py-2 rounded-full cursor-pointer text-white text-sm" :class="isSelected ? 'bg-green-600' : 'bg-gray-500'" @click="toggle">
            {{ node.name }}
            <!-- Vertical line down -->
            <div v-if="showChildren && node.children?.length" class="absolute top-full left-1/2 h-5 w-0.5 bg-blue-500" style="transform: translateX(-50%)"></div>
        </div>

        <!-- Horizontal + vertical connectors to children -->
        <div v-if="showChildren && node.children?.length" class="flex justify-center items-start space-x-6 mt-2 relative">
            <div class="absolute top-0 left-0 w-full h-0.5 bg-blue-500" style="top: -10px"></div>

            <TreeNode v-for="child in node.children" :key="child.id" :node="child" :selected-id="selectedId" @select="emit('select', $event)" />
        </div>
    </div>
</template>

<style scoped>
.tree-node {
    position: relative;
}

.node {
    position: relative;
    z-index: 10;
}
</style>
