<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Trophy, Clock, Music, Zap, Star, RotateCcw, Home, Heart, Target, TrendingUp, AlertCircle, Brain, Disc } from 'lucide-vue-next'
import NavBar from '@/components/NavBar.vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { useJourneySession } from '@/composables/useJourneySession'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const router = useRouter()
const isLoaded = ref(false)
const { session, getSummaryStats } = useJourneySession()

const sessionStats = ref(getSummaryStats())

const hasRealData = computed(() => sessionStats.value !== null)

const summaryData = computed(() => {
  if (sessionStats.value) {
    const { drivingTime, averageEnergy, averageTempo, musicSegments, predictionCount } = sessionStats.value
    
    let drivingStyle: 'smooth' | 'dynamic' | 'aggressive' | 'balanced' = 'balanced'
    let journeyEmotion = 'N/A (Demo)'
    
    if (session.drivingStats.length > 0) {
      const maxSpeed = Math.max(...session.drivingStats.map(s => s.speed))
      const speedVariance = session.drivingStats.reduce((sum, s) => {
        const avg = session.drivingStats.reduce((acc, curr) => acc + curr.speed, 0) / session.drivingStats.length
        return sum + Math.pow(s.speed - avg, 2)
      }, 0) / session.drivingStats.length
      
      if (maxSpeed > 120) drivingStyle = 'aggressive'
      else if (maxSpeed > 80 && speedVariance > 100) drivingStyle = 'dynamic'
      else if (speedVariance < 50) drivingStyle = 'smooth'
      else drivingStyle = 'balanced'
      
      if (averageEnergy >= 80) journeyEmotion = 'Energetic'
      else if (averageEnergy >= 50) journeyEmotion = 'Dynamic'
      else journeyEmotion = 'Relaxed'
    }
    
    return {
      drivingTime,
      musicSegments,
      averageEnergy,
      averageTempo,
      drivingStyle,
      journeyScore: 'N/A (Demo)',
      musicContinuity: 'N/A (Demo)',
      predictionAccuracy: 'N/A (Demo)',
      journeyEmotion,
      predictionCount,
      dataSource: sessionStats.value.dataSource,
      analysisSource: sessionStats.value.analysisSource,
      musicSource: sessionStats.value.musicSource
    }
  }
  return {
    drivingTime: 180,
    musicSegments: 5,
    averageEnergy: 65,
    averageTempo: 105,
    drivingStyle: 'balanced' as const,
    journeyScore: 'N/A (Demo)',
    musicContinuity: 'N/A (Demo)',
    predictionAccuracy: 'N/A (Demo)',
    journeyEmotion: 'Dynamic',
    predictionCount: 0,
    dataSource: 'fallback' as const,
    analysisSource: 'fallback' as const,
    musicSource: 'fallback' as const
  }
})

const energyData = computed(() => {
  if (session.drivingStats.length > 0) {
    return session.drivingStats.map(stat => stat.energy)
  }
  return [30, 45, 60, 75, 85, 90, 70, 55, 40, 30]
})

const tempoData = computed(() => {
  if (session.drivingStats.length > 0) {
    return session.drivingStats.map(stat => stat.tempo)
  }
  return [75, 90, 110, 130, 145, 140, 120, 100, 85, 70]
})

const speedData = computed(() => {
  if (session.drivingStats.length > 0) {
    return session.drivingStats.map(stat => stat.speed)
  }
  return [40, 60, 80, 100, 120, 140, 110, 80, 50, 30]
})

