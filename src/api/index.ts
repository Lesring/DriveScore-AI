import { generateJSON, type AIResponse } from '@/ai/aiService'
import { analyzeRoutePrompt, generateMusicPrompt, predictPrompt } from '@/ai/prompts'

export interface AnalyzeRouteRequest {
  start: string
  end: string
  weather?: string
  estimatedTime?: number
  driverStyle?: string
}

export interface RouteStep {
  id: number
  name: string
  type: string
  duration: number
  speed: number
  energy?: number
  tempo?: number
  emotion?: string
  reason?: string
}

export interface RouteAnalysis {
  destination: string
  estimatedTime: number
  weather: string
  traffic: string
  driverStyle: string
  mood: string
  steps: RouteStep[]
}

export interface GenerateMusicRequest {
  routeAnalysis: RouteAnalysis
}

export interface MusicSegment {
  id: string
  style: string
  energy: number
  tempo: number
  key: string
  duration: number
  progress: number
  emotion?: string
  reason?: string
  audioUrl?: string
}

export interface MusicGeneration {
  segments: MusicSegment[]
  status: 'generating' | 'completed'
}

export interface PredictRequest {
  currentState: string
  time: number
  currentSpeed?: number
  currentRoad?: string
  nextRoad?: string
}

export interface Prediction {
  upcomingRoad: string
  distance: number
  eta: number
  expectedMusic: string
  confidence: number
  reason?: string
  nextEnergy?: number
  nextTempo?: number
}

export interface CacheRequest {
  segmentIds: string[]
}

export interface CacheResult {
  cachedSegments: string[]
  cacheHitRate: number
  loadingSpeed: number
  memoryUsed: number
  status: 'loading' | 'ready' | 'preloading'
}

export interface APIResult<T> {
  data: T | null
  error: string | null
  source: 'ai' | 'fallback'
}

const fallbackAnalyzeRoute = (request: AnalyzeRouteRequest): RouteAnalysis => ({
  destination: request.end,
  estimatedTime: request.estimatedTime || 23,
  weather: request.weather || 'Sunny',
  traffic: 'Light',
  driverStyle: request.driverStyle || 'Balanced',
  mood: 'Energetic',
  steps: [
    { id: 1, name: 'Urban', type: 'city', duration: 300, speed: 40, energy: 30, tempo: 75, emotion: 'Relaxed', reason: 'Starting in urban area' },
    { id: 2, name: 'Build', type: 'elevated', duration: 240, speed: 80, energy: 55, tempo: 100, emotion: 'Building', reason: 'Entering elevated road' },
    { id: 3, name: 'Highway', type: 'highway', duration: 480, speed: 120, energy: 80, tempo: 130, emotion: 'Energetic', reason: 'Highway driving' },
    { id: 4, name: 'Peak', type: 'highway', duration: 180, speed: 140, energy: 95, tempo: 150, emotion: 'Intense', reason: 'High speed section' },
    { id: 5, name: 'Ending', type: 'urban', duration: 120, speed: 30, energy: 35, tempo: 70, emotion: 'Calm', reason: 'Approaching destination' }
  ]
})

const getAudioUrlForStyle = (style: string): string => {
  const styleMap: Record<string, string> = {
    'calm': '/music/Calm.mp3',
    'build': '/music/Build.mp3',
    'cruise': '/music/Cruise.mp3',
    'peak': '/music/Peak.mp3',
    'ending': '/music/Ending.mp3'
  }
  return styleMap[style.toLowerCase()] || '/music/Calm.mp3'
}

const fallbackGenerateMusic = (): MusicGeneration => ({
  status: 'completed',
  segments: [
    { id: 'Calm_01', style: 'Calm', energy: 25, tempo: 65, key: 'C Major', duration: 180, progress: 100, emotion: 'Relax', reason: 'Urban driving requires calm music', audioUrl: getAudioUrlForStyle('Calm') },
    { id: 'Build_01', style: 'Build', energy: 50, tempo: 95, key: 'A Minor', duration: 150, progress: 100, emotion: 'Building', reason: 'Preparing for highway', audioUrl: getAudioUrlForStyle('Build') },
    { id: 'Cruise_02', style: 'Cruise', energy: 75, tempo: 125, key: 'F Major', duration: 240, progress: 100, emotion: 'Energetic', reason: 'Highway cruising', audioUrl: getAudioUrlForStyle('Cruise') },
    { id: 'Peak_01', style: 'Peak', energy: 95, tempo: 145, key: 'D Minor', duration: 120, progress: 100, emotion: 'Intense', reason: 'High speed peak', audioUrl: getAudioUrlForStyle('Peak') },
    { id: 'Ending_01', style: 'Ending', energy: 35, tempo: 75, key: 'C Major', duration: 180, progress: 100, emotion: 'Peaceful', reason: 'Arriving at destination', audioUrl: getAudioUrlForStyle('Ending') }
  ]
})

