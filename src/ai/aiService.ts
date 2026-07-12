import { pipeline } from '@xenova/transformers'

export type AIProvider = 'xenova' | 'openai-compatible'
export type AIStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface AIResponse<T> {
  data: T | null
  error: string | null
  source: 'ai' | 'fallback'
  provider?: AIProvider
}

export interface AIConfig {
  provider: AIProvider
  baseURL?: string
  apiKey?: string
  model?: string
}

const config: AIConfig = {
  provider: (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'xenova',
  baseURL: import.meta.env.VITE_AI_BASE_URL,
  apiKey: import.meta.env.VITE_AI_API_KEY,
  model: import.meta.env.VITE_AI_MODEL || 'Xenova/phi-2'
}

let textGenerator: any = null
let isInitializing = false
let initPromise: Promise<void> | null = null

export const getAIStatus = (): AIStatus => {
  if (textGenerator) return 'ready'
  if (isInitializing) return 'loading'
  if (textGenerator === null && !isInitializing) return 'idle'
  return 'error'
}

export const getAIConfig = (): AIConfig => {
  return { ...config }
}

export const initializeAI = async (): Promise<void> => {
  if (textGenerator) return
  if (isInitializing) {
    if (initPromise) return initPromise
    return
  }
  
  isInitializing = true
  initPromise = new Promise(async (resolve, reject) => {
    try {
      if (config.provider === 'openai-compatible' && config.apiKey) {
        textGenerator = await createOpenAICompatibleGenerator()
      } else {
        textGenerator = await pipeline('text-generation', config.model, {
          quantized: true
        })
      }
      isInitializing = false
      resolve()
    } catch (error) {
      isInitializing = false
      console.error('Failed to initialize AI:', error)
      reject(error)
    }
  })
  
  return initPromise
}

const createOpenAICompatibleGenerator = async (): Promise<any> => {
  return {
    async generate(prompt: string, options: { max_new_tokens: number }) {
      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options.max_new_tokens,
          temperature: 0.7
        })
      })
      
      const data = await response.json()
      return [{
        generated_text: prompt + (data.choices?.[0]?.message?.content || '')
      }]
    }
  }
}

export const generateText = async (prompt: string, maxRetries = 3): Promise<AIResponse<string>> => {
  for (let retry = 0; retry < maxRetries; retry++) {
    try {
      if (!textGenerator) {
        await initializeAI()
      }
      
      if (!textGenerator) {
        return {
          data: null,
          error: 'AI model not initialized',
          source: 'fallback',
          provider: config.provider
        }
      }
      
      const result = await textGenerator(prompt, {
        max_new_tokens: 1024,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.05
      })
      
      if (result && Array.isArray(result) && result.length > 0) {
        const text = result[0].generated_text || ''
        return {
          data: text.replace(prompt, '').trim(),
          error: null,
          source: 'ai',
          provider: config.provider
        }
      }
      
      return {
        data: null,
        error: 'Empty response',
        source: 'fallback',
        provider: config.provider
      }
    } catch (error) {
      console.error(`AI generation attempt ${retry + 1} failed:`, error)
      if (retry === maxRetries - 1) {
        return {
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'fallback',
          provider: config.provider
        }
      }
      await delay(1000 * (retry + 1))
    }
  }
  
  return {
    data: null,
    error: 'Max retries exceeded',
    source: 'fallback',
    provider: config.provider
  }
}

export const generateJSON = async <T>(prompt: string, maxRetries = 3): Promise<AIResponse<T>> => {
  const response = await generateText(prompt, maxRetries)
  
  if (response.error || !response.data) {
    return {
      data: null,
      error: response.error,
      source: 'fallback',
      provider: response.provider
    }
  }
  
  try {
    const jsonMatch = response.data.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[0])
      return {
        data: jsonData as T,
        error: null,
        source: 'ai',
        provider: response.provider
      }
    }
    
    const jsonData = JSON.parse(response.data)
    return {
      data: jsonData as T,
      error: null,
      source: 'ai',
      provider: response.provider
    }
  } catch (parseError) {
    console.error('JSON parsing failed:', parseError)
    if (maxRetries > 1) {
      return generateJSON(prompt, maxRetries - 1)
    }
    return {
      data: null,
      error: 'Failed to parse JSON response',
      source: 'fallback',
      provider: response.provider
    }
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))