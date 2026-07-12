<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Brain, Lightbulb, ArrowRight } from 'lucide-vue-next'
import type { DrivingState } from '@/types'
import { aiExplainabilityRules } from '@/mock/data'

const props = defineProps<{
  drivingState: DrivingState
}>()

const currentExplanation = ref<{ reason: string; action: string } | null>(null)
const isChanging = ref(false)

const getRandomExplanation = (state: DrivingState) => {
  const rules = aiExplainabilityRules[state]
  return rules[Math.floor(Math.random() * rules.length)]
}

onMounted(() => {
  currentExplanation.value = getRandomExplanation(props.drivingState)
})

watch(() => props.drivingState, (newState) => {
  isChanging.value = true
  
  setTimeout(() => {
    currentExplanation.value = getRandomExplanation(newState)
    isChanging.value = false
  }, 300)
})
</script>

<template>
  <div class="glass-card p-4">
    <div class="flex items-center gap-2 mb-4">
      <Brain class="w-5 h-5 text-primary" />
      <span class="text-white font-semibold text-sm">AI Explainability</span>
    </div>
    
    <div 
      v-if="currentExplanation"
      class="space-y-4 transition-all duration-300"
      :class="{ 'opacity-0 scale-95': isChanging, 'opacity-100 scale-100': !isChanging }"
    >
      <div class="bg-primary/10 rounded-lg p-3">
        <div class="flex items-center gap-2 mb-2">
          <Lightbulb class="w-4 h-4 text-yellow-400" />
          <span class="text-white/60 text-xs uppercase">Reason</span>
        </div>
        <p class="text-white text-sm">{{ currentExplanation.reason }}</p>
      </div>
      
      <div class="flex justify-center">
        <ArrowRight class="w-4 h-4 text-white/30" />
      </div>
      
      <div class="bg-green-500/10 rounded-lg p-3">
        <div class="flex items-center gap-2 mb-2">
          <Brain class="w-4 h-4 text-green-400" />
          <span class="text-white/60 text-xs uppercase">Action</span>
        </div>
        <p class="text-white text-sm">{{ currentExplanation.action }}</p>
      </div>
    </div>
  </div>
</template>
