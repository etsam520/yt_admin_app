<template>
    <div class="custom-ad-strip" :style="stripStyles">
        <!-- Ad Content Display -->
        <div class="ad-content" v-if="!editMode">
            <div v-for="(item, index) in adItems" :key="index" class="ad-item" :style="getItemStyles(item)" @click="editItem(index)">
                <!-- Image Item -->
                <img
                    v-if="item.type === 'image'"
                    :src="item.content"
                    :alt="item.alt || 'Ad Image'"
                    class="ad-image"
                    :style="{
                        width: item.width + 'px',
                        height: item.height + 'px',
                        objectFit: 'contain'
                    }"
                />

                <!-- Text Item -->
                <span
                    v-else-if="item.type === 'text'"
                    class="ad-text"
                    :style="{
                        fontSize: item.fontSize + 'px',
                        fontWeight: item.fontWeight,
                        color: item.color,
                        fontFamily: item.fontFamily
                    }"
                >
                    {{ item.content }}
                </span>
            </div>

            <!-- Edit Button -->
            <button @click="toggleEditMode" class="edit-strip-btn" title="Edit Ad Strip">
                <FontAwesomeIcon :icon="faEdit" />
            </button>
        </div>

        <!-- Edit Mode -->
        <div v-if="editMode" class="edit-mode">
            <!-- Edit Mode Notice -->
            <div class="edit-notice">
                <div class="notice-content">
                    <span class="notice-icon">✏️</span>
                    <div class="notice-text">
                        <strong>Edit Mode Active</strong>
                        <p>Digital board is hidden while customizing the ad strip. Click "Done" when finished.</p>
                    </div>
                </div>
            </div>

            <!-- Live Preview -->
            <div class="preview-section">
                <div class="preview-header">
                    <h4>Live Preview</h4>
                    <span class="preview-badge">Real-time</span>
                </div>
                <div class="preview-container">
                    <div class="preview-ad-strip" :style="stripStyles">
                        <div class="preview-ad-content">
                            <div v-for="(item, index) in adItems" :key="`preview-${index}`" class="preview-ad-item" :style="getItemStyles(item)">
                                <!-- Preview Image Item -->
                                <img
                                    v-if="item.type === 'image'"
                                    :src="item.content"
                                    :alt="item.alt || 'Ad Image'"
                                    class="preview-ad-image"
                                    :style="{
                                        width: item.width + 'px',
                                        height: item.height + 'px',
                                        objectFit: 'contain'
                                    }"
                                />

                                <!-- Preview Text Item -->
                                <span
                                    v-else-if="item.type === 'text'"
                                    class="preview-ad-text"
                                    :style="{
                                        fontSize: item.fontSize + 'px',
                                        fontWeight: item.fontWeight,
                                        color: item.color,
                                        fontFamily: item.fontFamily
                                    }"
                                >
                                    {{ item.content }}
                                </span>
                            </div>
                        </div>
                        <div class="preview-edit-indicator">
                            <span class="preview-icon">👁️</span>
                            <span>Preview Mode</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Strip Settings -->
            <div class="strip-settings">
                <div class="settings-row">
                    <div class="setting-group">
                        <label>Background Color:</label>
                        <input type="color" v-model="stripSettings.backgroundColor" />
                    </div>
                    <div class="setting-group">
                        <label>Height:</label>
                        <input type="range" min="40" max="120" v-model="stripSettings.height" />
                        <span>{{ stripSettings.height }}px</span>
                    </div>
                    <div class="setting-group">
                        <label>Padding:</label>
                        <input type="range" min="5" max="30" v-model="stripSettings.padding" />
                        <span>{{ stripSettings.padding }}px</span>
                    </div>
                </div>
            </div>

            <!-- Ad Items List -->
            <div class="ad-items-editor">
                <div class="items-header">
                    <h4>Ad Items</h4>
                    <div class="add-buttons">
                        <button @click="addTextItem" class="add-btn text-btn"><FontAwesomeIcon :icon="faFont" /> Add Text</button>
                        <button @click="triggerImageUpload" class="add-btn image-btn"><FontAwesomeIcon :icon="faImage" /> Add Image</button>
                    </div>
                </div>

                <!-- Items Editor -->
                <div class="items-list">
                    <div v-for="(item, index) in adItems" :key="index" class="item-editor">
                        <div class="item-header">
                            <span class="item-type-badge" :class="item.type">
                                {{ item.type.toUpperCase() }}
                            </span>
                            <div class="item-actions">
                                <button @click="moveItemUp(index)" :disabled="index === 0">
                                    <FontAwesomeIcon :icon="faArrowUp" />
                                </button>
                                <button @click="moveItemDown(index)" :disabled="index === adItems.length - 1">
                                    <FontAwesomeIcon :icon="faArrowDown" />
                                </button>
                                <button @click="removeItem(index)" class="delete-btn">
                                    <FontAwesomeIcon :icon="faTrash" />
                                </button>
                            </div>
                        </div>

                        <!-- Text Item Editor -->
                        <div v-if="item.type === 'text'" class="text-editor">
                            <div class="editor-row">
                                <label>Text:</label>
                                <input type="text" v-model="item.content" placeholder="Enter text..." maxlength="100" />
                            </div>
                            <div class="editor-row">
                                <div class="setting-group">
                                    <label>Color:</label>
                                    <input type="color" v-model="item.color" />
                                </div>
                                <div class="setting-group">
                                    <label>Size:</label>
                                    <input type="range" min="10" max="32" v-model="item.fontSize" />
                                    <span>{{ item.fontSize }}px</span>
                                </div>
                                <div class="setting-group">
                                    <label>Weight:</label>
                                    <select v-model="item.fontWeight">
                                        <option value="normal">Normal</option>
                                        <option value="bold">Bold</option>
                                        <option value="600">Semi Bold</option>
                                        <option value="300">Light</option>
                                    </select>
                                </div>
                            </div>
                            <div class="editor-row">
                                <div class="setting-group">
                                    <label>Font:</label>
                                    <select v-model="item.fontFamily">
                                        <option value="Arial, sans-serif">Arial</option>
                                        <option value="Georgia, serif">Georgia</option>
                                        <option value="'Times New Roman', serif">Times New Roman</option>
                                        <option value="'Courier New', monospace">Courier New</option>
                                        <option value="Verdana, sans-serif">Verdana</option>
                                        <option value="Impact, sans-serif">Impact</option>
                                    </select>
                                </div>
                                <div class="setting-group">
                                    <label>Margin:</label>
                                    <input type="range" min="0" max="30" v-model="item.marginRight" />
                                    <span>{{ item.marginRight }}px</span>
                                </div>
                            </div>
                        </div>

                        <!-- Image Item Editor -->
                        <div v-if="item.type === 'image'" class="image-editor">
                            <div class="image-preview">
                                <img :src="item.content" :alt="item.alt" class="preview-img" />
                            </div>
                            <div class="editor-row">
                                <div class="setting-group">
                                    <label>Alt Text:</label>
                                    <input type="text" v-model="item.alt" placeholder="Image description..." />
                                </div>
                                <div class="setting-group">
                                    <label>Width:</label>
                                    <input type="range" min="20" max="200" v-model="item.width" />
                                    <span>{{ item.width }}px</span>
                                </div>
                                <div class="setting-group">
                                    <label>Height:</label>
                                    <input type="range" min="20" max="200" v-model="item.height" />
                                    <span>{{ item.height }}px</span>
                                </div>
                            </div>
                            <div class="editor-row">
                                <div class="setting-group">
                                    <label>Margin:</label>
                                    <input type="range" min="0" max="30" v-model="item.marginRight" />
                                    <span>{{ item.marginRight }}px</span>
                                </div>
                                <button @click="changeImage(index)" class="change-image-btn"><FontAwesomeIcon :icon="faImage" /> Change Image</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="edit-actions">
                <button @click="resetToDefault" class="action-btn reset-btn"><FontAwesomeIcon :icon="faRedo" /> Reset</button>
                <button @click="exportSettings" class="action-btn export-btn"><FontAwesomeIcon :icon="faDownload" /> Export</button>
                <button @click="toggleEditMode" class="action-btn save-btn"><FontAwesomeIcon :icon="faSave" /> Done</button>
            </div>
        </div>

        <!-- Hidden file input -->
        <input ref="fileInput" type="file" accept="image/*" @change="handleImageUpload" style="display: none" />
    </div>
