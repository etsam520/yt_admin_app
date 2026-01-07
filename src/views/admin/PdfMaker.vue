<template>
  <div class="p-4">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Left Column: Configuration -->
      <div class="lg:col-span-1">
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
                <Dropdown v-model="form.template" :options="templateOptions" optionLabel="label" optionValue="value" placeholder="Select template" class="w-full" />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Language</label>
                <Dropdown v-model="form.language" :options="languageOptions" optionLabel="label" optionValue="value" placeholder="Select language" class="w-full" />
              </div>

              <Divider />

              <div>
                <label class="block text-sm font-medium mb-2">Page Size</label>
                <Dropdown v-model="form.options.page_size" :options="pageSizeOptions" optionLabel="label" optionValue="value" placeholder="Select page size" class="w-full" />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Orientation</label>
                <Dropdown v-model="form.options.orientation" :options="orientationOptions" optionLabel="label" optionValue="value" placeholder="Select orientation" class="w-full" />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Font Size (8-20)</label>
                <InputNumber v-model="form.options.font_size" :min="8" :max="20" placeholder="12" class="w-full" showButtons />
              </div>
            </div>
          </template>
        </Card>

        <Card class="mb-4">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-palette"></i>
              <span>Colors & Styling</span>
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Background Color</label>
                <div class="flex items-center gap-3">
                  <ColorPicker v-model="bgColor" format="hex" />
                  <InputText v-model="form.options.background_color" placeholder="#ffffff" class="flex-1" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Text Color</label>
                <div class="flex items-center gap-3">
                  <ColorPicker v-model="textColor" format="hex" />
                  <InputText v-model="form.options.text_color" placeholder="#000000" class="flex-1" />
                </div>
              </div>
            </div>
          </template>
        </Card>

        <Card class="mb-4">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-align-justify"></i>
              <span>Layout</span>
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Column Count (1-4)</label>
                <InputNumber v-model="form.options.column_count" :min="1" :max="4" placeholder="1" class="w-full" showButtons />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Column Gap</label>
                <InputText v-model="form.options.column_gap" placeholder="10mm" class="w-full" />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Page Padding</label>
                <InputText v-model="form.options.page_padding" placeholder="10mm" class="w-full" />
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
                <InputText v-model="form.options.header_text" placeholder="Enter header" class="w-full" />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Footer Text</label>
                <InputText v-model="form.options.footer_text" placeholder="Enter footer" class="w-full" />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Watermark</label>
                <InputText v-model="form.options.watermark" placeholder="Enter watermark" class="w-full" />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Right Column: Options & Preview -->
      <div class="lg:col-span-2">
        <Card class="mb-4">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-sliders-h"></i>
              <span>Display Options</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Content Visibility -->
              <Panel header="Content Visibility" toggleable>
                <div class="flex flex-col gap-3">
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.show_solutions" inputId="show_solutions" />
                    <label for="show_solutions" class="cursor-pointer">Show Solutions</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.show_question_numbers" inputId="show_question_numbers" />
                    <label for="show_question_numbers" class="cursor-pointer">Show Question Numbers</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.show_answer_key" inputId="show_answer_key" />
                    <label for="show_answer_key" class="cursor-pointer">Show Answer Key</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.highlight_correct_answers" inputId="highlight_correct_answers" />
                    <label for="highlight_correct_answers" class="cursor-pointer">Highlight Correct Answers</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.show_images" inputId="show_images" />
                    <label for="show_images" class="cursor-pointer">Show Images</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.show_category_info" inputId="show_category_info" />
                    <label for="show_category_info" class="cursor-pointer">Show Category Info</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.show_ca_date" inputId="show_ca_date" />
                    <label for="show_ca_date" class="cursor-pointer">Show CA Date</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.answers_on_separate_page" inputId="answers_on_separate_page" />
                    <label for="answers_on_separate_page" class="cursor-pointer">Answers on Separate Page</label>
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
              <Panel header="Math Rendering" toggleable class="md:col-span-2">
                <div class="flex flex-col gap-3">
                  <div class="flex items-center gap-2">
                    <InputSwitch v-model="form.options.render_math" inputId="render_math" />
                    <label for="render_math" class="cursor-pointer">Enable Math Rendering</label>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">Math Engine</label>
                    <Dropdown v-model="form.options.math_engine" :options="mathEngineOptions" optionLabel="label" optionValue="value" placeholder="Select engine" class="w-full md:w-1/2" />
                  </div>
                </div>
              </Panel>
            </div>
          </template>
        </Card>

        <Card class="mb-4">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-download"></i>
              <span>Generate PDF</span>
            </div>
          </template>
          <template #content>
            <Button label="Generate PDF" icon="pi pi-file-pdf" :loading="loading" @click="generatePdf" class="w-full" size="large" />
          </template>
        </Card>

        <!-- PDF Preview -->
        <Card v-if="pdfUrl">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-eye"></i>
              <span>PDF Preview</span>
            </div>
          </template>
          <template #content>
            <iframe :src="pdfUrl" class="w-full h-[80vh] border rounded" title="PDF Preview"></iframe>
          </template>
        </Card>
      </div>
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
import { useToast } from 'primevue/usetoast';
import ColorPicker from 'primevue/colorpicker';

