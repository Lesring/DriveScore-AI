<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MapPin, Navigation, ChevronDown, Music, Clock, Zap } from 'lucide-vue-next'
import type { JourneyBlueprint } from '@/types'
import ComposerPanel from '@/components/ComposerPanel.vue'
import CacheEngine from '@/components/CacheEngine.vue'
import { analyzeRoute, generateMusic, type RouteAnalysis, type MusicGeneration } from '@/api'

const router = useRouter()

const startPoint = ref('')
const endPoint = ref('')
const isGenerating = ref(false)
const blueprint = ref<JourneyBlueprint | null>(null)
const showComposer = ref(false)
const showCache = ref(false)
const aiAnalysis = ref<RouteAnalysis | null>(null)
const aiMusicGeneration = ref<MusicGeneration | null>(null)

const generateBlueprint = async () => {
  if (!startPoint.value || !endPoint.value) return
  
  isGenerating.value = true
  
  aiAnalysis.value = await analyzeRoute({ 
    start: startPoint.value, 
    end: endPoint.value,
    weather: 'Sunny',
    estimatedTime: 23,
    driverStyle: 'Balanced'
  })
  
  aiMusicGeneration.value = await generateMusic({ routeAnalysis: aiAnalysis.value })
  
  showComposer.value = true
}

const onComposerComplete = () => {
  showCache.value = true
}

