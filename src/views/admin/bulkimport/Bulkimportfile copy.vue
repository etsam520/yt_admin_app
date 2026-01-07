<template>
  <section class="w-full">
    <!-- Top section bar -->
    <div class="flex items-center justify-between gap-2 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow">
      <div class="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5">
          <path fill="currentColor" d="M19 13v6H5v-6H3v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6zM11 6.414V16h2V6.414l3.293 3.293l1.414-1.414L12 2.586L6.293 8.293l1.414 1.414z"/>
        </svg>
        <div>
          <p class="text-sm font-semibold">Bulk File Import</p>
          <p class="text-xs text-slate-300">Drag & drop or browse — {{ files.length }} selected, {{ readableTotalSize }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-sm"
          @click="clearAll"
          :disabled="!files.length || uploading"
        >Clear</button>
        <button
          type="button"
          class="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-sm font-semibold shadow disabled:opacity-50"
          @click="startUpload"
          :disabled="!files.length || uploading"
        >{{ uploading ? 'Uploading…' : 'Upload' }}</button>
      </div>
    </div>

    <!-- Dropzone -->
    <label
      class="mt-3 block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      :class="{ 'opacity-60 pointer-events-none': uploading }"
      @dragover.prevent
      @dragenter.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <input
        class="sr-only"
        type="file"
        :accept="accept"
        :multiple="maxFiles !== 1"
        @change="onSelect"
        :disabled="uploading"
      />
      <div :class="dragOver ? 'scale-[1.01]' : ''" class="transition-transform">
        <p class="text-slate-600">Drop files here or <span class="text-indigo-600 font-semibold">browse</span></p>
        <p class="mt-1 text-xs text-slate-500">Max {{ maxFiles }} files • up to {{ maxSizeMB }} MB each</p>
      </div>
    </label>

    <!-- Files list -->
    <ul v-if="files.length" class="mt-4 space-y-3">
      <li v-for="item in files" :key="item.id" class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div class="flex items-center gap-3">
          <!-- File icon -->
          <div class="shrink-0 w-10 h-10 rounded-xl bg-slate-100 grid place-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-slate-600">
              <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2l6 6h-6z"/>
            </svg>
          </div>

          <!-- Meta -->
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <p class="truncate font-medium text-slate-900">{{ item.file.name }}</p>
              <p class="shrink-0 text-xs text-slate-500">{{ formatBytes(item.file.size) }}</p>
            </div>

            <p class="mt-0.5 text-xs" :class="item.error ? 'text-rose-600' : 'text-slate-500'">
              <span v-if="item.error">{{ item.error }}</span>
              <span v-else-if="item.status === 'queued'">Queued</span>
              <span v-else-if="item.status === 'uploading'">Uploading… {{ item.progress }}%</span>
              <span v-else-if="item.status === 'done'">Uploaded</span>
            </p>

            <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full bg-indigo-500 transition-[width]"
                :style="{ width: item.progress + '%' }"
              />
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button
              class="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              @click="removeFile(item.id)"
              :disabled="uploading && item.status === 'uploading'"
            >Remove</button>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

interface FileItem {
  id: string
  file: File
  progress: number
  status: 'queued' | 'uploading' | 'done' | 'error'
  error?: string
}

// const props = withDefaults(defineProps<{
//   accept?: string
//   maxFiles?: number
//   maxSizeMB?: number
//   autoUpload?: boolean
//   /** Optional endpoint. If provided, files will be POSTed as multipart/form-data with field name `file`. */
//   endpoint?: string
//   /** Optional additional form data to include with each upload */
//   extraData?: Record<string, string>
//   /** Optional auth/header token */
//   authToken?: string
// }>(), {
//   accept: '*',
//   maxFiles: 20,
//   maxSizeMB: 10,
//   autoUpload: false,
//   endpoint: undefined,
//   extraData: undefined,
//   authToken: undefined,
// })

const props = defineProps({
    accept: {
        type: String,
        default: '*',
    },
    maxFiles: {
        type: Number,
        default: 20,
    },
    maxSizeMB: {
        type: Number,
        default: 10,
    },
    autoUpload: {
        type: Boolean,
        default: false,
    },
    endpoint: {
        type: String,
        default: undefined,
    },
    extraData: {
        type: Object as () => Record<string, string>,
        default: () => ({}),
    },
    authToken: {
        type: String,
        default: undefined,
    },
})

const emit = defineEmits<{
  (e: 'change', files: File[]): void
  (e: 'uploaded', file: File, response: any): void
  (e: 'error', file: File, message: string): void
}>()

const files = reactive<FileItem[]>([])
const uploading = ref(false)
const dragOver = ref(false)

const readableTotalSize = computed(() => {
  const total = files.reduce((sum, f) => sum + f.file.size, 0)
  return formatBytes(total)
})

function onSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  addFiles(Array.from(input.files))
  // reset so same file can be re-selected
  input.value = ''
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const dropped = Array.from(e.dataTransfer?.files || [])
  addFiles(dropped)
}

