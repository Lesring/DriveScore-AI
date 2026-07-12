<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Music, Clock, Zap, ChevronRight, Download, Loader2, Play, Pause } from 'lucide-vue-next'
import { musicLibrary } from '@/mock/data'
import { audioManager, type AudioSource } from '@/audio/AudioManager'

const router = useRouter()
const activeStyle = ref<'calm' | 'build' | 'cruise' | 'peak' | 'ending'>('build')
const playingSegment = ref<string | null>(null)
const isLoading = ref<string | null>(null)

const styles = [
  { id: 'calm', name: 'Calm', color: '#10b981' },
  { id: 'build', name: 'Build', color: '#f59e0b' },
  { id: 'cruise', name: 'Cruise', color: '#8b5cf6' },
  { id: 'peak', name: 'Peak', color: '#ef4444' },
  { id: 'ending', name: 'Ending', color: '#3b82f6' }
]

const filteredSegments = computed(() => {
  return musicLibrary.filter(m => m.style === activeStyle.value)
})

const getSegmentStatus = (id: string) => {
  if (playingSegment.value === id) return 'playing'
  if (['Calm_02', 'Build_01', 'Cruise_03'].includes(id)) return 'cached'
  if (['Build_02', 'Cruise_01'].includes(id)) return 'loading'
  return 'available'
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const goHome = () => {
  router.push('/')
}

const getAudioUrlForStyle = (style: string): string => {
  const styleMap: Record<string, string> = {
    'calm': '/music/Calm.mp3',
    'build': '/music/Build.mp3',
    'cruise': '/music/Cruise.mp3',
    'peak': '/music/Peak.mp3',
    'ending': '/music/Ending.mp3'
  }
  return styleMap[style.toLowerCase()] || '/music/Calm.mp3'
}

const playSegment = async (id: string) => {
  if (playingSegment.value === id) {
    audioManager.stop()
    playingSegment.value = null
    return
  }

  isLoading.value = id
  
  try {
    const segment = musicLibrary.find(m => m.id === id)
    if (!segment) return

    const audioSource: AudioSource = {
      id: segment.id,
      type: 'synthesized',
      segment: {
        ...segment,
        tempo: segment.bpm,
        progress: 100,
        style: segment.style.charAt(0).toUpperCase() + segment.style.slice(1),
        audioUrl: getAudioUrlForStyle(segment.style)
      }
    }

    await audioManager.play(audioSource, { fadeIn: 500, loop: true })
    playingSegment.value = id
  } catch (error) {
    console.error('Failed to play segment:', error)
  } finally {
    isLoading.value = null
  }
}
</script>

<template>
  <div class="min-h-screen relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-dark via-dark-light to-primary/10"></div>
    
    <nav class="relative z-10 flex items-center justify-between px-8 py-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Music class="w-6 h-6 text-white" />
        </div>
        <span class="text-xl font-bold text-white">Music Segment Engine</span>
      </div>
      
      <button 
        @click="goHome"
        class="px-6 py-2 bg-white/10 border border-white/20 rounded-full text-white text-sm hover:bg-white/20 transition-colors"
      >
        Return Home
      </button>
    </nav>
    
    <main class="relative z-10 px-4 py-8">
      <div class="max-w-6xl mx-auto">
        <div class="glass-card p-6 mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-white mb-2">Music Library</h2>
              <p class="text-white/60">AI-generated music segments organized by style</p>
            </div>
            
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span class="text-white/60 text-sm">Engine Active</span>
            </div>
          </div>
        </div>
        
        <div class="flex gap-3 mb-8 overflow-x-auto pb-2">
          <button 
            v-for="style in styles" 
            :key="style.id"
            @click="activeStyle = style.id as any"
            class="px-6 py-3 rounded-full font-semibold transition-all duration-300 whitespace-nowrap"
            :class="{
              'text-white shadow-lg': activeStyle === style.id,
              'text-white/60 bg-white/5 border border-white/10': activeStyle !== style.id
            }"
            :style="activeStyle === style.id ? { background: `linear-gradient(135deg, ${style.color}, ${style.color}80)` } : {}"
          >
            {{ style.name }}
          </button>
        </div>
        
        <div class="grid md:grid-cols-2 gap-6">
          <div 
            v-for="segment in filteredSegments" 
            :key="segment.id"
            class="glass-card p-5 transition-all duration-300"
            :class="{
              'ring-2 ring-offset-2 ring-offset-dark': getSegmentStatus(segment.id) === 'playing',
              'hover:scale-[1.02]': getSegmentStatus(segment.id) !== 'playing'
            }"
            :style="getSegmentStatus(segment.id) === 'playing' ? { borderColor: styles.find(s => s.id === segment.style)?.color } : {}"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div 
                  class="w-14 h-14 rounded-xl flex items-center justify-center"
                  :style="{ background: `${styles.find(s => s.id === segment.style)?.color}20` }"
                >
                  <Music 
                    class="w-7 h-7" 
                    :style="{ color: styles.find(s => s.id === segment.style)?.color }"
                  />
                </div>
                <div>
                  <h3 class="text-white font-semibold text-lg">{{ segment.id }}</h3>
                  <span 
                    class="text-sm px-2 py-0.5 rounded-full"
                    :style="{ background: `${styles.find(s => s.id === segment.style)?.color}20`, color: styles.find(s => s.id === segment.style)?.color }"
                  >
                    {{ segment.style.toUpperCase() }}
                  </span>
                </div>
              </div>
              
              <button 
                @click="playSegment(segment.id)"
                :disabled="isLoading === segment.id"
                class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                :class="{
                  'bg-primary': getSegmentStatus(segment.id) === 'playing',
                  'bg-white/10 hover:bg-white/20': getSegmentStatus(segment.id) !== 'playing',
                  'opacity-50': isLoading === segment.id
                }"
              >
                <Loader2 
                  v-if="isLoading === segment.id"
                  class="w-5 h-5 text-white animate-spin"
                />
                <Pause 
                  v-else-if="getSegmentStatus(segment.id) === 'playing'"
                  class="w-5 h-5 text-white"
                />
                <Play 
                  v-else 
                  class="w-5 h-5 text-white" 
                />
              </button>
            </div>
            
            <div class="grid grid-cols-4 gap-3 mb-4">
              <div class="bg-white/5 rounded-lg p-3 text-center">
                <div class="text-white/50 text-xs flex items-center justify-center gap-1 mb-1">
                  <Zap class="w-3 h-3" />
                  Energy
                </div>
                <div class="text-white font-semibold">{{ segment.energy }}%</div>
              </div>
              
              <div class="bg-white/5 rounded-lg p-3 text-center">
                <div class="text-white/50 text-xs flex items-center justify-center gap-1 mb-1">
                  <Music class="w-3 h-3" />
                  BPM
                </div>
                <div class="text-white font-semibold">{{ segment.bpm }}</div>
              </div>
              
              <div class="bg-white/5 rounded-lg p-3 text-center">
                <div class="text-white/50 text-xs mb-1">Key</div>
                <div class="text-white font-semibold text-sm">{{ segment.key }}</div>
              </div>
              
              <div class="bg-white/5 rounded-lg p-3 text-center">
                <div class="text-white/50 text-xs flex items-center justify-center gap-1 mb-1">
                  <Clock class="w-3 h-3" />
                  Duration
                </div>
                <div class="text-white font-semibold">{{ formatDuration(segment.duration) }}</div>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Download 
                  v-if="getSegmentStatus(segment.id) === 'cached'" 
                  class="w-4 h-4 text-green-400" 
                />
                <Loader2 
                  v-else-if="getSegmentStatus(segment.id) === 'loading'" 
                  class="w-4 h-4 text-blue-400 animate-spin" 
                />
                <ChevronRight 
                  v-else 
                  class="w-4 h-4 text-white/30" 
                />
                
                <span 
                  :class="{
                    'text-green-400': getSegmentStatus(segment.id) === 'cached',
                    'text-blue-400': getSegmentStatus(segment.id) === 'loading',
                    'text-white/30': getSegmentStatus(segment.id) === 'available',
                    'text-primary': getSegmentStatus(segment.id) === 'playing'
                  }"
                >
                  {{ 
                    getSegmentStatus(segment.id) === 'cached' ? 'Cached' :
                    getSegmentStatus(segment.id) === 'loading' ? 'Loading...' :
                    getSegmentStatus(segment.id) === 'playing' ? 'Playing' : 'Available'
                  }}
                </span>
              </div>
              
              <div 
                v-if="getSegmentStatus(segment.id) === 'playing'"
                class="flex items-center gap-1"
              >
                <div 
                  v-for="i in 3" 
                  :key="i"
                  class="w-1 bg-primary rounded-full animate-pulse"
                  :style="{ height: `${10 + i * 5}px`, animationDelay: `${i * 0.1}s` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-8 glass-card p-6">
          <h3 class="text-white font-semibold mb-4">Engine Status</h3>
          
          <div class="grid grid-cols-4 gap-4">
            <div class="bg-white/5 rounded-lg p-4">
              <div class="text-2xl font-bold text-white mb-1">{{ musicLibrary.length }}</div>
              <div class="text-white/50 text-sm">Total Segments</div>
            </div>
            
            <div class="bg-white/5 rounded-lg p-4">
              <div class="text-2xl font-bold text-green-400 mb-1">3</div>
              <div class="text-white/50 text-sm">Cached</div>
            </div>
            
            <div class="bg-white/5 rounded-lg p-4">
              <div class="text-2xl font-bold text-blue-400 mb-1">2</div>
              <div class="text-white/50 text-sm">Loading</div>
            </div>
            
            <div class="bg-white/5 rounded-lg p-4">
              <div class="text-2xl font-bold text-primary mb-1">{{ playingSegment ? 1 : 0 }}</div>
              <div class="text-white/50 text-sm">Playing</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>