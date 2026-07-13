<script setup lang="ts">
import { watch } from 'vue'
import { Play, Pause, Square, RotateCcw, Presentation, Clock, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { usePresentationMode } from '@/composables/usePresentationMode'

const {
  isPresenting,
  isPaused,
  currentStepIndex,
  remainingTime,
  progress,
  presentationSteps,
  currentStep,
  togglePause,
  stopPresentation,
  restartPresentation,
  goToStep,
  formatTime
} = usePresentationMode()

const stepNames: Record<string, string> = {
  '/': 'Home',
  '/journey-brain': 'Journey Brain',
  '/planner': 'Journey Planner',
  '/simulation': 'Driving',
  '/architecture': 'Architecture',
  '/summary': 'Summary',
  '/final-vision': 'Final Vision',
  '/roadmap': 'Roadmap'
}

const applyHighlights = () => {
  if (!isPresenting.value) {
    document.querySelectorAll('[data-highlight]').forEach(el => {
      el.classList.remove('highlight-active', 'highlight-inactive')
    })
    return
  }

  const activeHighlights = currentStep.value?.highlight || []
  
  document.querySelectorAll('[data-highlight]').forEach(el => {
    const highlightValue = el.getAttribute('data-highlight')
    if (highlightValue && activeHighlights.includes(highlightValue)) {
      el.classList.add('highlight-active')
      el.classList.remove('highlight-inactive')
    } else {
      el.classList.add('highlight-inactive')
      el.classList.remove('highlight-active')
    }
  })
}

watch([isPresenting, currentStepIndex], () => {
  applyHighlights()
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div 
        v-if="isPresenting"
        class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div class="glass-card p-4 px-6 backdrop-blur-xl border-glass-border shadow-2xl max-w-4xl">
          <div class="flex flex-col gap-4">
            <div 
              v-if="currentStep?.caption" 
              class="text-center text-secondary-theme text-sm italic"
            >
              {{ currentStep.caption }}
            </div>
            
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-2">
                <Presentation class="w-5 h-5 text-purple-400" />
                <span class="text-primary-theme font-semibold">Presentation Mode</span>
              </div>
              
              <div class="w-px h-8 bg-glass-border"></div>
              
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <span class="text-muted-theme text-sm">{{ currentStepIndex + 1 }}/{{ presentationSteps.length }}</span>
                  <span class="text-primary-theme font-medium">{{ stepNames[currentStep?.route] || 'Unknown' }}</span>
                </div>
                
                <div class="flex items-center gap-2">
                  <Clock class="w-4 h-4 text-muted-theme" />
                  <span class="text-primary-theme font-mono">{{ formatTime(remainingTime) }}</span>
                </div>
              </div>
              
              <div class="w-px h-8 bg-glass-border"></div>
              
              <div class="w-48">
                <div class="h-1.5 bg-glass-border rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                    :style="{ width: `${progress}%` }"
                  ></div>
                </div>
              </div>
              
              <div class="w-px h-8 bg-glass-border"></div>
              
              <div class="flex items-center gap-2">
                <button
                  @click="goToStep(Math.max(0, currentStepIndex - 1))"
                  class="w-8 h-8 rounded-lg bg-glass-bg hover:bg-glass-border flex items-center justify-center transition-colors"
                >
                  <ChevronLeft class="w-4 h-4 text-primary-theme" />
                </button>
                
                <button
                  @click="togglePause"
                  class="w-10 h-10 rounded-lg bg-primary hover:bg-primary/80 flex items-center justify-center transition-colors"
                >
                  <Pause v-if="!isPaused" class="w-5 h-5 text-white" />
                  <Play v-else class="w-5 h-5 text-white" />
                </button>
                
                <button
                  @click="goToStep(Math.min(presentationSteps.length - 1, currentStepIndex + 1))"
                  class="w-8 h-8 rounded-lg bg-glass-bg hover:bg-glass-border flex items-center justify-center transition-colors"
                >
                  <ChevronRight class="w-4 h-4 text-primary-theme" />
                </button>
              </div>
              
              <div class="w-px h-8 bg-glass-border"></div>
              
              <div class="flex items-center gap-2">
                <button
                  @click="restartPresentation"
                  class="w-8 h-8 rounded-lg bg-glass-bg hover:bg-glass-border flex items-center justify-center transition-colors"
                  title="Restart"
                >
                  <RotateCcw class="w-4 h-4 text-primary-theme" />
                </button>
                
                <button
                  @click="stopPresentation"
                  class="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                  title="Stop"
                >
                  <Square class="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>