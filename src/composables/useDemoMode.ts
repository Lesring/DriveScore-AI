import { ref } from 'vue'

const isAutoDemo = ref(false)
const currentStep = ref(0)
const demoSteps = [
  '/',
  '/journey-brain',
  '/planner',
  '/simulation',
  '/architecture',
  '/music-engine',
  '/summary',
  '/final-vision'
]

export function useDemoMode() {
  const startDemo = async () => {
    isAutoDemo.value = true
    currentStep.value = 0
  }

  const nextStep = () => {
    if (currentStep.value < demoSteps.length - 1) {
      currentStep.value++
      return demoSteps[currentStep.value]
    }
    return null
  }

  const getCurrentRoute = () => {
    return demoSteps[currentStep.value]
  }

  const stopDemo = () => {
    isAutoDemo.value = false
    currentStep.value = 0
  }

  const resetDemo = () => {
    currentStep.value = 0
  }

  return {
    isAutoDemo,
    currentStep,
    demoSteps,
    startDemo,
    nextStep,
    getCurrentRoute,
    stopDemo,
    resetDemo
  }
}
