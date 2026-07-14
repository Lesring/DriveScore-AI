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

export function useStableAudio() {
  const isGenerating = ref(false)
  const currentGeneration = ref<StableAudioGenerationResponse | null>(null)
  const generatedAudios = ref<GeneratedAudio[]>([])
  const lastError = ref<string | null>(null)
  const isApiConfigured = ref(true)

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
    options: { duration?: number; seed?: number } = {}
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

    const result = await generateWithConfig(config, options)
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
    lastError.value = null

    try {
      const prompt = buildPrompt(config)
      
      const response = await generateAudioWithWait({
        prompt,
        seconds_total: options.duration || 30,
        seed: options.seed,
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

        generatedAudios.value.unshift(generated)
        
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
    }
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

  return {
    isGenerating,
    currentGeneration,
    generatedAudios,
    lastError,
    isApiConfigured,
    hasApiKey,
    availableStyles,
    availableEvents,
    checkApiKey,
    getStyleConfig,
    getEventConfig,
    generateForStyle,
    generateForEvent,
    generateWithConfig,
    getGeneratedForStyle,
    getGeneratedForEvent,
    clearGeneratedAudios
  }
}