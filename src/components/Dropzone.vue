<script>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import Dropzone from 'dropzone';

export default {
    name: 'Dropzone',
    props: {
        options: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['added-file', 'removed-file'],
    setup(props, { emit }) {
        const dropzoneElement = ref(null);
        let dropzoneInstance = null;

        onMounted(() => {
            // Initialize Dropzone
            Dropzone.autoDiscover = false;
            dropzoneInstance = new Dropzone(dropzoneElement.value, {
                url: '#', // Will be overridden by options
                autoProcessQueue: false,
                addRemoveLinks: true,
                ...props.options
            });

            // Set up event handlers
            dropzoneInstance.on('addedfile', (file) => {
                emit('added-file', file);
            });

            dropzoneInstance.on('removedfile', (file) => {
                emit('removed-file', file);
            });
        });

        onBeforeUnmount(() => {
            if (dropzoneInstance) {
                dropzoneInstance.destroy();
            }
        });

        return {
            dropzoneElement
        };
    }
};
</script>

<template>
    <div class="dropzone" ref="dropzoneElement">
        <input type="file" class="hidden" />
        <slot name="message">
            <div class="default-message">Drop files here or click to upload</div>
        </slot>
    </div>
</template>

<style>
@import 'dropzone/dist/dropzone.css';

.dropzone {
    border: 2px dashed #ccc;
    border-radius: 5px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.dropzone:hover {
    border-color: #aaa;
    background-color: #f8f9fa;
}

.dropzone .dz-message {
    margin: 0;
}

.dropzone .default-message {
    color: #666;
}

.dropzone .dz-preview .dz-image {
    border-radius: 4px;
}

.dropzone .dz-preview .dz-remove {
    font-size: 14px;
    text-decoration: none;
    color: #ff0000;
}

.dropzone .dz-preview .dz-remove:hover {
    text-decoration: underline;
}

.hidden {
    display: none;
}
</style>
