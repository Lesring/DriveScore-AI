<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Brain, MapPin, Clock, Cloud, Car, Heart, Building2, TrendingUp, Route, Zap, Flag, Check, ArrowDownRight, AlertCircle, RefreshCw } from 'lucide-vue-next'
import { reasoningSteps } from '@/mock/data'
import { analyzeRoute, generateMusic, cache, type RouteStep, type RouteAnalysis, type MusicGeneration, type APIResult } from '@/api'
import { useJourneySession } from '@/composables/useJourneySession'

const router = useRouter()
const { setRouteInput, setRouteAnalysis, setMusicSegments, clearSession } = useJourneySession()

const isProcessing = ref(true)
const currentStep = ref(0)
const completedSteps = ref<number[]>([])
const currentReasoning = ref('')
const currentStatus = ref<'idle' | 'loading-model' | 'analyzing' | 'generating-music' | 'success' | 'error'>('idle')
const missionData = ref<{
  destination: string
  estimatedTime: number
  weather: string
  traffic: string
  driverStyle: string
  mood: string
} | null>(null)

const aiGeneratedSteps = ref<RouteStep[]>([])
const errorMessage = ref<string | null>(null)
const analysisSource = ref<'ai' | 'fallback'>('ai')
const musicSource = ref<'ai' | 'fallback'>('ai')

const iconMap: Record<string, any> = {
  Building2,
  TrendingUp,
  Route,
  Zap,
  Flag
}

const stepIconMap: Record<string, string> = {
  Urban: 'Building2',
  Build: 'TrendingUp',
  Highway: 'Route',
  Peak: 'Zap',
  Ending: 'Flag'
}

const stepColorMap: Record<string, string> = {
  Urban: '#3b82f6',
  Build: '#f59e0b',
  Highway: '#8b5cf6',
  Peak: '#ef4444',
  Ending: '#10b981'
}

onMounted(() => {
  runBrainWorkflow()
})

const runBrainWorkflow = async () => {
  currentReasoning.value = reasoningSteps[0].text
  currentStatus.value = 'loading-model'
  
  const routeInput = {
    start: 'Central Station',
    end: 'Airport',
    weather: 'Sunny',
    estimatedTime: 23,
    driverStyle: 'Balanced'
  }
  
  clearSession()
  setRouteInput(routeInput)
  
  try {
    currentStatus.value = 'analyzing'
    const analysisResult: APIResult<RouteAnalysis> = await analyzeRoute(routeInput)
    analysisSource.value = analysisResult.source
    
    if (analysisResult.error) {
      console.warn('AI analysis error:', analysisResult.error)
      errorMessage.value = errorMessage.value ? `${errorMessage.value}; ${analysisResult.error}` : analysisResult.error
    }
    
    setRouteAnalysis(analysisResult.data!, analysisResult.source)
    
    missionData.value = {
      destination: analysisResult.data!.destination,
      estimatedTime: analysisResult.data!.estimatedTime,
      weather: analysisResult.data!.weather,
      traffic: analysisResult.data!.traffic,
      driverStyle: analysisResult.data!.driverStyle,
      mood: analysisResult.data!.mood
    }
    
    aiGeneratedSteps.value = analysisResult.data!.steps
    
    for (let i = 1; i < reasoningSteps.length; i++) {
      await delay(reasoningSteps[i-1].duration)
      currentReasoning.value = reasoningSteps[i].text
      
      if (i === 3) {
        currentStatus.value = 'generating-music'
        const musicResult: APIResult<MusicGeneration> = await generateMusic({ routeAnalysis: analysisResult.data! })
        musicSource.value = musicResult.source
        
        if (musicResult.error) {
          console.warn('AI music error:', musicResult.error)
        }
        
        setMusicSegments(musicResult.data!, musicResult.source)
      }
      
      if (i === 5) {
        await cache({ segmentIds: ['Calm_01', 'Build_01', 'Cruise_02', 'Peak_01', 'Ending_01'] })
      }
    }
    
    for (let i = 0; i < aiGeneratedSteps.value.length; i++) {
      await delay(800)
      currentStep.value = i + 1
      completedSteps.value.push(i + 1)
    }
    
    await delay(1000)
    currentStatus.value = 'success'
    isProcessing.value = false
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unknown error'
    currentStatus.value = 'error'
    isProcessing.value = false
  }
}

