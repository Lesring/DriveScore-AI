<script setup lang="ts">
import { onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Play, Pause, Gauge, Zap, Music, Navigation, Activity, Brain, Loader2, Sun, Moon } from 'lucide-vue-next'
import { useDrivingSimulation } from '@/composables/useDrivingSimulation'
import { useJourneySession } from '@/composables/useJourneySession'
import { usePresentationMode } from '@/composables/usePresentationMode'
import { useTheme } from '@/composables/useTheme'
import { useRoadSimulator } from '@/composables/useRoadSimulator'
import JourneyTimeline from '@/components/JourneyTimeline.vue'
import AIExplainBox from '@/components/AIExplainBox.vue'
import PredictionPanel from '@/components/PredictionPanel.vue'
import AIEventStream from '@/components/AIEventStream.vue'
import AIExplainability from '@/components/AIExplainability.vue'
import RoadSimulator from '@/components/RoadSimulator.vue'

const router = useRouter()

const {
  isDriving,
  isPaused,
  isOverridden,
  drivingData,
  particles,
  currentStateConfig,
  stateProgress,
  formatTime,
  formatDistance,
  startDriving,
  togglePause,
  stop,
  currentPrediction,
  isPredicting,
  currentMusicSegment
} = useDrivingSimulation()

const { session } = useJourneySession()
const { theme, toggleTheme } = useTheme()

const { isPresenting, setAutoDriving } = usePresentationMode()
const { triggerEvent } = useRoadSimulator()

const predictionConfidence = computed(() => {
  if (!currentPrediction.value) return null
  return currentPrediction.value.confidence
})

const averageSpeed = computed(() => {
  if (session.drivingStats.length === 0) return null
  const total = session.drivingStats.reduce((sum, stat) => sum + stat.speed, 0)
  return Math.round(total / session.drivingStats.length)
})

const maxSpeed = computed(() => {
  if (session.drivingStats.length === 0) return null
  return Math.max(...session.drivingStats.map(stat => stat.speed))
})

let roadEventTriggered = false
let autoStartTimer: number | null = null
let roadEventTimer: number | null = null

const handleAutoStart = () => {
  if (isPresenting.value && !isDriving.value) {
    autoStartTimer = window.setTimeout(async () => {
      await startDriving()
      setAutoDriving(true)
      
      roadEventTimer = window.setTimeout(() => {
        if (isDriving.value && !roadEventTriggered) {
          triggerEvent('rain')
          roadEventTriggered = true
        }
      }, 8000)
    }, 1000)
  }
}

watch(isPresenting, (newVal) => {
  if (newVal) {
    handleAutoStart()
  }
})

onMounted(() => {
  handleAutoStart()
})

onUnmounted(() => {
  if (autoStartTimer) {
    clearTimeout(autoStartTimer)
    autoStartTimer = null
  }
  if (roadEventTimer) {
    clearTimeout(roadEventTimer)
    roadEventTimer = null
  }
  stop()
})
</script>

