<template>
  <div class="pdf-maker-form">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Left Column: Configuration -->
      <div>
        <Card class="mb-4">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-cog"></i>
              <span>Basic Settings</span>
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Template</label>
                <Dropdown 
                  v-model="form.template" 
                  :options="templateOptions" 
                  optionLabel="label" 
                  optionValue="value" 
                  placeholder="Select template" 
                  class="w-full" 
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Language</label>
                <Dropdown 
                  v-model="form.language" 
                  :options="languageOptions" 
                  optionLabel="label" 
                  optionValue="value" 
                  placeholder="Select language" 
                  class="w-full" 
                />
              </div>

              <Divider />

              <div>
                <label class="block text-sm font-medium mb-2">Orientation</label>
                <Dropdown 
                  v-model="form.options.orientation" 
                  :options="orientationOptions" 
                  optionLabel="label" 
                  optionValue="value" 
                  placeholder="Select orientation" 
                  class="w-full" 
                />
              </div>
            </div>
          </template>
        </Card>

        <Card class="mb-4">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-palette"></i>
              <span>Question Styling</span>
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-4">
              <!-- Question Styling -->
              <Panel header="Question Text" toggleable>
                <div class="flex flex-col gap-3">
                  <!-- Preview Box -->
                  <div class="p-3 border rounded-lg" 
                       :style="{
                         backgroundColor: form.question.background_color || '#ffffff',
                         color: form.question.color || '#000000',
                         fontSize: (form.question.font_size || 12) + 'px'
                       }">
                    Sample question text preview
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium mb-2">Font Size</label>
                    <InputNumber 
                      v-model="form.question.font_size" 
                      :min="8" 
                      :max="20" 
                      placeholder="12" 
                      class="w-full" 
                      showButtons 
                    />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-sm font-medium mb-2">Text Color</label>
                      <div class="flex items-center gap-3">
                        <ColorPicker v-model="questionTextColor" format="hex" />
                        <InputText 
                          v-model="form.question.color" 
                          placeholder="#000000" 
                          class="flex-1" 
                        />
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2">Background Color</label>
                      <div class="flex items-center gap-3">
                        <ColorPicker v-model="questionBgColor" format="hex" />
                        <InputText 
                          v-model="form.question.background_color" 
                          placeholder="#ffffff" 
                          class="flex-1" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>

              <!-- Question Options Styling -->
              <Panel header="Question Options" toggleable>
                <div class="flex flex-col gap-3">
                  <!-- Preview Box -->
                  <div class="p-3 border rounded-lg" 
                       :style="{
                         backgroundColor: form.question_options.background_color || '#ffffff',
                         color: form.question_options.color || '#000000',
                         fontSize: (form.question_options.font_size || 12) + 'px'
                       }">
                    A) Sample option text<br>
                    B) Another option example
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium mb-2">Font Size</label>
                    <InputNumber 
                      v-model="form.question_options.font_size" 
                      :min="8" 
                      :max="20" 
                      placeholder="12" 
                      class="w-full" 
                      showButtons 
                    />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-sm font-medium mb-2">Text Color</label>
                      <div class="flex items-center gap-3">
                        <ColorPicker v-model="optionsTextColor" format="hex" />
                        <InputText 
                          v-model="form.question_options.color" 
                          placeholder="#000000" 
                          class="flex-1" 
                        />
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2">Background Color</label>
                      <div class="flex items-center gap-3">
                        <ColorPicker v-model="optionsBgColor" format="hex" />
                        <InputText 
                          v-model="form.question_options.background_color" 
                          placeholder="#ffffff" 
                          class="flex-1" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>

              <!-- Solution Styling -->
              <Panel header="Solution Text" toggleable>
                <div class="flex flex-col gap-3">
                  <!-- Preview Box -->
                  <div class="p-3 border rounded-lg" 
                       :style="{
                         backgroundColor: form.question_solution.background_color || '#ffffff',
                         color: form.question_solution.color || '#000000',
                         fontSize: (form.question_solution.font_size || 10) + 'px'
                       }">
                    Solution: This is how the solution text will appear with the selected styling.
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium mb-2">Font Size</label>
                    <InputNumber 
                      v-model="form.question_solution.font_size" 
                      :min="8" 
                      :max="20" 
                      placeholder="10" 
                      class="w-full" 
                      showButtons 
                    />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-sm font-medium mb-2">Text Color</label>
                      <div class="flex items-center gap-3">
                        <ColorPicker v-model="solutionTextColor" format="hex" />
                        <InputText 
                          v-model="form.question_solution.color" 
                          placeholder="#000000" 
                          class="flex-1" 
                        />
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2">Background Color</label>
                      <div class="flex items-center gap-3">
                        <ColorPicker v-model="solutionBgColor" format="hex" />
                        <InputText 
                          v-model="form.question_solution.background_color" 
                          placeholder="#ffffff" 
                          class="flex-1" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
          </template>
        </Card>

        <Card class="mb-4">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-book"></i>
              <span>Cover Page</span>
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <InputSwitch v-model="form.show_cover_page" inputId="show_cover_page" />
                <label for="show_cover_page" class="cursor-pointer">Include Cover Page</label>
              </div>

              <div v-if="form.show_cover_page" class="flex flex-col gap-4 pl-4 border-l-2 border-gray-200">
                <div>
                  <label class="block text-sm font-medium mb-2">Exam/Set Name</label>
                  <InputText 
                    v-model="form.cover_page.set_name" 
                    placeholder="Enter exam or set name" 
                    class="w-full" 
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Teacher Name</label>
                  <InputText 
                    v-model="form.cover_page.teacher_name" 
                    placeholder="Enter teacher name" 
                    class="w-full" 
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Date</label>
                  <InputText 
                    v-model="form.cover_page.date" 
                    placeholder="Enter date" 
                    class="w-full" 
                  />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium mb-2">Title Color</label>
                    <div class="flex items-center gap-3">
                      <ColorPicker v-model="coverTitleColor" format="hex" />
                      <InputText 
                        v-model="form.cover_page.title_color" 
                        placeholder="#000000" 
                        class="flex-1" 
                      />
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">Subtitle Color</label>
                    <div class="flex items-center gap-3">
                      <ColorPicker v-model="coverSubtitleColor" format="hex" />
                      <InputText 
                        v-model="form.cover_page.subtitle_color" 
                        placeholder="#555555" 
                        class="flex-1" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Logo/Image Path</label>
                  <InputText 
                    v-model="form.cover_page.image_path" 
                    placeholder="Enter image path or URL" 
                    class="w-full" 
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>

        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-file-edit"></i>
              <span>Content</span>
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Header Text</label>
                <InputText 
                  v-model="form.options.header_text" 
                  placeholder="Enter header" 
                  class="w-full" 
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Footer Text</label>
                <InputText 
                  v-model="form.options.footer_text" 
                  placeholder="Enter footer" 
                  class="w-full" 
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Watermark</label>
                <InputText 
                  v-model="form.options.watermark" 
                  placeholder="Enter watermark" 
                  class="w-full" 
                />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Right Column: Options -->
      <div>
        <Card class="mb-4">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-sliders-h"></i>
              <span>Display Options</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 gap-4">
              <!-- Content Visibility -->
              <Panel header="Content Visibility" toggleable>
                <div class="flex flex-col gap-3">
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.show_solutions" inputId="show_solutions" />
                    <label for="show_solutions" class="cursor-pointer">Show Solutions</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.show_answer_key" inputId="show_answer_key" />
                    <label for="show_answer_key" class="cursor-pointer">Show Answer Key</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.show_images" inputId="show_images" />
                    <label for="show_images" class="cursor-pointer">Show Images</label>
                  </div>
                </div>
              </Panel>

              <!-- Organization -->
              <Panel header="Organization" toggleable>
                <div class="flex flex-col gap-3">
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.group_by_subject" inputId="group_by_subject" />
                    <label for="group_by_subject" class="cursor-pointer">Group by Subject</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.group_by_topic" inputId="group_by_topic" />
                    <label for="group_by_topic" class="cursor-pointer">Group by Topic</label>
                  </div>
                </div>
              </Panel>

              <!-- Math Rendering -->
              <Panel header="Math Rendering" toggleable>
                <div class="flex flex-col gap-3">
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.render_math" inputId="render_math" />
                    <label for="render_math" class="cursor-pointer">Enable Math Rendering</label>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">Math Engine</label>
                    <Dropdown 
                      v-model="form.options.math_engine" 
                      :options="mathEngineOptions" 
                      optionLabel="label" 
                      optionValue="value" 
                      placeholder="Select engine" 
                      class="w-full" 
                    />
                  </div>
                </div>
              </Panel>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-2 mt-4">
      <Button 
        label="Cancel" 
        icon="pi pi-times" 
        class="p-button-outlined" 
        @click="$emit('cancel')" 
        :disabled="loading"
      />
      <Button 
        label="Generate PDF" 
        icon="pi pi-file-pdf" 
        :loading="loading" 
        @click="generatePdf" 
      />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { apiClient } from '@/service/apiService';
