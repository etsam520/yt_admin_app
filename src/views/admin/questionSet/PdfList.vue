<template>
  <div class="pdf-list-container">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-semibold">PDFs for Set: {{ setName }}</h3>
      <Button 
        label="Generate New PDF" 
        icon="pi pi-plus" 
        @click="showGenerateDialog = true" 
        :disabled="loading"
      />
    </div>

    <!-- PDF List -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <ProgressSpinner />
    </div>

    <div v-else-if="pdfs.length === 0" class="text-center py-12">
      <i class="pi pi-file-pdf text-6xl text-gray-300 mb-4"></i>
      <h4 class="text-lg font-medium text-gray-600 mb-2">No PDFs generated yet</h4>
      <p class="text-gray-500 mb-4">Generate your first PDF for this question set</p>
      <Button 
        label="Generate PDF" 
        icon="pi pi-plus" 
        @click="showGenerateDialog = true"
      />
    </div>

      <DataTable 
        v-else
        :value="pdfs" 
        :loading="loading"
        responsiveLayout="scroll"
        stripedRows
      >
      <Column field="id" header="ID" :sortable="true" style="width: 80px" />
      
      <Column header="Template" :sortable="true">
        <template #body="{ data }">
          <Tag :value="data.template || 'standard'" severity="info" />
        </template>
      </Column>

      <Column header="Language" :sortable="true">
        <template #body="{ data }">
          <Tag :value="data.language || 'english'" />
        </template>
      </Column>

      <Column field="created_at" header="Generated On" :sortable="true">
        <template #body="{ data }">
          {{ formatDate(data.created_at) }}
        </template>
      </Column>

      <Column header="Actions" style="width: 200px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button 
              icon="pi pi-eye" 
              class="p-button-sm p-button-info" 
              @click="viewPdf(data)"
              v-tooltip.top="'View PDF'"
            />
            <Button 
              icon="pi pi-download" 
              class="p-button-sm p-button-success" 
              @click="downloadPdf(data)"
              v-tooltip.top="'Download PDF'"
            />
            <Button 
              icon="pi pi-trash" 
              class="p-button-sm p-button-danger" 
              @click="confirmDelete(data)"
              v-tooltip.top="'Delete PDF'"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Generate PDF Dialog -->
    <Dialog 
      v-model:visible="showGenerateDialog" 
      header="Generate PDF" 
      :modal="true" 
      :style="{ width: '90vw', maxWidth: '1200px' }"
      :breakpoints="{ '960px': '95vw' }"
    >
      <PdfMakerForm 
        :setId="setId" 
        @pdf-generated="handlePdfGenerated" 
        @cancel="showGenerateDialog = false"
      />
    </Dialog>

    <!-- PDF Preview Dialog -->
    <Dialog 
      v-model:visible="showPreviewDialog" 
      header="PDF Preview" 
      :modal="true" 
      :style="{ width: '90vw', maxWidth: '1400px', height: '90vh' }"
      :breakpoints="{ '960px': '95vw' }"
    >
      <iframe 
        v-if="previewUrl" 
        :src="previewUrl" 
        class="w-full h-[80vh] border rounded"
        title="PDF Preview"
      ></iframe>
    </Dialog>

    <!-- Delete Confirmation -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { apiClient } from '@/service/apiService';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import ConfirmDialog from 'primevue/confirmdialog';
import PdfMakerForm from './PdfMakerForm.vue';

const props = defineProps({
  setId: {
    type: Number,
    required: true
  },
  setName: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close']);

const confirm = useConfirm();
const toast = useToast();

const pdfs = ref([]);
const loading = ref(false);
const showGenerateDialog = ref(false);
const showPreviewDialog = ref(false);
const previewUrl = ref('');

const fetchPdfs = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get('admin/pdf/list', {
        params: { setId: props.setId }
    });
    pdfs.value = response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch PDFs:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load PDFs',
      life: 5000
    });
  } finally {
    loading.value = false;
  }
};

const viewPdf = async (pdf) => {
  try {
    const response = await apiClient.get(`admin/pdf/show/${pdf.id}`, {
      responseType: 'blob'
    });
    
    // Create blob URL from binary response
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    previewUrl.value = url;
    showPreviewDialog.value = true;
  } catch (error) {
    console.error('Failed to fetch PDF:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load PDF',
      life: 5000
    });
  }
};

const downloadPdf = async (pdf) => {
  try {
    const response = await apiClient.get(`admin/pdf/show/${pdf.id}`, {
      responseType: 'blob'
    });
    
    // Create blob and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `questions-${pdf.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'PDF download started',
      life: 3000
    });
  } catch (error) {
    console.error('Failed to download PDF:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to download PDF',
      life: 5000
    });
  }
};

const confirmDelete = (pdf) => {
  confirm.require({
    message: `Are you sure you want to delete this PDF (ID: ${pdf.id})?`,
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    accept: () => deletePdf(pdf.id),
    reject: () => {}
  });
};

const deletePdf = async (id) => {
  try {
    await apiClient.delete(`admin/pdf/delete/${id}`);
    await fetchPdfs();
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'PDF deleted successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Failed to delete PDF:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error?.response?.data?.message || 'Failed to delete PDF',
      life: 5000
    });
  }
};

const handlePdfGenerated = (pdfData) => {
  showGenerateDialog.value = false;
  fetchPdfs();
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'PDF generated successfully',
    life: 3000
  });
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString();
};

onMounted(() => {
  fetchPdfs();
});
</script>

<style scoped>
.pdf-list-container {
  min-height: 400px;
}
</style>
