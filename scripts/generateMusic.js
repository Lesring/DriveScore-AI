import fs from 'fs'
import path from 'path'

const SAMPLE_RATE = 44100
const DURATION = 15
const CHANNELS = 2

function writeWavFile(filePath, audioData) {
  const bytesPerSample = 2
  const dataSize = audioData.length * CHANNELS * bytesPerSample
  const buffer = Buffer.alloc(44 + dataSize)
  
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(CHANNELS, 22)
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(SAMPLE_RATE * CHANNELS * bytesPerSample, 28)
  buffer.writeUInt16LE(CHANNELS * bytesPerSample, 32)
  buffer.writeUInt16LE(bytesPerSample * 8, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  
  let offset = 44
  for (const sample of audioData) {
    const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)))
    buffer.writeInt16LE(intSample, offset)
    buffer.writeInt16LE(intSample, offset + bytesPerSample)
    offset += bytesPerSample * CHANNELS
  }
  
  fs.writeFileSync(filePath, buffer)
}

function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t)
}

function sawtooth(freq, t) {
  const period = 1 / freq
  return ((t % period) / period) * 2 - 1
}

function triangle(freq, t) {
  const period = 1 / freq
  const phase = (t % period) / period
  return phase < 0.5 ? phase * 4 - 1 : (1 - phase) * 4 - 1
}

function square(freq, t) {
  return Math.sign(sine(freq, t))
}

function noise() {
  return (Math.random() * 2 - 1) * 0.3
}

function envelope(t, duration, attack = 0.1, decay = 0.1, sustain = 0.7, release = 0.1) {
  if (t < attack * duration) {
    return (t / (attack * duration)) * sustain
  } else if (t < (attack + decay) * duration) {
    const d = t - attack * duration
    return sustain - (d / (decay * duration)) * (sustain * 0.2)
  } else if (t > (1 - release) * duration) {
    const r = t - (1 - release) * duration
    return (sustain * 0.8) * (1 - r / (release * duration))
  }
  return sustain * 0.8
}

function generateCalm() {
  const samples = []
  const length = SAMPLE_RATE * DURATION
  
  const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88]
  
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE
    let sample = 0
    
    const chord = [scale[0], scale[2], scale[4]]
    for (const freq of chord) {
      sample += sine(freq * 0.5, t) * envelope(t, DURATION, 0.2, 0.2, 0.5, 0.3) * 0.3
    }
    
    const note = scale[Math.floor((t * 0.5) % scale.length)]
    sample += sine(note, t) * envelope(t % 4, 4, 0.3, 0.3, 0.4, 0.4) * 0.2
    
    if (t % 8 < 2) {
      sample += sine(scale[3] * 0.5, t) * 0.15
    }
    
    sample += noise() * 0.05
    
    samples.push(sample * 0.4)
  }
  
  return samples
}

function generateBuild() {
  const samples = []
  const length = SAMPLE_RATE * DURATION
  
  const scale = [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00]
  
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE
    const beat = Math.floor(t * 3)
    const beatPhase = t * 3 - beat
    let sample = 0
    
    const chord = scale.slice(0, 4)
    for (const freq of chord) {
      sample += sine(freq * 0.25, t) * envelope(beatPhase, 1/3, 0.1, 0.2, 0.7, 0.3) * 0.4
    }
    
    if (beat % 4 === 0) {
      sample += sine(scale[4], t) * envelope(beatPhase, 1/3, 0.05, 0.3, 0.6, 0.4) * 0.3
    } else if (beat % 2 === 0) {
      sample += sine(scale[2], t) * envelope(beatPhase, 1/3, 0.05, 0.3, 0.6, 0.4) * 0.2
    }
    
    const bassFreq = scale[0] / 2
    sample += sine(bassFreq, t) * 0.15
    
    sample += noise() * 0.08
    
    samples.push(sample * 0.45)
  }
  
  return samples
}

