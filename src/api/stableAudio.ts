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
    instruments: ['grand piano', 'warm pad synthesizers', 'soft mallet percussion', 'cello'],
    mood: 'serene, peaceful, relaxing, meditative',
    genre: 'ambient, cinematic, neoclassical',
    tempo: 65,
    energy: 20,
    description: 'Beautiful ambient cinematic music with gentle piano arpeggios, warm atmospheric pads, soft mallet percussion, and subtle cello. Perfect for calm urban driving scenes. High quality production, professional mixing, crystal clear audio.'
  },
  build: {
    style: 'Build',
    instruments: ['progression synth arpeggio', 'deep bassline', 'shaker', 'toms', 'subtle hi-hats'],
    mood: 'hopeful, anticipatory, uplifting, building',
    genre: 'electronic, progressive house, cinematic',
    tempo: 95,
    energy: 45,
    description: 'Progressive electronic music with rising synth arpeggios, deep pulsing bassline, and subtle percussion. Gradually builds energy and tension. Perfect for accelerating into highway. Professional production, clean mix, wide stereo image.'
  },
  cruise: {
    style: 'Cruise',
    instruments: ['electric guitar', 'bass guitar', 'tight drum kit', 'analog synthesizer', 'rhythm guitar'],
    mood: 'energetic, driving, upbeat, confident',
    genre: 'synthwave, indie rock, electronic rock',
    tempo: 120,
    energy: 70,
    description: 'High-energy synthwave rock music with catchy guitar riffs, driving bassline, tight drums, and retro synthesizers. Perfect for highway cruising at night. Professional production quality, powerful mix, punchy drums.'
  },
  peak: {
    style: 'Peak',
    instruments: ['heavy drums', 'distorted guitar', 'powerful synths', 'epic strings', 'sub bass'],
    mood: 'intense, thrilling, adrenaline, epic',
    genre: 'electronic rock, cinematic, epic trailer',
    tempo: 140,
    energy: 90,
    description: 'Epic cinematic rock music with thunderous drums, distorted guitars, powerful synthesizers, and orchestral strings. Maximum energy for intense driving moments like overtaking. Professional epic production, massive sound, dramatic build.'
  },
  ending: {
    style: 'Ending',
    instruments: ['grand piano', 'string orchestra', 'soft woodwinds', 'gentle chimes'],
    mood: 'peaceful, reflective, nostalgic, calming',
    genre: 'classical, cinematic, ambient',
    tempo: 70,
    energy: 30,
    description: 'Beautiful cinematic conclusion music with emotional piano melody, lush string orchestra, and gentle woodwinds. Perfect for arriving at destination. High quality orchestral production, emotional and heartfelt.'
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
  return import.meta.env.VITE_STABILITY_API_KEY || ''
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

export interface CustomMusicSettings {
  instruments: string[]
  genre: string
  mood: string
  energy: number
  tempo: number
}

export const getCustomMusicSettings = (): CustomMusicSettings | null => {
  try {
    const stored = localStorage.getItem('drivescore-custom-music-settings')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    return null
  }
  return null
}

export const buildPrompt = (config: MusicStyleConfig): string => {
  const customSettings = getCustomMusicSettings()
  
  const instruments = customSettings?.instruments.length 
    ? customSettings.instruments.join(', ') 
    : config.instruments.join(', ')
  
  const genre = customSettings?.genre || config.genre
  const mood = customSettings?.mood || config.mood
  const energy = customSettings?.energy ?? config.energy
  const tempo = customSettings?.tempo ?? config.tempo
  
  return `${config.description}. Genre: ${genre}. Mood: ${mood}. Instruments: ${instruments}. Tempo: ${tempo} BPM. Energy level: ${energy}/100. High quality production, suitable for driving background music.`
}