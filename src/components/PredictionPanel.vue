<script setup lang="ts">
import { computed } from 'vue'
import { Compass, Clock, Music, Download, Loader2, Brain, RefreshCw } from 'lucide-vue-next'
import type { Prediction } from '@/api'
import { useJourneySession } from '@/composables/useJourneySession'

const props = defineProps<{
  isDriving: boolean
  prediction: Prediction | null
  isPredicting: boolean
}>()

const emit = defineEmits<{
  (e: 'retry'): void
}>()

const { session } = useJourneySession()

const cacheStatus = computed(() => {
  if (!props.prediction) return { text: 'Loading...', status: 'loading' as const }
  if (props.prediction.eta <= 10) return { text: 'Switching...', status: 'switching' as const }
  return { text: 'Ready', status: 'ready' as const }
})

const aiStatus = computed(() => session.aiStatus)
</script>

<template>
  <div class="glass-card p-5 backdrop-blur-xl border-glass-border">
    <div class="flex items-center gap-2 mb-4 pb-3 border-b border-glass-border">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
        <Compass class="w-5 h-5 text-white" />
      </div>
      <span class="text-primary-theme font-semibold">AI Prediction</span>
      <Loader2 
        v-if="isPredicting" 
        class="w-4 h-4 text-blue-400 animate-spin ml-auto" 
      />
    </div>
    
    <div class="flex items-center gap-2 mb-4">
      <span 
        v-if="aiStatus === 'loading'"
        class="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400"
      >
        Loading
      </span>
      <span 
        v-else-if="session.dataSource === 'ai'"
        class="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400"
      >
        AI
      </span>
      <span 
        v-else-if="session.dataSource === 'fallback'"
        class="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400"
      >
        Fallback
      </span>
    </div>
    
    <div class="space-y-4">
      <div>
        <div class="text-muted-theme text-sm mb-1">Upcoming Road</div>
        <div class="text-primary-theme font-semibold flex items-center gap-2">
          <span>{{ prediction?.upcomingRoad || 'Analyzing...' }}</span>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-glass-bg rounded-lg p-3">
          <div class="text-muted-theme text-xs flex items-center gap-1 mb-1">
            <Compass class="w-3 h-3" />
            Distance
          </div>
          <div class="text-primary-theme font-mono">{{ prediction?.distance || '--' }} m</div>
        </div>
        
        <div class="bg-glass-bg rounded-lg p-3">
          <div class="text-muted-theme text-xs flex items-center gap-1 mb-1">
            <Clock class="w-3 h-3" />
            ETA
          </div>
          <div class="text-primary-theme font-mono">{{ prediction?.eta || '--' }} s</div>
        </div>
      </div>
      
      <div>
        <div class="text-muted-theme text-sm mb-1">Expected Music</div>
        <div class="flex items-center gap-2">
          <Music class="w-4 h-4 text-secondary" />
          <span class="text-primary-theme font-semibold">{{ prediction?.expectedMusic || '--' }}</span>
        </div>
      </div>
      
      <div v-if="prediction">
        <div class="text-muted-theme text-sm mb-1">Confidence</div>
        <div class="flex items-center gap-2">
          <div class="flex-1 h-2 bg-glass-border rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-green-400 to-cyan-400 rounded-full transition-all duration-500"
              :style="{ width: `${prediction.confidence}%` }"
            ></div>
          </div>
          <span class="text-primary-theme text-sm font-mono">{{ prediction.confidence }}%</span>
        </div>
      </div>
      
      <div v-if="prediction?.reason" class="bg-primary/10 rounded-lg p-3">
        <div class="flex items-start gap-2">
          <Brain class="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <div class="text-primary text-xs font-semibold mb-1">Reason</div>
            <p class="text-primary-theme text-sm">{{ prediction.reason }}</p>
          </div>
        </div>
      </div>
      
      <div>
        <div class="text-muted-theme text-sm mb-2">Cache Status</div>
        <div 
          class="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300"
          :class="{
            'bg-green-500/20': cacheStatus.status === 'ready',
            'bg-yellow-500/20 animate-pulse': cacheStatus.status === 'switching',
            'bg-blue-500/20': cacheStatus.status === 'loading'
          }"
        >
          <Download 
            v-if="cacheStatus.status === 'ready'" 
            class="w-4 h-4 text-green-400" 
          />
          <Loader2 
            v-else-if="cacheStatus.status === 'switching'" 
            class="w-4 h-4 text-yellow-400 animate-spin" 
          />
          <Brain 
            v-else 
            class="w-4 h-4 text-blue-400" 
          />
          <span 
            :class="{
              'text-green-400': cacheStatus.status === 'ready',
              'text-yellow-400': cacheStatus.status === 'switching',
              'text-blue-400': cacheStatus.status === 'loading'
            }"
          >
            {{ cacheStatus.text }}
          </span>
        </div>
      </div>
      
      <button
        v-if="session.dataSource === 'fallback'"
        @click="emit('retry')"
        class="w-full flex items-center justify-center gap-2 py-2 bg-glass-bg hover:bg-glass-border rounded-lg transition-colors"
      >
        <RefreshCw class="w-4 h-4 text-secondary-theme" />
        <span class="text-secondary-theme text-sm">Retry AI</span>
      </button>
    </div>
  </div>
</template>