import Card from 'primevue/card';
import Panel from 'primevue/panel';
import Divider from 'primevue/divider';
import Dropdown from 'primevue/dropdown';
import InputSwitch from 'primevue/inputswitch';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import ColorPicker from 'primevue/colorpicker';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
  setId: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['pdf-generated', 'cancel']);

const toast = useToast();

const templateOptions = [
  { label: 'Modern', value: 'modern' },
  { label: 'Exam', value: 'exam' }
];

const languageOptions = [
  { label: 'Hindi', value: 'hindi' },
  { label: 'English', value: 'english' },
  { label: 'Both', value: 'both' }
];

const orientationOptions = [
  { label: 'Portrait', value: 'portrait' },
  { label: 'Landscape', value: 'landscape' }
];

const mathEngineOptions = [
  { label: 'KaTeX', value: 'katex' },
  { label: 'MathJax', value: 'mathjax' }
];

const form = reactive({
  set_id: props.setId,
  show_cover_page: true,
  cover_page: {
    set_name: "Math Exam 2025",
    teacher_name: "Prof. Smith",
    date: "Dec 17, 2025",
    title_color : "#000000",
    subtitle_color : "#555555",
  },
  template: 'modern',
  language: 'english',
  question : {
    font_size: 12,
    color : '#000000',
    background_color : '#ffffff'
  },
  question_options : {
    font_size : 12,
    color : '#000000',
    background_color : '#ffffff'
  },
  question_solution : {
    font_size : 10,
    color : '#000000',
    background_color : '#ffffff'
  },
  options: {
    show_solutions: false,
    show_answer_key: false,
    show_images: true,
    group_by_subject: false,
    group_by_topic: false,
    orientation: 'portrait',
    header_text: '',
    footer_text: '',
    watermark: '',
    render_math: false,
    math_engine: 'katex'
  }
});