const onCacheReady = () => {
  if (!aiAnalysis.value || !aiMusicGeneration.value) {
    return
  }
  
  blueprint.value = {
    start: startPoint.value,
    end: endPoint.value,
    steps: aiAnalysis.value.steps.map((step, index) => ({
      id: index + 1,
      name: step.name,
      type: step.type as 'city' | 'elevated' | 'highway' | 'urban' | 'end',
      duration: step.duration,
      speed: step.speed
    })),
    musicChapters: aiMusicGeneration.value.segments.map((segment, index) => ({
      id: index + 1,
      name: segment.style,
      style: segment.style.toLowerCase() as 'calm' | 'build' | 'cruise' | 'peak' | 'ending',
      energy: segment.energy,
      tempo: segment.tempo,
      duration: segment.duration
    })),
    totalDuration: aiAnalysis.value.steps.reduce((sum, step) => sum + step.duration, 0)
  }
  
  isGenerating.value = false
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const startJourney = () => {
  router.push('/simulation')
}

const energyColor = (energy: number) => {
  if (energy < 40) return 'bg-green-500'
  if (energy < 70) return 'bg-yellow-500'
  return 'bg-red-500'
}
</script>

<template>
  <div class="min-h-screen relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-dark via-dark-light to-primary/10"></div>
    
    <nav class="relative z-10 flex items-center justify-between px-8 py-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Navigation class="w-6 h-6 text-white" />
        </div>
        <span class="text-xl font-bold text-white">Journey Planner</span>
      </div>
    </nav>
    
    <main class="relative z-10 px-4 py-8 max-w-6xl mx-auto">
      <div 
        class="glass-card p-8 mb-8"
        :class="{ 'animate-fade-in-up': true }"
      >
        <h2 class="text-2xl font-bold text-white mb-6">Plan Your Journey</h2>
        
        <div class="grid md:grid-cols-2 gap-6 mb-8">
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2">
              <MapPin class="w-5 h-5 text-primary" />
            </div>
            <input 
              v-model="startPoint"
              type="text"
              placeholder="Start Location"
              class="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2">
              <MapPin class="w-5 h-5 text-secondary" />
            </div>
            <input 
              v-model="endPoint"
              type="text"
              placeholder="Destination"
              class="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-secondary/50 transition-colors"
            />
          </div>
        </div>
        
        <button 
          @click="generateBlueprint"
          :disabled="!startPoint || !endPoint || isGenerating"
          class="w-full glass-button text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Navigation class="w-5 h-5" />
          <span>{{ isGenerating ? 'Generating...' : 'Generate Journey Blueprint' }}</span>
          <div 
            v-if="isGenerating"
            class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
          ></div>
        </button>
      </div>
      
      <ComposerPanel 
        v-if="showComposer"
        :is-visible="showComposer"
        @completed="onComposerComplete"
      />
      
      <CacheEngine 
        v-if="showCache"
        :is-visible="showCache"
        @ready="onCacheReady"
      />
      
      <div 
        v-if="blueprint"
        class="grid md:grid-cols-2 gap-8"
      >
        <div 
          class="glass-card p-6"
          :class="{ 'animate-slide-in-right': true }"
        >
          <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Navigation class="w-6 h-6 text-primary" />
            Journey Route
          </h3>
          
          <div class="space-y-4">
            <div 
              v-for="(step, index) in blueprint.steps"
              :key="step.id"
              class="flex items-center gap-4 group"
            >
              <div 
                class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold transition-all duration-300 group-hover:scale-110"
                :class="step.type === 'highway' ? 'bg-gradient-to-br from-primary to-accent' : step.type === 'elevated' ? 'bg-gradient-to-br from-secondary to-primary' : 'bg-white/10'"
              >
                {{ index + 1 }}
              </div>
              
              <div class="flex-1">
                <h4 class="text-white font-semibold">{{ step.name }}</h4>
                <div class="flex items-center gap-4 text-sm text-white/50">
                  <span class="flex items-center gap-1">
                    <Clock class="w-4 h-4" />
                    {{ formatDuration(step.duration) }}
                  </span>
                  <span>{{ step.speed }} km/h</span>
                </div>
              </div>
              
              <ChevronDown 
                v-if="index < blueprint.steps.length - 1"
                class="w-5 h-5 text-white/30"
              />
            </div>
          </div>
        </div>
        
        <div 
          class="glass-card p-6"
          :class="{ 'animate-slide-in-right': true }"
          style="animation-delay: 0.2s"
        >
          <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Music class="w-6 h-6 text-secondary" />
            Music Chapters
          </h3>
          
          <div class="space-y-4">
            <div 
              v-for="chapter in blueprint.musicChapters"
              :key="chapter.id"
              class="p-4 bg-white/5 rounded-xl"
            >
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-white font-semibold text-lg">{{ chapter.name }}</h4>
                <span class="text-sm text-white/50">{{ formatDuration(chapter.duration) }}</span>
              </div>
              
              <div class="space-y-3">
                <div>
                  <div class="flex items-center justify-between text-sm mb-1">
                    <span class="text-white/60 flex items-center gap-1">
                      <Zap class="w-4 h-4 text-yellow-400" />
                      Energy
                    </span>
                    <span class="text-white">{{ chapter.energy }}%</span>
                  </div>
                  <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all duration-500"
                      :class="energyColor(chapter.energy)"
                      :style="{ width: `${chapter.energy}%` }"
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div class="flex items-center justify-between text-sm mb-1">
                    <span class="text-white/60 flex items-center gap-1">
                      <Music class="w-4 h-4 text-secondary" />
                      Tempo
                    </span>
                    <span class="text-white">{{ chapter.tempo }} BPM</span>
                  </div>
                  <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-all duration-500"
                      :style="{ width: `${(chapter.tempo / 150) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        v-if="blueprint"
        class="mt-8 text-center"
        :class="{ 'animate-scale-in': true }"
        style="animation-delay: 0.4s"
      >
        <button 
          @click="startJourney"
          class="glass-button text-lg flex items-center gap-3 mx-auto"
        >
          <Navigation class="w-5 h-5" />
          <span>Start Driving Simulation</span>
        </button>
        
        <p class="mt-4 text-white/50 text-sm">
          Estimated Journey Time: {{ formatDuration(blueprint.totalDuration) }}
        </p>
      </div>
    </main>
  </div>
</template>
