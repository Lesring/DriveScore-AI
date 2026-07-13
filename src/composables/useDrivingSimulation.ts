import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import type { DrivingState, DrivingData } from '@/types'
import { stateTransitions, stateConfigs } from '@/mock/data'
import { predict, getAudioUrlForStyle, type Prediction, type MusicSegment } from '@/api'
import { audioManager, type AudioSource } from '@/audio/AudioManager'
import { useJourneySession } from '@/composables/useJourneySession'
import { ROAD_EVENT_MAPPING, type RoadAction } from '@/composables/useRoadSimulator'
import { useStableAudio } from '@/composables/useStableAudio'

const fallbackMusicSegments: MusicSegment[] = [
  { id: 'Calm_01', style: 'Calm', energy: 25, tempo: 65, key: 'C Major', duration: 180, progress: 100, emotion: 'Relax', reason: 'Demo data - Urban driving requires calm music', audioUrl: getAudioUrlForStyle('Calm') },
  { id: 'Build_01', style: 'Build', energy: 50, tempo: 95, key: 'A Minor', duration: 150, progress: 100, emotion: 'Building', reason: 'Demo data - Preparing for highway', audioUrl: getAudioUrlForStyle('Build') },
  { id: 'Cruise_02', style: 'Cruise', energy: 75, tempo: 125, key: 'F Major', duration: 240, progress: 100, emotion: 'Energetic', reason: 'Demo data - Highway cruising', audioUrl: getAudioUrlForStyle('Cruise') },
  { id: 'Peak_01', style: 'Peak', energy: 95, tempo: 145, key: 'D Minor', duration: 120, progress: 100, emotion: 'Intense', reason: 'Demo data - High speed peak', audioUrl: getAudioUrlForStyle('Peak') },
  { id: 'Ending_01', style: 'Ending', energy: 35, tempo: 75, key: 'C Major', duration: 180, progress: 100, emotion: 'Peaceful', reason: 'Demo data - Arriving at destination', audioUrl: getAudioUrlForStyle('Ending') }
]