</template>


<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faEdit, faFont, faImage, faArrowUp, faArrowDown, faTrash, faSave, faRedo, faDownload } from '@fortawesome/free-solid-svg-icons';

const toast = useToast();
const fileInput = ref(null);
const editMode = ref(false);
const currentEditingIndex = ref(-1);

// Strip settings
const stripSettings = ref({
    backgroundColor: '#f8fafc',
    height: 60,
    padding: 15,
    borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
});

// Ad items array
const adItems = ref([
    {
        type: 'text',
        content: 'Welcome to Modern Digital Teaching Board',
        color: '#1e293b',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        marginRight: 20
    },
    {
        type: 'text',
        content: '🎯 Interactive Learning',
        color: '#059669',
        fontSize: 14,
        fontWeight: 'normal',
        fontFamily: 'Arial, sans-serif',
        marginRight: 15
    }
]);

// Computed styles
const stripStyles = computed(() => ({
    backgroundColor: stripSettings.value.backgroundColor,
    height: stripSettings.value.height + 'px',
    padding: stripSettings.value.padding + 'px',
    borderRadius: stripSettings.value.borderRadius + 'px',
    boxShadow: stripSettings.value.boxShadow
}));

// Get item styles
const getItemStyles = (item) => ({
    marginRight: item.marginRight + 'px'
});