const fallbackPredict = (request: PredictRequest): Prediction => {
  const predictions = [
    { upcomingRoad: 'Urban', distance: 450, eta: 25, expectedMusic: 'Calm', confidence: 98, reason: 'City driving', nextEnergy: 30, nextTempo: 75 },
    { upcomingRoad: 'Elevated', distance: 600, eta: 20, expectedMusic: 'Build', confidence: 95, reason: 'Approaching elevated road', nextEnergy: 55, nextTempo: 100 },
    { upcomingRoad: 'Highway', distance: 800, eta: 22, expectedMusic: 'Cruise', confidence: 97, reason: 'Entering highway', nextEnergy: 80, nextTempo: 130 },
    { upcomingRoad: 'Highway', distance: 350, eta: 18, expectedMusic: 'Peak', confidence: 94, reason: 'High speed section', nextEnergy: 95, nextTempo: 150 },
    { upcomingRoad: 'Urban', distance: 200, eta: 15, expectedMusic: 'Ending', confidence: 99, reason: 'Approaching destination', nextEnergy: 35, nextTempo: 70 }
  ]
  const index = Math.min(Math.floor(request.time / 10), predictions.length - 1)
  return predictions[index]
}

export const analyzeRoute = async (request: AnalyzeRouteRequest): Promise<APIResult<RouteAnalysis>> => {
  const promptInput = {
    start: request.start,
    end: request.end,
    weather: request.weather || 'Sunny',
    estimatedTime: request.estimatedTime || 23,
    driverStyle: request.driverStyle || 'Balanced'
  }
  
  const prompt = analyzeRoutePrompt(promptInput)
  const response: AIResponse<RouteAnalysis> = await generateJSON<RouteAnalysis>(prompt, 2)
  
  if (response.data) {
    return {
      data: response.data,
      error: response.error,
      source: response.source
    }
  }
  
  return {
    data: fallbackAnalyzeRoute(request),
    error: response.error || 'AI generation failed',
    source: 'fallback'
  }
}

export const generateMusic = async (request: GenerateMusicRequest): Promise<APIResult<MusicGeneration>> => {
  const promptInput = {
    journeyBlueprint: {
      steps: request.routeAnalysis.steps
    }
  }
  
  const prompt = generateMusicPrompt(promptInput)
  const response: AIResponse<MusicGeneration> = await generateJSON<MusicGeneration>(prompt, 2)
  
  if (response.data) {
    return {
      data: response.data,
      error: response.error,
      source: response.source
    }
  }
  
  return {
    data: fallbackGenerateMusic(),
    error: response.error || 'AI generation failed',
    source: 'fallback'
  }
}

export const predict = async (request: PredictRequest): Promise<APIResult<Prediction>> => {
  const roadMap: Record<string, string> = {
    parking: 'Urban',
    city: 'Urban',
    accelerating: 'Elevated',
    highway: 'Highway',
    overtaking: 'Highway',
    cruise: 'Highway',
    decelerating: 'Urban',
    arrived: 'Urban'
  }
  
  const nextRoadMap: Record<string, string> = {
    parking: 'Urban',
    city: 'Elevated',
    accelerating: 'Highway',
    highway: 'Highway',
    overtaking: 'Highway',
    cruise: 'Highway',
    decelerating: 'Urban',
    arrived: 'Destination'
  }
  
  const promptInput = {
    currentSpeed: request.currentSpeed || 60,
    currentRoad: request.currentRoad || roadMap[request.currentState] || 'Urban',
    nextRoad: request.nextRoad || nextRoadMap[request.currentState] || 'Urban',
    estimatedTime: request.time || 20
  }
  
  const prompt = predictPrompt(promptInput)
  const response: AIResponse<Prediction> = await generateJSON<Prediction>(prompt, 2)
  
  if (response.data) {
    return {
      data: response.data,
      error: response.error,
      source: response.source
    }
  }
  
  return {
    data: fallbackPredict(request),
    error: response.error || 'AI generation failed',
    source: 'fallback'
  }
}

export const cache = async (request: CacheRequest): Promise<CacheResult> => {
  await delay(1500)
  return {
    cachedSegments: request.segmentIds,
    cacheHitRate: 98,
    loadingSpeed: 5.6,
    memoryUsed: request.segmentIds.length * 6.4,
    status: 'ready'
  }
}

export const preload = async (segmentIds: string[]): Promise<CacheResult> => {
  await delay(800)
  return {
    cachedSegments: segmentIds,
    cacheHitRate: 96,
    loadingSpeed: 4.8,
    memoryUsed: segmentIds.length * 6.4,
    status: 'preloading'
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))