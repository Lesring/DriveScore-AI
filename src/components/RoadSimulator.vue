<script setup lang="ts">
import { CloudRain, Moon, Car, Cone, AlertTriangle, Mountain, Zap, Sun, Brain, Play } from 'lucide-vue-next'
import { useRoadSimulator } from '@/composables/useRoadSimulator'

defineProps<{
  isDriving: boolean
}>()

const { simulationState, triggerEvent, clearAllEvents } = useRoadSimulator()

const events: { id: 'rain' | 'night' | 'traffic' | 'construction' | 'accident' | 'mountain' | 'highway'; label: string; icon: any; color: string }[] = [
  { id: 'rain', label: 'Rain', icon: CloudRain, color: '#60a5fa' },
  { id: 'night', label: 'Night', icon: Moon, color: '#818cf8' },
  { id: 'traffic', label: 'Traffic', icon: Car, color: '#f59e0b' },
  { id: 'construction', label: 'Construction', icon: Cone, color: '#f97316' },
  { id: 'accident', label: 'Accident', icon: AlertTriangle, color: '#ef4444' },
  { id: 'mountain', label: 'Mountain', icon: Mountain, color: '#10b981' },
  { id: 'highway', label: 'Highway', icon: Zap, color: '#06b6d4' }
]
</script>

<template>
  <div class="glass-card p-5 backdrop-blur-xl border-white/10">
    <div class="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <Brain class="w-5 h-5 text-white" />
      </div>
      <span class="text-white font-semibold">Road Simulator</span>
    </div>
    
    <div v-if="!isDriving" class="flex flex-col items-center justify-center py-6">
      <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
        <Play class="w-6 h-6 text-white/50" />
      </div>
      <p class="text-white/50 text-sm text-center">Start driving first</p>
      <p class="text-white/30 text-xs text-center mt-1">Events will become available</p>
    </div>
    
    <div v-else class="space-y-4">
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="event in events"
          :key="event.id"
          @click="triggerEvent(event.id)"
          class="flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-300"
          :class="{
            'bg-white/20 scale-105 shadow-lg': simulationState.roadState[event.id],
            'bg-white/5 hover:bg-white/10': !simulationState.roadState[event.id]
          }"
          :disabled="simulationState.isRerouting"
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
        class="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/70"
        :disabled="simulationState.isRerouting"
      >
        <Sun class="w-4 h-4" />
        <span>Clear All</span>
      </button>
      
      <div v-if="Object.values(simulationState.roadState).some(v => v)" class="pt-3 border-t border-white/10">
        <div class="text-xs text-white/50 mb-2">Active Conditions:</div>
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