const toast = useToast();

const templateOptions = [
  { label: 'Magazine', value: 'magazine' },
  { label: 'Bilingual', value: 'bilingual' },
  { label: 'Standard', value: 'standard' },
  { label: 'Modern', value: 'modern' },
  { label: 'Minimal', value: 'minimal' },
  { label: 'Exam', value: 'exam' }
];

const languageOptions = [
  { label: 'Hindi', value: 'hindi' },
  { label: 'English', value: 'english' },
  { label: 'Both', value: 'both' }
];

const pageSizeOptions = [
  { label: 'A4', value: 'A4' },
  { label: 'A3', value: 'A3' },
  { label: 'Letter', value: 'Letter' },
  { label: 'Legal', value: 'Legal' }
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
  template: 'standard',
  language: 'english',
  options: {
    show_solutions: false,
    show_question_numbers: true,
    show_answer_key: false,
    highlight_correct_answers: false,
    show_images: true,
    show_category_info: false,
    show_ca_date: false,
    group_by_subject: false,
    group_by_topic: false,
    page_size: 'A4',
    orientation: 'portrait',
    font_size: 12,
    background_color: '#ffffff',
    text_color: '#000000',
    header_text: '',
    footer_text: '',
    watermark: '',
    column_count: 1,
    column_gap: '10mm',
    page_padding: '10mm',
    render_math: false,
    math_engine: 'katex',
    answers_on_separate_page: false
  }
});

const loading = ref(false);
const pdfUrl = ref('');

// Color pickers bind to hex without '#', keep options with '#'
const bgColor = ref((form.options.background_color || '').replace('#',''));
const textColor = ref((form.options.text_color || '').replace('#',''));

watch(bgColor, (val) => {
  form.options.background_color = val ? `#${val}` : '';
});

watch(textColor, (val) => {
  form.options.text_color = val ? `#${val}` : '';
});

async function generatePdf() {
  loading.value = true;
  try {
    // Prepare payload exactly as backend validation expects
    const payload = {
      template: form.template || null,
      language: form.language || null,
      options: { ...form.options }
    };

    const response = await apiClient.post('admin/pdf/generate-questions', payload);

    if (response.data.success && response.data.pdf_url) {
      // Set PDF URL for preview
      pdfUrl.value = response.data.pdf_url;
      
      // Trigger download
      const link = document.createElement('a');
      link.href = response.data.pdf_url;
      link.download = 'questions.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.add({ 
        severity: 'success', 
        summary: 'PDF Generated', 
        detail: response.data.message || 'PDF generated successfully', 
        life: 3000 
      });
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    const message = error?.response?.data?.message || error.message || 'Unknown error';
    toast.add({ severity: 'error', summary: 'Generation Failed', detail: message, life: 5000 });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Minimal spacing tweaks if needed */
</style>
