<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Bot, ChevronRight } from 'lucide-vue-next'
import type { DrivingState } from '@/types'
import { aiExplanations } from '@/mock/data'

const props = defineProps<{
  drivingState: DrivingState
  isDriving: boolean
}>()

const messages = ref<{ id: number; text: string; timestamp: Date }[]>([])
let messageId = 0
let messageInterval: number | null = null

const addMessage = (text: string) => {
  messages.value.push({
    id: messageId++,
    text,
    timestamp: new Date()
  })
  
  if (messages.value.length > 3) {
    messages.value.shift()
  }
}

onMounted(() => {
  if (props.isDriving) {
    const explanations = aiExplanations[props.drivingState]
    if (explanations && explanations.length > 0) {
      addMessage(explanations[0])
    }
    
    messageInterval = window.setInterval(() => {
      const explanations = aiExplanations[props.drivingState]
      if (explanations && explanations.length > 0) {
        const randomIndex = Math.floor(Math.random() * explanations.length)
        const newMessage = explanations[randomIndex]
        
        if (messages.value.length === 0 || messages.value[messages.value.length - 1].text !== newMessage) {
          addMessage(newMessage)
        }
      }
    }, 5000)
  }
})

onUnmounted(() => {
  if (messageInterval) clearInterval(messageInterval)
})

watch(() => props.drivingState, (newState) => {
  const explanations = aiExplanations[newState]
  if (explanations && explanations.length > 0) {
    addMessage(explanations[0])
  }
})

watch(() => props.isDriving, (isDriving) => {
  if (isDriving) {
    messages.value = []
    const explanations = aiExplanations[props.drivingState]
    if (explanations && explanations.length > 0) {
      addMessage(explanations[0])
    }
  }
})

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <div class="glass-card mx-4 mb-6 p-4 backdrop-blur-xl border-white/10">
    <div class="flex items-center gap-2 mb-3">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <Bot class="w-5 h-5 text-white" />
      </div>
      <span class="text-primary-theme font-semibold">AI Assistant</span>
      <div class="flex-1 h-px bg-glass-border"></div>
      <div class="flex items-center gap-1">
        <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        <span class="text-muted-theme text-sm">Active</span>
      </div>
    </div>
    
    <div class="space-y-3">
      <div 
        v-for="message in messages" 
        :key="message.id"
        class="flex items-start gap-3 animate-fade-in-up"
      >
        <ChevronRight class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-primary-theme text-sm">{{ message.text }}</p>
          <span class="text-muted-theme text-xs">{{ formatTime(message.timestamp) }}</span>
        </div>
      </div>
      
      <div v-if="messages.length === 0" class="flex items-center gap-3">
        <ChevronRight class="w-4 h-4 text-muted-theme flex-shrink-0 mt-0.5" />
        <span class="text-muted-theme text-sm">Waiting for driving data...</span>
      </div>
    </div>
  </div>
</template>
