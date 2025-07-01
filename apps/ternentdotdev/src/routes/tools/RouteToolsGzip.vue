<script setup>
import { ref, computed } from 'vue';
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { SResizablePanels } from 'ternent-ui';
import { compressStream, decompressStream } from '@/module/compress/compress';

useBreadcrumbs({
  path: "/tools/gzip",
  name: "Gzip",
});

// State
const activeTab = ref('compress');

// Input fields
const inputText = ref('');
const inputFile = ref(null);
const compressedData = ref(null);
const inputMode = ref('text'); // 'text' or 'file'

// Output
const result = ref('');
const isLoading = ref(false);
const error = ref('');
const compressionRatio = ref(0);
const originalSize = ref(0);
const compressedSize = ref(0);

// File input handling
const fileInput = ref(null);

// Make TextEncoder available in template
const textEncoder = new TextEncoder();

// Computed
const canCompress = computed(() => {
  if (inputMode.value === 'text') {
    return inputText.value.trim() !== '';
  } else {
    return inputFile.value !== null;
  }
});

const canDecompress = computed(() => {
  return compressedData.value !== null || (inputMode.value === 'text' && inputText.value.trim() !== '');
});

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
};

const compressionStats = computed(() => {
  if (originalSize.value && compressedSize.value) {
    const ratio = ((originalSize.value - compressedSize.value) / originalSize.value * 100);
    return {
      original: formatSize(originalSize.value),
      compressed: formatSize(compressedSize.value),
      ratio: ratio.toFixed(1) + '%',
      saved: formatSize(originalSize.value - compressedSize.value)
    };
  }
  return null;
});

// Methods
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    inputFile.value = file;
    originalSize.value = file.size;
  }
};

const compressData = async () => {
  if (!canCompress.value) return;
  
  isLoading.value = true;
  error.value = '';
  result.value = '';
  
  try {
    let dataStream;
    let inputName = 'data';
    
    if (inputMode.value === 'text') {
      const blob = new Blob([inputText.value], { type: 'text/plain' });
      dataStream = blob.stream();
      originalSize.value = textEncoder.encode(inputText.value).length;
      inputName = 'text-data';
    } else if (inputFile.value) {
      dataStream = inputFile.value.stream();
      originalSize.value = inputFile.value.size;
      inputName = inputFile.value.name;
    }
    
    // Use your existing compression function
    const compressedResponse = await compressStream(dataStream);
    const compressedBlob = await compressedResponse.blob();
    
    compressedData.value = compressedBlob;
    compressedSize.value = compressedBlob.size;
    
    result.value = 'success';
    compressionRatio.value = ((originalSize.value - compressedSize.value) / originalSize.value * 100);
    
  } catch (err) {
    console.error('Compression error:', err);
    error.value = err.message || 'Failed to compress data';
    result.value = 'error';
  } finally {
    isLoading.value = false;
  }
};

const decompressData = async () => {
  if (!canDecompress.value) return;
  
  isLoading.value = true;
  error.value = '';
  result.value = '';
  
  try {
    let dataStream;
    
    if (activeTab.value === 'decompress' && inputMode.value === 'file' && inputFile.value) {
      // Decompressing an uploaded gzip file
      dataStream = inputFile.value.stream();
      originalSize.value = inputFile.value.size;
    } else if (compressedData.value) {
      // Decompressing previously compressed data
      dataStream = compressedData.value.stream();
    } else {
      throw new Error('No data to decompress');
    }
    
    // Use your existing decompression function
    const decompressedResponse = await decompressStream(dataStream);
    const decompressedBlob = await decompressedResponse.blob();
    
    // Try to read as text
    const text = await decompressedBlob.text();
    inputText.value = text;
    
    compressedSize.value = decompressedBlob.size;
    result.value = 'success';
    
  } catch (err) {
    console.error('Decompression error:', err);
    error.value = err.message || 'Failed to decompress data. Make sure the file is a valid gzip archive.';
    result.value = 'error';
  } finally {
    isLoading.value = false;
  }
};

