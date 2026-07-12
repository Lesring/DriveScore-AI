export type MusicStyle = 'Calm' | 'Build' | 'Cruise' | 'Peak' | 'Ending'

export interface MusicGeneratorConfig {
  style: MusicStyle
  energy: number
  tempo: number
  key: string
  duration: number
}

const scales: Record<string, number[]> = {
  'C Major': [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88],
  'A Minor': [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00],
  'F Major': [174.61, 196.00, 220.00, 233.08, 261.63, 293.66, 329.63],
  'D Minor': [146.83, 164.81, 174.61, 196.00, 220.00, 233.08, 261.63],
  'G Major': [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 369.99]
}

const chords: Record<string, number[][]> = {
  'C Major': [[261.63, 329.63, 392.00], [293.66, 349.23, 440.00], [329.63, 392.00, 493.88], [349.23, 440.00, 523.25]],
  'A Minor': [[220.00, 261.63, 329.63], [246.94, 293.66, 349.23], [261.63, 329.63, 392.00], [293.66, 349.23, 440.00]],
  'F Major': [[174.61, 220.00, 261.63], [196.00, 233.08, 293.66], [220.00, 261.63, 329.63], [233.08, 293.66, 349.23]],
  'D Minor': [[146.83, 174.61, 220.00], [164.81, 196.00, 233.08], [174.61, 220.00, 261.63], [196.00, 233.08, 293.66]],
  'G Major': [[196.00, 246.94, 293.66], [220.00, 261.63, 329.63], [246.94, 293.66, 369.99], [261.63, 329.63, 392.00]]
}

