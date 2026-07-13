<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Music, Loader2, Check } from 'lucide-vue-next'
import { useJourneySession } from '@/composables/useJourneySession'

const props = defineProps<{
  isVisible: boolean
}>()

const emit = defineEmits<{
  (e: 'completed'): void
}>()

const { session } = useJourneySession()

const isVisualizing = ref(true)

const musicSegments = computed(() => session.musicSegments)
const musicSource = computed(() => session.musicSource)

const segmentColors: Record<string, string> = {
  Calm: '#d4c7b0',
  Build: '#c9a962',
  Cruise: '#dcc88a',
  Peak: '#f5efe6',
  Ending: '#b8a687'
}

watch(() => props.isVisible, (visible) => {
  if (visible) {
    isVisualizing.value = true
    setTimeout(() => {
      isVisualizing.value = false
      emit('completed')
    }, 1500)
  }
}, { immediate: true })
</script>

<template>
  <div 
    v-if="isVisible"
    class="glass-card p-6"
  >
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-primary-theme font-semibold flex items-center gap-2">
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
          {{ isVisualizing ? 'Visualizing result...' : 'Visualized' }}
        </span>
      </div>
    </div>
    
    <div class="flex items-center gap-2 mb-6">
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
        Fallback Demo Data
      </span>
      <span 
        v-else
        class="text-xs px-2 py-0.5 rounded-full bg-glass-bg text-muted-theme"
      >
        No Data
      </span>
    </div>
    
    <div class="space-y-4">
      <div 
        v-for="segment in musicSegments" 
        :key="segment.id"
        class="p-3 bg-glass-bg rounded-xl"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-primary-theme font-semibold">{{ segment.style }}</span>
            <span 
              class="text-xs px-2 py-0.5 rounded-full"
              :style="{ background: `${segmentColors[segment.style] || '#8b5cf6'}20`, color: segmentColors[segment.style] || '#8b5cf6' }"
            >
              {{ segment.key }}
            </span>
          </div>
          <span class="text-secondary-theme text-sm">Energy: {{ segment.energy }}%</span>
        </div>
        
        <div class="h-2 bg-glass-border rounded-full overflow-hidden">
          <div 
            class="h-full rounded-full transition-all duration-100"
            :style="{ 
              width: `${segment.progress || 100}%`,
              background: segmentColors[segment.style] || '#8b5cf6'
            }"
          ></div>
        </div>
        
        <div 
          class="flex items-center gap-1 mt-2 text-green-400 text-xs"
        >
          <Check class="w-3 h-3" />
          <span>Ready</span>
        </div>
      </div>
      
      <div 
        v-if="musicSegments.length === 0"
        class="p-4 bg-glass-bg rounded-xl text-center"
      >
        <p class="text-muted-theme text-sm">No music segments available</p>
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