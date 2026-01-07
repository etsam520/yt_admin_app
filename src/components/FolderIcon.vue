<script setup>
const props = defineProps({
    size: {
        type: String,
        default: 'medium' // 'small' | 'medium' | 'large'
    },
    color: {
        type: String,
        default: '#3B82F6' // Blue color
    }
});

const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
};
</script>

<template>
    <div :class="sizeClasses[size]">
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 2500 2500" 
            :width="sizeClasses[size].includes('w-8') ? '32' : sizeClasses[size].includes('w-12') ? '48' : '64'"
            :height="sizeClasses[size].includes('w-8') ? '32' : sizeClasses[size].includes('w-12') ? '48' : '64'"
            class="folder-icon"
        >
            <defs>
                <linearGradient id="folderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" :style="`stop-color:${color};stop-opacity:1`" />
                    <stop offset="100%" :style="`stop-color:${darkenColor(color, 20)};stop-opacity:1`" />
                </linearGradient>
            </defs>
            <path 
                d="M 2205.8 547.4 L 1151.9 547.4 L 917.7 313.2 L 332.2 313.2 C 203.39 313.2 98 418.59 98 547.4 L 98 1952.8 C 98 2081.61 203.39 2187 332.2 2187 L 2205.8 2187 C 2334.61 2187 2440 2081.61 2440 1952.8 L 2440 781.6 C 2440 652.79 2334.61 547.4 2205.8 547.4 Z" 
                fill="url(#folderGradient)" 
                stroke="none"
            />
            <!-- Folder tab -->
            <path 
                d="M 917.7 313.2 L 1151.9 547.4 L 2205.8 547.4 C 2334.61 547.4 2440 652.79 2440 781.6 L 2440 547.4 C 2440 418.59 2334.61 313.2 2205.8 313.2 L 917.7 313.2 Z" 
                :fill="darkenColor(color, 30)" 
                opacity="0.8"
            />
        </svg>
    </div>
</template>

<script>
export default {
    methods: {
        darkenColor(color, percent) {
            // Simple color darkening function
            const num = parseInt(color.replace("#", ""), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255))
                .toString(16).slice(1);
        }
    }
}
</script>

<style scoped>
.folder-icon {
    transition: all 0.2s ease;
}

.folder-icon:hover {
    transform: scale(1.1);
}
</style>