export class MusicGenerator {
  private audioContext: AudioContext

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
  }

  generateAudioBuffer(config: MusicGeneratorConfig): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate
    const length = Math.floor(config.duration * sampleRate)
    const buffer = this.audioContext.createBuffer(2, length, sampleRate)
    
    const leftChannel = buffer.getChannelData(0)
    const rightChannel = buffer.getChannelData(1)
    
    const scale = scales[config.key] || scales['C Major']
    const chordSet = chords[config.key] || chords['C Major']
    
    this.fillBuffer(leftChannel, rightChannel, config, scale, chordSet)
    
    return buffer
  }

  private fillBuffer(
    left: Float32Array,
    right: Float32Array,
    config: MusicGeneratorConfig,
    scale: number[],
    chordSet: number[][]
  ): void {
    const sampleRate = this.audioContext.sampleRate
    const bpm = config.tempo
    const beatDuration = 60 / bpm
    const sampleBeat = beatDuration * sampleRate
    
    const style = config.style.toLowerCase()
    const energy = config.energy / 100
    
    for (let i = 0; i < left.length; i++) {
      let sample = 0
      
      const beat = Math.floor(i / sampleBeat)
      const beatPhase = (i % sampleBeat) / sampleBeat
      
      switch (style) {
        case 'calm':
          sample = this.generateCalm(i, sampleRate, scale, chordSet, beat, beatPhase, energy)
          break
        case 'build':
          sample = this.generateBuild(i, sampleRate, scale, chordSet, beat, beatPhase, energy)
          break
        case 'cruise':
          sample = this.generateCruise(i, sampleRate, scale, chordSet, beat, beatPhase, energy)
          break
        case 'peak':
          sample = this.generatePeak(i, sampleRate, scale, chordSet, beat, beatPhase, energy)
          break
        case 'ending':
          sample = this.generateEnding(i, sampleRate, scale, chordSet, beat, beatPhase, energy)
          break
      }
      
      const stereoPan = Math.sin(i * 0.00001) * 0.3
      left[i] = sample * (1 - stereoPan) * 0.3
      right[i] = sample * (1 + stereoPan) * 0.3
    }
    
    this.normalize(left)
    this.normalize(right)
  }

  private generateCalm(
    i: number,
    sampleRate: number,
    scale: number[],
    chordSet: number[][],
    beat: number,
    beatPhase: number,
    energy: number
  ): number {
    let sample = 0
    
    if (beat % 4 === 0) {
      const chord = chordSet[Math.floor(beat / 4) % chordSet.length]
      for (const freq of chord) {
        sample += this.sineWave(i, freq * 0.5, sampleRate) * this.envelope(beatPhase, 2)
      }
    }
    
    if (beat % 2 === 1) {
      const note = scale[(beat + 2) % scale.length]
      sample += this.sineWave(i, note * 0.5, sampleRate) * this.envelope(beatPhase, 1) * 0.5
    }
    
    if (beatPhase < 0.1) {
      const note = scale[beat % scale.length]
      sample += this.sineWave(i, note, sampleRate) * this.envelope(beatPhase * 10, 0.3) * 0.3
    }
    
    sample += this.noise() * 0.05 * energy
    
    return sample * (0.3 + energy * 0.3)
  }

  private generateBuild(
    i: number,
    sampleRate: number,
    scale: number[],
    chordSet: number[][],
    beat: number,
    beatPhase: number,
    energy: number
  ): number {
    let sample = 0
    
    const chord = chordSet[beat % chordSet.length]
    for (const freq of chord) {
      sample += this.sineWave(i, freq * 0.5, sampleRate) * this.envelope(beatPhase, 2) * 0.6
      sample += this.triangleWave(i, freq * 0.25, sampleRate) * this.envelope(beatPhase, 2) * 0.3
    }
    
    const noteIndex = Math.floor(beatPhase * 4)
    if (noteIndex < 3) {
      const note = scale[(beat * 2 + noteIndex) % scale.length]
      sample += this.squareWave(i, note, sampleRate) * this.envelope((beatPhase - noteIndex * 0.25) * 4, 0.5) * 0.2
    }
    
    if (beat % 4 === 0) {
      sample += this.sineWave(i, 60, sampleRate) * this.envelope(beatPhase, 3) * 0.1
    }
    
    sample += this.noise() * 0.08 * energy
    
    return sample * (0.4 + energy * 0.4)
  }

  private generateCruise(
    i: number,
    sampleRate: number,
    scale: number[],
    chordSet: number[][],
    beat: number,
    beatPhase: number,
    energy: number
  ): number {
    let sample = 0
    
    const chord = chordSet[Math.floor(beat / 2) % chordSet.length]
    for (const freq of chord) {
      sample += this.sineWave(i, freq * 0.5, sampleRate) * this.envelope(beatPhase, 2) * 0.5
      sample += this.sawtoothWave(i, freq * 0.25, sampleRate) * this.envelope(beatPhase, 2) * 0.3
    }
    
    const arpeggioIndex = Math.floor(beatPhase * 8)
    const arpeggioNote = scale[(beat * 3 + arpeggioIndex) % scale.length]
    sample += this.squareWave(i, arpeggioNote, sampleRate) * this.envelope((beatPhase - arpeggioIndex * 0.125) * 8, 0.3) * 0.3
    
    if (beat % 2 === 0) {
      sample += this.sineWave(i, 60, sampleRate) * this.envelope(beatPhase, 2) * 0.15
      sample += this.sineWave(i, 80, sampleRate) * this.envelope(beatPhase, 2) * 0.1
    }
    
    sample += this.noise() * 0.1 * energy
    
    return sample * (0.5 + energy * 0.3)
  }

  private generatePeak(
    i: number,
    sampleRate: number,
    scale: number[],
    chordSet: number[][],
    beat: number,
    beatPhase: number,
    energy: number
  ): number {
    let sample = 0
    
    const chord = chordSet[beat % chordSet.length]
    for (const freq of chord) {
      sample += this.sawtoothWave(i, freq * 0.5, sampleRate) * this.envelope(beatPhase, 1.5) * 0.4
      sample += this.squareWave(i, freq * 0.25, sampleRate) * this.envelope(beatPhase, 1.5) * 0.3
    }
    
    const fastNote = scale[(beat * 4 + Math.floor(beatPhase * 16)) % scale.length]
    sample += this.squareWave(i, fastNote, sampleRate) * this.envelope((beatPhase % 0.0625) * 16, 0.2) * 0.3
    
    if (beat % 2 === 0) {
      sample += this.sineWave(i, 40, sampleRate) * this.envelope(beatPhase, 2) * 0.2
      sample += this.sineWave(i, 80, sampleRate) * this.envelope(beatPhase, 2) * 0.15
      sample += this.sineWave(i, 120, sampleRate) * this.envelope(beatPhase, 2) * 0.1
    }
    
    sample += this.noise() * 0.15 * energy
    
    return sample * (0.6 + energy * 0.3)
  }

  private generateEnding(
    i: number,
    sampleRate: number,
    scale: number[],
    chordSet: number[][],
    beat: number,
    beatPhase: number,
    energy: number
  ): number {
    let sample = 0
    
    if (beat % 4 === 0) {
      const chord = chordSet[Math.floor(beat / 4) % chordSet.length]
      for (const freq of chord) {
        sample += this.sineWave(i, freq * 0.5, sampleRate) * this.envelope(beatPhase, 3) * 0.7
      }
    }
    
    if (beat % 2 === 0) {
      const note = scale[(beat + 1) % scale.length]
      sample += this.sineWave(i, note, sampleRate) * this.envelope(beatPhase, 1.5) * 0.3
    }
    
    if (beat % 8 === 4) {
      const note = scale[(beat + 3) % scale.length]
      sample += this.sineWave(i, note * 2, sampleRate) * this.envelope(beatPhase, 1) * 0.2
    }
    
    sample += this.noise() * 0.03 * energy
    
    return sample * (0.3 + energy * 0.2)
  }

  private sineWave(i: number, freq: number, sampleRate: number): number {
    return Math.sin(2 * Math.PI * freq * i / sampleRate)
  }

  private triangleWave(i: number, freq: number, sampleRate: number): number {
    const period = sampleRate / freq
    const phase = (i % period) / period
    return phase < 0.5 ? phase * 4 - 1 : (1 - phase) * 4 - 1
  }

  private squareWave(i: number, freq: number, sampleRate: number): number {
    return Math.sign(Math.sin(2 * Math.PI * freq * i / sampleRate))
  }

  private sawtoothWave(i: number, freq: number, sampleRate: number): number {
    const period = sampleRate / freq
    return ((i % period) / period) * 2 - 1
  }

  private noise(): number {
    return (Math.random() * 2 - 1) * 0.5
  }

  private envelope(t: number, duration: number): number {
    if (t < 0.1 * duration) {
      return t / (0.1 * duration)
    } else if (t > 0.9 * duration) {
      return 1 - (t - 0.9 * duration) / (0.1 * duration)
    }
    return 1
  }

  private normalize(data: Float32Array): void {
    let max = 0
    for (const value of data) {
      max = Math.max(max, Math.abs(value))
    }
    if (max > 0 && max > 1) {
      for (let i = 0; i < data.length; i++) {
        data[i] /= max
      }
    }
  }
}