const retryWorkflow = () => {
  errorMessage.value = null
  runBrainWorkflow()
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const continueJourney = () => {
  router.push('/planner')
}
</script>

<template>
  <div class="min-h-screen relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-dark via-dark-light to-primary/10"></div>
    
    <nav class="relative z-10 flex items-center justify-between px-8 py-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Brain class="w-6 h-6 text-white" />
        </div>
        <span class="text-xl font-bold text-white">Journey Brain</span>
      </div>
      
      <div class="flex items-center gap-2">
        <div 
          class="w-2 h-2 rounded-full transition-colors duration-300"
          :class="{
            'bg-yellow-400 animate-pulse': currentStatus === 'loading-model',
            'bg-blue-400 animate-pulse': currentStatus === 'analyzing',
            'bg-purple-400 animate-pulse': currentStatus === 'generating-music',
            'bg-green-400': currentStatus === 'success',
            'bg-red-400': currentStatus === 'error',
            'bg-blue-400': currentStatus === 'idle'
          }"
        ></div>
        <span class="text-white/60 text-sm">
          {{ currentStatus === 'loading-model' ? 'Loading Model...' : 
             currentStatus === 'analyzing' ? 'Analyzing Route...' : 
             currentStatus === 'generating-music' ? 'Generating Music...' : 
             currentStatus === 'success' ? 'Analysis Complete' : 
             currentStatus === 'error' ? 'Generation Failed' : 'AI Thinking...' }}
        </span>
      </div>
    </nav>
    
    <main class="relative z-10 px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-1 space-y-6">
            <div class="glass-card p-6">
              <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
                <Brain class="w-5 h-5 text-primary" />
                Mission
              </h3>
              
              <div v-if="missionData" class="space-y-4">
                <div class="flex items-center gap-3">
                  <MapPin class="w-5 h-5 text-secondary flex-shrink-0" />
                  <div>
                    <div class="text-white/50 text-sm">Destination</div>
                    <div class="text-white font-semibold">{{ missionData.destination }}</div>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <Clock class="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <div class="text-white/50 text-sm">Estimated Time</div>
                    <div class="text-white font-semibold">{{ missionData.estimatedTime }} min</div>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <Cloud class="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <div class="text-white/50 text-sm">Weather</div>
                    <div class="text-white font-semibold">{{ missionData.weather }}</div>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <Car class="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <div>
                    <div class="text-white/50 text-sm">Traffic</div>
                    <div class="text-white font-semibold">{{ missionData.traffic }}</div>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <Heart class="w-5 h-5 text-pink-400 flex-shrink-0" />
                  <div>
                    <div class="text-white/50 text-sm">Driver Style</div>
                    <div class="text-white font-semibold">{{ missionData.driverStyle }}</div>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <Zap class="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <div class="text-white/50 text-sm">Mood</div>
                    <div class="text-white font-semibold">{{ missionData.mood }}</div>
                  </div>
                </div>
              </div>
              
              <div v-else class="space-y-2">
                <div v-for="i in 6" :key="i" class="flex items-center gap-3">
                  <div class="w-5 h-5 bg-white/10 rounded"></div>
                  <div class="flex-1 h-4 bg-white/10 rounded"></div>
                </div>
              </div>
            </div>
            
            <div 
              v-if="errorMessage"
              class="glass-card p-4 bg-red-500/20 border border-red-500/30"
            >
              <div class="flex items-center gap-3">
                <AlertCircle class="w-5 h-5 text-red-400 flex-shrink-0" />
                <div class="flex-1">
                  <div class="text-red-400 font-semibold">AI Generation Failed</div>
                  <div class="text-white/70 text-sm">{{ errorMessage }}</div>
                </div>
                <button 
                  @click="retryWorkflow"
                  class="p-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors"
                >
                  <RefreshCw class="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>
            
            <button 
              v-if="!isProcessing"
              @click="continueJourney"
              class="w-full glass-button flex items-center justify-center gap-2"
            >
              <span>Continue Journey</span>
              <ArrowDownRight class="w-5 h-5" />
            </button>
          </div>
          
          <div class="lg:col-span-1">
            <div class="glass-card p-6 h-full">
              <div class="flex items-center gap-3 mb-6">
                <h3 class="text-white font-semibold text-center flex-1">Journey Blueprint</h3>
                <span 
                  class="text-xs px-2 py-1 rounded-full"
                  :class="analysisSource === 'ai' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'"
                >
                  {{ analysisSource === 'ai' ? 'AI Generated' : 'Fallback Demo' }}
                </span>
              </div>
              
              <div v-if="aiGeneratedSteps.length > 0" class="space-y-1">
                <div 
                  v-for="(step, index) in aiGeneratedSteps" 
                  :key="step.id"
                  class="relative flex items-center gap-4 p-4 rounded-xl transition-all duration-500"
                  :class="{
                    'bg-white/10': currentStep === step.id,
                    'opacity-100': completedSteps.includes(step.id),
                    'opacity-30': !completedSteps.includes(step.id)
                  }"
                >
                  <div 
                    class="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500"
                    :class="{
                      'shadow-glow': completedSteps.includes(step.id)
                    }"
                    :style="{ 
                      background: completedSteps.includes(step.id) 
                        ? `linear-gradient(135deg, ${stepColorMap[step.name] || '#8b5cf6'}, ${(stepColorMap[step.name] || '#8b5cf6')}80)` 
                        : 'rgba(255,255,255,0.1)',
                      boxShadow: currentStep === step.id ? `0 0 0 2px ${stepColorMap[step.name] || '#8b5cf6'}, 0 0 0 4px rgba(17, 24, 39, 1)` : 'none'
                    }"
                  >
                    <component 
                      :is="iconMap[stepIconMap[step.name] || 'Route']" 
                      class="w-6 h-6 transition-colors duration-500"
                      :style="{ color: completedSteps.includes(step.id) ? '#fff' : stepColorMap[step.name] || '#8b5cf6' }"
                    />
                    
                    <div 
                      v-if="completedSteps.includes(step.id)"
                      class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <Check class="w-3 h-3 text-white" />
                    </div>
                  </div>
                  
                  <div class="flex-1">
                    <div 
                      class="font-semibold transition-colors duration-500"
                      :style="{ color: completedSteps.includes(step.id) ? stepColorMap[step.name] || '#8b5cf6' : '#fff' }"
                    >
                      {{ step.name }}
                    </div>
                    <div class="text-white/50 text-sm">{{ step.type }} - {{ step.speed }} km/h</div>
                    <div v-if="step.emotion" class="text-white/40 text-xs mt-1">Emotion: {{ step.emotion }}</div>
                  </div>
                  
                  <ArrowDownRight 
                    v-if="index < aiGeneratedSteps.length - 1"
                    class="w-5 h-5 text-white/30"
                  />
                </div>
              </div>
              
              <div v-else class="space-y-2">
                <div v-for="i in 5" :key="i" class="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <div class="w-12 h-12 bg-white/10 rounded-xl"></div>
                  <div class="flex-1">
                    <div class="h-4 bg-white/10 rounded w-24"></div>
                    <div class="h-3 bg-white/5 rounded w-32 mt-1"></div>
                  </div>
                </div>
              </div>
              
              <div class="mt-6 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full transition-all duration-500"
                  :style="{ width: `${(completedSteps.length / (aiGeneratedSteps.length || 5)) * 100}%` }"
                ></div>
              </div>
              <div class="text-center text-white/50 text-sm mt-2">
                {{ completedSteps.length }} / {{ aiGeneratedSteps.length || 5 }} steps completed
              </div>
            </div>
          </div>
          
          <div class="lg:col-span-1">
            <div class="glass-card p-6 h-full">
              <h3 class="text-white font-semibold mb-4 flex items-center gap-2">
                <Zap class="w-5 h-5 text-yellow-400" />
                AI Reasoning
              </h3>
              
              <div class="space-y-3 max-h-[400px] overflow-y-auto">
                <div 
                  v-for="(step, index) in reasoningSteps" 
                  :key="index"
                  class="flex items-start gap-3 p-3 rounded-lg transition-all duration-500"
                  :class="{
                    'bg-primary/20': currentReasoning === step.text,
                    'bg-white/5': currentReasoning !== step.text && index < reasoningSteps.findIndex(s => s.text === currentReasoning),
                    'opacity-30': index > reasoningSteps.findIndex(s => s.text === currentReasoning)
                  }"
                >
                  <div 
                    class="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    :class="{
                      'bg-green-400': index < reasoningSteps.findIndex(s => s.text === currentReasoning),
                      'bg-primary animate-pulse': currentReasoning === step.text,
                      'bg-white/30': index > reasoningSteps.findIndex(s => s.text === currentReasoning)
                    }"
                  ></div>
                  <div>
                    <div 
                    class="text-sm"
                    :class="{
                      'text-white': currentReasoning === step.text || index < reasoningSteps.findIndex(s => s.text === currentReasoning),
                      'text-white/50': index > reasoningSteps.findIndex(s => s.text === currentReasoning)
                    }"
                  >
                      {{ step.text }}
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-if="!isProcessing" class="mt-6 p-4 bg-green-500/20 rounded-xl">
                <div class="flex items-center gap-2 text-green-400 mb-2">
                  <Check class="w-5 h-5" />
                  <span class="font-semibold">Analysis Complete</span>
                </div>
                <p class="text-white/70 text-sm">Journey blueprint generated successfully.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>