function generateCruise() {
  const samples = []
  const length = SAMPLE_RATE * DURATION
  
  const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88]
  
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE
    const beat = Math.floor(t * 4)
    const beatPhase = t * 4 - beat
    let sample = 0
    
    const chords = [
      [scale[0], scale[2], scale[4]],
      [scale[4], scale[6], scale[1]],
      [scale[5], scale[0], scale[2]],
      [scale[3], scale[5], scale[0]]
    ]
    
    const chord = chords[beat % chords.length]
    for (const freq of chord) {
      sample += sine(freq * 0.5, t) * envelope(beatPhase, 0.25, 0.05, 0.1, 0.85, 0.1) * 0.3
      sample += triangle(freq * 0.25, t) * 0.15
    }
    
    if (beat % 8 === 0) {
      sample += sine(scale[4], t) * envelope(beatPhase, 0.25, 0.02, 0.15, 0.7, 0.2) * 0.25
    } else if (beat % 2 === 0) {
      const note = scale[(beat / 2 + 2) % scale.length]
      sample += sawtooth(note, t) * envelope(beatPhase, 0.25, 0.02, 0.2, 0.6, 0.2) * 0.15
    }
    
    const kick = beat % 4 === 0
    if (kick && beatPhase < 0.1) {
      sample += sine(80 * (1 - beatPhase * 10), t) * (1 - beatPhase * 10) * 0.4
    }
    
    const hihat = beat % 2 === 0
    if (hihat && beatPhase < 0.05) {
      sample += noise() * (1 - beatPhase * 20) * 0.15
    }
    
    samples.push(sample * 0.4)
  }
  
  return samples
}

function generatePeak() {
  const samples = []
  const length = SAMPLE_RATE * DURATION
  
  const scale = [293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]
  
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE
    const beat = Math.floor(t * 5)
    const beatPhase = t * 5 - beat
    let sample = 0
    
    const chord = [scale[0], scale[2], scale[4]]
    for (const freq of chord) {
      sample += square(freq * 0.5, t) * envelope(beatPhase, 0.2, 0.02, 0.1, 0.8, 0.15) * 0.25
      sample += sawtooth(freq * 0.25, t) * 0.15
    }
    
    if (beat % 2 === 0) {
      const note = scale[(beat + 1) % scale.length]
      sample += square(note, t) * envelope(beatPhase, 0.2, 0.01, 0.15, 0.6, 0.25) * 0.2
    }
    
    const kick = beat % 4 === 0
    if (kick && beatPhase < 0.08) {
      sample += sine(60 * (1 - beatPhase * 12), t) * (1 - beatPhase * 12) * 0.5
    }
    
    const snare = beat % 4 === 2
    if (snare && beatPhase < 0.1) {
      sample += noise() * (1 - beatPhase * 10) * 0.3
    }
    
    for (let h = 0; h < 4; h++) {
      if (beatPhase > h * 0.25 && beatPhase < h * 0.25 + 0.03) {
        sample += noise() * 0.1
      }
    }
    
    sample += noise() * 0.12
    
    samples.push(sample * 0.35)
  }
  
  return samples
}

function generateEnding() {
  const samples = []
  const length = SAMPLE_RATE * DURATION
  
  const scale = [392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 698.46]
  
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE
    const fadeFactor = Math.max(0, 1 - t / DURATION)
    let sample = 0
    
    const chord = [scale[0], scale[2], scale[4], scale[6]]
    for (const freq of chord) {
      sample += sine(freq * 0.5, t) * envelope(t, DURATION, 0.3, 0.2, 0.5, 0.5) * 0.3
    }
    
    if (t % 6 < 3) {
      const note = scale[Math.floor((t * 0.3) % scale.length)]
      sample += sine(note, t) * envelope(t % 6, 6, 0.5, 0.3, 0.4, 0.5) * 0.15
    }
    
    sample += noise() * 0.03
    
    samples.push(sample * 0.35 * fadeFactor)
  }
  
  return samples
}

const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1')
const outputDir = path.join(__dirname, '../public/music')

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

console.log('Generating Calm.wav...')
writeWavFile(path.join(outputDir, 'Calm.wav'), generateCalm())

console.log('Generating Build.wav...')
writeWavFile(path.join(outputDir, 'Build.wav'), generateBuild())

console.log('Generating Cruise.wav...')
writeWavFile(path.join(outputDir, 'Cruise.wav'), generateCruise())

console.log('Generating Peak.wav...')
writeWavFile(path.join(outputDir, 'Peak.wav'), generatePeak())

console.log('Generating Ending.wav...')
writeWavFile(path.join(outputDir, 'Ending.wav'), generateEnding())

console.log('Done! All music files generated.')