<template>
  <div class="min-h-screen relative overflow-hidden page-bg" data-highlight="driving">
    <div class="absolute inset-0 bg-gradient-theme"></div>
    <div 
      class="absolute inset-0 transition-colors duration-1000"
      :style="{
        background: `linear-gradient(180deg, ${currentStateConfig.color}10 0%, transparent 50%, ${currentStateConfig.color}05 100%)`
      }"
    ></div>
    
    <div class="absolute inset-0 overflow-hidden">
      <div 
        v-for="particle in particles"
        :key="particle.id"
        class="absolute w-1 h-1 bg-white rounded-full"
        :style="{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          opacity: particle.opacity * (drivingData.speed / 100),
          transition: 'opacity 0.3s ease'
        }"
      ></div>
    </div>
    
    <div 
      v-if="session.isRerouting"
      class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent p-4"
    >
      <div class="max-w-7xl mx-auto">
        <div class="glass-card p-4 flex items-center gap-4">
          <div class="flex items-center gap-3">
            <Loader2 class="w-6 h-6 text-primary animate-spin" />
            <span class="text-primary-theme font-semibold">AI Re-thinking...</span>
          </div>
          <div class="flex-1">
            <div class="h-2 bg-glass-border rounded-full overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                :style="{ width: `${session.reroutingProgress}%` }"
              ></div>
            </div>
          </div>
          <div class="text-secondary-theme text-sm">
            {{ session.reroutingSteps[session.reroutingSteps.length - 1] }}
          </div>
        </div>
      </div>
    </div>
    
    <nav class="relative z-10 flex items-center justify-between px-8 py-6">
      <div class="flex items-center gap-3">
        <button 
          @click="router.push('/planner')"
          class="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div 
          class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500"
          :style="{ background: `linear-gradient(135deg, ${currentStateConfig.color}, ${currentStateConfig.color}80)` }"
        >
          <Navigation class="w-6 h-6 text-white" />
        </div>
        <span class="text-xl font-bold text-primary-theme">Driving Simulation</span>
      </div>
      
      <div class="flex items-center gap-6">
        <div class="text-right">
          <p class="text-text-muted text-sm">Time</p>
          <p class="text-primary-theme font-mono text-lg">{{ formatTime(drivingData.time) }}</p>
        </div>
        <div class="text-right">
          <p class="text-text-muted text-sm">Distance</p>
          <p class="text-primary-theme font-mono text-lg">{{ formatDistance(drivingData.distance) }} km</p>
        </div>
        <button 
          @click="toggleTheme"
          class="p-3 rounded-xl hover:bg-white/10 transition-all duration-300"
        >
          <Sun v-if="theme === 'dark'" class="w-5 h-5 text-text-secondary" />
          <Moon v-else class="w-5 h-5 text-text-secondary" />
        </button>
      </div>
    </nav>
    
    <main class="relative z-10 px-6 py-8 pb-64">
      <div class="max-w-7xl mx-auto">
        <div 
          v-if="!isDriving"
          class="flex flex-col items-center justify-center min-h-[60vh]"
        >
          <div class="glass-card p-12 text-center mb-8">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <Play class="w-12 h-12 text-white" />
            </div>
            <h2 class="text-3xl font-bold text-primary-theme mb-4">Ready to Drive?</h2>
            <p class="text-secondary-theme mb-8">Experience AI-powered music adaptation based on your driving behavior.</p>
            
            <button 
              @click="() => startDriving()"
              class="glass-button text-xl px-12 py-4"
            >
              <span class="flex items-center gap-3">
                <Play class="w-6 h-6" />
                Start Driving
              </span>
            </button>
          </div>
        </div>
        
        <div v-else>
          <div v-if="session.lastRerouteResult" class="mb-6">
            <div class="glass-card p-4 flex items-start gap-3 border-l-4 border-primary">
              <Brain class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p class="text-primary-theme font-medium">{{ session.lastRerouteResult.explanation }}</p>
                <p class="text-muted-theme text-sm mt-1">Road: {{ session.lastRerouteResult.roadType }} | Target: {{ session.lastRerouteResult.targetSpeed }} km/h</p>
              </div>
            </div>
          </div>
          
          <AIExplainBox 
            :driving-state="drivingData.state" 
            :is-driving="isDriving"
            class="mb-6"
          />
          
          <div class="grid xl:grid-cols-4 gap-6">
            <div class="xl:col-span-2 space-y-6">
              <div class="glass-card p-8 relative overflow-hidden">
                <div class="scan-line"></div>
                
                <div class="flex items-center justify-between mb-8">
                  <div>
                    <h3 class="text-muted-theme text-sm uppercase tracking-wider">Current State</h3>
                    <div class="flex items-center gap-2 mt-2">
                      <p 
                        class="text-3xl font-bold capitalize"
                        :style="{ color: currentStateConfig.color }"
                      >
                        {{ drivingData.state }}
                      </p>
                      <span 
                        v-if="isOverridden"
                        class="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium"
                      >
                        Event Override
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    @click="togglePause"
                    class="w-14 h-14 rounded-full bg-glass-border flex items-center justify-center hover:bg-glass-bg transition-colors"
                  >
                    <Pause v-if="!isPaused" class="w-6 h-6 text-primary-theme" />
                    <Play v-else class="w-6 h-6 text-primary-theme" />
                  </button>
                </div>
                
                <div class="flex items-end gap-4 mb-8">
                  <div class="relative">
                    <div class="text-8xl font-bold text-primary-theme font-mono">
                      {{ Math.round(drivingData.speed) }}
                    </div>
                    <div class="absolute -bottom-2 right-0 text-muted-theme text-xl">km/h</div>
                  </div>
                  <div class="flex-1 h-3 bg-glass-border rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all duration-300"
                      :style="{ width: `${(drivingData.speed / 150) * 100}%`, background: currentStateConfig.color }"
                    ></div>
                  </div>
                </div>
                
                <div class="h-2 bg-glass-bg rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                    :style="{ width: `${stateProgress}%` }"
                  ></div>
                </div>
                <p class="text-muted-theme text-sm mt-2">State Progress</p>
              </div>
              
              <div class="glass-card p-8">
                <h3 class="text-primary-theme font-semibold mb-6 flex items-center gap-3">
                  <Music class="w-5 h-5 text-secondary" />
                  Current Music
                </h3>
                
                <div class="flex items-center gap-6">
                  <div 
                    class="w-24 h-24 rounded-2xl flex items-center justify-center transition-colors duration-500"
                    :style="{ background: `${currentStateConfig.color}20` }"
                  >
                    <Music class="w-12 h-12" :style="{ color: currentStateConfig.color }" />
                  </div>
                  
                  <div class="flex-1">
                    <h4 class="text-primary-theme text-xl font-semibold mb-2">{{ currentMusicSegment?.style || drivingData.musicStyle }}</h4>
                    <p class="text-muted-theme mb-2">{{ currentMusicSegment?.key || 'AI-Generated Soundtrack' }}</p>
                    
                    <div class="flex items-center gap-4 text-sm">
                      <span class="px-2 py-1 rounded bg-glass-bg text-secondary-theme">
                        {{ currentMusicSegment?.energy || drivingData.energy }} Energy
                      </span>
                      <span class="px-2 py-1 rounded bg-glass-bg text-secondary-theme">
                        {{ currentMusicSegment?.tempo || drivingData.tempo }} BPM
                      </span>
                      <span class="px-2 py-1 rounded bg-glass-bg text-secondary-theme">
                        {{ currentMusicSegment?.emotion || 'Adaptive' }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="mt-6 flex items-center justify-center gap-8">
                  <div 
                    v-for="i in 6" 
                    :key="i"
                    class="w-2 rounded-full transition-all duration-150"
                    :class="i <= Math.ceil(drivingData.energy / 20) ? 'opacity-100' : 'opacity-20'"
                    :style="{ 
                      background: currentStateConfig.color,
                      height: `${15 + Math.random() * 40}px`
                    }"
                  ></div>
                </div>
              </div>
            </div>
            
            <div class="space-y-6">
              <PredictionPanel 
                :is-driving="isDriving" 
                :prediction="currentPrediction"
                :is-predicting="isPredicting"
              />
              
              <RoadSimulator :is-driving="isDriving" />
              
              <AIExplainability :driving-state="drivingData.state" />
              
              <AIEventStream 
                :driving-state="drivingData.state" 
                :is-driving="isDriving"
              />
            </div>
            
            <div class="space-y-6">
              <div class="glass-card p-5 backdrop-blur-2xl border-glass-border shadow-2xl">
                <div class="flex items-center gap-2 mb-4 pb-4 border-b border-glass-border">
                  <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 21a9 9 0 1 0 7.4-13 9 9 0 0 0-5.7 11.6"/></svg>
                  </div>
                  <span class="text-primary-theme font-semibold">AI Music Director</span>
                </div>
                
                <div class="mb-4 pb-4 border-b border-glass-border">
                  <div class="flex items-center gap-2 mb-3">
                    <div class="w-2 h-2 rounded-full" :class="session.aiStatus === 'loading' ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'"></div>
                    <span class="text-muted-theme text-sm">AI STATUS</span>
                  </div>
                  
                  <div class="space-y-2 text-sm">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full" :class="session.aiStatus === 'loading' ? 'bg-yellow-400 animate-pulse' : 'bg-primary animate-pulse'"></div>
                      <span class="text-primary-theme">{{ session.aiStatus === 'loading' ? 'Re-thinking...' : 'Thinking...' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-muted-theme">Current Road</span>
                      <span class="text-primary-theme">{{ session.lastRerouteResult?.roadType || 'Urban Road' }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-muted-theme">Next Road</span>
                      <span class="text-primary">{{ session.lastRerouteResult?.roadType || 'Elevated Road' }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="mb-4 pb-4 border-b border-glass-border">
                  <div class="text-muted-theme text-sm mb-2">Energy</div>
                  <div class="text-primary-theme text-2xl font-bold">{{ Math.round(drivingData.energy) }}%</div>
                  <div class="h-2 bg-glass-border rounded-full overflow-hidden mt-2">
                    <div 
                      class="h-full rounded-full transition-all duration-500"
                      :style="{ width: `${drivingData.energy}%`, background: currentStateConfig.color }"
                    ></div>
                  </div>
                </div>
                
                <div class="mb-4 pb-4 border-b border-glass-border">
                  <div class="text-muted-theme text-sm mb-2">Tempo</div>
                  <div class="text-primary-theme text-2xl font-bold">{{ Math.round(drivingData.tempo) }} BPM</div>
                </div>
                
                <div v-if="predictionConfidence !== null">
                  <div class="text-muted-theme text-sm mb-2">Prediction Confidence</div>
                  <div class="flex items-center gap-3">
                    <div class="flex-1 h-2 bg-glass-border rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-500"
                        :style="{ width: `${predictionConfidence}%` }"
                      ></div>
                    </div>
                    <span class="text-primary-theme font-mono text-sm">{{ predictionConfidence }}%</span>
                  </div>
                </div>
              </div>
              
              <div class="glass-card p-6">
                <h3 class="text-primary-theme font-semibold mb-4 flex items-center gap-3">
                  <Zap class="w-5 h-5 text-yellow-400" />
                  Energy Level
                </h3>
                
                <div class="flex items-center justify-center mb-4">
                  <div class="relative w-32 h-32">
                    <svg class="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="rgba(201, 169, 98, 0.15)"
                        stroke-width="10"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        :stroke="currentStateConfig.color"
                        stroke-width="10"
                        stroke-linecap="round"
                        :stroke-dasharray="`${(drivingData.energy / 100) * 352} 352`"
                        class="transition-all duration-500"
                      />
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                      <span class="text-3xl font-bold text-primary-theme">{{ Math.round(drivingData.energy) }}</span>
                      <span class="text-muted-theme text-xs">%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="glass-card p-6">
                <h3 class="text-primary-theme font-semibold mb-4 flex items-center gap-3">
                  <Gauge class="w-5 h-5 text-secondary" />
                  Tempo
                </h3>
                
                <div class="text-center mb-4">
                  <span class="text-4xl font-bold text-primary-theme font-mono">{{ Math.round(drivingData.tempo) }}</span>
                  <span class="text-muted-theme text-lg ml-2">BPM</span>
                </div>
                
                <div class="flex items-center justify-center gap-2">
                  <div 
                    v-for="i in 10" 
                    :key="i"
                    class="w-2 rounded-t-lg transition-all duration-150"
                    :class="i <= Math.ceil(drivingData.tempo / 15) ? 'opacity-100' : 'opacity-20'"
                    :style="{ 
                      background: currentStateConfig.color,
                      height: `${8 + (i * 6)}px`
                    }"
                  ></div>
                </div>
              </div>
              
              <div class="glass-card p-6">
                <h3 class="text-primary-theme font-semibold mb-4 flex items-center gap-3">
                  <Activity class="w-5 h-5 text-primary" />
                  Speed Details
                </h3>
                
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-muted-theme">Current</span>
                    <span class="text-primary-theme font-mono">{{ Math.round(drivingData.speed) }} km/h</span>
                  </div>
                  <div v-if="averageSpeed !== null" class="flex justify-between items-center">
                    <span class="text-muted-theme">Average</span>
                    <span class="text-primary-theme font-mono">{{ averageSpeed }} km/h</span>
                  </div>
                  <div v-if="maxSpeed !== null" class="flex justify-between items-center">
                    <span class="text-muted-theme">Max</span>
                    <span class="text-primary-theme font-mono">{{ maxSpeed }} km/h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <JourneyTimeline 
      v-if="isDriving"
      :is-driving="isDriving"
      :driving-time="drivingData.time"
    />
  </div>
</template>