// Define emits
const emit = defineEmits(['edit-mode-changed']);

// Methods
const toggleEditMode = () => {
    editMode.value = !editMode.value;

    // Emit edit mode change event to parent
    emit('edit-mode-changed', editMode.value);

    if (!editMode.value) {
        saveToLocalStorage();
    }
};

const addTextItem = () => {
    adItems.value.push({
        type: 'text',
        content: 'New Text',
        color: '#1e293b',
        fontSize: 14,
        fontWeight: 'normal',
        fontFamily: 'Arial, sans-serif',
        marginRight: 10
    });
};

const triggerImageUpload = () => {
    console.log('Triggering image upload...');
    currentEditingIndex.value = -1;

    if (fileInput.value) {
        // Reset the input first to ensure change event fires even for same file
        fileInput.value.value = '';
        fileInput.value.click();
    } else {
        console.error('File input reference not found');
        toast.add({
            severity: 'error',
            summary: 'Upload Error',
            detail: 'Image upload interface not available',
            life: 3000
        });
    }
};

const changeImage = (index) => {
    console.log('Changing image for index:', index);
    currentEditingIndex.value = index;

    if (fileInput.value) {
        // Reset the input first to ensure change event fires even for same file
        fileInput.value.value = '';
        fileInput.value.click();
    } else {
        console.error('File input reference not found');
        toast.add({
            severity: 'error',
            summary: 'Upload Error',
            detail: 'Image upload interface not available',
            life: 3000
        });
    }
};

