<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { DrivingState } from '@/types'
import { eventStreamTemplates } from '@/mock/data'

const props = defineProps<{
  drivingState: DrivingState
  isDriving: boolean
}>()

const events = ref<{ id: number; text: string; type: string; timestamp: string }[]>([])
let eventId = 0
let intervalId: number | null = null
let streamContainer: HTMLElement | null = null

const formatTime = () => {
  const now = new Date()
  return now.toLocaleTimeString('en-US', { hour12: false })
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    system: '#9a8668',
    info: '#b8a687',
    route: '#c9a962',
    speed: '#dcc88a',
    music: '#e8dcc4',
    cache: '#d4c7b0'
  }
  return colors[type] || '#c9a962'
}

const addEvent = (text: string, type: string) => {
  events.value.push({
    id: eventId++,
    text,
    type,
    timestamp: formatTime()
  })
  
  if (events.value.length > 20) {
    events.value.shift()
  }
  
  nextTick(() => {
    if (streamContainer) {
      streamContainer.scrollTop = streamContainer.scrollHeight
    }
  })
}

onMounted(() => {
  streamContainer = document.querySelector('.event-stream-container') as HTMLElement
  
  if (props.isDriving) {
    const templates = eventStreamTemplates[props.drivingState]
    templates.forEach((template, index) => {
      setTimeout(() => {
        addEvent(template.text, template.type)
      }, index * 500)
    })
    
    intervalId = window.setInterval(() => {
      const templates = eventStreamTemplates[props.drivingState]
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
      addEvent(randomTemplate.text, randomTemplate.type)
    }, 4000)
  }
})

watch(() => props.drivingState, (newState) => {
  const templates = eventStreamTemplates[newState]
  templates.forEach((template, index) => {
    setTimeout(() => {
      addEvent(template.text, template.type)
    }, index * 300)
  })
})

watch(() => props.isDriving, (isDriving) => {
  if (!isDriving) {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
})
</script>

<template>
  <div class="glass-card p-4 h-48">
    <div class="flex items-center gap-2 mb-3 pb-2 border-b border-glass-border">
      <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
      <span class="text-primary-theme font-semibold text-sm">AI Event Stream</span>
    </div>
    
    <div 
      ref="streamContainer"
      class="event-stream-container h-32 overflow-y-auto space-y-3 pr-2 scrollbar-thin"
    >
      <div 
        v-for="event in events" 
        :key="event.id"
        class="group"
      >
        <div class="flex items-start gap-2">
          <span class="text-muted-theme text-xs font-mono flex-shrink-0">[{{ event.timestamp }}]</span>
          <div class="flex-1">
            <p 
              class="text-sm transition-colors duration-300"
              :style="{ color: getTypeColor(event.type) }"
            >
              {{ event.text }}
            </p>
          </div>
        </div>
        <div class="h-px bg-white/5 mt-2"></div>
      </div>
      
      <div v-if="events.length === 0" class="text-center text-muted-theme text-sm py-4">
        Waiting for events...
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 2px;
}
</style>