const downloadCompressed = () => {
  if (!compressedData.value) return;
  
  const url = URL.createObjectURL(compressedData.value);
  const a = document.createElement('a');
  a.href = url;
  a.download = `compressed-data.gz`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

const clearAll = () => {
  inputText.value = '';
  inputFile.value = null;
  compressedData.value = null;
  result.value = '';
  error.value = '';
  originalSize.value = 0;
  compressedSize.value = 0;
  compressionRatio.value = 0;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};
</script>

<template>
  <div class="flex w-full h-full flex-1 bg-gradient-to-br from-base-100 to-base-200">
    <SResizablePanels 
      identifier="gzip-tool" 
      :min-content-width="400" 
      :min-sidebar-width="300"
      class="w-full h-full"
    >
      <!-- Main Panel (Left) -->
      <template #default>
        <div class="flex flex-col h-full">
          <!-- Header -->
          <div class="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-base-300">
            <div class="max-w-2xl">
              <h1 class="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                🗜️ Gzip Compression
              </h1>
              <p class="text-base-content/70 mt-2">
                Compress and decompress data using modern gzip algorithms
              </p>
              <div class="flex gap-2 mt-4">
                <div class="badge badge-primary badge-sm">⚡ Web Streams</div>
                <div class="badge badge-accent badge-sm">🛡️ Local Processing</div>
                <div class="badge badge-secondary badge-sm">📦 Gzip</div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="p-6 border-b border-base-300">
            <div class="flex gap-2">
              <button
                @click="activeTab = 'compress'"
                class="btn btn-ghost"
                :class="{ 'btn-active': activeTab === 'compress' }"
              >
                🗜️ Compress
              </button>
              <button
                @click="activeTab = 'decompress'"
                class="btn btn-ghost"
                :class="{ 'btn-active': activeTab === 'decompress' }"
              >
                📦 Decompress
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 p-6 overflow-auto">
            <div class="space-y-6">
              <!-- Input Mode Selection -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Input Method</span>
                </label>
                <div class="flex gap-2">
                  <button 
                    @click="inputMode = 'text'"
                    class="btn btn-sm"
                    :class="inputMode === 'text' ? 'btn-primary' : 'btn-outline'"
                  >
                    📝 Text
                  </button>
                  <button 
                    @click="inputMode = 'file'"
                    class="btn btn-sm"
                    :class="inputMode === 'file' ? 'btn-primary' : 'btn-outline'"
                  >
                    📄 File
                  </button>
                </div>
              </div>

              <!-- Text Input -->
              <div v-if="inputMode === 'text'" class="form-control">
                <label class="label">
                  <span class="label-text font-medium">
                    {{ activeTab === 'compress' ? 'Text to compress' : 'Text or data to decompress' }}
                  </span>
                </label>
                <textarea
                  v-model="inputText"
                  :placeholder="activeTab === 'compress' ? 'Enter text to compress...' : 'Enter text or compressed data...'"
                  class="textarea textarea-bordered h-64 font-mono"
                />
                <label class="label">
                  <span class="label-text-alt">{{ textEncoder.encode(inputText).length.toLocaleString() }} bytes</span>
                </label>
              </div>

              <!-- File Input -->
              <div v-if="inputMode === 'file'" class="form-control">
                <label class="label">
                  <span class="label-text font-medium">
                    {{ activeTab === 'compress' ? 'File to compress' : 'Gzip file to decompress' }}
                  </span>
                </label>
                <div 
                  class="border-2 border-dashed border-base-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                  @click="triggerFileInput"
                  @drop.prevent="handleFileSelect"
                  @dragover.prevent
                >
                  <input
                    ref="fileInput"
                    type="file"
                    :accept="activeTab === 'decompress' ? '.gz,.gzip' : '*'"
                    @change="handleFileSelect"
                    class="hidden"
                  />
                  <div v-if="!inputFile" class="space-y-2">
                    <div class="text-4xl">📁</div>
                    <p class="text-base-content/70">
                      Click to browse or drag and drop a {{ activeTab === 'decompress' ? 'gzip' : '' }} file
                    </p>
                  </div>
                  <div v-else class="space-y-2">
                    <div class="text-4xl text-success">✅</div>
                    <p class="font-medium">{{ inputFile.name }}</p>
                    <p class="text-sm text-base-content/70">{{ formatSize(inputFile.size) }}</p>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3">
                <button
                  v-if="activeTab === 'compress'"
                  :disabled="!canCompress || isLoading"
                  @click="compressData"
                  class="btn btn-primary"
                  :class="{ 'loading': isLoading }"
                >
                  🗜️ Compress Data
                </button>
                
                <button
                  v-if="activeTab === 'decompress'"
                  :disabled="!canDecompress || isLoading"
                  @click="decompressData"
                  class="btn btn-primary"
                  :class="{ 'loading': isLoading }"
                >
                  📦 Decompress Data
                </button>

                <button
                  @click="clearAll"
                  class="btn btn-outline"
                >
                  🗑️ Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Results Panel (Right) -->
      <template #sidebar>
        <div class="flex flex-col h-full bg-base-50">
          <!-- Results Header -->
          <div class="p-6 bg-gradient-to-r from-accent/10 to-secondary/10 border-b border-base-300">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-semibold">📋 Results</h2>
                <p class="text-sm text-base-content/70">Compression results and statistics</p>
              </div>
            </div>
          </div>

          <!-- Results Content -->
          <div class="flex-1 p-6 overflow-auto">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex flex-col items-center justify-center h-64 space-y-4">
              <div class="loading loading-spinner loading-lg text-primary"></div>
              <p class="text-base-content/70">
                {{ activeTab === 'compress' ? 'Compressing' : 'Decompressing' }} data...
              </p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 class="font-bold">Error!</h3>
                <div class="text-xs">{{ error }}</div>
              </div>
            </div>

            <!-- Success State -->
            <div v-else-if="result === 'success'" class="space-y-4">
              <!-- Success Alert -->
              <div class="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ activeTab === 'compress' ? 'Compression' : 'Decompression' }} successful!</span>
              </div>

              <!-- Compression Stats -->
              <div v-if="compressionStats && activeTab === 'compress'" class="stats stats-vertical shadow">
                <div class="stat">
                  <div class="stat-title">Original Size</div>
                  <div class="stat-value text-lg">{{ compressionStats.original }}</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Compressed Size</div>
                  <div class="stat-value text-lg">{{ compressionStats.compressed }}</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Space Saved</div>
                  <div class="stat-value text-lg text-success">{{ compressionStats.ratio }}</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Bytes Saved</div>
                  <div class="stat-value text-lg">{{ compressionStats.saved }}</div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="space-y-3">
                <div v-if="activeTab === 'compress' && compressedData">
                  <button
                    @click="downloadCompressed"
                    class="btn btn-primary btn-block"
                  >
                    💾 Download Gzip File
                  </button>
                </div>

                <div v-if="activeTab === 'decompress' && inputText">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Decompressed Content</span>
                    </label>
                    <textarea
                      :value="inputText"
                      readonly
                      class="textarea textarea-bordered h-32 font-mono text-sm"
                    />
                  </div>
                  <button
                    @click="copyToClipboard(inputText)"
                    class="btn btn-outline btn-block mt-2"
                  >
                    📋 Copy to Clipboard
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="flex flex-col items-center justify-center h-64 space-y-4 text-base-content/50">
              <div class="text-6xl">📦</div>
              <p class="text-center">
                {{ activeTab === 'compress' ? 'Enter text or select a file to compress' : 'Upload a gzip file or enter data to decompress' }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </SResizablePanels>
  </div>
</template>
