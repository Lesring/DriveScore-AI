import { reactive, ref } from 'vue'
import type { RouteAnalysis, MusicGeneration, Prediction, MusicSegment } from '@/api'
import { getAudioUrlForStyle } from '@/api'

export type AIStatus = 'idle' | 'loading' | 'ready' | 'fallback' | 'error'

export interface RouteInput {
  start: string
  end: string
  weather?: string
  estimatedTime?: number
  driverStyle?: string
}

export interface DrivingStat {
  timestamp: number
  speed: number
  energy: number
  tempo: number
  musicStyle: string
  segmentId?: string
}

export interface RerouteEvent {
  eventType: string
  analysis: RouteAnalysis
  music: MusicGeneration
  prediction: Prediction
  explanation: string
  targetSpeed?: number
  targetEnergy?: number
  targetTempo?: number
  roadType?: string
}

export interface JourneySession {
  routeInput: RouteInput | null
  routeAnalysis: RouteAnalysis | null
  musicSegments: MusicSegment[]
  predictions: Prediction[]
  drivingStats: DrivingStat[]
  lastRerouteEvent: string | null
  lastRerouteResult: RerouteEvent | null
  aiStatus: AIStatus
  aiError: string | null
  dataSource: 'ai' | 'fallback' | 'none'
  analysisSource: 'ai' | 'fallback' | 'none'
  musicSource: 'ai' | 'fallback' | 'none'
  isRerouting: boolean
  reroutingSteps: string[]
  reroutingProgress: number
}

const session = reactive<JourneySession>({
  routeInput: null,
  routeAnalysis: null,
  musicSegments: [],
  predictions: [],
  drivingStats: [],
  lastRerouteEvent: null,
  lastRerouteResult: null,
  aiStatus: 'idle',
  aiError: null,
  dataSource: 'none',
  analysisSource: 'none',
  musicSource: 'none',
  isRerouting: false,
  reroutingSteps: [],
  reroutingProgress: 0
})

const sessionListeners = ref<Set<() => void>>(new Set())

const notifyListeners = () => {
  sessionListeners.value.forEach(listener => listener())
}

export function useJourneySession() {
  const setRouteInput = (input: RouteInput) => {
    session.routeInput = input
    notifyListeners()
  }

  const setRouteAnalysis = (analysis: RouteAnalysis, source: 'ai' | 'fallback' = 'ai') => {
    session.routeAnalysis = analysis
    session.analysisSource = source
    session.dataSource = source === 'ai' ? 'ai' : 'fallback'
    session.aiStatus = source === 'ai' ? 'ready' : 'fallback'
    notifyListeners()
  }

  const setMusicSegments = (generation: MusicGeneration, source: 'ai' | 'fallback' = 'ai') => {
    session.musicSegments = generation.segments.map(segment => ({
      ...segment,
      audioUrl: segment.audioUrl || getAudioUrlForStyle(segment.style)
    }))
    session.musicSource = source
    session.dataSource = source === 'ai' ? 'ai' : 'fallback'
    session.aiStatus = source === 'ai' ? 'ready' : 'fallback'
    notifyListeners()
  }

  const addPrediction = (prediction: Prediction) => {
    session.predictions.push(prediction)
    notifyListeners()
  }

  const addDrivingStat = (stat: DrivingStat) => {
    session.drivingStats.push(stat)
    if (session.drivingStats.length > 100) {
      session.drivingStats.shift()
    }
    notifyListeners()
  }

  const setLastRerouteEvent = (event: string) => {
    session.lastRerouteEvent = event
    session.aiStatus = 'loading'
    notifyListeners()
  }

  const completeReroute = (analysis: RouteAnalysis, music: MusicGeneration) => {
    session.routeAnalysis = analysis
    session.musicSegments = music.segments
    session.aiStatus = 'ready'
    notifyListeners()
  }

  const startRerouting = (steps: string[] = [], progress: number = 0) => {
    session.isRerouting = true
    session.reroutingSteps = steps
    session.reroutingProgress = progress
    session.aiStatus = 'loading'
    notifyListeners()
  }

  const updateReroutingStep = (step: string, progress: number) => {
    session.reroutingSteps.push(step)
    session.reroutingProgress = progress
    notifyListeners()
  }

  const setRerouteResult = (event: RerouteEvent) => {
    session.lastRerouteResult = event
    session.routeAnalysis = event.analysis
    session.musicSegments = event.music.segments
    session.predictions.push(event.prediction)
    session.isRerouting = false
    session.aiStatus = 'ready'
    notifyListeners()
  }

  const finishRerouting = () => {
    session.isRerouting = false
    session.reroutingProgress = 100
    session.aiStatus = 'ready'
    notifyListeners()
  }

  const setAIStatus = (status: AIStatus) => {
    session.aiStatus = status
    notifyListeners()
  }

  const setAIError = (error: string | null) => {
    session.aiError = error
    session.aiStatus = error ? 'error' : 'idle'
    notifyListeners()
  }

  const startLoading = () => {
    session.aiStatus = 'loading'
    notifyListeners()
  }

  const clearSession = () => {
    session.routeInput = null
    session.routeAnalysis = null
    session.musicSegments = []
    session.predictions = []
    session.drivingStats = []
    session.lastRerouteEvent = null
    session.aiStatus = 'idle'
    session.aiError = null
    session.dataSource = 'none'
    session.analysisSource = 'none'
    session.musicSource = 'none'
    notifyListeners()
  }

  const subscribe = (callback: () => void) => {
    sessionListeners.value.add(callback)
    return () => sessionListeners.value.delete(callback)
  }

  const hasData = () => {
    return session.routeAnalysis !== null && session.musicSegments.length > 0
  }

  const getSummaryStats = () => {
    if (session.drivingStats.length === 0) {
      return null
    }
    
    const totalTime = session.drivingStats.length > 0 
      ? (session.drivingStats[session.drivingStats.length - 1].timestamp - session.drivingStats[0].timestamp) / 1000 
      : 0
    
    const avgEnergy = session.drivingStats.reduce((sum, stat) => sum + stat.energy, 0) / session.drivingStats.length
    const avgTempo = session.drivingStats.reduce((sum, stat) => sum + stat.tempo, 0) / session.drivingStats.length
    
    const uniqueSegments = new Set(session.drivingStats.map(stat => stat.segmentId).filter(Boolean))
    
    return {
      drivingTime: Math.round(totalTime),
      averageEnergy: Math.round(avgEnergy),
      averageTempo: Math.round(avgTempo),
      musicSegments: uniqueSegments.size,
      predictionCount: session.predictions.length,
      dataSource: session.dataSource,
      analysisSource: session.analysisSource,
      musicSource: session.musicSource
    }
  }

  return {
    session,
    setRouteInput,
    setRouteAnalysis,
    setMusicSegments,
    addPrediction,
    addDrivingStat,
    setLastRerouteEvent,
    completeReroute,
    setAIStatus,
    setAIError,
    startLoading,
    clearSession,
    subscribe,
    hasData,
    getSummaryStats,
    startRerouting,
    updateReroutingStep,
    setRerouteResult,
    finishRerouting
  }
}