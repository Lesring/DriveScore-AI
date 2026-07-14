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
  phaseRole: string
}

const SHARED_SONIC_IDENTITY = {
  genreFamily: 'cinematic electronic / ambient synthwave',
  coreInstruments: ['warm analog pads', 'soft piano', 'subtle synth bass', 'light electronic percussion'],
  optionalInstruments: ['soft arpeggio', 'filtered drums', 'airy textures'],
  forbiddenInstruments: ['distorted guitar', 'heavy metal', 'orchestral trailer brass', 'lo-fi hiphop vinyl crackle', 'folk acoustic', 'progressive house drop'],
  baseTempo: 100,
  baseEnergy: 50
}

export const DEFAULT_MUSIC_STYLE_CONFIGS: Record<string, MusicStyleConfig> = {
  calm: {
    style: 'Calm',
    instruments: [...SHARED_SONIC_IDENTITY.coreInstruments],
    mood: 'serene, peaceful, meditative, introspective',
    genre: SHARED_SONIC_IDENTITY.genreFamily,
    tempo: 65,
    energy: 20,
    description: 'This is phase Calm of ONE continuous cinematic-electronic driving soundtrack suite. Keep the same sonic identity, instruments family, and tonal color as the other phases. Only change intensity. Sparse piano with warm pads, almost no drums. Intro of the same soundtrack.',
    phaseRole: 'intro - sparse, minimal, establishing theme'
  },
  build: {
    style: 'Build',
    instruments: [...SHARED_SONIC_IDENTITY.coreInstruments, 'soft arpeggio'],
    mood: 'hopeful, anticipatory, rising, building',
    genre: SHARED_SONIC_IDENTITY.genreFamily,
    tempo: 95,
    energy: 45,
    description: 'This is phase Build of ONE continuous cinematic-electronic driving soundtrack suite. Keep the same sonic identity, instruments family, and tonal color as the other phases. Only change intensity. Add soft arpeggio and light percussion to the same palette, rising but maintaining the same instruments.',
    phaseRole: 'development - adding layers, increasing density'
  },
  cruise: {
    style: 'Cruise',
    instruments: [...SHARED_SONIC_IDENTITY.coreInstruments, 'soft arpeggio', 'filtered drums'],
    mood: 'confident, steady, driving, relaxed',
    genre: SHARED_SONIC_IDENTITY.genreFamily,
    tempo: 115,
    energy: 65,
    description: 'This is phase Cruise of ONE continuous cinematic-electronic driving soundtrack suite. Keep the same sonic identity, instruments family, and tonal color as the other phases. Only change intensity. Steady pulse with confident groove, same synth and piano palette throughout.',
    phaseRole: 'main theme - steady groove, full arrangement'
  },
  peak: {
    style: 'Peak',
    instruments: [...SHARED_SONIC_IDENTITY.coreInstruments, 'soft arpeggio', 'filtered drums', 'airy textures'],
    mood: 'intense, energetic, bright, climactic',
    genre: SHARED_SONIC_IDENTITY.genreFamily,
    tempo: 135,
    energy: 90,
    description: 'This is phase Peak of ONE continuous cinematic-electronic driving soundtrack suite. Keep the same sonic identity, instruments family, and tonal color as the other phases. Only change intensity. Denser drums, stronger bass, brighter leads - but NO genre jump, NO rock takeover. Climax variation of the same theme.',
    phaseRole: 'climax - maximum intensity, densest arrangement'
  },
  ending: {
    style: 'Ending',
    instruments: [...SHARED_SONIC_IDENTITY.coreInstruments],
    mood: 'peaceful, reflective, resolving, calming',
    genre: SHARED_SONIC_IDENTITY.genreFamily,
    tempo: 70,
    energy: 30,
    description: 'This is phase Ending of ONE continuous cinematic-electronic driving soundtrack suite. Keep the same sonic identity, instruments family, and tonal color as the other phases. Only change intensity. Return to sparse piano and pads, resolving tension. Outro of the same soundtrack.',
    phaseRole: 'outro - returning to minimal, resolving theme'
  }
}

