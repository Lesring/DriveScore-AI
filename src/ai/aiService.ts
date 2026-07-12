import { pipeline } from '@xenova/transformers'

export type AIStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface AIResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
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

export const initializeAI = async (): Promise<void> => {
  if (textGenerator) return
  if (isInitializing) {
    if (initPromise) return initPromise
    return
  }
  
  isInitializing = true
  initPromise = new Promise(async (resolve, reject) => {
    try {
      textGenerator = await pipeline('text-generation', 'Xenova/phi-2', {
        quantized: true
      })
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
          loading: false
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
          loading: false
        }
      }
      
      return {
        data: null,
        error: 'Empty response',
        loading: false
      }
    } catch (error) {
      console.error(`AI generation attempt ${retry + 1} failed:`, error)
      if (retry === maxRetries - 1) {
        return {
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false
        }
      }
      await delay(1000 * (retry + 1))
    }
  }
  
  return {
    data: null,
    error: 'Max retries exceeded',
    loading: false
  }
}

export const generateJSON = async <T>(prompt: string, maxRetries = 3): Promise<AIResponse<T>> => {
  const response = await generateText(prompt, maxRetries)
  
  if (response.error || !response.data) {
    return {
      data: null,
      error: response.error,
      loading: false
    }
  }
  
  try {
    const jsonMatch = response.data.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[0])
      return {
        data: jsonData as T,
        error: null,
        loading: false
      }
    }
    
    const jsonData = JSON.parse(response.data)
    return {
      data: jsonData as T,
      error: null,
      loading: false
    }
  } catch (parseError) {
    console.error('JSON parsing failed:', parseError)
    if (maxRetries > 1) {
      return generateJSON(prompt, maxRetries - 1)
    }
    return {
      data: null,
      error: 'Failed to parse JSON response',
      loading: false
    }
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