onMounted(() => {
  sessionStats.value = getSummaryStats()
  setTimeout(() => {
    isLoaded.value = true
  }, 300)
})

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins} min ${secs} sec`
}

type DrivingStyle = 'smooth' | 'dynamic' | 'aggressive' | 'balanced'

const drivingStyleConfig = computed(() => {
  const configs: Record<DrivingStyle, { label: string; description: string; color: string; stars: number }> = {
    smooth: { label: 'Smooth Operator', description: 'Consistent and relaxed driving', color: '#d4c7b0', stars: 4 },
    dynamic: { label: 'Dynamic Driver', description: 'Varied driving style with energy', color: '#c9a962', stars: 5 },
    aggressive: { label: 'Aggressive Driver', description: 'Fast and intense driving style', color: '#f5efe6', stars: 3 },
    balanced: { label: 'Balanced Driver', description: 'Perfect mix of smooth and dynamic', color: '#dcc88a', stars: 5 }
  }
  return configs[summaryData.value.drivingStyle as DrivingStyle]
})

const emotionColor = computed(() => {
  if (summaryData.value.journeyEmotion === 'N/A (Demo)') return '#c9a962'
  const colors: Record<string, string> = {
    'Energetic': '#dcc88a',
    'Dynamic': '#c9a962',
    'Relaxed': '#d4c7b0',
    'Calm': '#b8a687'
  }
  return colors[summaryData.value.journeyEmotion] || '#c9a962'
})

const goHome = () => {
  router.push('/')
}

const startOver = () => {
  router.push('/planner')
}

const viewFinalVision = () => {
  router.push('/final-vision')
}

const generateChartOption = (data: number[], color: string, title: string) => ({
  backgroundColor: 'transparent',
  grid: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 50
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textStyle: { color: '#fff' }
  },
  xAxis: {
    type: 'category',
    data: data.map((_, i) => `T${i + 1}`),
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
    axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 }
  },
  yAxis: {
    type: 'value',
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
    axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
  },
  series: [{
    name: title,
    type: 'line',
    data,
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { color, width: 2 },
    itemStyle: { color },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: `${color}40` },
          { offset: 1, color: `${color}05` }
        ]
      }
    }
  }]
})

const energyChartOption = computed(() => generateChartOption(energyData.value, '#c9a962', 'Energy'))
const tempoChartOption = computed(() => generateChartOption(tempoData.value, '#dcc88a', 'Tempo'))
const speedChartOption = computed(() => generateChartOption(speedData.value, '#d4c7b0', 'Speed'))
</script>

<template>
  <div class="min-h-screen relative overflow-hidden page-bg" data-highlight="results">
    <div class="absolute inset-0 bg-gradient-theme"></div>
    
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-3xl"></div>
    
    <NavBar title="Journey Summary" :showBack="true" @back="router.push('/simulation')" />
    
    <div class="relative z-10 px-8">
      <div class="flex items-center gap-4">
        <div 
          v-if="hasRealData"
          class="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full"
        >
          <span class="text-green-400 text-sm font-medium">Real Session Data</span>
        </div>
        <div 
          v-else
          class="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full"
        >
          <AlertCircle class="w-4 h-4 text-yellow-400" />
          <span class="text-yellow-400 text-sm font-medium">Demo Data</span>
        </div>
        
        <div class="flex items-center gap-2">
          <Brain 
            class="w-4 h-4"
            :class="summaryData.analysisSource === 'ai' ? 'text-green-400' : 'text-yellow-400'"
          />
          <span 
            class="text-xs px-2 py-0.5 rounded-full"
            :class="summaryData.analysisSource === 'ai' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'"
          >
            Analysis: {{ summaryData.analysisSource === 'ai' ? 'AI' : 'Fallback' }}
          </span>
        </div>
        
        <div class="flex items-center gap-2">
          <Disc 
            class="w-4 h-4"
            :class="summaryData.musicSource === 'ai' ? 'text-green-400' : 'text-yellow-400'"
          />
          <span 
            class="text-xs px-2 py-0.5 rounded-full"
            :class="summaryData.musicSource === 'ai' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'"
          >
            Music: {{ summaryData.musicSource === 'ai' ? 'AI' : 'Fallback' }}
          </span>
        </div>
      </div>
    </div>
    
    <main class="relative z-10 px-4 py-8 max-w-6xl mx-auto">
      <div 
        class="text-center mb-12"
        :class="{ 'animate-fade-in-up': isLoaded, 'opacity-0': !isLoaded }"
      >
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-6 shadow-glow">
          <Trophy class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-4xl font-bold text-primary-theme mb-4">Journey Completed</h1>
        <p class="text-secondary-theme text-lg">Your AI-powered driving experience has ended</p>
        
        <div class="mt-6 inline-flex items-center gap-3 px-6 py-3 glass-card rounded-full">
          <Target class="w-5 h-5 text-primary" />
          <span class="text-primary-theme">Journey Score</span>
          <span class="text-3xl font-bold text-primary">{{ summaryData.journeyScore }}</span>
        </div>
      </div>
      
      <div 
        class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
      >
        <div 
          class="glass-card p-6"
          :class="{ 'animate-slide-in-right': isLoaded, 'opacity-0': !isLoaded }"
        >
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Clock class="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 class="text-primary-theme font-semibold">Driving Time</h3>
              <p class="text-muted-theme text-sm">Total journey duration</p>
            </div>
          </div>
          <div class="text-center py-4">
            <span class="text-5xl font-bold text-primary-theme font-mono">{{ formatTime(summaryData.drivingTime) }}</span>
          </div>
        </div>
        
        <div 
          class="glass-card p-6"
          :class="{ 'animate-slide-in-right': isLoaded, 'opacity-0': !isLoaded }"
          style="animation-delay: 0.1s"
        >
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Music class="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 class="text-primary-theme font-semibold">Music Segments</h3>
              <p class="text-muted-theme text-sm">Unique soundtracks played</p>
            </div>
          </div>
          <div class="text-center py-4">
            <span class="text-5xl font-bold text-primary-theme font-mono">{{ summaryData.musicSegments }}</span>
            <span class="text-muted-theme text-xl ml-2">tracks</span>
          </div>
        </div>
        
        <div 
          class="glass-card p-6"
          :class="{ 'animate-slide-in-right': isLoaded, 'opacity-0': !isLoaded }"
          style="animation-delay: 0.2s"
        >
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Zap class="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 class="text-primary-theme font-semibold">Average Energy</h3>
              <p class="text-muted-theme text-sm">Overall driving intensity</p>
            </div>
          </div>
          <div class="text-center py-4">
            <span class="text-5xl font-bold text-primary-theme font-mono">{{ summaryData.averageEnergy }}</span>
            <span class="text-muted-theme text-xl ml-2">%</span>
          </div>
          <div class="h-3 bg-glass-border rounded-full overflow-hidden mt-4">
            <div 
              class="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400"
              :style="{ width: `${summaryData.averageEnergy}%` }"
            ></div>
          </div>
        </div>
        
        <div 
          class="glass-card p-6"
          :class="{ 'animate-slide-in-right': isLoaded, 'opacity-0': !isLoaded }"
          style="animation-delay: 0.3s"
        >
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Music class="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 class="text-primary-theme font-semibold">Average Tempo</h3>
              <p class="text-muted-theme text-sm">Overall music BPM</p>
            </div>
          </div>
          <div class="text-center py-4">
            <span class="text-5xl font-bold text-primary-theme font-mono">{{ summaryData.averageTempo }}</span>
            <span class="text-muted-theme text-xl ml-2">BPM</span>
          </div>
        </div>
        
        <div 
          class="glass-card p-6"
          :class="{ 'animate-slide-in-right': isLoaded, 'opacity-0': !isLoaded }"
          style="animation-delay: 0.4s"
        >
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Target class="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 class="text-primary-theme font-semibold">Predictions</h3>
              <p class="text-muted-theme text-sm">AI forecast count</p>
            </div>
          </div>
          <div class="text-center py-4">
            <span class="text-5xl font-bold text-primary-theme font-mono">{{ summaryData.predictionCount }}</span>
            <span class="text-muted-theme text-xl ml-2">events</span>
          </div>
        </div>
        
        <div 
          class="glass-card p-6"
          :class="{ 'animate-slide-in-right': isLoaded, 'opacity-0': !isLoaded }"
          style="animation-delay: 0.5s"
        >
          <div class="flex items-center gap-4 mb-4">
            <div 
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :style="{ background: `${emotionColor}20` }"
            >
              <Heart class="w-6 h-6" :style="{ color: emotionColor }" />
            </div>
            <div>
              <h3 class="text-primary-theme font-semibold">Journey Emotion</h3>
              <p class="text-muted-theme text-sm">Overall mood</p>
            </div>
          </div>
          <div class="text-center py-4">
            <span 
              class="text-2xl font-bold"
              :style="{ color: emotionColor }"
            >
              {{ summaryData.journeyEmotion }}
            </span>
          </div>
        </div>
      </div>
      
      <div 
        class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
      >
        <div 
          class="glass-card p-6"
          :class="{ 'animate-scale-in': isLoaded, 'opacity-0': !isLoaded }"
          style="animation-delay: 0.6s"
        >
          <h3 class="text-primary-theme font-semibold mb-4 flex items-center gap-3">
            <Zap class="w-5 h-5 text-yellow-400" />
            Energy Curve
          </h3>
          <div class="h-48">
            <v-chart :option="energyChartOption" class="w-full h-full" autoresize />
          </div>
        </div>
        
        <div 
          class="glass-card p-6"
          :class="{ 'animate-scale-in': isLoaded, 'opacity-0': !isLoaded }"
          style="animation-delay: 0.7s"
        >
          <h3 class="text-primary-theme font-semibold mb-4 flex items-center gap-3">
            <Music class="w-5 h-5 text-primary" />
            Tempo Curve
          </h3>
          <div class="h-48">
            <v-chart :option="tempoChartOption" class="w-full h-full" autoresize />
          </div>
        </div>
        
        <div 
          class="glass-card p-6"
          :class="{ 'animate-scale-in': isLoaded, 'opacity-0': !isLoaded }"
          style="animation-delay: 0.8s"
        >
          <h3 class="text-primary-theme font-semibold mb-4 flex items-center gap-3">
            <TrendingUp class="w-5 h-5 text-secondary" />
            Driving Speed
          </h3>
          <div class="h-48">
            <v-chart :option="speedChartOption" class="w-full h-full" autoresize />
          </div>
        </div>
      </div>
      
      <div 
        class="glass-card p-6"
        :class="{ 'animate-slide-in-right': isLoaded, 'opacity-0': !isLoaded }"
        style="animation-delay: 0.9s"
      >
        <div class="flex items-center gap-4 mb-4">
          <div 
            class="w-12 h-12 rounded-xl flex items-center justify-center"
            :style="{ background: `${drivingStyleConfig.color}20` }"
          >
            <Star class="w-6 h-6" :style="{ color: drivingStyleConfig.color }" />
          </div>
          <div>
            <h3 class="text-primary-theme font-semibold">Driver Style</h3>
            <p class="text-muted-theme text-sm">Your driving personality</p>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <span 
              class="text-3xl font-bold"
              :style="{ color: drivingStyleConfig.color }"
            >
              {{ drivingStyleConfig.label }}
            </span>
            <p class="text-muted-theme mt-1">{{ drivingStyleConfig.description }}</p>
          </div>
          <div class="flex items-center gap-1">
            <Star 
              v-for="i in 5" 
              :key="i"
              class="w-8 h-8"
              :class="i <= drivingStyleConfig.stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-theme'"
            />
          </div>
        </div>
      </div>
      
      <div 
        class="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
        :class="{ 'animate-scale-in': isLoaded, 'opacity-0': !isLoaded }"
        style="animation-delay: 1s"
      >
        <button 
          @click="startOver"
          class="glass-button flex items-center gap-3"
        >
          <RotateCcw class="w-5 h-5" />
          <span>Start New Journey</span>
        </button>
        
        <button 
          @click="viewFinalVision"
          class="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 flex items-center gap-3"
        >
          <Trophy class="w-5 h-5" />
          <span>The Future of Driving Sound</span>
        </button>
        
        <button 
          @click="goHome"
          class="px-8 py-3 bg-glass-bg border border-glass-border rounded-full text-primary-theme font-semibold transition-all duration-300 hover:bg-glass-border flex items-center gap-3"
        >
          <Home class="w-5 h-5" />
          <span>Return Home</span>
        </button>
      </div>
    </main>
    
    <footer class="relative z-10 text-center py-8 text-muted-theme text-sm">
      <p>DriveScore AI - Future Mobility Experience</p>
    </footer>
  </div>
</template>