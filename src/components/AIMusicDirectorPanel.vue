<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Brain, Clock, Music, Zap, CheckCircle2, Loader2 } from 'lucide-vue-next'
import type { DrivingState } from '@/types'
import { stateConfigs, aiDecisions, musicLibrary, roadNames } from '@/mock/data'

const props = defineProps<{
  drivingState: DrivingState
  energy: number
  tempo: number
  isDriving: boolean
}>()

const currentRoad = ref('Urban Road')
const nextRoad = ref('Elevated Road')
const eta = ref(28)
const predictionConfidence = ref(96)
const currentMusicId = ref('Calm_02')

const cacheItems = ref([
  { id: 'Calm_02', status: 'cached' as const },
  { id: 'Build_01', status: 'cached' as const },
  { id: 'Cruise_03', status: 'cached' as const },
  { id: 'Peak_01', status: 'loading' as const }
])

let etaInterval: number | null = null
let confidenceInterval: number | null = null

onMounted(() => {
  if (props.isDriving) {
    etaInterval = window.setInterval(() => {
      eta.value = Math.max(0, eta.value - 1)
      if (eta.value === 0) {
        eta.value = Math.floor(Math.random() * 30) + 15
        const roads = Object.values(roadNames)
        const currentIndex = roads.indexOf(currentRoad.value)
        currentRoad.value = nextRoad.value
        nextRoad.value = roads[(currentIndex + 1) % (roads.length - 1)]
      }
    }, 1000)

    confidenceInterval = window.setInterval(() => {
      predictionConfidence.value = Math.min(100, Math.max(85, predictionConfidence.value + (Math.random() - 0.5) * 4))
    }, 2000)
  }
})

onUnmounted(() => {
  if (etaInterval) clearInterval(etaInterval)
  if (confidenceInterval) clearInterval(confidenceInterval)
})

watch(() => props.drivingState, (newState) => {
  const decision = aiDecisions[newState]
  if (decision) {
    const style = newState === 'parking' ? 'calm' :
                  newState === 'city' ? 'calm' :
                  newState === 'accelerating' ? 'build' :
                  newState === 'highway' ? 'cruise' :
                  newState === 'overtaking' ? 'peak' :
                  newState === 'cruise' ? 'cruise' :
                  newState === 'decelerating' ? 'ending' : 'ending'
    
    const music = musicLibrary.find(m => m.style === style)
    if (music) {
      currentMusicId.value = music.id
    }
  }
})

const currentConfig = computed(() => stateConfigs[props.drivingState])
const currentDecision = computed(() => aiDecisions[props.drivingState])
const currentMusic = computed(() => musicLibrary.find(m => m.id === currentMusicId.value))

const getKey = () => {
  return currentMusic.value?.key || 'C Major'
}
</script>

<template>
  <div class="fixed right-6 top-28 w-72 z-50">
    <div class="glass-card p-5 backdrop-blur-2xl border-white/15 shadow-2xl">
      <div class="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Brain class="w-5 h-5 text-white" />
        </div>
        <span class="text-white font-semibold">AI Music Director</span>
      </div>
      
      <div class="mb-4 pb-4 border-b border-white/10">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span class="text-white/60 text-sm">AI STATUS</span>
        </div>
        
        <div class="space-y-2 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <span class="text-white">Thinking...</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/50">Current Road</span>
            <span class="text-white">{{ currentRoad }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/50">Next Road</span>
            <span class="text-primary">{{ nextRoad }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-white/50 flex items-center gap-1">
              <Clock class="w-3 h-3" />
              ETA
            </span>
            <span class="text-white font-mono">{{ eta }} s</span>
          </div>
        </div>
      </div>
      
      <div class="mb-4 pb-4 border-b border-white/10">
        <div class="text-white/60 text-sm mb-2">AI Decision</div>
        <div class="text-white font-semibold mb-2">{{ currentDecision.action }}</div>
        <div class="text-white/50 text-sm flex items-start gap-2">
          <Zap class="w-3 h-3 mt-0.5 text-yellow-400 flex-shrink-0" />
          <span>{{ currentDecision.reason }}</span>
        </div>
      </div>
      
      <div class="mb-4 pb-4 border-b border-white/10">
        <div class="text-white/60 text-sm mb-3">Music Cache</div>
        <div class="space-y-2">
          <div 
            v-for="item in cacheItems" 
            :key="item.id"
            class="flex items-center gap-2"
          >
            <CheckCircle2 
              v-if="item.status === 'cached'" 
              class="w-4 h-4 text-green-400" 
            />
            <Loader2 
              v-else 
              class="w-4 h-4 text-blue-400 animate-spin" 
            />
            <span :class="item.status === 'cached' ? 'text-white' : 'text-white/60'">
              {{ item.id }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="mb-4 pb-4 border-b border-white/10">
        <div class="text-white/60 text-sm mb-3">Current Music</div>
        <div class="flex items-center gap-3 mb-3">
          <div 
            class="w-10 h-10 rounded-lg flex items-center justify-center"
            :style="{ background: `${currentConfig.color}20` }"
          >
            <Music class="w-5 h-5" :style="{ color: currentConfig.color }" />
          </div>
          <div>
            <div class="text-white font-semibold">{{ currentMusicId }}</div>
            <div class="text-white/50 text-xs">{{ currentMusic?.style?.toUpperCase() }}</div>
          </div>
        </div>
        
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-white/5 rounded-lg p-2">
            <div class="text-white/50 text-xs">Energy</div>
            <div class="text-white font-mono">{{ Math.round(energy) }}%</div>
          </div>
          <div class="bg-white/5 rounded-lg p-2">
            <div class="text-white/50 text-xs">Tempo</div>
            <div class="text-white font-mono">{{ Math.round(tempo) }} BPM</div>
          </div>
          <div class="bg-white/5 rounded-lg p-2">
            <div class="text-white/50 text-xs">Key</div>
            <div class="text-white text-xs">{{ getKey() }}</div>
          </div>
        </div>
      </div>
      
      <div>
        <div class="text-white/60 text-sm mb-2">Prediction Confidence</div>
        <div class="flex items-center gap-3">
          <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-500"
              :style="{ width: `${predictionConfidence}%` }"
            ></div>
          </div>
          <span class="text-white font-mono text-sm">{{ Math.round(predictionConfidence) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
