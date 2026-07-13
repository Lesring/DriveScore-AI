import type { MusicSegment, RouteStep } from '@/api'
import { getAudioUrlForStyle } from '@/api'
import { MusicGenerator, type MusicGeneratorConfig } from './MusicGenerator'

export interface AudioSource {
  id: string
  type: 'synthesized' | 'url' | 'ai-generated'
  url?: string
  segment?: MusicSegment
  step?: RouteStep
  aiGenerated?: boolean
}

export interface PlaybackState {
  isPlaying: boolean
  currentSource: AudioSource | null
  volume: number
  tempo: number
  energy: number
  isUsingFallback: boolean
  fallbackReason: string | null
}

export class AudioManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private bgmGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private currentSource: AudioSource | null = null
  private isPlaying = false
  
  private activeBufferSource: AudioBufferSourceNode | null = null
  private activeGainNode: GainNode | null = null
  private cache = new Map<string, AudioBuffer>()
  private energy = 50
  private tempo = 100
  private baseVolume = 0.5
  private musicGenerator: MusicGenerator | null = null
  private isUsingFallback = false
  private fallbackReason: string | null = null
  private listeners: Set<(state: PlaybackState) => void> = new Set()

  get playbackState(): PlaybackState {
    return {
      isPlaying: this.isPlaying,
      currentSource: this.currentSource,
      volume: this.masterGain?.gain.value || 0,
      tempo: this.tempo,
      energy: this.energy,
      isUsingFallback: this.isUsingFallback,
      fallbackReason: this.fallbackReason
    }
  }

  subscribe(listener: (state: PlaybackState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    const state = this.playbackState
    this.listeners.forEach(listener => listener(state))
  }

  private initContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = this.baseVolume
      this.masterGain.connect(this.audioContext.destination)

      this.bgmGain = this.audioContext.createGain()
      this.bgmGain.gain.value = 1
      this.bgmGain.connect(this.masterGain)

      this.sfxGain = this.audioContext.createGain()
      this.sfxGain.gain.value = 0.8
      this.sfxGain.connect(this.masterGain)

      this.musicGenerator = new MusicGenerator(this.audioContext)
    }
  }

  async resume(): Promise<void> {
    this.initContext()
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  async preload(sources: AudioSource[]): Promise<{ success: string[]; failed: string[] }> {
    this.initContext()
    const success: string[] = []
    const failed: string[] = []
    
    for (const source of sources) {
      if (!this.cache.has(source.id)) {
        if (source.type === 'ai-generated' || source.aiGenerated || source.type === 'url' || source.url) {
          const url = source.url || getAudioUrlForStyle(source.segment?.style || 'calm')
          try {
            const response = await fetch(url)
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`)
            }
            const arrayBuffer = await response.arrayBuffer()
            const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
            this.cache.set(source.id, audioBuffer)
            success.push(source.id)
            this.isUsingFallback = false
            this.fallbackReason = null
          } catch (error) {
            console.warn(`Failed to preload ${source.id}:`, error)
            failed.push(source.id)
          }
        } else if (source.type === 'synthesized') {
          await this.generateAndCache(source)
          success.push(source.id)
        }
      } else {
        success.push(source.id)
      }
    }
    
    if (failed.length > 0 && success.length === 0) {
      this.isUsingFallback = true
      this.fallbackReason = 'All audio files failed to load, using synthesized fallback'
      for (const source of sources) {
        await this.generateAndCache(source)
      }
    }
    
    this.notifyListeners()
    return { success, failed }
  }

  private async generateAndCache(source: AudioSource): Promise<void> {
    if (!this.audioContext || !this.musicGenerator) return
    
    const segment = source.segment
    if (!segment) return

    const config: MusicGeneratorConfig = {
      style: segment.style as any,
      energy: segment.energy,
      tempo: segment.tempo,
      key: segment.key || 'C Major',
      duration: segment.duration || 30
    }

    const buffer = this.musicGenerator.generateAudioBuffer(config)
    this.cache.set(source.id, buffer)
  }

  async play(source: AudioSource, options: { fadeIn?: number; loop?: boolean } = {}): Promise<void> {
    await this.resume()

    const fadeIn = options.fadeIn ?? 1000
    const loop = options.loop ?? true

    if (this.currentSource?.id === source.id && this.isPlaying) {
      return
    }

    if (this.isPlaying) {
      await this.stopCurrentSource(500)
    }

    this.currentSource = source
    const buffer = await this.getBufferForSource(source)

    if (!buffer || !this.audioContext || !this.bgmGain) return

    this.createBufferSource(buffer, source, { fadeIn, loop })
    this.isPlaying = true
    this.notifyListeners()
  }

  private async getBufferForSource(source: AudioSource): Promise<AudioBuffer | null> {
    if (!this.audioContext) {
      await this.resume()
    }

    if (source.type === 'ai-generated' || source.aiGenerated || source.url) {
      const url = source.url || getAudioUrlForStyle(source.segment?.style || 'calm')
      
      if (this.cache.has(source.id)) {
        return this.cache.get(source.id)!
      }
      
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
        this.cache.set(source.id, audioBuffer)
        this.isUsingFallback = false
        this.fallbackReason = null
        this.notifyListeners()
        return audioBuffer
      } catch (error) {
        console.error(`Failed to load audio file: ${url}`, error)
        this.isUsingFallback = true
        this.fallbackReason = `Audio file not found: ${url}, using synthesized fallback`
        this.notifyListeners()
        return this.generateBufferForSource(source)
      }
    } else if (source.type === 'synthesized') {
      if (this.cache.has(source.id)) {
        return this.cache.get(source.id)!
      }
      return this.generateBufferForSource(source)
    } else {
      const url = getAudioUrlForStyle(source.segment?.style || 'calm')
      
      if (this.cache.has(source.id)) {
        return this.cache.get(source.id)!
      }
      
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
        this.cache.set(source.id, audioBuffer)
        this.isUsingFallback = false
        this.fallbackReason = null
        this.notifyListeners()
        return audioBuffer
      } catch (error) {
        console.error(`Failed to load audio file: ${url}`, error)
        this.isUsingFallback = true
        this.fallbackReason = `Audio file not found: ${url}, using synthesized fallback`
        this.notifyListeners()
        return this.generateBufferForSource(source)
      }
    }

    return null
  }

  private generateBufferForSource(source: AudioSource): AudioBuffer | null {
    if (!this.audioContext || !this.musicGenerator) return null

    const segment = source.segment
    const style = segment?.style.toLowerCase() || 'calm'
    const energy = segment?.energy || 50
    const tempo = segment?.tempo || 100
    const key = segment?.key || 'C Major'
    const duration = segment?.duration || 30

    const config: MusicGeneratorConfig = {
      style: style.charAt(0).toUpperCase() + style.slice(1) as any,
      energy,
      tempo,
      key,
      duration
    }

    const buffer = this.musicGenerator.generateAudioBuffer(config)
    this.cache.set(source.id, buffer)
    return buffer
  }

  private createBufferSource(
    buffer: AudioBuffer,
    source: AudioSource,
    options: { fadeIn: number; loop: boolean }
  ): void {
    if (!this.audioContext || !this.bgmGain) return

    const bufferSource = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()

    bufferSource.buffer = buffer
    bufferSource.loop = options.loop
    
    const baseRate = source.segment?.tempo ? source.segment.tempo / 100 : 1
    const rateRange = 0.8 + (this.energy / 100) * 0.4
    bufferSource.playbackRate.value = Math.min(1.3, Math.max(0.8, baseRate * rateRange))

    gainNode.gain.value = 0

    bufferSource.connect(gainNode)
    gainNode.connect(this.bgmGain)

    bufferSource.start()

    const startTime = this.audioContext.currentTime
    const targetVolume = this.getVolumeForEnergy()

    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(targetVolume, startTime + options.fadeIn / 1000)

    bufferSource.onended = () => {
      if (!bufferSource.loop && this.currentSource?.id === source.id) {
        this.isPlaying = false
        this.currentSource = null
        this.activeBufferSource = null
        this.activeGainNode = null
        this.notifyListeners()
      }
    }

    this.activeBufferSource = bufferSource
    this.activeGainNode = gainNode
  }

  private getVolumeForEnergy(): number {
    return this.baseVolume * (0.3 + this.energy / 150)
  }

  async crossfadeTo(source: AudioSource, duration: number = 1000): Promise<void> {
    await this.resume()

    if (!this.isPlaying) {
      await this.play(source, { fadeIn: duration })
      return
    }

    const newBuffer = await this.getBufferForSource(source)
    if (!newBuffer || !this.audioContext || !this.bgmGain) return

    const newSource = this.audioContext.createBufferSource()
    const newGain = this.audioContext.createGain()

    newSource.buffer = newBuffer
    newSource.loop = true

    const baseRate = source.segment?.tempo ? source.segment.tempo / 100 : 1
    const rateRange = 0.8 + (this.energy / 100) * 0.4
    newSource.playbackRate.value = Math.min(1.3, Math.max(0.8, baseRate * rateRange))

    newGain.gain.value = 0

    newSource.connect(newGain)
    newGain.connect(this.bgmGain)

    const oldSource = this.activeBufferSource
    const oldGain = this.activeGainNode
    const startTime = this.audioContext.currentTime

    if (oldSource && oldGain) {
      const currentVolume = oldGain.gain.value

      oldGain.gain.cancelScheduledValues(startTime)
      oldGain.gain.setValueAtTime(currentVolume, startTime)
      oldGain.gain.linearRampToValueAtTime(0, startTime + duration / 1000)

      newGain.gain.setValueAtTime(0, startTime)
      newGain.gain.linearRampToValueAtTime(this.getVolumeForEnergy(), startTime + duration / 1000)

      newSource.start(startTime)

      setTimeout(() => {
        try {
          oldSource.stop()
        } catch {}
      }, duration)
    } else {
      newGain.gain.setValueAtTime(0, startTime)
      newGain.gain.linearRampToValueAtTime(this.getVolumeForEnergy(), startTime + duration / 1000)
      newSource.start(startTime)
    }

    this.activeBufferSource = newSource
    this.activeGainNode = newGain
    this.currentSource = source
    this.notifyListeners()
  }

  private async stopCurrentSource(duration: number = 300): Promise<void> {
    if (!this.activeBufferSource || !this.activeGainNode || !this.audioContext) {
      this.isPlaying = false
      this.notifyListeners()
      return
    }

    const startTime = this.audioContext.currentTime
    const currentVolume = this.activeGainNode.gain.value

    this.activeGainNode.gain.cancelScheduledValues(startTime)
    this.activeGainNode.gain.setValueAtTime(currentVolume, startTime)
    this.activeGainNode.gain.linearRampToValueAtTime(0, startTime + duration / 1000)

    return new Promise(resolve => {
      setTimeout(() => {
        try {
          this.activeBufferSource?.stop()
        } catch {}
        this.activeBufferSource = null
        this.activeGainNode = null
        this.isPlaying = false
        this.notifyListeners()
        resolve()
      }, duration)
    })
  }

  setEnergy(energy: number): void {
    this.energy = Math.max(0, Math.min(100, energy))

    if (this.audioContext && this.masterGain) {
      const targetVolume = this.getVolumeForEnergy()
      this.masterGain.gain.setTargetAtTime(targetVolume, this.audioContext.currentTime, 0.1)
    }

    if (this.activeBufferSource) {
      const segment = this.currentSource?.segment
      if (segment) {
        const baseRate = segment.tempo / 100
        const rateRange = 0.8 + (this.energy / 100) * 0.4
        this.activeBufferSource.playbackRate.setTargetAtTime(
          Math.min(1.3, Math.max(0.8, baseRate * rateRange)),
          this.audioContext!.currentTime,
          0.2
        )
      }
    }
    this.notifyListeners()
  }

  setTempo(tempo: number): void {
    this.tempo = Math.max(60, Math.min(200, tempo))

    if (this.activeBufferSource) {
      const segment = this.currentSource?.segment
      if (segment) {
        const baseRate = this.tempo / 100
        const rateRange = 0.8 + (this.energy / 100) * 0.4
        this.activeBufferSource.playbackRate.setTargetAtTime(
          Math.min(1.3, Math.max(0.8, baseRate * rateRange)),
          this.audioContext!.currentTime,
          0.2
        )
      }
    }
    this.notifyListeners()
  }

  setVolume(volume: number): void {
    this.baseVolume = Math.max(0, Math.min(1, volume))

    if (this.audioContext && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.baseVolume, this.audioContext.currentTime, 0.1)
    }
    this.notifyListeners()
  }

  pause(): void {
    if (this.activeBufferSource) {
      try {
        this.activeBufferSource.stop()
      } catch {}
      this.activeBufferSource = null
    }
    this.isPlaying = false
    this.notifyListeners()
  }

  unpause(): void {
    if (this.currentSource) {
      this.play(this.currentSource, { fadeIn: 500, loop: true })
    }
  }

  stop(): void {
    this.stopCurrentSource(300)
  }

  getCachedSegments(): string[] {
    return Array.from(this.cache.keys())
  }

  clearCache(): void {
    this.cache.clear()
  }

  destroy(): void {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

export const audioManager = new AudioManager()