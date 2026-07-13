<script setup lang="ts">
import { CloudRain, Moon, Car, Cone, AlertTriangle, Mountain, Zap, Sun, Brain, Play, Sparkles } from 'lucide-vue-next'
import { useRoadSimulator } from '@/composables/useRoadSimulator'
import { useStableAudio } from '@/composables/useStableAudio'

defineProps<{
  isDriving: boolean
}>()

const { simulationState, triggerEvent, clearAllEvents } = useRoadSimulator()
const { generateForEvent, hasApiKey, isGenerating } = useStableAudio()

const handleEventClick = async (eventId: 'rain' | 'night' | 'traffic' | 'construction' | 'accident' | 'mountain' | 'highway') => {
  if (!hasApiKey.value) {
    triggerEvent(eventId)
    return
  }

  if (isGenerating.value) {
    return
  }

  triggerEvent(eventId)
  
  try {
    await generateForEvent(eventId, { duration: 30 })
  } catch (error) {
    console.error('AI music generation failed:', error)
  }
}

const events: { id: 'rain' | 'night' | 'traffic' | 'construction' | 'accident' | 'mountain' | 'highway'; label: string; icon: any; color: string }[] = [
  { id: 'rain', label: 'Rain', icon: CloudRain, color: '#b8a687' },
  { id: 'night', label: 'Night', icon: Moon, color: '#9a8668' },
  { id: 'traffic', label: 'Traffic', icon: Car, color: '#c9a962' },
  { id: 'construction', label: 'Construction', icon: Cone, color: '#dcc88a' },
  { id: 'accident', label: 'Accident', icon: AlertTriangle, color: '#f5efe6' },
  { id: 'mountain', label: 'Mountain', icon: Mountain, color: '#e8dcc4' },
  { id: 'highway', label: 'Highway', icon: Zap, color: '#d4c7b0' }
]
</script>

<template>
  <div class="glass-card p-5 backdrop-blur-xl border-glass-border">
    <div class="flex items-center gap-2 mb-4 pb-3 border-b border-glass-border">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <Brain class="w-5 h-5 text-white" />
      </div>
      <span class="text-primary-theme font-semibold">Road Simulator</span>
      <span v-if="hasApiKey" class="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
        <Sparkles class="w-3 h-3 text-primary" />
        <span class="text-xs text-primary-light">AI</span>
      </span>
    </div>
    
    <div v-if="!isDriving" class="flex flex-col items-center justify-center py-6">
      <div class="w-12 h-12 rounded-full bg-glass-border flex items-center justify-center mb-3">
        <Play class="w-6 h-6 text-text-muted" />
      </div>
      <p class="text-text-muted text-sm text-center">Start driving first</p>
      <p class="text-muted-theme text-xs text-center mt-1">Events will become available</p>
    </div>
    
    <div v-else class="space-y-4">
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="event in events"
          :key="event.id"
          @click="handleEventClick(event.id)"
          class="flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-300 relative"
          :class="{
            'bg-primary/20 scale-105 shadow-lg': simulationState.roadState[event.id],
            'bg-glass-bg hover:bg-glass-border': !simulationState.roadState[event.id]
          }"
          :disabled="simulationState.isRerouting || isGenerating"
        >
          <component 
            :is="event.icon" 
            class="w-5 h-5 transition-colors duration-300"
            :style="{ color: simulationState.roadState[event.id] ? event.color : '#9ca3af' }"
          />
          <span 
            class="text-xs font-medium transition-colors duration-300"
            :style="{ color: simulationState.roadState[event.id] ? event.color : '#9ca3af' }"
          >
            {{ event.label }}
          </span>
        </button>
      </div>
      
      <button
        @click="clearAllEvents"
        class="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-glass-bg hover:bg-glass-border transition-colors text-sm text-secondary-theme"
        :disabled="simulationState.isRerouting"
      >
        <Sun class="w-4 h-4" />
        <span>Clear All</span>
      </button>
      
      <div v-if="Object.values(simulationState.roadState).some(v => v)" class="pt-3 border-t border-glass-border">
        <div class="text-xs text-muted-theme mb-2">Active Conditions:</div>
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="event in events.filter(e => simulationState.roadState[e.id])"
            :key="event.id"
            class="px-2 py-1 rounded-full text-xs font-medium"
            :style="{ 
              background: `${event.color}20`,
              color: event.color
            }"
          >
            {{ event.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>