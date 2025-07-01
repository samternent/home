<script setup>
import { ref, computed } from 'vue';
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import { SResizablePanels, SCard, SButton } from 'ternent-ui';
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
  <div class="flex w-full h-full flex-1 bg-base-100">
    <SResizablePanels 
      identifier="gzip-tool" 
      :min-content-width="400" 
      :min-sidebar-width="300"
      class="w-full h-full"
    >
      <!-- Main Panel (Left) -->
      <template #default>
        <div class="flex flex-col h-full w-full">
          <!-- Header -->
          <div class="flex-shrink-0 p-8 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-base-300">
            <div class="w-full">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl">
                  🗜️
                </div>
                <div>
                  <h1 class="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Gzip Compression
                  </h1>
                  <p class="text-base-content/70 text-sm">
                    Compress and decompress data using modern gzip algorithms
                  </p>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <div class="badge badge-primary badge-sm">⚡ Web Streams</div>
                <div class="badge badge-accent badge-sm">🛡️ Local Processing</div>
                <div class="badge badge-secondary badge-sm">📦 Gzip Format</div>
                <div class="badge badge-ghost badge-sm">✨ Zero Dependencies</div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex-shrink-0 p-6 border-b border-base-300">
            <div class="flex gap-2">
              <SButton
                @click="activeTab = 'compress'"
                :variant="activeTab === 'compress' ? 'primary' : 'ghost'"
                size="sm"
                class="transition-all duration-200"
              >
                🗜️ Compress
              </SButton>
              <SButton
                @click="activeTab = 'decompress'"
                :variant="activeTab === 'decompress' ? 'primary' : 'ghost'"
                size="sm"
                class="transition-all duration-200"
              >
                📦 Decompress
              </SButton>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-6 w-full">
              <div class="w-full space-y-6">
              <!-- Input Mode Selection -->
              <SCard class="p-6">
                <div class="space-y-4">
                  <div>
                    <h3 class="text-lg font-semibold text-base-content mb-2">Input Method</h3>
                    <p class="text-sm text-base-content/70 mb-4">Choose how you want to provide your data</p>
                  </div>
                  <div class="flex gap-2">
                    <SButton 
                      @click="inputMode = 'text'"
                      :variant="inputMode === 'text' ? 'primary' : 'outline'"
                      size="sm"
                      class="flex-1"
                    >
                      <span class="mr-2">📝</span>
                      Text Input
                    </SButton>
                    <SButton 
                      @click="inputMode = 'file'"
                      :variant="inputMode === 'file' ? 'primary' : 'outline'"
                      size="sm"
                      class="flex-1"
                    >
                      <span class="mr-2">📄</span>
                      File Upload
                    </SButton>
                  </div>
                </div>
              </SCard>

              <!-- Text Input Card -->
              <SCard v-if="inputMode === 'text'" class="p-6">
                <div class="space-y-4">
                  <div>
                    <h3 class="text-lg font-semibold text-base-content mb-2">
                      {{ activeTab === 'compress' ? 'Text to compress' : 'Text or data to decompress' }}
                    </h3>
                    <p class="text-sm text-base-content/70">
                      {{ activeTab === 'compress' ? 'Enter any text content to compress' : 'Paste text or compressed data to decompress' }}
                    </p>
                  </div>
                  <textarea
                    v-model="inputText"
                    :placeholder="activeTab === 'compress' ? 'Enter text to compress...' : 'Enter text or compressed data...'"
                    class="textarea textarea-bordered w-full h-64 font-mono text-sm resize-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                  <div class="flex justify-between items-center text-xs text-base-content/60">
                    <span>{{ textEncoder.encode(inputText).length.toLocaleString() }} bytes</span>
                    <span class="opacity-60">{{ inputText.split('\n').length.toLocaleString() }} lines</span>
                  </div>
                </div>
              </SCard>

              <!-- File Input Card -->
              <SCard v-if="inputMode === 'file'" class="p-6">
                <div class="space-y-4">
                  <div>
                    <h3 class="text-lg font-semibold text-base-content mb-2">
                      {{ activeTab === 'compress' ? 'File to compress' : 'Gzip file to decompress' }}
                    </h3>
                    <p class="text-sm text-base-content/70">
                      {{ activeTab === 'compress' ? 'Upload any file to compress it' : 'Upload a .gz file to decompress' }}
                    </p>
                  </div>
                  <div 
                    class="border-2 border-dashed border-base-300 hover:border-primary/50 rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group hover:bg-primary/5"
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
                    <div v-if="!inputFile" class="space-y-3">
                      <div class="text-4xl group-hover:scale-110 transition-transform duration-200">📁</div>
                      <div>
                        <p class="font-medium text-base-content">
                          Click to browse or drag and drop a {{ activeTab === 'decompress' ? 'gzip' : '' }} file
                        </p>
                        <p class="text-sm text-base-content/60 mt-1">
                          Maximum file size: 100MB
                        </p>
                      </div>
                    </div>
                    <div v-else class="space-y-3">
                      <div class="text-4xl text-success">✅</div>
                      <div>
                        <p class="font-semibold text-base-content">{{ inputFile.name }}</p>
                        <p class="text-sm text-base-content/70">{{ formatSize(inputFile.size) }}</p>
                        <div class="badge badge-success badge-xs">Ready to process</div>
                      </div>
                    </div>
                  </div>
                </div>
              </SCard>

              <!-- Action Buttons -->
              <SCard class="p-6">
                <div class="flex gap-3">
                  <SButton
                    v-if="activeTab === 'compress'"
                    :disabled="!canCompress || isLoading"
                    @click="compressData"
                    variant="primary"
                    size="md"
                    :loading="isLoading"
                    class="flex-1"
                  >
                    <span v-if="!isLoading" class="mr-2">🗜️</span>
                    {{ isLoading ? 'Compressing...' : 'Compress Data' }}
                  </SButton>
                  
                  <SButton
                    v-if="activeTab === 'decompress'"
                    :disabled="!canDecompress || isLoading"
                    @click="decompressData"
                    variant="primary"
                    size="md"
                    :loading="isLoading"
                    class="flex-1"
                  >
                    <span v-if="!isLoading" class="mr-2">📦</span>
                    {{ isLoading ? 'Decompressing...' : 'Decompress Data' }}
                  </SButton>

                  <SButton
                    @click="clearAll"
                    variant="outline"
                    size="md"
                  >
                    <span class="mr-2">🗑️</span>
                    Clear
                  </SButton>
                </div>
              </SCard>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Results Panel (Right) -->
      <template #sidebar>
        <div class="flex flex-col h-full w-full bg-base-100">
          <!-- Results Header -->
          <div class="flex-shrink-0 p-6 bg-gradient-to-r from-accent/5 to-secondary/5 border-b border-base-300">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-lg">
                📋
              </div>
              <div>
                <h2 class="text-xl font-semibold text-base-content">Results</h2>
                <p class="text-sm text-base-content/70">Compression results and statistics</p>
              </div>
            </div>
          </div>

          <!-- Results Content -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-6 w-full">
            <!-- Loading State -->
            <SCard v-if="isLoading" class="p-8">
              <div class="flex flex-col items-center justify-center space-y-4">
                <div class="loading loading-spinner loading-lg text-primary"></div>
                <div class="text-center">
                  <p class="font-medium text-base-content">
                    {{ activeTab === 'compress' ? 'Compressing' : 'Decompressing' }} data...
                  </p>
                  <p class="text-sm text-base-content/60">This may take a moment</p>
                </div>
              </div>
            </SCard>

            <!-- Error State -->
            <SCard v-else-if="error" class="p-6 border-error/20 bg-error/5">
              <div class="space-y-4">
                <div class="flex items-start gap-3">
                  <div class="text-2xl">❌</div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-error mb-2">Processing Error</h3>
                    <p class="text-sm text-error/80">{{ error }}</p>
                  </div>
                </div>
                <SButton @click="clearAll" variant="outline" size="sm" class="w-full">
                  Try Again
                </SButton>
              </div>
            </SCard>

            <!-- Success State -->
            <div v-else-if="result === 'success'" class="space-y-4">
              <!-- Success Alert -->
              <SCard class="p-6 border-success/20 bg-success/5">
                <div class="flex items-center gap-3">
                  <div class="text-2xl">✅</div>
                  <div>
                    <h3 class="font-semibold text-success">Success!</h3>
                    <p class="text-sm text-success/80">
                      {{ activeTab === 'compress' ? 'Compression' : 'Decompression' }} completed successfully
                    </p>
                  </div>
                </div>
              </SCard>

              <!-- Compression Stats -->
              <SCard v-if="compressionStats && activeTab === 'compress'" class="p-6">
                <h3 class="font-semibold text-base-content mb-4">Compression Statistics</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div class="text-center p-3 bg-base-100 rounded-lg">
                    <div class="text-sm text-base-content/60">Original</div>
                    <div class="text-lg font-bold text-base-content">{{ compressionStats.original }}</div>
                  </div>
                  <div class="text-center p-3 bg-base-100 rounded-lg">
                    <div class="text-sm text-base-content/60">Compressed</div>
                    <div class="text-lg font-bold text-primary">{{ compressionStats.compressed }}</div>
                  </div>
                  <div class="text-center p-3 bg-success/10 rounded-lg col-span-2">
                    <div class="text-sm text-success/80">Space Saved</div>
                    <div class="text-2xl font-bold text-success">{{ compressionStats.ratio }}</div>
                    <div class="text-xs text-success/60">{{ compressionStats.saved }} saved</div>
                  </div>
                </div>
              </SCard>

              <!-- Action Buttons -->
              <div class="space-y-3">
                <SCard v-if="activeTab === 'compress' && compressedData" class="p-4">
                  <SButton
                    @click="downloadCompressed"
                    variant="primary"
                    size="md"
                    class="w-full"
                  >
                    <span class="mr-2">💾</span>
                    Download Gzip File
                  </SButton>
                </SCard>

                <SCard v-if="activeTab === 'decompress' && inputText" class="p-4 space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-base-content mb-2">
                      Decompressed Content
                    </label>
                    <textarea
                      :value="inputText"
                      readonly
                      class="textarea textarea-bordered w-full h-32 font-mono text-sm resize-none"
                    />
                  </div>
                  <SButton
                    @click="copyToClipboard(inputText)"
                    variant="outline"
                    size="md"
                    class="w-full"
                  >
                    <span class="mr-2">📋</span>
                    Copy to Clipboard
                  </SButton>
                </SCard>
              </div>
            </div>

            <!-- Empty State -->
            <SCard v-else class="p-8">
              <div class="flex flex-col items-center justify-center space-y-4 text-base-content/50">
                <div class="text-6xl opacity-60">📦</div>
                <div class="text-center">
                  <p class="font-medium mb-2">Ready to Process</p>
                  <p class="text-sm">
                    {{ activeTab === 'compress' ? 'Enter text or select a file to compress' : 'Upload a gzip file or enter data to decompress' }}
                  </p>
                </div>
              </div>
            </SCard>
            </div>
          </div>
        </div>
      </template>
    </SResizablePanels>
  </div>
</template>
