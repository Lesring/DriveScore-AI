<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { HardDrive, Download, Loader2, Check } from 'lucide-vue-next'
import { cacheMemoryData } from '@/mock/data'

const props = defineProps<{
  isVisible: boolean
}>()

const emit = defineEmits<{
  (e: 'ready'): void
}>()

const isLoading = ref(true)
const cachedSegments = ref<string[]>([])
const memoryUsed = ref(0)

const memoryPercentage = computed(() => (memoryUsed.value / cacheMemoryData.capacity) * 100)

onMounted(() => {
  if (props.isVisible) {
    startCaching()
  }
})

watch(() => props.isVisible, (visible) => {
  if (visible) {
    startCaching()
  }
})

const startCaching = async () => {
  isLoading.value = true
  cachedSegments.value = []
  memoryUsed.value = 0
  
  for (const segment of cacheMemoryData.cachedSegments) {
    isLoading.value = true
    await delay(800)
    cachedSegments.value.push(segment)
    memoryUsed.value += 6.4
  }
  
  isLoading.value = false
  emit('ready')
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const getSegmentStatus = (segment: string) => {
  if (cachedSegments.value.includes(segment)) return 'cached'
  if (isLoading.value) return 'loading'
  return 'available'
}
</script>

<template>
  <div 
    v-if="isVisible"
    class="glass-card p-6"
  >
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-white font-semibold flex items-center gap-2">
        <HardDrive class="w-5 h-5 text-secondary" />
        Music Cache Memory
      </h3>
      
      <div class="flex items-center gap-2">
        <Loader2 
          v-if="isLoading" 
          class="w-4 h-4 text-blue-400 animate-spin" 
        />
        <Check v-else class="w-4 h-4 text-green-400" />
        <span :class="isLoading ? 'text-blue-400' : 'text-green-400'" class="text-sm">
          {{ isLoading ? 'Caching...' : 'Ready' }}
        </span>
      </div>
    </div>
    
    <div class="mb-6">
      <div class="flex justify-between text-sm mb-2">
        <span class="text-white/60">Memory Capacity</span>
        <span class="text-white">{{ cacheMemoryData.capacity }} MB</span>
      </div>
      <div class="h-3 bg-white/10 rounded-full overflow-hidden">
        <div 
          class="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-300"
          :style="{ width: `${memoryPercentage}%` }"
        ></div>
      </div>
      <div class="flex justify-between text-sm mt-1">
        <span class="text-white/60">Used: {{ memoryUsed.toFixed(1) }} MB</span>
        <span class="text-white">{{ memoryPercentage.toFixed(0) }}%</span>
      </div>
    </div>
    
    <div class="mb-6">
      <h4 class="text-white/60 text-sm mb-3">Current Cache</h4>
      <div class="space-y-2">
        <div 
          v-for="segment in cacheMemoryData.cachedSegments" 
          :key="segment"
          class="flex items-center justify-between p-2 rounded-lg transition-all duration-300"
          :class="{
            'bg-green-500/20': getSegmentStatus(segment) === 'cached',
            'bg-blue-500/20': getSegmentStatus(segment) === 'loading',
            'bg-white/5': getSegmentStatus(segment) === 'available'
          }"
        >
          <div class="flex items-center gap-2">
            <Download 
              v-if="getSegmentStatus(segment) === 'cached'" 
              class="w-4 h-4 text-green-400" 
            />
            <Loader2 
              v-else-if="getSegmentStatus(segment) === 'loading'" 
              class="w-4 h-4 text-blue-400 animate-spin" 
            />
            <div v-else class="w-4 h-4 bg-white/20 rounded"></div>
            
            <span 
              :class="{
                'text-white': getSegmentStatus(segment) === 'cached',
                'text-blue-400': getSegmentStatus(segment) === 'loading',
                'text-white/50': getSegmentStatus(segment) === 'available'
              }"
            >
              {{ segment }}
            </span>
          </div>
          
          <span 
            v-if="getSegmentStatus(segment) === 'cached'"
            class="text-green-400 text-xs"
          >
            ✓
          </span>
          <span 
            v-else-if="getSegmentStatus(segment) === 'loading'"
            class="text-blue-400 text-xs"
          >
            Loading...
          </span>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white/5 rounded-lg p-3 text-center">
        <div class="text-green-400 font-bold text-xl">{{ cacheMemoryData.cacheHitRate }}%</div>
        <div class="text-white/50 text-xs">Cache Hit Rate</div>
      </div>
      <div class="bg-white/5 rounded-lg p-3 text-center">
        <div class="text-blue-400 font-bold text-xl">{{ cacheMemoryData.loadingSpeed }} MB/s</div>
        <div class="text-white/50 text-xs">Preload Speed</div>
      </div>
    </div>
  </div>
</template>