const loading = ref(false);

// Color pickers
const questionTextColor = ref((form.question.color || '').replace('#', ''));
const questionBgColor = ref((form.question.background_color || '').replace('#', ''));
const optionsTextColor = ref((form.question_options.color || '').replace('#', ''));
const optionsBgColor = ref((form.question_options.background_color || '').replace('#', ''));
const solutionTextColor = ref((form.question_solution.color || '').replace('#', ''));
const solutionBgColor = ref((form.question_solution.background_color || '').replace('#', ''));
const coverTitleColor = ref((form.cover_page.title_color || '').replace('#', ''));
const coverSubtitleColor = ref((form.cover_page.subtitle_color || '').replace('#', ''));

// Watch color picker changes
watch(questionTextColor, (val) => {
  form.question.color = val ? `#${val}` : '';
});

watch(questionBgColor, (val) => {
  form.question.background_color = val ? `#${val}` : '';
});

watch(optionsTextColor, (val) => {
  form.question_options.color = val ? `#${val}` : '';
});

watch(optionsBgColor, (val) => {
  form.question_options.background_color = val ? `#${val}` : '';
});

watch(solutionTextColor, (val) => {
  form.question_solution.color = val ? `#${val}` : '';
});

watch(solutionBgColor, (val) => {
  form.question_solution.background_color = val ? `#${val}` : '';
});

watch(coverTitleColor, (val) => {
  form.cover_page.title_color = val ? `#${val}` : '';
});

watch(coverSubtitleColor, (val) => {
  form.cover_page.subtitle_color = val ? `#${val}` : '';
});

async function generatePdf() {
  loading.value = true;
  try {
    const payload = {
      set_id: form.set_id,
      template: form.template || null,
      language: form.language || null,
      options: { ...form.options },
      question: { ...form.question },
      question_options: { ...form.question_options },
      question_solution: { ...form.question_solution },
      show_cover_page: form.show_cover_page,
      cover_page: { ...form.cover_page }
    };

    const response = await apiClient.post('admin/pdf/generate-questions', payload);

    if (response.data.success) {
      emit('pdf-generated', response.data);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: response.data.message || 'PDF generated successfully',
        life: 3000
      });
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    const message = error?.response?.data?.message || error.message || 'Unknown error';
    toast.add({
      severity: 'error',
      summary: 'Generation Failed',
      detail: message,
      life: 5000
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.pdf-maker-form {
  padding: 1rem 0;
}
</style>
