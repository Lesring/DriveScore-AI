<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { journeyTimeline } from '@/mock/data'

const props = defineProps<{
  isDriving: boolean
  drivingTime: number
}>()

const currentSegment = ref(0)
const timelineProgress = ref(0)
let progressInterval: number | null = null

const totalDuration = computed(() => journeyTimeline.reduce((sum, item) => sum + item.duration, 0))

onMounted(() => {
  if (props.isDriving) {
    progressInterval = window.setInterval(() => {
      const elapsed = props.drivingTime * 1000
      timelineProgress.value = Math.min(100, (elapsed / totalDuration.value) * 100)
      
      let accumulated = 0
      for (let i = 0; i < journeyTimeline.length; i++) {
        accumulated += journeyTimeline[i].duration
        if (elapsed < accumulated) {
          currentSegment.value = i
          break
        }
      }
    }, 100)
  }
})

onUnmounted(() => {
  if (progressInterval) clearInterval(progressInterval)
})

watch(() => props.isDriving, (isDriving) => {
  if (isDriving) {
    timelineProgress.value = 0
    currentSegment.value = 0
  }
})

const getSegmentStatus = (index: number) => {
  if (index < currentSegment.value) return 'completed'
  if (index === currentSegment.value) return 'current'
  return 'pending'
}
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 z-30">
    <div class="glass-card mx-4 mb-4 p-4 backdrop-blur-xl border-glass-border">
      <div class="flex items-center justify-between mb-3">
        <span class="text-secondary-theme text-sm">Journey Timeline</span>
        <span class="text-muted-theme text-sm">
          {{ Math.round(timelineProgress) }}% Complete
        </span>
      </div>
      
      <div class="relative">
        <div class="absolute top-1/2 left-0 right-0 h-1 bg-glass-border -translate-y-1/2 rounded-full"></div>
        
        <div 
          class="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent -translate-y-1/2 rounded-full transition-all duration-300"
          :style="{ width: `${timelineProgress}%` }"
        ></div>
        
        <div class="relative flex justify-between">
          <div 
            v-for="(segment, index) in journeyTimeline" 
            :key="segment.id"
            class="flex flex-col items-center"
          >
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 cursor-pointer relative group"
              :class="{
                'ring-2 ring-offset-2 ring-offset-dark ring-primary shadow-lg shadow-primary/50 scale-110': getSegmentStatus(index) === 'current',
                'bg-gradient-to-br from-primary to-secondary shadow-glow': getSegmentStatus(index) === 'completed',
                'bg-glass-border': getSegmentStatus(index) === 'pending'
              }"
              :style="getSegmentStatus(index) === 'current' ? { background: `linear-gradient(135deg, ${segment.color}, ${segment.color}80)` } : {}"
            >
              <span 
                :class="{
                  'text-white': getSegmentStatus(index) !== 'pending',
                  'text-primary-theme': getSegmentStatus(index) === 'pending'
                }"
              >
                {{ segment.name.charAt(0) }}
              </span>
              
              <div 
                v-if="getSegmentStatus(index) === 'current'"
                class="absolute inset-0 rounded-full animate-ping opacity-30"
                :style="{ background: segment.color }"
              ></div>
            </div>
            
            <div 
              class="mt-2 text-xs font-medium transition-colors duration-300"
              :class="{
                'text-primary-theme': getSegmentStatus(index) === 'current',
                'text-primary': getSegmentStatus(index) === 'completed',
                'text-muted-theme': getSegmentStatus(index) === 'pending'
              }"
            >
              {{ segment.name }}
            </div>
            
            <div 
              class="text-xs transition-colors duration-300"
              :class="{
                'text-secondary-theme': getSegmentStatus(index) === 'current',
                'text-muted-theme': getSegmentStatus(index) !== 'current'
              }"
            >
              {{ Math.round(segment.duration / 1000) }}s
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