export const ROAD_EVENT_MUSIC_CONFIGS: Record<string, MusicStyleConfig> = {
  rain: {
    style: 'Rain',
    instruments: [...SHARED_SONIC_IDENTITY.coreInstruments],
    mood: 'calming, softer, wet atmosphere',
    genre: SHARED_SONIC_IDENTITY.genreFamily,
    tempo: 60,
    energy: 18,
    description: 'This is a rain variation of ONE continuous cinematic-electronic driving soundtrack suite. Keep the SAME sonic identity as the base journey phases. Same instruments family, same tonal color. Only add wetter, softer atmosphere. Lower energy.',
    phaseRole: 'environmental variation - rain'
  },
  night: {
    style: 'Night',
    instruments: [...SHARED_SONIC_IDENTITY.coreInstruments],
    mood: 'darker, mysterious, atmospheric',
    genre: SHARED_SONIC_IDENTITY.genreFamily,
    tempo: 90,
    energy: 35,
    description: 'This is a night variation of ONE continuous cinematic-electronic driving soundtrack suite. Keep the SAME sonic identity as the base journey phases. Same instruments family, same tonal color. Only use darker pads, slightly lower brightness.',
    phaseRole: 'environmental variation - night'
  },
  traffic: {
    style: 'Traffic',
    instruments: [...SHARED_SONIC_IDENTITY.coreInstruments],
    mood: 'patient, slowed, sparse',
    genre: SHARED_SONIC_IDENTITY.genreFamily,
    tempo: 70,
    energy: 22,
    description: 'This is a traffic variation of ONE continuous cinematic-electronic driving soundtrack suite. Keep the SAME sonic identity as the base journey phases. Same instruments family, same tonal color. Only slower tempo, sparser arrangement.',
    phaseRole: 'environmental variation - traffic'
  },
  construction: {
    style: 'Construction',
    instruments: [...SHARED_SONIC_IDENTITY.coreInstruments],
    mood: 'cautious, careful, alert',
    genre: SHARED_SONIC_IDENTITY.genreFamily,
    tempo: 75,
    energy: 25,
    description: 'This is a construction zone variation of ONE continuous cinematic-electronic driving soundtrack suite. Keep the SAME sonic identity as the base journey phases. Same instruments family, same tonal color. More cautious feel, lower energy.',
    phaseRole: 'environmental variation - construction'
  },
  accident: {
    style: 'Accident',
    instruments: [...SHARED_SONIC_IDENTITY.coreInstruments],
    mood: 'somber, cautious, reflective',
    genre: SHARED_SONIC_IDENTITY.genreFamily,
    tempo: 55,
    energy: 15,
    description: 'This is an accident scene variation of ONE continuous cinematic-electronic driving soundtrack suite. Keep the SAME sonic identity as the base journey phases. Same instruments family, same tonal color. Very sparse, somber, cautious.',
    phaseRole: 'environmental variation - accident'
  },
  mountain: {
    style: 'Mountain',
    instruments: [...SHARED_SONIC_IDENTITY.coreInstruments, 'airy textures'],
    mood: 'elevated, expansive, adventurous',
    genre: SHARED_SONIC_IDENTITY.genreFamily,
    tempo: 120,
    energy: 75,
    description: 'This is a mountain driving variation of ONE continuous cinematic-electronic driving soundtrack suite. Keep the SAME sonic identity as the base journey phases. Same instruments family, same tonal color. Higher energy, slightly faster tempo, airy textures.',
    phaseRole: 'environmental variation - mountain'
  },
  highway: {
    style: 'Highway',
    instruments: [...SHARED_SONIC_IDENTITY.coreInstruments, 'soft arpeggio', 'filtered drums'],
    mood: 'energetic, flowing, free',
    genre: SHARED_SONIC_IDENTITY.genreFamily,
    tempo: 130,
    energy: 85,
    description: 'This is a highway driving variation of ONE continuous cinematic-electronic driving soundtrack suite. Keep the SAME sonic identity as the base journey phases. Same instruments family, same tonal color. Higher energy, faster tempo, confident groove.',
    phaseRole: 'environmental variation - highway'
  },
  clear: {
    style: 'Clear',
    instruments: [...SHARED_SONIC_IDENTITY.coreInstruments, 'soft arpeggio'],
    mood: 'bright, positive, clear',
    genre: SHARED_SONIC_IDENTITY.genreFamily,
    tempo: 110,
    energy: 60,
    description: 'This is a clear weather variation of ONE continuous cinematic-electronic driving soundtrack suite. Keep the SAME sonic identity as the base journey phases. Same instruments family, same tonal color. Return to baseline cruise intensity.',
    phaseRole: 'environmental variation - clear'
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
  baseEnergy: number
  baseTempo: number
}

export const getCustomMusicSettings = (): CustomMusicSettings | null => {
  try {
    const stored = localStorage.getItem('drivescore-custom-music-settings')
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        instruments: parsed.instruments || [],
        genre: parsed.genre || SHARED_SONIC_IDENTITY.genreFamily,
        mood: parsed.mood || 'cinematic, driving',
        baseEnergy: parsed.energy || SHARED_SONIC_IDENTITY.baseEnergy,
        baseTempo: parsed.tempo || SHARED_SONIC_IDENTITY.baseTempo
      }
    }
  } catch {
    return null
  }
  return null
}

