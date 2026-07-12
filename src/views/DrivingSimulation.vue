<script setup lang="ts">
import { onUnmounted } from 'vue'
import { Play, Pause, Gauge, Zap, Music, Navigation, Activity } from 'lucide-vue-next'
import { useDrivingSimulation } from '@/composables/useDrivingSimulation'
import AIMusicDirectorPanel from '@/components/AIMusicDirectorPanel.vue'
import JourneyTimeline from '@/components/JourneyTimeline.vue'
import AIExplainBox from '@/components/AIExplainBox.vue'
import PredictionPanel from '@/components/PredictionPanel.vue'
import AIEventStream from '@/components/AIEventStream.vue'
import AIExplainability from '@/components/AIExplainability.vue'
import RoadSimulator from '@/components/RoadSimulator.vue'

const {
  isDriving,
  isPaused,
  drivingData,
  particles,
  currentStateConfig,
  stateProgress,
  energyColor,
  formatTime,
  formatDistance,
  startDriving,
  togglePause,
  stop,
  currentPrediction,
  isPredicting,
  currentMusicSegment
} = useDrivingSimulation()

onUnmounted(() => {
  stop()
})
</script>

<template>
  <div class="min-h-screen relative overflow-hidden bg-dark pb-32">
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
    
    <nav class="relative z-10 flex items-center justify-between px-8 py-6">
      <div class="flex items-center gap-3">
        <div 
          class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500"
          :style="{ background: `linear-gradient(135deg, ${currentStateConfig.color}, ${currentStateConfig.color}80)` }"
        >
          <Navigation class="w-6 h-6 text-white" />
        </div>
        <span class="text-xl font-bold text-white">Driving Simulation</span>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="text-right">
          <p class="text-white/50 text-sm">Time</p>
          <p class="text-white font-mono text-lg">{{ formatTime(drivingData.time) }}</p>
        </div>
        <div class="text-right">
          <p class="text-white/50 text-sm">Distance</p>
          <p class="text-white font-mono text-lg">{{ formatDistance(drivingData.distance) }} km</p>
        </div>
      </div>
    </nav>
    
    <main class="relative z-10 px-4 py-8">
      <div class="max-w-6xl mx-auto">
        <div 
          v-if="!isDriving"
          class="flex flex-col items-center justify-center min-h-[60vh]"
        >
          <div class="glass-card p-12 text-center mb-8">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <Play class="w-12 h-12 text-white" />
            </div>
            <h2 class="text-3xl font-bold text-white mb-4">Ready to Drive?</h2>
            <p class="text-white/60 mb-8">Experience AI-powered music adaptation based on your driving behavior.</p>
            
            <button 
              @click="startDriving"
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
          <AIExplainBox 
            :driving-state="drivingData.state" 
            :is-driving="isDriving"
          />
          
          <div class="grid lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
              <div class="glass-card p-8 relative overflow-hidden">
                <div class="scan-line"></div>
                
                <div class="flex items-center justify-between mb-8">
                  <div>
                    <h3 class="text-white/50 text-sm uppercase tracking-wider">Current State</h3>
                    <p 
                      class="text-3xl font-bold mt-2 capitalize"
                      :style="{ color: currentStateConfig.color }"
                    >
                      {{ drivingData.state }}
                    </p>
                  </div>
                  
                  <button 
                    @click="togglePause"
                    class="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Pause v-if="!isPaused" class="w-6 h-6 text-white" />
                    <Play v-else class="w-6 h-6 text-white" />
                  </button>
                </div>
                
                <div class="flex items-end gap-4 mb-8">
                  <div class="relative">
                    <div class="text-8xl font-bold text-white font-mono">
                      {{ Math.round(drivingData.speed) }}
                    </div>
                    <div class="absolute -bottom-2 right-0 text-white/50 text-xl">km/h</div>
                  </div>
                  <div class="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all duration-300"
                      :style="{ width: `${(drivingData.speed / 150) * 100}%`, background: currentStateConfig.color }"
                    ></div>
                  </div>
                </div>
                
                <div class="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                    :style="{ width: `${stateProgress}%` }"
                  ></div>
                </div>
                <p class="text-white/40 text-sm mt-2">State Progress</p>
              </div>
              
              <div class="glass-card p-8">
                <h3 class="text-white font-semibold mb-6 flex items-center gap-3">
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
                    <h4 class="text-white text-xl font-semibold mb-2">{{ currentMusicSegment?.style || drivingData.musicStyle }}</h4>
                    <p class="text-white/50 mb-2">{{ currentMusicSegment?.key || 'AI-Generated Soundtrack' }}</p>
                    
                    <div class="flex items-center gap-4 text-sm">
                      <span class="px-2 py-1 rounded bg-white/10 text-white/70">
                        {{ currentMusicSegment?.energy || drivingData.energy }} Energy
                      </span>
                      <span class="px-2 py-1 rounded bg-white/10 text-white/70">
                        {{ currentMusicSegment?.tempo || drivingData.tempo }} BPM
                      </span>
                      <span class="px-2 py-1 rounded bg-white/10 text-white/70">
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
              
              <div class="glass-card p-6">
                <h3 class="text-white font-semibold mb-4 flex items-center gap-3">
                  <Zap class="w-5 h-5 text-yellow-400" />
                  Energy Level
                </h3>
                
                <div class="flex items-center justify-center mb-4">
                  <div class="relative w-40 h-40">
                    <svg class="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        stroke-width="12"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        :stroke="currentStateConfig.color"
                        stroke-width="12"
                        stroke-linecap="round"
                        :stroke-dasharray="`${(drivingData.energy / 100) * 440} 440`"
                        class="transition-all duration-500"
                      />
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                      <span class="text-4xl font-bold text-white">{{ Math.round(drivingData.energy) }}</span>
                      <span class="text-white/50 text-sm">%</span>
                    </div>
                  </div>
                </div>
                
                <div class="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full bg-gradient-to-r transition-all duration-500"
                    :class="energyColor"
                    :style="{ width: `${drivingData.energy}%` }"
                  ></div>
                </div>
              </div>
              
              <div class="glass-card p-6">
                <h3 class="text-white font-semibold mb-4 flex items-center gap-3">
                  <Gauge class="w-5 h-5 text-secondary" />
                  Tempo
                </h3>
                
                <div class="text-center mb-4">
                  <span class="text-5xl font-bold text-white font-mono">{{ Math.round(drivingData.tempo) }}</span>
                  <span class="text-white/50 text-lg ml-2">BPM</span>
                </div>
                
                <div class="flex items-center justify-center gap-2">
                  <div 
                    v-for="i in 10" 
                    :key="i"
                    class="w-3 rounded-t-lg transition-all duration-150"
                    :class="i <= Math.ceil(drivingData.tempo / 15) ? 'opacity-100' : 'opacity-20'"
                    :style="{ 
                      background: currentStateConfig.color,
                      height: `${10 + (i * 8)}px`
                    }"
                  ></div>
                </div>
              </div>
              
              <div class="glass-card p-6">
                <h3 class="text-white font-semibold mb-4 flex items-center gap-3">
                  <Activity class="w-5 h-5 text-primary" />
                  Speed Details
                </h3>
                
                <div class="space-y-4">
                  <div class="flex justify-between items-center">
                    <span class="text-white/50">Current</span>
                    <span class="text-white font-mono">{{ Math.round(drivingData.speed) }} km/h</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-white/50">Average</span>
                    <span class="text-white font-mono">65 km/h</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-white/50">Max</span>
                    <span class="text-white font-mono">142 km/h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <AIMusicDirectorPanel 
      v-if="isDriving"
      :driving-state="drivingData.state"
      :energy="drivingData.energy"
      :tempo="drivingData.tempo"
      :is-driving="isDriving"
    />
    
    <JourneyTimeline 
      :is-driving="isDriving"
      :driving-time="drivingData.time"
    />
  </div>
</template>
