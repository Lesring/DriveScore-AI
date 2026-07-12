<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MapPin, Navigation, ChevronDown, Music, Clock, Zap, AlertCircle, RefreshCw } from 'lucide-vue-next'
import type { JourneyBlueprint } from '@/types'
import ComposerPanel from '@/components/ComposerPanel.vue'
import CacheEngine from '@/components/CacheEngine.vue'
import { analyzeRoute, generateMusic, type RouteAnalysis, type MusicGeneration, type APIResult } from '@/api'
import { useJourneySession } from '@/composables/useJourneySession'

const router = useRouter()
const { setRouteInput, setRouteAnalysis, setMusicSegments, clearSession } = useJourneySession()

const startPoint = ref('')
const endPoint = ref('')
const isGenerating = ref(false)
const currentStatus = ref<'idle' | 'loading-model' | 'analyzing' | 'generating-music' | 'success' | 'error'>('idle')
const blueprint = ref<JourneyBlueprint | null>(null)
const showComposer = ref(false)
const showCache = ref(false)
const aiAnalysis = ref<RouteAnalysis | null>(null)
const aiMusicGeneration = ref<MusicGeneration | null>(null)
const errorMessage = ref<string | null>(null)
const analysisSource = ref<'ai' | 'fallback'>('ai')
const musicSource = ref<'ai' | 'fallback'>('ai')

const generateBlueprint = async () => {
  if (!startPoint.value || !endPoint.value) return
  
  isGenerating.value = true
  currentStatus.value = 'loading-model'
  errorMessage.value = null
  clearSession()
  
  const routeInput = {
    start: startPoint.value,
    end: endPoint.value,
    weather: 'Sunny',
    estimatedTime: 23,
    driverStyle: 'Balanced'
  }
  
  setRouteInput(routeInput)
  
  try {
    currentStatus.value = 'analyzing'
    const analysisResult: APIResult<RouteAnalysis> = await analyzeRoute(routeInput)
    analysisSource.value = analysisResult.source
    
    if (analysisResult.error) {
      console.warn('AI analysis error:', analysisResult.error)
    }
    
    aiAnalysis.value = analysisResult.data!
    setRouteAnalysis(analysisResult.data!, analysisResult.source)
    
    currentStatus.value = 'generating-music'
    const musicResult: APIResult<MusicGeneration> = await generateMusic({ routeAnalysis: analysisResult.data! })
    musicSource.value = musicResult.source
    
    if (musicResult.error) {
      console.warn('AI music error:', musicResult.error)
    }
    
    aiMusicGeneration.value = musicResult.data!
    setMusicSegments(musicResult.data!, musicResult.source)
    
    currentStatus.value = 'success'
    showComposer.value = true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unknown error'
    currentStatus.value = 'error'
    isGenerating.value = false
  }
}

const retryGeneration = () => {
  errorMessage.value = null
  generateBlueprint()
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

const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    'loading-model': 'Loading AI Model...',
    'analyzing': 'Analyzing Route...',
    'generating-music': 'Generating Music...',
    'success': 'Generation Complete',
    'error': 'Generation Failed'
  }
  return statusMap[currentStatus.value] || 'AI Generating...'
})

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
        
        <div 
          v-if="isGenerating"
          class="flex items-center gap-4 p-4 bg-primary/10 border border-primary/30 rounded-xl mb-6"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
              <span class="text-primary font-semibold">{{ statusText }}</span>
            </div>
            <div class="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                :style="{ 
                  width: `${currentStatus === 'loading-model' ? 15 : 
                          currentStatus === 'analyzing' ? 45 : 
                          currentStatus === 'generating-music' ? 75 : 100}%` 
                }"
              ></div>
            </div>
          </div>
        </div>
        
        <div 
          v-if="errorMessage"
          class="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-xl mb-6"
        >
          <AlertCircle class="w-5 h-5 text-red-400 flex-shrink-0" />
          <div class="flex-1">
            <div class="text-red-400 font-semibold">AI Generation Failed</div>
            <div class="text-white/70 text-sm">{{ errorMessage }}</div>
          </div>
          <button 
            @click="retryGeneration"
            class="p-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors"
          >
            <RefreshCw class="w-5 h-5 text-red-400" />
          </button>
        </div>
        
        <button 
          @click="generateBlueprint"
          :disabled="!startPoint || !endPoint || isGenerating"
          class="w-full glass-button text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Navigation class="w-5 h-5" />
          <span>{{ isGenerating ? statusText : 'Generate Journey Blueprint' }}</span>
          <div 
            v-if="isGenerating"
            class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
          ></div>
        </button>
      </div>
      
      <ComposerPanel 
        v-if="showComposer"
        :is-visible="showComposer"
        :analysis-source="analysisSource"
        :music-source="musicSource"
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
          <div class="flex items-center gap-3 mb-6">
            <h3 class="text-xl font-bold text-white flex items-center gap-3">
              <Navigation class="w-6 h-6 text-primary" />
              Journey Route
            </h3>
            <span 
              class="text-xs px-2 py-1 rounded-full"
              :class="analysisSource === 'ai' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'"
            >
              {{ analysisSource === 'ai' ? 'AI Generated' : 'Fallback Demo' }}
            </span>
          </div>
          
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
          <div class="flex items-center gap-3 mb-6">
            <h3 class="text-xl font-bold text-white flex items-center gap-3">
              <Music class="w-6 h-6 text-secondary" />
              Music Chapters
            </h3>
            <span 
              class="text-xs px-2 py-1 rounded-full"
              :class="musicSource === 'ai' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'"
            >
              {{ musicSource === 'ai' ? 'AI Generated' : 'Fallback Demo' }}
            </span>
          </div>
          
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