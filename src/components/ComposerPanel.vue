<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Music, Loader2, Check } from 'lucide-vue-next'
import { composerProgressData } from '@/mock/data'

const props = defineProps<{
  isVisible: boolean
  analysisSource?: 'ai' | 'fallback'
  musicSource?: 'ai' | 'fallback'
}>()

const emit = defineEmits<{
  (e: 'completed'): void
}>()

const isVisualizing = ref(true)
const progress = ref<Record<string, number>>({})
const completedSegments = ref<string[]>([])

onMounted(() => {
  if (props.isVisible) {
    startVisualization()
  }
})

watch(() => props.isVisible, (visible) => {
  if (visible) {
    startVisualization()
  }
})

const startVisualization = async () => {
  isVisualizing.value = true
  progress.value = {}
  completedSegments.value = []
  
  for (const segment of composerProgressData) {
    progress.value[segment.id] = 0
    
    for (let i = 0; i <= segment.targetProgress; i += 2) {
      await delay(30)
      progress.value[segment.id] = i
    }
    
    completedSegments.value.push(segment.id)
    await delay(500)
  }
  
  isVisualizing.value = false
  emit('completed')
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
</script>

<template>
  <div 
    v-if="isVisible"
    class="glass-card p-6"
  >
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-white font-semibold flex items-center gap-2">
        <Music class="w-5 h-5 text-primary" />
        Music Visualizer
      </h3>
      
      <div class="flex items-center gap-2">
        <Loader2 
          v-if="isVisualizing" 
          class="w-4 h-4 text-primary animate-spin" 
        />
        <Check v-else class="w-4 h-4 text-green-400" />
        <span :class="isVisualizing ? 'text-primary' : 'text-green-400'" class="text-sm">
          {{ isVisualizing ? 'Visualizing cached result...' : 'Visualized' }}
        </span>
      </div>
    </div>
    
    <div class="space-y-4">
      <div 
        v-for="segment in composerProgressData" 
        :key="segment.id"
        class="p-3 bg-white/5 rounded-xl"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-white font-semibold">{{ segment.name }}</span>
            <span 
              class="text-xs px-2 py-0.5 rounded-full"
              :style="{ background: `${segment.color}20`, color: segment.color }"
            >
              {{ segment.style }}
            </span>
            <span 
              v-if="musicSource === 'ai'"
              class="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400"
            >
              AI Generated
            </span>
            <span 
              v-else-if="musicSource === 'fallback'"
              class="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400"
            >
              Fallback Demo
            </span>
          </div>
          <span class="text-white/60 text-sm">{{ progress[segment.id] || 0 }}%</span>
        </div>
        
        <div class="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            class="h-full rounded-full transition-all duration-100"
            :style="{ 
              width: `${progress[segment.id] || 0}%`,
              background: segment.color
            }"
          ></div>
        </div>
        
        <div 
          v-if="completedSegments.includes(segment.id)"
          class="flex items-center gap-1 mt-2 text-green-400 text-xs"
        >
          <Check class="w-3 h-3" />
          <span>Ready</span>
        </div>
      </div>
    </div>
    
    <div v-if="!isVisualizing" class="mt-4 pt-4 border-t border-white/10">
      <button 
        @click="$emit('completed')"
        class="w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
      >
        Proceed to Cache Engine
      </button>
    </div>
  </div>
</template>