function addFiles(newFiles: File[]) {
  const room = props.maxFiles - files.length
  const sliced = newFiles.slice(0, Math.max(0, room))

  for (const f of sliced) {
    if (f.size > props.maxSizeMB * 1024 * 1024) {
      const item: FileItem = {
        id: crypto.randomUUID(),
        file: f,
        progress: 0,
        status: 'error',
        error: `File exceeds ${props.maxSizeMB} MB`,
      }
      files.push(item)
      emit('error', f, item.error!)
      continue
    }

    files.push({
      id: crypto.randomUUID(),
      file: f,
      progress: 0,
      status: 'queued',
    })
  }

  emit('change', files.map(f => f.file))
  if (props.autoUpload) startUpload()
}

function removeFile(id: string) {
  const idx = files.findIndex(f => f.id === id)
  if (idx !== -1) files.splice(idx, 1)
}

function clearAll() {
  files.splice(0, files.length)
}

async function startUpload() {
  if (!files.length || uploading.value) return
  uploading.value = true
  try {
    for (const item of files) {
      if (item.status === 'done') continue
      if (item.status === 'error') continue
      item.status = 'uploading'

      if (props.endpoint) {
        // Real upload via fetch
        const form = new FormData()
        form.append('file', item.file)
        if (props.extraData) {
          Object.entries(props.extraData).forEach(([k, v]) => form.append(k, v))
        }
        const controller = new AbortController()
        // Simulate progress (fetch has no native progress; this is a lightweight illusion)
        await simulateProgress(item, 400)
        const res = await fetch(props.endpoint, {
          method: 'POST',
          body: form,
          headers: props.authToken ? { Authorization: `Bearer ${props.authToken}` } : undefined,
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json().catch(() => ({}))
        item.progress = 100
        item.status = 'done'
        emit('uploaded', item.file, data)
      } else {
        // Simulated upload for demo
        await simulateProgress(item, 800)
        item.status = 'done'
        emit('uploaded', item.file, { ok: true })
      }
    }
  } catch (err: any) {
    const current = files.find(f => f.status === 'uploading')
    if (current) {
      current.status = 'error'
      current.error = err?.message || 'Upload failed'
      emit('error', current.file, current.error)
    }
  } finally {
    uploading.value = false
  }
}

function simulateProgress(item: FileItem, msPerStep = 500) {
  return new Promise<void>((resolve) => {
    let p = item.progress
    const interval = setInterval(() => {
      p = Math.min(100, p + Math.ceil(Math.random() * 20))
      item.progress = p
      if (p >= 100) {
        clearInterval(interval)
        resolve()
      }
    }, msPerStep)
  })
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(i ? 1 : 0)} ${units[i]}`
}
</script>

<style scoped>
/***** No extra CSS; Tailwind handles styling *****/
</style>
