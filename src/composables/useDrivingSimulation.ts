import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { DrivingState, DrivingData } from '@/types'
import { stateTransitions, stateConfigs } from '@/mock/data'
import { predict, type Prediction, type MusicSegment } from '@/api'
import { audioManager, type AudioSource } from '@/audio/AudioManager'

export function useDrivingSimulation() {
  const router = useRouter()
  
  const isDriving = ref(false)
  const isPaused = ref(false)
  const drivingData = ref<DrivingData>({
    speed: 0,
    state: 'parking',
    energy: 0,
    tempo: 0,
    musicStyle: 'Silent',
    currentChapter: 0,
    distance: 0,
    time: 0
  })

  const currentPrediction = ref<Prediction | null>(null)
  const isPredicting = ref(false)
  const currentMusicSegment = ref<MusicSegment | null>(null)

  const particles = ref<{
    id: number
    x: number
    y: number
    opacity: number
    speed: number
  }[]>([])

  let animationFrame: number | null = null
  let lastTime = 0
  let currentStateIndex = 0
  let stateTimer = 0
  let stateDuration = 3000
  let predictInterval: number | null = null
  let lastMusicStyle = ''

  const musicSegments: MusicSegment[] = [
    { id: 'Calm_01', style: 'Calm', energy: 25, tempo: 65, key: 'C Major', duration: 180, progress: 100, emotion: 'Relax', reason: 'Urban driving requires calm music' },
    { id: 'Build_01', style: 'Build', energy: 50, tempo: 95, key: 'A Minor', duration: 150, progress: 100, emotion: 'Building', reason: 'Preparing for highway' },
    { id: 'Cruise_02', style: 'Cruise', energy: 75, tempo: 125, key: 'F Major', duration: 240, progress: 100, emotion: 'Energetic', reason: 'Highway cruising' },
    { id: 'Peak_01', style: 'Peak', energy: 95, tempo: 145, key: 'D Minor', duration: 120, progress: 100, emotion: 'Intense', reason: 'High speed peak' },
    { id: 'Ending_01', style: 'Ending', energy: 35, tempo: 75, key: 'C Major', duration: 180, progress: 100, emotion: 'Peaceful', reason: 'Arriving at destination' }
  ]

  for (let i = 0; i < 30; i++) {
    particles.value.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 2 + 1
    })
  }

  const currentStateConfig = computed(() => stateConfigs[drivingData.value.state])
  const stateProgress = computed(() => (stateTimer / stateDuration) * 100)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDistance = (meters: number) => {
    const km = meters / 1000
    return km.toFixed(1)
  }

  const energyColor = computed(() => {
    const energy = drivingData.value.energy
    if (energy < 30) return 'from-green-400 to-green-600'
    if (energy < 60) return 'from-yellow-400 to-orange-500'
    if (energy < 85) return 'from-orange-500 to-red-500'
    return 'from-red-500 to-purple-600'
  })

  const getMusicSegmentForStyle = (style: string): MusicSegment | undefined => {
    return musicSegments.find(s => s.style.toLowerCase() === style.toLowerCase())
  }

  const getMusicSegmentForState = (state: DrivingState): MusicSegment | undefined => {
    const stateStyleMap: Record<DrivingState, string> = {
      parking: 'Calm',
      city: 'Calm',
      accelerating: 'Build',
      highway: 'Cruise',
      overtaking: 'Peak',
      cruise: 'Cruise',
      decelerating: 'Ending',
      arrived: 'Ending'
    }
    return getMusicSegmentForStyle(stateStyleMap[state])
  }

  const playMusicForState = async (state: DrivingState) => {
    const segment = getMusicSegmentForState(state)
    if (!segment) return

    const audioSource: AudioSource = {
      id: segment.id,
      type: 'synthesized',
      segment
    }

    await audioManager.play(audioSource, { fadeIn: 1500, loop: true })
    currentMusicSegment.value = segment
  }

  const updateAudioParameters = () => {
    audioManager.setEnergy(drivingData.value.energy)
    audioManager.setTempo(drivingData.value.tempo)
  }

  const startDriving = () => {
    isDriving.value = true
    isPaused.value = false
    currentStateIndex = 0
    stateTimer = 0
    drivingData.value = {
      speed: 0,
      state: 'parking',
      energy: 0,
      tempo: 0,
      musicStyle: 'Silent',
      currentChapter: 0,
      distance: 0,
      time: 0
    }
    lastTime = performance.now()
    
    predictInterval = window.setInterval(() => {
      if (!isPaused.value && isDriving.value) {
        runPrediction()
      }
    }, 3000)
    
    audioManager.resume()
    animate()
  }

  const runPrediction = async () => {
    isPredicting.value = true
    try {
      const prediction = await predict({
        currentState: drivingData.value.state,
        time: Math.floor(drivingData.value.time),
        currentSpeed: Math.round(drivingData.value.speed)
      })
      currentPrediction.value = prediction

      if (prediction.nextEnergy !== undefined) {
        audioManager.setEnergy(prediction.nextEnergy)
      }
      if (prediction.nextTempo !== undefined) {
        audioManager.setTempo(prediction.nextTempo)
      }

      const predictedSegment = getMusicSegmentForStyle(prediction.expectedMusic)
      if (predictedSegment && predictedSegment.id !== currentMusicSegment.value?.id) {
        const audioSource: AudioSource = {
          id: predictedSegment.id,
          type: 'synthesized',
          segment: predictedSegment
        }
        await audioManager.crossfadeTo(audioSource, 1500)
        currentMusicSegment.value = predictedSegment
      }
    } catch (error) {
      console.error('Prediction failed:', error)
    } finally {
      isPredicting.value = false
    }
  }

  const togglePause = () => {
    isPaused.value = !isPaused.value
    if (isPaused.value) {
      audioManager.pause()
    } else {
      audioManager.unpause()
      lastTime = performance.now()
      animate()
    }
  }

  const animate = (currentTime?: number) => {
    if (!isDriving.value || isPaused.value) return
    if (!currentTime) currentTime = performance.now()

    const deltaTime = currentTime - lastTime
    lastTime = currentTime

    stateTimer += deltaTime

    if (stateTimer >= stateDuration) {
      stateTimer = 0
      currentStateIndex++
      if (currentStateIndex >= stateTransitions.length) {
        finishJourney()
        return
      }
      drivingData.value.state = stateTransitions[currentStateIndex]
      const config = stateConfigs[drivingData.value.state]
      stateDuration = config.energy > 80 ? 4000 : 5000
    }

    const config = stateConfigs[drivingData.value.state]
    const targetSpeed = getTargetSpeed(drivingData.value.state)

    drivingData.value.speed += (targetSpeed - drivingData.value.speed) * 0.05
    drivingData.value.energy += (config.energy - drivingData.value.energy) * 0.02
    drivingData.value.tempo += (config.tempo - drivingData.value.tempo) * 0.02
    drivingData.value.musicStyle = config.style
    drivingData.value.distance += drivingData.value.speed * (deltaTime / 3600)
    drivingData.value.time += deltaTime / 1000

    updateAudioParameters()

    if (drivingData.value.musicStyle !== lastMusicStyle && drivingData.value.state !== 'parking') {
      lastMusicStyle = drivingData.value.musicStyle
      playMusicForState(drivingData.value.state)
    }

    particles.value.forEach(p => {
      p.x += (p.speed * (drivingData.value.speed / 100)) * (deltaTime / 16)
      if (p.x > 100) p.x = 0
    })

    animationFrame = requestAnimationFrame(animate)
  }

  const getTargetSpeed = (state: DrivingState): number => {
    switch (state) {
      case 'parking': return 0
      case 'city': return 40
      case 'highway': return 120
      case 'overtaking': return 140
      case 'cruise': return 110
      case 'decelerating': return 30
      case 'arrived': return 0
      case 'accelerating': return 80
      default: return 0
    }
  }

  const finishJourney = () => {
    isDriving.value = false
    audioManager.stop()
    router.push('/summary')
  }

  const stop = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
    if (predictInterval) {
      clearInterval(predictInterval)
      predictInterval = null
    }
    audioManager.stop()
  }

  watch(() => drivingData.value.state, (newState) => {
    if (isDriving.value && !isPaused.value && newState !== 'parking') {
      playMusicForState(newState)
    }
  })

  return {
    isDriving,
    isPaused,
    drivingData,
    particles,
    currentStateConfig,
    stateProgress,
    energyColor,
    formatTime,
    formatDistance,
    startDriving,
    togglePause,
    stop,
    currentPrediction,
    isPredicting,
    currentMusicSegment
  }
}
