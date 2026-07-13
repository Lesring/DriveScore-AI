export interface StableAudioGenerationRequest {
  prompt: string
  seconds_total?: number
  seed?: number
  steps?: number
  guidance_scale?: number
}

export interface StableAudioGenerationResponse {
  id: string
  status: 'queued' | 'generating' | 'completed' | 'error'
  audio_file?: {
    url: string
  }
  error?: {
    name: string
    message: string
  }
  meta?: {
    usage?: {
      credits_used: number
    }
  }
}

export interface MusicStyleConfig {
  style: string
  instruments: string[]
  mood: string
  genre: string
  tempo: number
  energy: number
  description: string
}

export const DEFAULT_MUSIC_STYLE_CONFIGS: Record<string, MusicStyleConfig> = {
  calm: {
    style: 'Calm',
    instruments: ['piano', 'soft synthesizer', 'gentle pads'],
    mood: 'relaxing, peaceful, serene',
    genre: 'ambient, new age',
    tempo: 70,
    energy: 25,
    description: 'Soft, gentle background music'
  },
  build: {
    style: 'Build',
    instruments: ['synth arpeggio', 'bassline', 'subtle percussion'],
    mood: 'building, hopeful, anticipatory',
    genre: 'electronic, progressive',
    tempo: 100,
    energy: 50,
    description: 'Music that builds tension gradually'
  },
  cruise: {
    style: 'Cruise',
    instruments: ['electric guitar', 'bass guitar', 'drums', 'synthesizer'],
    mood: 'energetic, driving, upbeat',
    genre: 'rock, synthwave',
    tempo: 125,
    energy: 75,
    description: 'Mid-tempo driving music for cruising'
  },
  peak: {
    style: 'Peak',
    instruments: ['heavy drums', 'distorted guitar', 'powerful synths'],
    mood: 'intense, thrilling, adrenaline',
    genre: 'rock, electronic',
    tempo: 145,
    energy: 95,
    description: 'High energy peak music'
  },
  ending: {
    style: 'Ending',
    instruments: ['piano', 'orchestra', 'soft strings'],
    mood: 'peaceful, reflective, calming',
    genre: 'classical, ambient',
    tempo: 75,
    energy: 35,
    description: 'Gentle conclusion music'
  }
}

export const ROAD_EVENT_MUSIC_CONFIGS: Record<string, MusicStyleConfig> = {
  rain: {
    style: 'Rain',
    instruments: ['soft piano', 'rain sounds', 'ambient pads'],
    mood: 'calm, contemplative, soothing',
    genre: 'ambient, new age',
    tempo: 65,
    energy: 20,
    description: 'Relaxing music for rainy day driving'
  },
  night: {
    style: 'Night',
    instruments: ['synth pads', 'electronic beats', 'ambient textures'],
    mood: 'mysterious, calm, atmospheric',
    genre: 'ambient, electronic',
    tempo: 80,
    energy: 30,
    description: 'Moody atmospheric night driving music'
  },
  traffic: {
    style: 'Traffic',
    instruments: ['chill piano', 'subtle beats', 'mellow pads'],
    mood: 'patient, calm, relaxed',
    genre: 'lo-fi, chillhop',
    tempo: 75,
    energy: 25,
    description: 'Calm music for traffic conditions'
  },
  construction: {
    style: 'Construction',
    instruments: ['slow synth', 'cautious rhythm', 'warning tones'],
    mood: 'careful, alert, steady',
    genre: 'electronic, ambient',
    tempo: 85,
    energy: 35,
    description: 'Careful driving music for construction zones'
  },
  accident: {
    style: 'Accident',
    instruments: ['somber piano', 'string section', 'muted beats'],
    mood: 'somber, cautious, alert',
    genre: 'ambient, cinematic',
    tempo: 60,
    energy: 20,
    description: 'Somber music for accident scenes'
  },
  mountain: {
    style: 'Mountain',
    instruments: ['acoustic guitar', 'orchestra', 'epic drums'],
    mood: 'epic, inspiring, adventurous',
    genre: 'cinematic, folk',
    tempo: 105,
    energy: 65,
    description: 'Epic music for mountain driving'
  },
  highway: {
    style: 'Highway',
    instruments: ['electric guitar', 'driving bass', 'powerful drums', 'synths'],
    mood: 'energetic, free, driving',
    genre: 'rock, synthwave',
    tempo: 130,
    energy: 80,
    description: 'High-energy driving music for highways'
  },
  clear: {
    style: 'Clear',
    instruments: ['bright piano', 'upbeat drums', 'positive synths'],
    mood: 'positive, energetic, optimistic',
    genre: 'pop, electronic',
    tempo: 100,
    energy: 60,
    description: 'Bright music for clear weather driving'
  }
}

const API_BASE_URL = 'https://api.stability.ai'
const API_VERSION = 'v2beta'

const getApiKey = (): string => {
  return import.meta.env.STABILITY_API_KEY || ''
}

const createHeaders = (): Headers => {
  const headers = new Headers()
  headers.set('Authorization', `Bearer ${getApiKey()}`)
  headers.set('Content-Type', 'application/json')
  return headers
}

export const generateAudio = async (
  request: StableAudioGenerationRequest
): Promise<StableAudioGenerationResponse> => {
  const url = `${API_BASE_URL}/${API_VERSION}/audio/stable-audio-2/text-to-audio`
  
  const body = {
    prompt: request.prompt,
    seconds_total: request.seconds_total || 30,
    seed: request.seed,
    steps: request.steps || 100,
    guidance_scale: request.guidance_scale || 3.0
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Stable Audio API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

export const getGenerationStatus = async (
  generationId: string
): Promise<StableAudioGenerationResponse> => {
  const url = `${API_BASE_URL}/${API_VERSION}/audio/stable-audio-2/text-to-audio/${generationId}`

  const response = await fetch(url, {
    method: 'GET',
    headers: createHeaders()
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Stable Audio API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

export const waitForGeneration = async (
  generationId: string,
  timeout: number = 60000,
  interval: number = 2000
): Promise<StableAudioGenerationResponse> => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    const result = await getGenerationStatus(generationId)
    
    if (result.status === 'completed' || result.status === 'error') {
      return result
    }
    
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  
  throw new Error('Stable Audio generation timed out')
}

export const generateAudioWithWait = async (
  request: StableAudioGenerationRequest
): Promise<StableAudioGenerationResponse> => {
  const initialResponse = await generateAudio(request)
  
  if (initialResponse.status === 'completed') {
    return initialResponse
  }
  
  return waitForGeneration(initialResponse.id)
}

export const buildPrompt = (config: MusicStyleConfig): string => {
  const instruments = config.instruments.join(', ')
  return `${config.description}. Genre: ${config.genre}. Mood: ${config.mood}. Instruments: ${instruments}. Tempo: ${config.tempo} BPM. Energy level: ${config.energy}/100. High quality production, suitable for driving background music.`
}