const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 100KB)
    if (file.size > 100 * 1024) {
        toast.add({
            severity: 'error',
            summary: 'File Too Large',
            detail: 'Image file size must be less than 100KB',
            life: 3000
        });
        return;
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
        toast.add({
            severity: 'error',
            summary: 'Invalid File',
            detail: 'Please select an image file (PNG, JPG, GIF, etc.)',
            life: 3000
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageData = e.target.result;

        // Create image to check dimensions
        const img = new Image();
        img.onload = () => {
            // Default size for new images (ensuring max 200px width)
            let defaultWidth = Math.min(img.width, 200);
            let defaultHeight = Math.min(img.height, 200);

            // Maintain aspect ratio
            if (img.width > 200 || img.height > 200) {
                const aspectRatio = img.width / img.height;
                if (img.width > img.height) {
                    defaultWidth = 200;
                    defaultHeight = Math.round(200 / aspectRatio);
                } else {
                    defaultHeight = 200;
                    defaultWidth = Math.round(200 * aspectRatio);
                }
            }

            if (currentEditingIndex.value >= 0) {
                // Update existing image
                adItems.value[currentEditingIndex.value].content = imageData;
                adItems.value[currentEditingIndex.value].alt = file.name;
            } else {
                // Add new image with size constraints
                adItems.value.push({
                    type: 'image',
                    content: imageData,
                    alt: file.name,
                    width: Math.min(defaultWidth, 200),
                    height: Math.min(defaultHeight, 200),
                    marginRight: 10
                });
            }

            // Auto-save to localStorage immediately
            saveToLocalStorage();

            toast.add({
                severity: 'success',
                summary: 'Image Added',
                detail: `Image successfully uploaded (${Math.min(defaultWidth, 200)}x${Math.min(defaultHeight, 200)}px)`,
                life: 3000
            });
        };

        img.onerror = () => {
            toast.add({
                severity: 'error',
                summary: 'Invalid Image',
                detail: 'Could not load the selected image file',
                life: 3000
            });
        };

        img.src = imageData;
    };

    reader.onerror = () => {
        toast.add({
            severity: 'error',
            summary: 'File Error',
            detail: 'Could not read the selected file',
            life: 3000
        });
    };

    reader.readAsDataURL(file);

    // Reset file input
    event.target.value = '';
    currentEditingIndex.value = -1;
};

const removeItem = (index) => {
    adItems.value.splice(index, 1);
};

const moveItemUp = (index) => {
    if (index > 0) {
        const temp = adItems.value[index];
        adItems.value[index] = adItems.value[index - 1];
        adItems.value[index - 1] = temp;
    }
};

const moveItemDown = (index) => {
    if (index < adItems.value.length - 1) {
        const temp = adItems.value[index];
        adItems.value[index] = adItems.value[index + 1];
        adItems.value[index + 1] = temp;
    }
};

const editItem = (index) => {
    // Could implement inline editing or highlight selected item
    console.log('Editing item:', index);
};

const resetToDefault = () => {
    stripSettings.value = {
        backgroundColor: '#f8fafc',
        height: 60,
        padding: 15,
        borderRadius: 8,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    };

    adItems.value = [
        {
            type: 'text',
            content: 'Welcome to Modern Digital Teaching Board',
            color: '#1e293b',
            fontSize: 16,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            marginRight: 20
        },
        {
            type: 'text',
            content: '🎯 Interactive Learning',
            color: '#059669',
            fontSize: 14,
            fontWeight: 'normal',
            fontFamily: 'Arial, sans-serif',
            marginRight: 15
        }
    ];

    saveToLocalStorage();

    toast.add({
        severity: 'success',
        summary: 'Reset Complete',
        detail: 'Ad strip has been reset to default settings',
        life: 3000
    });
};

const exportSettings = () => {
    const settings = {
        stripSettings: stripSettings.value,
        adItems: adItems.value,
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `ad-strip-settings-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast.add({
        severity: 'success',
        summary: 'Export Complete',
        detail: 'Ad strip settings exported successfully',
        life: 3000
    });
};

const saveToLocalStorage = () => {
    try {
        const settings = {
            stripSettings: stripSettings.value,
            adItems: adItems.value,
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem('customAdStripSettings', JSON.stringify(settings));
        console.log('Settings saved to localStorage:', settings);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        toast.add({
            severity: 'warn',
            summary: 'Save Warning',
            detail: 'Could not save settings to browser storage',
            life: 3000
        });
    }
};

const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('customAdStripSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            if (settings.stripSettings) {
                stripSettings.value = { ...stripSettings.value, ...settings.stripSettings };
            }
            if (settings.adItems) {
                adItems.value = settings.adItems;
            }
        } catch (error) {
            console.error('Error loading ad strip settings:', error);
        }
    }
};

// Watch for changes and auto-save
watch(
    [stripSettings, adItems],
    () => {
        // Auto-save both in edit mode and normal mode
        saveToLocalStorage();
    },
    { deep: true, flush: 'post' }
);

// Load settings on mount
onMounted(() => {
    loadFromLocalStorage();
});
</script>


<style scoped>
.custom-ad-strip {
    width: 100%;
    border: 1px solid #e2e8f0;
    position: relative;
    transition: all 0.3s ease;
}

.ad-content {
    display: flex;
    align-items: center;
    height: 100%;
    position: relative;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.ad-content::-webkit-scrollbar {
    display: none;
}

.ad-item {
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.ad-item:hover {
    transform: scale(1.02);
}

.ad-image {
    border-radius: 4px;
    object-fit: contain;
}

.ad-text {
    white-space: nowrap;
    user-select: none;
}

.edit-strip-btn {
    position: absolute;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
    background: #3b82f6;
    color: white;
    border: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;
}

.edit-strip-btn:hover {
    background: #2563eb;
    transform: translateY(-50%) scale(1.1);
}

.edit-mode {
    padding: 20px;
    background: #f8fafc;
    border-radius: 8px;
    min-height: 200px;
}

.strip-settings {
    margin-bottom: 20px;
    padding: 15px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.settings-row {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}

.setting-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.setting-group label {
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.setting-group input,
.setting-group select {
    padding: 6px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
}

.setting-group input[type='color'] {
    width: 50px;
    height: 35px;
    padding: 2px;
    cursor: pointer;
}

.setting-group input[type='range'] {
    width: 100px;
}

.ad-items-editor {
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    padding: 15px;
    margin-bottom: 20px;
}

.items-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e2e8f0;
}

.items-header h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
}

.add-buttons {
    display: flex;
    gap: 10px;
}

.add-btn {
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 5px;
}

.text-btn {
    background: #3b82f6;
    color: white;
}

.text-btn:hover {
    background: #2563eb;
}

.image-btn {
    background: #10b981;
    color: white;
}

.image-btn:hover {
    background: #059669;
}

.items-list {
    max-height: 400px;
    overflow-y: auto;
}

.item-editor {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    background: #f9fafb;
}

.item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.item-type-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.item-type-badge.text {
    background: #dbeafe;
    color: #1e40af;
}

.item-type-badge.image {
    background: #d1fae5;
    color: #065f46;
}

.item-actions {
    display: flex;
    gap: 5px;
}

.item-actions button {
    width: 24px;
    height: 24px;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
}

.item-actions button:hover {
    background: #f3f4f6;
}

.item-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.delete-btn {
    background: #fee2e2 !important;
    color: #dc2626;
}

.delete-btn:hover {
    background: #fecaca !important;
}

.text-editor,
.image-editor {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.editor-row {
    display: flex;
    gap: 15px;
    align-items: end;
    flex-wrap: wrap;
}

.editor-row input[type='text'] {
    flex: 1;
    min-width: 150px;
}

.image-preview {
    margin-bottom: 10px;
}

.preview-img {
    max-width: 100px;
    max-height: 60px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    object-fit: contain;
}

.change-image-btn {
    background: #f59e0b;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 5px;
}

.change-image-btn:hover {
    background: #d97706;
}

.edit-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    padding-top: 15px;
    border-top: 1px solid #e2e8f0;
}

.action-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
}

.reset-btn {
    background: #6b7280;
    color: white;
}

.reset-btn:hover {
    background: #4b5563;
}

.export-btn {
    background: #8b5cf6;
    color: white;
}

.export-btn:hover {
    background: #7c3aed;
}

.save-btn {
    background: #10b981;
    color: white;
}

.save-btn:hover {
    background: #059669;
}

.edit-notice {
    background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
    border: 2px solid #3b82f6;
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.notice-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.notice-icon {
    font-size: 24px;
    flex-shrink: 0;
}

.notice-text {
    flex: 1;
}

.notice-text strong {
    color: #1e40af;
    font-size: 16px;
    display: block;
    margin-bottom: 4px;
}

.notice-text p {
    color: #3730a3;
    font-size: 14px;
    margin: 0;
    line-height: 1.4;
}

/* Preview Section Styles */
.preview-section {
    background: white;
    border-radius: 12px;
    border: 2px solid #e5e7eb;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid #f3f4f6;
}

.preview-header h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 8px;
}

.preview-header h4::before {
    content: '👁️';
    font-size: 18px;
}

.preview-badge {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
    animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.8;
    }
}

.preview-container {
    position: relative;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 10px;
    background: #f9fafb;
    overflow: hidden;
}

.preview-ad-strip {
    width: 100%;
    border: 1px solid #e2e8f0;
    position: relative;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-ad-content {
    display: flex;
    align-items: center;
    height: 100%;
    position: relative;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.preview-ad-content::-webkit-scrollbar {
    display: none;
}

.preview-ad-item {
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.preview-ad-image {
    border-radius: 4px;
    object-fit: contain;
}

.preview-ad-text {
    white-space: nowrap;
    user-select: none;
}

.preview-edit-indicator {
    position: absolute;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
    background: rgba(59, 130, 246, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.preview-icon {
    font-size: 12px;
}

/* Responsive Design */
@media (max-width: 768px) {
    .settings-row {
        flex-direction: column;
    }

    .editor-row {
        flex-direction: column;
        align-items: stretch;
    }

    .add-buttons {
        flex-direction: column;
    }

    .edit-actions {
        flex-direction: column;
    }

    .preview-header {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
    }

    .preview-section {
        padding: 15px;
    }

    .preview-edit-indicator {
        position: static;
        transform: none;
        margin-top: 8px;
        align-self: flex-end;
    }
}
</style>
