import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export interface PresentationStep {
  route: string
  duration: number
  highlight?: string[]
  caption: string
}

export const presentationSteps: PresentationStep[] = [
  { 
    route: '/', 
    duration: 15000, 
    highlight: ['hero'],
    caption: 'Welcome to DriveScore AI - The future of intelligent driving experiences'
  },
  { 
    route: '/journey-brain', 
    duration: 20000, 
    highlight: ['blueprint'],
    caption: 'Journey Brain analyzes your route and creates an emotional blueprint'
  },
  { 
    route: '/planner', 
    duration: 20000, 
    highlight: ['music'],
    caption: 'AI Music Director generates a personalized soundtrack for your journey'
  },
  { 
    route: '/simulation', 
    duration: 25000, 
    highlight: ['driving'],
    caption: 'Experience real-time music adaptation based on driving behavior'
  },
  { 
    route: '/architecture', 
    duration: 15000, 
    highlight: ['system'],
    caption: 'Built with cutting-edge AI and real-time audio processing'
  },
  { 
    route: '/summary', 
    duration: 10000, 
    highlight: ['results'],
    caption: 'Your journey stats and personalized music insights'
  },
  { 
    route: '/final-vision', 
    duration: 15000, 
    highlight: ['vision'],
    caption: 'Envisioning the future of connected driving experiences'
  },
  { 
    route: '/roadmap', 
    duration: 20000, 
    highlight: ['roadmap'],
    caption: 'Roadmap to bringing AI-powered music to every journey'
  }
]

const isPresenting = ref(false)
const isPaused = ref(false)
const currentStepIndex = ref(0)
const remainingTime = ref(0)
const progress = ref(0)
const isAutoDriving = ref(false)
const isGeneratingMusic = ref(false)

let stepTimer: number | null = null
let countdownTimer: number | null = null
let startTime = 0

const emitStepChange = (step: PresentationStep, index: number) => {
  const event = new CustomEvent('presentation-step-change', {
    detail: { step, index, isPresenting: isPresenting.value }
  })
  window.dispatchEvent(event)
}

const emitPresentationStart = () => {
  const event = new CustomEvent('presentation-start', {
    detail: { isPresenting: isPresenting.value }
  })
  window.dispatchEvent(event)
}

const emitPresentationStop = () => {
  const event = new CustomEvent('presentation-stop', {
    detail: { isPresenting: isPresenting.value }
  })
  window.dispatchEvent(event)
}

const currentStep = computed(() => presentationSteps[currentStepIndex.value])

const totalDuration = presentationSteps.reduce((acc, step) => acc + step.duration, 0)

const overallProgress = computed(() => {
  if (!isPresenting.value) return 0
  const elapsedSteps = presentationSteps.slice(0, currentStepIndex.value)
  const elapsedTime = elapsedSteps.reduce((acc, step) => acc + step.duration, 0)
  const currentStepTime = currentStep.value.duration - remainingTime.value
  return ((elapsedTime + currentStepTime) / totalDuration) * 100
})

const formatTime = (ms: number) => {
  const seconds = Math.ceil(ms / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const setAutoDriving = (value: boolean) => {
  isAutoDriving.value = value
}

export function usePresentationMode() {
  const router = useRouter()

  const startStepTimer = () => {
    if (!isPresenting.value || isPaused.value) return
    
    const step = presentationSteps[currentStepIndex.value]
    remainingTime.value = step.duration
    progress.value = 0
    startTime = Date.now()
    
    if (stepTimer) {
      clearTimeout(stepTimer)
    }
    
    stepTimer = window.setTimeout(() => {
      advanceStep()
    }, remainingTime.value)
    
    if (countdownTimer) {
      clearInterval(countdownTimer)
    }
    
    countdownTimer = window.setInterval(() => {
      if (!isPaused.value && isPresenting.value) {
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
    
    const nextStep = presentationSteps[currentStepIndex.value]
    router.push(nextStep.route)
    emitStepChange(nextStep, currentStepIndex.value)
    startStepTimer()
  }

  const startPresentation = async () => {
    isPresenting.value = true
    isPaused.value = false
    currentStepIndex.value = 0
    isAutoDriving.value = false
    isGeneratingMusic.value = false
    
    await router.push(presentationSteps[0].route)
    emitPresentationStart()
    emitStepChange(presentationSteps[0], 0)
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
      startTime = Date.now() - (currentStep.value.duration - remainingTime.value)
      stepTimer = window.setTimeout(() => {
        advanceStep()
      }, remainingTime.value)
      
      countdownTimer = window.setInterval(() => {
        if (!isPaused.value && isPresenting.value) {
          const elapsed = Date.now() - startTime
          remainingTime.value = Math.max(0, currentStep.value.duration - elapsed)
          progress.value = (elapsed / currentStep.value.duration) * 100
        }
      }, 100)
    }
  }

  const stopPresentation = () => {
    isPresenting.value = false
    isPaused.value = false
    isAutoDriving.value = false
    isGeneratingMusic.value = false
    
    if (stepTimer) {
      clearTimeout(stepTimer)
      stepTimer = null
    }
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    
    emitPresentationStop()
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
    isAutoDriving,
    isGeneratingMusic,
    startPresentation,
    togglePause,
    stopPresentation,
    restartPresentation,
    goToStep,
    formatTime,
    setAutoDriving
  }
}