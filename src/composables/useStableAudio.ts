import { ref, computed } from 'vue'
import {
  generateAudioWithWait,
  buildPrompt,
  DEFAULT_MUSIC_STYLE_CONFIGS,
  ROAD_EVENT_MUSIC_CONFIGS,
  type MusicStyleConfig,
  type StableAudioGenerationResponse
} from '@/api/stableAudio'

export interface GeneratedAudio {
  id: string
  url: string
  style: string
  eventType?: string
  config: MusicStyleConfig
  timestamp: number
}

const isGenerating = ref(false)
const currentGeneration = ref<StableAudioGenerationResponse | null>(null)
const generatedAudios = ref<GeneratedAudio[]>([])
const lastError = ref<string | null>(null)
const isApiConfigured = ref(true)
const journeySeed = ref<number | null>(null)
const generationProgress = ref(0)
const generationStatus = ref<'idle' | 'generating' | 'completed' | 'error'>('idle')

const availableStyles = computed(() => {
  return Object.keys(DEFAULT_MUSIC_STYLE_CONFIGS)
})

const availableEvents = computed(() => {
  return Object.keys(ROAD_EVENT_MUSIC_CONFIGS)
})

const hasApiKey = computed(() => {
  return import.meta.env.VITE_STABILITY_API_KEY && import.meta.env.VITE_STABILITY_API_KEY.length > 0
})

const checkApiKey = () => {
  isApiConfigured.value = hasApiKey.value
  return isApiConfigured.value
}

const setJourneySeed = (seed: number | null) => {
  journeySeed.value = seed
}

const generateSeedFromRoute = (routeInput: string): number => {
  let hash = 0
  for (let i = 0; i < routeInput.length; i++) {
    const char = routeInput.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const result = Math.abs(hash) % 1000000
  journeySeed.value = result
  return result
}

const getStyleConfig = (style: string): MusicStyleConfig | null => {
  return DEFAULT_MUSIC_STYLE_CONFIGS[style.toLowerCase()] || null
}

const getEventConfig = (eventType: string): MusicStyleConfig | null => {
  return ROAD_EVENT_MUSIC_CONFIGS[eventType.toLowerCase()] || null
}

const generateForStyle = async (
  style: string,
  options: { duration?: number; seed?: number } = {}
): Promise<GeneratedAudio | null> => {
  if (!checkApiKey()) {
    lastError.value = 'API key not configured'
    return null
  }

  const config = getStyleConfig(style)
  if (!config) {
    lastError.value = `Style ${style} not found`
    return null
  }

  return generateWithConfig(config, options)
}

const generateForEvent = async (
  eventType: string,
  options: { duration?: number; seedOffset?: number } = {}
): Promise<GeneratedAudio | null> => {
  if (!checkApiKey()) {
    lastError.value = 'API key not configured'
    return null
  }

  const config = getEventConfig(eventType)
  if (!config) {
    lastError.value = `Event type ${eventType} not found`
    return null
  }

  const effectiveSeed = journeySeed.value !== null 
    ? journeySeed.value + (options.seedOffset || 0)
    : undefined

  const result = await generateWithConfig(config, { 
    duration: options.duration, 
    seed: effectiveSeed 
  })
  if (result) {
    result.eventType = eventType
  }
  return result
}

const generateWithConfig = async (
  config: MusicStyleConfig,
  options: { duration?: number; seed?: number } = {}
): Promise<GeneratedAudio | null> => {
  if (!checkApiKey()) {
    lastError.value = 'API key not configured'
    return null
  }

  isGenerating.value = true
  generationStatus.value = 'generating'
  lastError.value = null

  try {
    const effectiveSeed = options.seed ?? (journeySeed.value ?? undefined)
    const prompt = buildPrompt(config)
    
    const response = await generateAudioWithWait({
      prompt,
      seconds_total: options.duration || 30,
      seed: effectiveSeed,
      steps: 100,
      guidance_scale: 3.0
    })

    currentGeneration.value = response

    if (response.status === 'completed' && response.audio_file?.url) {
      const generated: GeneratedAudio = {
        id: response.id,
        url: response.audio_file.url,
        style: config.style,
        config,
        timestamp: Date.now()
      }

      const existingIndex = generatedAudios.value.findIndex(
        a => a.style.toLowerCase() === config.style.toLowerCase()
      )
      if (existingIndex > -1) {
        generatedAudios.value[existingIndex] = generated
      } else {
        generatedAudios.value.unshift(generated)
      }
      
      if (generatedAudios.value.length > 20) {
        generatedAudios.value = generatedAudios.value.slice(0, 20)
      }

      return generated
    }

    if (response.error) {
      lastError.value = response.error.message || 'Generation failed'
    } else {
      lastError.value = 'Generation did not complete successfully'
    }

    return null
  } catch (error) {
    lastError.value = error instanceof Error ? error.message : 'Unknown error'
    return null
  } finally {
    isGenerating.value = false
    if (lastError.value) {
      generationStatus.value = 'error'
    } else if (generationStatus.value === 'generating') {
      generationStatus.value = 'completed'
    }
  }
}

const preGenerateAllStyles = async (seed: number): Promise<boolean> => {
  if (!checkApiKey()) {
    console.log('[StableAudio] No API key configured, skipping AI generation')
    return false
  }

  setJourneySeed(seed)
  generationProgress.value = 0
  generationStatus.value = 'generating'
  
  const styles = Object.keys(DEFAULT_MUSIC_STYLE_CONFIGS)
  let successCount = 0

  for (let i = 0; i < styles.length; i++) {
    const style = styles[i]
    console.log(`[StableAudio] Generating ${style} (${i + 1}/${styles.length})...`)
    
    const result = await generateForStyle(style, { duration: 30, seed })
    
    if (result) {
      successCount++
      console.log(`[StableAudio] Successfully generated ${style}`)
    } else {
      console.warn(`[StableAudio] Failed to generate ${style}`)
    }
    
    generationProgress.value = ((i + 1) / styles.length) * 100
  }

  generationStatus.value = successCount === styles.length ? 'completed' : 'error'
  return successCount > 0
}

const getGeneratedForStyle = (style: string): GeneratedAudio | undefined => {
  return generatedAudios.value.find(a => a.style.toLowerCase() === style.toLowerCase())
}

const getGeneratedForEvent = (eventType: string): GeneratedAudio | undefined => {
  return generatedAudios.value.find(a => a.eventType === eventType)
}

const clearGeneratedAudios = () => {
  generatedAudios.value = []
}

const resetJourneySeed = () => {
  journeySeed.value = null
  generationStatus.value = 'idle'
  generationProgress.value = 0
}

export function useStableAudio() {
  return {
    isGenerating,
    currentGeneration,
    generatedAudios,
    lastError,
    isApiConfigured,
    hasApiKey,
    journeySeed,
    generationProgress,
    generationStatus,
    availableStyles,
    availableEvents,
    checkApiKey,
    setJourneySeed,
    generateSeedFromRoute,
    getStyleConfig,
    getEventConfig,
    generateForStyle,
    generateForEvent,
    generateWithConfig,
    preGenerateAllStyles,
    getGeneratedForStyle,
    getGeneratedForEvent,
    clearGeneratedAudios,
    resetJourneySeed
  }
}
