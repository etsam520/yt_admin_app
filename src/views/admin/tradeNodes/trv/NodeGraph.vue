<script setup>
import { ref, onMounted } from 'vue';

// Your nested trade node structure
const rawTree = ref([
    {
        id: 3,
        name: 'Business',
        parentId: null,
        createdAt: '2025-06-20T08:07:26.591Z',
        children: [
            {
                id: 8,
                name: 'Digital Marketing',
                parentId: 3,
                createdAt: '2025-06-20T08:07:26.591Z',
                children: []
            }
        ]
    },
    {
        id: 2,
        name: 'Design',
        parentId: null,
        createdAt: '2025-06-20T08:07:26.591Z',
        children: [
            {
                id: 7,
                name: 'Graphic Design',
                parentId: 2,
                createdAt: '2025-06-20T08:07:26.591Z',
                children: []
            },
            {
                id: 6,
                name: 'UI/UX Design',
                parentId: 2,
                createdAt: '2025-06-20T08:07:26.591Z',
                children: []
            }
        ]
    },
    {
        id: 1,
        name: 'Programming',
        parentId: null,
        createdAt: '2025-06-20T08:07:26.591Z',
        children: [
            {
                id: 5,
                name: 'Mobile App Development',
                parentId: 1,
                createdAt: '2025-06-20T08:07:26.591Z',
                children: []
            },
            {
                id: 4,
                name: 'Web Development',
                parentId: 1,
                createdAt: '2025-06-20T08:07:26.591Z',
                children: []
            }
        ]
    }
]);

const positionedNodes = ref([]);
const links = ref([]);

const spacingX = 180;
const spacingY = 120;

function layoutTree(treeList) {
    const positions = [];
    const edges = [];
    let currentX = 100;

    function traverse(node, depth = 0, parentNode = null) {
        const children = node.children || [];

        let x = currentX;
        let y = depth * spacingY + 50;

        // Traverse children first to center parent
        const childPositions = [];
        for (const child of children) {
            const childPos = traverse(child, depth + 1, node);
            childPositions.push(childPos);
        }

        if (childPositions.length > 0) {
            x = childPositions.reduce((sum, p) => sum + p.x, 0) / childPositions.length;
        } else {
            currentX += spacingX;
        }

        const thisNode = { id: node.id, name: node.name, x, y };
        positions.push(thisNode);

        // Add link if parent exists
        if (parentNode) {
            const parent = positions.find((p) => p.id === parentNode.id);
            if (parent) {
                edges.push({ source: parent, target: thisNode });
            }
        }

        return thisNode;
    }

    for (const rootNode of treeList) {
        traverse(rootNode);
    }

    positionedNodes.value = positions;
    links.value = edges;
}

onMounted(() => {
    layoutTree(rawTree.value);
});
</script>

<template>
    <div class="relative w-full h-[700px] bg-gray-100">
        <!-- SVG lines -->
        <svg height="100" width="100" xmlns="http://www.w3.org/2000/svg">
            <circle r="45" cx="50" cy="50" fill="red" stroke="green" stroke-width="3" />
            <text x="50" y="50" font-family="Arial" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle">abcd</text>
        </svg>
        <svg class="absolute top-0 left-0 w-full h-full">
            <line v-for="(link, index) in links" :key="index" :x1="link.source.x" :y1="link.source.y" :x2="link.target.x" :y2="link.target.y" stroke="#3b82f6" stroke-width="2" />
        </svg>

        <!-- Nodes -->
        <div v-for="node in positionedNodes" :key="node.id" class="absolute w-12 h-12 bg-green-600 rounded-full text-white text-sm font-bold flex items-center justify-center shadow-md" :style="{ left: `${node.x - 24}px`, top: `${node.y - 24}px` }">
            {{ node.name[0] }}
        </div>
    </div>
</template>
