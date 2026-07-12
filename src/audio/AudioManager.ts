import type { MusicSegment, RouteStep } from '@/api'

export interface AudioSource {
  id: string
  type: 'synthesized' | 'url'
  url?: string
  segment?: MusicSegment
  step?: RouteStep
}

export interface PlaybackState {
  isPlaying: boolean
  currentSource: AudioSource | null
  volume: number
  tempo: number
  energy: number
}

export class AudioManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private bgmGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private currentSource: AudioSource | null = null
  private isPlaying = false
  private fadeInProgress = false
  private fadeOutProgress = false
  private crossfadeSources: { active: AudioBufferSourceNode | null; fading: AudioBufferSourceNode | null } = { active: null, fading: null }
  private cache = new Map<string, AudioBuffer>()
  private energy = 50
  private tempo = 100
  private baseVolume = 0.5
  private synthEngine: SynthEngine | null = null
  private loopInterval: number | null = null

  get playbackState(): PlaybackState {
    return {
      isPlaying: this.isPlaying,
      currentSource: this.currentSource,
      volume: this.masterGain?.gain.value || 0,
      tempo: this.tempo,
      energy: this.energy
    }
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

      this.synthEngine = new SynthEngine(this.audioContext, this.bgmGain)
    }
  }

  async resume(): Promise<void> {
    this.initContext()
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  async preload(sources: AudioSource[]): Promise<void> {
    this.initContext()
    for (const source of sources) {
      if (!this.cache.has(source.id)) {
        if (source.type === 'url' && source.url) {
          try {
            const response = await fetch(source.url)
            const arrayBuffer = await response.arrayBuffer()
            const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
            this.cache.set(source.id, audioBuffer)
          } catch (error) {
            console.warn(`Failed to preload ${source.id}:`, error)
          }
        } else if (source.type === 'synthesized') {
          this.cache.set(source.id, this.synthEngine!.generateSegment(source))
        }
      }
    }
  }

  async play(source: AudioSource, options: { fadeIn?: number; loop?: boolean } = {}): Promise<void> {
    await this.resume()

    const fadeIn = options.fadeIn ?? 1000
    const loop = options.loop ?? true

    if (this.currentSource?.id === source.id && this.isPlaying) {
      return
    }

    if (this.isPlaying) {
      await this.fadeOut(500)
    }

    this.currentSource = source

    if (source.type === 'synthesized') {
      this.synthEngine!.start(source, { energy: this.energy, tempo: this.tempo, loop })
    } else {
      const buffer = this.cache.get(source.id)
      if (buffer) {
        this.playBuffer(buffer, source, { fadeIn, loop })
      }
    }

    this.isPlaying = true
    this.fadeIn(fadeIn)
  }

  private playBuffer(buffer: AudioBuffer, _source: AudioSource, options: { fadeIn?: number; loop?: boolean }): void {
    if (!this.audioContext || !this.bgmGain) return

    const audioSource = this.audioContext.createBufferSource()
    audioSource.buffer = buffer
    audioSource.loop = options.loop ?? true
    audioSource.connect(this.bgmGain)
    audioSource.start()

    this.crossfadeSources.active = audioSource
  }

  async crossfadeTo(source: AudioSource, duration: number = 1000): Promise<void> {
    await this.resume()

    if (!this.isPlaying) {
      await this.play(source, { fadeIn: duration })
      return
    }

    const newBuffer = source.type === 'synthesized'
      ? this.synthEngine!.generateSegment(source)
      : this.cache.get(source.id)

    if (!newBuffer || !this.audioContext || !this.bgmGain) return

    const newSource = this.audioContext.createBufferSource()
    newSource.buffer = newBuffer
    newSource.loop = true

    const newGain = this.audioContext.createGain()
    newGain.gain.value = 0

    newSource.connect(newGain)
    newGain.connect(this.bgmGain)

    const oldSource = this.crossfadeSources.active
    const oldGain = this.bgmGain

    if (oldSource) {
      const startTime = this.audioContext.currentTime
      
      oldGain.gain.cancelScheduledValues(startTime)
      oldGain.gain.setValueAtTime(oldGain.gain.value, startTime)
      oldGain.gain.linearRampToValueAtTime(0, startTime + duration / 1000)

      newGain.gain.setValueAtTime(0, startTime)
      newGain.gain.linearRampToValueAtTime(1, startTime + duration / 1000)

      newSource.start(startTime)

      setTimeout(() => {
        oldSource.stop()
        this.crossfadeSources.active = newSource
      }, duration)
    }

    this.currentSource = source
  }

  async fadeIn(duration: number = 1000): Promise<void> {
    if (this.fadeInProgress || !this.masterGain) return
    this.fadeInProgress = true

    if (!this.audioContext) await this.resume()
    if (!this.audioContext) return

    const startTime = this.audioContext.currentTime
    const targetVolume = this.baseVolume * (1 + this.energy / 200)

    this.masterGain.gain.cancelScheduledValues(startTime)
    this.masterGain.gain.setValueAtTime(0, startTime)
    this.masterGain.gain.linearRampToValueAtTime(targetVolume, startTime + duration / 1000)

    await new Promise(resolve => setTimeout(resolve, duration))
    this.fadeInProgress = false
  }

  async fadeOut(duration: number = 1000): Promise<void> {
    if (this.fadeOutProgress || !this.masterGain) return
    this.fadeOutProgress = true

    if (!this.audioContext) await this.resume()
    if (!this.audioContext) return

    const startTime = this.audioContext.currentTime

    this.masterGain.gain.cancelScheduledValues(startTime)
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, startTime)
    this.masterGain.gain.linearRampToValueAtTime(0, startTime + duration / 1000)

    await new Promise(resolve => setTimeout(resolve, duration))
    this.fadeOutProgress = false
    this.isPlaying = false

    if (this.synthEngine) {
      this.synthEngine.stop()
    }

    if (this.crossfadeSources.active) {
      try {
        this.crossfadeSources.active.stop()
      } catch {}
      this.crossfadeSources.active = null
    }
  }

  setEnergy(energy: number): void {
    this.energy = Math.max(0, Math.min(100, energy))
    
    if (this.audioContext && this.masterGain) {
      const targetVolume = this.baseVolume * (0.3 + this.energy / 150)
      this.masterGain.gain.setTargetAtTime(targetVolume, this.audioContext.currentTime, 0.1)
    }

    if (this.synthEngine) {
      this.synthEngine.setEnergy(this.energy)
    }
  }

  setTempo(tempo: number): void {
    this.tempo = Math.max(60, Math.min(200, tempo))
    
    if (this.synthEngine) {
      this.synthEngine.setTempo(this.tempo)
    }
  }

  setVolume(volume: number): void {
    this.baseVolume = Math.max(0, Math.min(1, volume))
    
    if (this.audioContext && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.baseVolume, this.audioContext.currentTime, 0.1)
    }
  }

  pause(): void {
    if (this.synthEngine) {
      this.synthEngine.pause()
    }
    this.isPlaying = false
  }

  unpause(): void {
    if (this.synthEngine) {
      this.synthEngine.resume()
    }
    this.isPlaying = true
  }

  stop(): void {
    this.fadeOut(300)
  }

  getCachedSegments(): string[] {
    return Array.from(this.cache.keys())
  }

  clearCache(): void {
    this.cache.clear()
  }

  destroy(): void {
    this.stop()
    if (this.loopInterval) {
      clearInterval(this.loopInterval)
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

class SynthEngine {
  private audioContext: AudioContext
  private destination: AudioNode
  private oscillators: Map<string, OscillatorNode[]> = new Map()
  private gainNodes: Map<string, GainNode[]> = new Map()
  private patterns: Map<string, number[]> = new Map()
  private isPlaying = false
  private currentPatternId = ''
  private energy = 50
  private tempo = 100
  private noteDuration = 0.5
  private playHead = 0
  private intervalId: number | null = null

  constructor(audioContext: AudioContext, destination: AudioNode) {
    this.audioContext = audioContext
    this.destination = destination
    this.updateNoteDuration()
  }

  private updateNoteDuration(): void {
    this.noteDuration = 60 / this.tempo
  }

  generateSegment(source: AudioSource): AudioBuffer {
    const duration = source.segment?.duration || 30
    const buffer = this.audioContext.createBuffer(2, duration * this.audioContext.sampleRate, this.audioContext.sampleRate)
    
    return buffer
  }

  start(source: AudioSource, options: { energy: number; tempo: number; loop: boolean }): void {
    this.stop()

    this.energy = options.energy
    this.tempo = options.tempo
    this.updateNoteDuration()
    this.currentPatternId = source.id
    this.isPlaying = true

    this.createPattern(source)
    this.startPlayback()
  }

  private createPattern(source: AudioSource): void {
    const style = source.segment?.style || source.step?.type || 'calm'
    const key = source.segment?.key || 'C Major'
    
    const patterns: Record<string, number[]> = {
      calm: this.generateScalePattern(key, 0.2),
      build: this.generateScalePattern(key, 0.3),
      cruise: this.generateChordPattern(key, 0.4),
      peak: this.generateArpeggioPattern(key, 0.6),
      ending: this.generateScalePattern(key, 0.15)
    }

    this.patterns.set(source.id, patterns[style] || patterns.calm)
  }

  private generateScalePattern(key: string, density: number): number[] {
    const scales: Record<string, number[]> = {
      'C Major': [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88],
      'A Minor': [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00],
      'F Major': [174.61, 196.00, 220.00, 233.08, 261.63, 293.66, 329.63],
      'D Minor': [146.83, 164.81, 174.61, 196.00, 220.00, 233.08, 261.63],
      'G Major': [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 369.99]
    }

    const scale = scales[key] || scales['C Major']
    const pattern: number[] = []
    
    for (let i = 0; i < 32; i++) {
      if (Math.random() < density) {
        const noteIndex = i % scale.length
        const octave = Math.floor(i / scale.length)
        pattern.push(scale[noteIndex] * Math.pow(2, octave > 0 ? 1 : 0))
      } else {
        pattern.push(0)
      }
    }
    
    return pattern
  }

  private generateChordPattern(key: string, density: number): number[] {
    const chords: Record<string, number[][]> = {
      'C Major': [[261.63, 329.63, 392.00], [293.66, 349.23, 440.00], [329.63, 392.00, 493.88]],
      'A Minor': [[220.00, 261.63, 329.63], [246.94, 293.66, 349.23], [261.63, 329.63, 392.00]],
      'F Major': [[174.61, 220.00, 261.63], [196.00, 233.08, 293.66], [220.00, 261.63, 329.63]],
      'D Minor': [[146.83, 174.61, 220.00], [164.81, 196.00, 233.08], [174.61, 220.00, 261.63]],
      'G Major': [[196.00, 246.94, 293.66], [220.00, 261.63, 329.63], [246.94, 293.66, 369.99]]
    }

    const chordSet = chords[key] || chords['C Major']
    const pattern: number[] = []
    
    for (let i = 0; i < 32; i++) {
      if (Math.random() < density) {
        const chord = chordSet[i % chordSet.length]
        pattern.push(...chord)
      } else {
        pattern.push(0)
      }
    }
    
    return pattern
  }

  private generateArpeggioPattern(key: string, density: number): number[] {
    const scales: Record<string, number[]> = {
      'C Major': [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88],
      'A Minor': [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00],
      'F Major': [174.61, 196.00, 220.00, 233.08, 261.63, 293.66, 329.63],
      'D Minor': [146.83, 164.81, 174.61, 196.00, 220.00, 233.08, 261.63],
      'G Major': [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 369.99]
    }

    const scale = scales[key] || scales['C Major']
    const pattern: number[] = []
    
    for (let i = 0; i < 64; i++) {
      if (Math.random() < density) {
        const noteIndex = i % scale.length
        const octave = Math.floor(i / scale.length) % 3
        pattern.push(scale[noteIndex] * Math.pow(2, octave))
      } else {
        pattern.push(0)
      }
    }
    
    return pattern
  }

  private startPlayback(): void {
    this.playHead = 0
    
    const playNote = () => {
      if (!this.isPlaying) return

      const pattern = this.patterns.get(this.currentPatternId)
      if (!pattern) return

      const note = pattern[this.playHead % pattern.length]
      
      if (note > 0) {
        this.playTone(note)
      }

      this.playHead++
      this.intervalId = window.setTimeout(playNote, this.noteDuration * 1000 * 0.5)
    }

    playNote()
  }

  private playTone(frequency: number): void {
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.type = this.energy > 70 ? 'sawtooth' : this.energy > 40 ? 'triangle' : 'sine'
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    
    const volume = (this.energy / 200) * (0.3 + Math.random() * 0.2)
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + this.noteDuration)
    
    oscillator.connect(gainNode)
    gainNode.connect(this.destination)
    
    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + this.noteDuration)
  }

  setEnergy(energy: number): void {
    this.energy = energy
  }

  setTempo(tempo: number): void {
    this.tempo = tempo
    this.updateNoteDuration()
    
    if (this.intervalId) {
      clearTimeout(this.intervalId)
      if (this.isPlaying) {
        this.startPlayback()
      }
    }
  }

  pause(): void {
    this.isPlaying = false
    if (this.intervalId) {
      clearTimeout(this.intervalId)
    }
  }

  resume(): void {
    this.isPlaying = true
    this.startPlayback()
  }

  stop(): void {
    this.isPlaying = false
    if (this.intervalId) {
      clearTimeout(this.intervalId)
      this.intervalId = null
    }
    
    this.oscillators.forEach(oscillators => {
      oscillators.forEach(osc => {
        try { osc.stop() } catch {}
      })
    })
    this.oscillators.clear()
    this.gainNodes.clear()
  }
}

export const audioManager = new AudioManager()