export function useDrivingSimulation() {
  const router = useRouter()
  const { session, addDrivingStat, addPrediction, subscribe } = useJourneySession()
  const { generateForStyle, generateForEvent, getGeneratedForStyle, getGeneratedForEvent, hasApiKey, isGenerating } = useStableAudio()
  
  const isDriving = ref(false)
  const isPaused = ref(false)
  const isOverridden = ref(false)
  const overrideEndTime = ref(0)
  const overrideTarget = ref<{ speed: number; energy: number; tempo: number; state: string } | null>(null)
  
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
  const musicSegments = ref<MusicSegment[]>([])

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
  let musicChangesCount = 0

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
    return musicSegments.value.find(s => s.style.toLowerCase() === style.toLowerCase())
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

    let audioSource: AudioSource

    if (hasApiKey.value) {
      const generatedAudio = getGeneratedForStyle(segment.style)
      if (generatedAudio) {
        audioSource = {
          id: `ai_${generatedAudio.id}`,
          type: 'ai-generated',
          url: generatedAudio.url,
          segment,
          aiGenerated: true
        }
      } else {
        audioSource = {
          id: segment.id,
          type: segment.audioUrl ? 'url' : 'synthesized',
          url: segment.audioUrl,
          segment
        }
      }
    } else {
      audioSource = {
        id: segment.id,
        type: segment.audioUrl ? 'url' : 'synthesized',
        url: segment.audioUrl,
        segment
      }
    }

    await audioManager.play(audioSource, { fadeIn: 1500, loop: true })
    currentMusicSegment.value = segment
    musicChangesCount++
    
    addDrivingStat({
      timestamp: Date.now(),
      speed: Math.round(drivingData.value.speed),
      energy: Math.round(drivingData.value.energy),
      tempo: Math.round(drivingData.value.tempo),
      musicStyle: segment.style,
      segmentId: segment.id
    })
  }

  const updateAudioParameters = () => {
    audioManager.setEnergy(drivingData.value.energy)
    audioManager.setTempo(drivingData.value.tempo)
  }

  const applyOverride = async (target: { speed: number; energy: number; tempo: number; state: string; musicStyle?: string; eventType?: string }) => {
    if (!isDriving.value) return

    isOverridden.value = true
    overrideTarget.value = target
    overrideEndTime.value = Date.now() + 8000

    drivingData.value.state = target.state as DrivingState
    
    if (target.musicStyle) {
      const segment = getMusicSegmentForStyle(target.musicStyle)
      if (segment) {
        let audioSource: AudioSource

        if (hasApiKey.value) {
          let generatedAudio = target.eventType 
            ? getGeneratedForEvent(target.eventType) 
            : getGeneratedForStyle(target.musicStyle)
          
          if (!generatedAudio) {
            generatedAudio = getGeneratedForStyle(target.musicStyle)
          }

          if (generatedAudio) {
            audioSource = {
              id: `ai_${generatedAudio.id}`,
              type: 'ai-generated',
              url: generatedAudio.url,
              segment,
              aiGenerated: true
            }
          } else {
            audioSource = {
              id: segment.id,
              type: segment.audioUrl ? 'url' : 'synthesized',
              url: segment.audioUrl,
              segment
            }
          }
        } else {
          audioSource = {
            id: segment.id,
            type: segment.audioUrl ? 'url' : 'synthesized',
            url: segment.audioUrl,
            segment
          }
        }

        await audioManager.crossfadeTo(audioSource, 1000)
        currentMusicSegment.value = segment
      }
    }

    currentPrediction.value = session.predictions[session.predictions.length - 1] || null
  }

  const checkOverrideExpired = () => {
    if (isOverridden.value && Date.now() >= overrideEndTime.value) {
      isOverridden.value = false
      overrideTarget.value = null
    }
  }

  const handleRerouteResult = () => {
    if (!session.lastRerouteResult || !isDriving.value) return
    
    const result = session.lastRerouteResult
    const eventType = result.eventType as RoadAction
    const mapping = ROAD_EVENT_MAPPING[eventType] || ROAD_EVENT_MAPPING.clear
    
    applyOverride({
      speed: mapping.speed,
      energy: mapping.energy,
      tempo: mapping.tempo,
      state: mapping.state,
      musicStyle: mapping.musicStyle,
      eventType
    })
  }

  const unsubscribe = subscribe(handleRerouteResult)

  onUnmounted(() => {
    unsubscribe()
    stop()
  })

  const startDriving = () => {
    musicSegments.value = session.musicSegments.length > 0 
      ? session.musicSegments 
      : fallbackMusicSegments
    
    if (session.musicSegments.length === 0) {
      console.warn('[DrivingSimulation] Using fallback music segments - no session data available')
    }
    
    isDriving.value = true
    isPaused.value = false
    isOverridden.value = false
    currentStateIndex = 0
    stateTimer = 0
    musicChangesCount = 0
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
      if (!isPaused.value && isDriving.value && !isOverridden.value) {
        runPrediction()
      }
    }, 3000)
    
    audioManager.resume()
    animate()
  }

  const runPrediction = async () => {
    isPredicting.value = true
    try {
      const predictionResult = await predict({
        currentState: drivingData.value.state,
        time: Math.floor(drivingData.value.time),
        currentSpeed: Math.round(drivingData.value.speed)
      })
      
      if (!predictionResult.data) return
      
      const prediction = predictionResult.data
      currentPrediction.value = prediction
      addPrediction(prediction)

      if (prediction.nextEnergy !== undefined) {
        audioManager.setEnergy(prediction.nextEnergy)
      }
      if (prediction.nextTempo !== undefined) {
        audioManager.setTempo(prediction.nextTempo)
      }

      const predictedSegment = getMusicSegmentForStyle(prediction.expectedMusic)
      if (predictedSegment && predictedSegment.id !== currentMusicSegment.value?.id) {
        let audioSource: AudioSource

        if (hasApiKey.value) {
          const generatedAudio = getGeneratedForStyle(predictedSegment.style)
          if (generatedAudio) {
            audioSource = {
              id: `ai_${generatedAudio.id}`,
              type: 'ai-generated',
              url: generatedAudio.url,
              segment: predictedSegment,
              aiGenerated: true
            }
          } else {
            audioSource = {
              id: predictedSegment.id,
              type: predictedSegment.audioUrl ? 'url' : 'synthesized',
              url: predictedSegment.audioUrl,
              segment: predictedSegment
            }
          }
        } else {
          audioSource = {
            id: predictedSegment.id,
            type: predictedSegment.audioUrl ? 'url' : 'synthesized',
            url: predictedSegment.audioUrl,
            segment: predictedSegment
          }
        }

        await audioManager.crossfadeTo(audioSource, 1500)
        currentMusicSegment.value = predictedSegment
        musicChangesCount++
        
        addDrivingStat({
          timestamp: Date.now(),
          speed: Math.round(drivingData.value.speed),
          energy: Math.round(drivingData.value.energy),
          tempo: Math.round(drivingData.value.tempo),
          musicStyle: predictedSegment.style,
          segmentId: predictedSegment.id
        })
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

    checkOverrideExpired()

    if (isOverridden.value && overrideTarget.value) {
      drivingData.value.speed += (overrideTarget.value.speed - drivingData.value.speed) * 0.08
      drivingData.value.energy += (overrideTarget.value.energy - drivingData.value.energy) * 0.05
      drivingData.value.tempo += (overrideTarget.value.tempo - drivingData.value.tempo) * 0.05
      
      updateAudioParameters()
    } else {
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

      updateAudioParameters()

      if (drivingData.value.musicStyle !== lastMusicStyle && drivingData.value.state !== 'parking') {
        lastMusicStyle = drivingData.value.musicStyle
        playMusicForState(drivingData.value.state)
      }
    }

    drivingData.value.distance += drivingData.value.speed * (deltaTime / 3600)
    drivingData.value.time += deltaTime / 1000

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
    if (isDriving.value && !isPaused.value && newState !== 'parking' && !isOverridden.value) {
      playMusicForState(newState)
    }
  })

  return {
    isDriving,
    isPaused,
    isOverridden,
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
    currentMusicSegment,
    musicSegments,
    musicChangesCount,
    generateForStyle,
    generateForEvent,
    hasApiKey,
    isGenerating
  }
}