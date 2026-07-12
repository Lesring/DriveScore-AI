import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

export interface PresentationStep {
  route: string
  duration: number
  highlight?: string[]
}

export const presentationSteps: PresentationStep[] = [
  { route: '/', duration: 15000, highlight: ['hero'] },
  { route: '/journey-brain', duration: 20000, highlight: ['blueprint'] },
  { route: '/planner', duration: 20000, highlight: ['music'] },
  { route: '/simulation', duration: 25000, highlight: ['driving'] },
  { route: '/architecture', duration: 15000, highlight: ['system'] },
  { route: '/summary', duration: 10000, highlight: ['results'] },
  { route: '/final-vision', duration: 15000, highlight: ['vision'] },
  { route: '/roadmap', duration: 20000, highlight: ['roadmap'] }
]

export function usePresentationMode() {
  const router = useRouter()
  const isPresenting = ref(false)
  const isPaused = ref(false)
  const currentStepIndex = ref(0)
  const remainingTime = ref(0)
  const progress = ref(0)
  
  let stepTimer: number | null = null
  let countdownTimer: number | null = null

  const currentStep = () => presentationSteps[currentStepIndex.value]
  
  const startPresentation = async () => {
    isPresenting.value = true
    isPaused.value = false
    currentStepIndex.value = 0
    
    await router.push(presentationSteps[0].route)
    startStepTimer()
  }

  const startStepTimer = () => {
    if (!isPresenting.value || isPaused.value) return
    
    const step = presentationSteps[currentStepIndex.value]
    remainingTime.value = step.duration
    progress.value = 0
    
    const startTime = Date.now()
    
    stepTimer = window.setTimeout(() => {
      advanceStep()
    }, step.duration)
    
    countdownTimer = window.setInterval(() => {
      if (!isPaused.value) {
        const elapsed = Date.now() - startTime
        remainingTime.value = Math.max(0, step.duration - elapsed)
        progress.value = (elapsed / step.duration) * 100
      }
    }, 100)
  }

  const advanceStep = () => {
    if (!isPresenting.value) return
    
    currentStepIndex.value++
    
    if (currentStepIndex.value >= presentationSteps.length) {
      stopPresentation()
      return
    }
    
    router.push(presentationSteps[currentStepIndex.value].route)
    startStepTimer()
  }

  const togglePause = () => {
    if (!isPresenting.value) return
    
    isPaused.value = !isPaused.value
    
    if (isPaused.value) {
      if (stepTimer) {
        clearTimeout(stepTimer)
        stepTimer = null
      }
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    } else {
      startStepTimer()
    }
  }

  const stopPresentation = () => {
    isPresenting.value = false
    isPaused.value = false
    
    if (stepTimer) {
      clearTimeout(stepTimer)
      stepTimer = null
    }
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    
    router.push('/')
  }

  const restartPresentation = () => {
    stopPresentation()
    setTimeout(() => {
      startPresentation()
    }, 500)
  }

  const goToStep = async (index: number) => {
    if (index < 0 || index >= presentationSteps.length) return
    
    currentStepIndex.value = index
    await router.push(presentationSteps[index].route)
    
    if (isPresenting.value && !isPaused.value) {
      startStepTimer()
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const totalDuration = presentationSteps.reduce((acc, step) => acc + step.duration, 0)
  
  const overallProgress = () => {
    const elapsedSteps = presentationSteps.slice(0, currentStepIndex.value)
    const elapsedTime = elapsedSteps.reduce((acc, step) => acc + step.duration, 0)
    const currentStepTime = currentStep().duration - remainingTime.value
    return ((elapsedTime + currentStepTime) / totalDuration) * 100
  }

  onUnmounted(() => {
    if (stepTimer) clearTimeout(stepTimer)
    if (countdownTimer) clearInterval(countdownTimer)
  })

  return {
    isPresenting,
    isPaused,
    currentStepIndex,
    currentStep,
    remainingTime,
    progress,
    overallProgress,
    totalDuration,
    presentationSteps,
    startPresentation,
    togglePause,
    stopPresentation,
    restartPresentation,
    goToStep,
    formatTime
  }
}