const PHASE_INTENSITY_MULTIPLIERS: Record<string, { tempo: number; energy: number }> = {
  calm: { tempo: 0.65, energy: 0.4 },
  build: { tempo: 0.95, energy: 0.9 },
  cruise: { tempo: 1.15, energy: 1.3 },
  peak: { tempo: 1.35, energy: 1.8 },
  ending: { tempo: 0.70, energy: 0.6 }
}

export const buildPrompt = (config: MusicStyleConfig): string => {
  const customSettings = getCustomMusicSettings()
  
  const sharedInstruments = customSettings?.instruments.length
    ? customSettings.instruments.join(', ')
    : config.instruments.join(', ')
  
  const mood = customSettings?.mood || config.mood
  
  let tempo = config.tempo
  let energy = config.energy
  
  if (customSettings) {
    const multiplier = PHASE_INTENSITY_MULTIPLIERS[config.style.toLowerCase()]
    if (multiplier) {
      tempo = Math.round(customSettings.baseTempo * multiplier.tempo)
      energy = Math.min(95, Math.round(customSettings.baseEnergy * multiplier.energy))
    }
  }

  const negativeConstraints = [
    'no vocals',
    'no genre jumps',
    'no distorted guitars',
    'no trailer brass',
    'no lo-fi hiphop',
    'no folk acoustic',
    'no heavy metal',
    'no orchestral trailer takeover',
    'no progressive house drop'
  ]

  return `Create phase "${config.style}" of ONE continuous cinematic-electronic driving soundtrack suite. 
Keep the SAME sonic identity across all journey phases. 
Shared palette: ${sharedInstruments}. 
This phase role: ${config.phaseRole}. 
Tempo: ${tempo} BPM. 
Energy: ${energy}/100. 
Mood: ${mood}. 
Make it sound like a variation of the same theme, not a different song. 
Instrumental only, seamless loop-friendly, clean mix, suitable as in-car background music. 
Avoid: ${negativeConstraints.join(', ')}.
${config.description}`.replace(/\n/g, ' ')
}

export const generateJourneySeed = (routeInput: string): number => {
  let hash = 0
  for (let i = 0; i < routeInput.length; i++) {
    const char = routeInput.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash) % 1000000
}

export { SHARED_SONIC_IDENTITY }
