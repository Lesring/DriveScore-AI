const fs = require('fs')
const path = require('path')
const https = require('https')
const FormData = require('form-data')

const API_BASE_URL = 'https://api.stability.ai'
const API_VERSION = 'v2beta'
const API_KEY = process.env.VITE_STABILITY_API_KEY || 'sk-IjTbXWIzQtyeIatGfW4PcDLcsGjyXWxTUemdqzGNABqdP0m2'

const SHARED_SONIC_IDENTITY = {
  genreFamily: 'cinematic electronic / ambient synthwave',
  coreInstruments: ['warm analog pads', 'soft piano', 'subtle synth bass', 'light electronic percussion'],
  optionalInstruments: ['soft arpeggio', 'filtered drums', 'airy textures'],
  forbiddenInstruments: ['distorted guitar', 'heavy metal', 'orchestral trailer brass', 'lo-fi hiphop vinyl crackle', 'folk acoustic', 'progressive house drop'],
  baseTempo: 100,
  baseEnergy: 50
}

const MUSIC_STYLES = {
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

const buildPrompt = (config) => {
  const baseInstruments = [...new Set([...SHARED_SONIC_IDENTITY.coreInstruments, ...config.instruments])]
  const sharedInstruments = baseInstruments.join(', ')
  
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

  return `Create phase "${config.style}" of ONE continuous cinematic-electronic driving soundtrack suite. Keep the SAME sonic identity across all journey phases. Shared genre family: ${SHARED_SONIC_IDENTITY.genreFamily}. Genre: ${config.genre}. Shared palette: ${sharedInstruments}. This phase role: ${config.phaseRole}. Tempo: ${config.tempo} BPM. Energy: ${config.energy}/100. Mood: ${config.mood}. Make it sound like a variation of the same theme, not a different song. Instrumental only, seamless loop-friendly, clean mix, suitable as in-car background music. Avoid: ${negativeConstraints.join(', ')}. ${config.description}`
}

const generateAudio = async (prompt, seed, duration = 30) => {
  const url = `${API_BASE_URL}/${API_VERSION}/audio/stable-audio-2/text-to-audio`
  const parsedUrl = new URL(url)
  
  const form = new FormData()
  form.append('prompt', prompt)
  form.append('seconds_total', duration.toString())
  form.append('seed', seed.toString())
  form.append('steps', '100')
  form.append('guidance_scale', '3.0')

  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      ...form.getHeaders()
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', (chunk) => {
        chunks.push(chunk)
      })
      res.on('end', () => {
        const data = Buffer.concat(chunks)
        
        if (res.statusCode !== 200) {
          try {
            const errorText = data.toString('utf-8')
            const errorJson = JSON.parse(errorText)
            reject(new Error(`Stable Audio API error: ${res.statusCode} - ${errorJson.errors?.join(', ') || errorText}`))
          } catch {
            reject(new Error(`Stable Audio API error: ${res.statusCode}`))
          }
          return
        }
        
        const contentType = res.headers['content-type'] || ''
        if (contentType.includes('application/json')) {
          try {
            const result = JSON.parse(data.toString('utf-8'))
            resolve({ type: 'json', data: result })
          } catch {
            resolve({ type: 'audio', data, contentType })
          }
        } else {
          resolve({ type: 'audio', data, contentType })
        }
      })
    })
    req.on('error', reject)
    form.pipe(req)
  })
}

const main = async () => {
  const journeySeed = 123456
  const outputDir = path.join(__dirname, '../public/music')
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  console.log(`=== Generating Journey Music with Seed: ${journeySeed} ===`)
  console.log(`Output directory: ${outputDir}`)
  console.log('')

  const styles = Object.keys(MUSIC_STYLES)
  
  for (let i = 0; i < styles.length; i++) {
    const styleKey = styles[i]
    const config = MUSIC_STYLES[styleKey]
    
    console.log(`[${i + 1}/${styles.length}] Generating ${config.style}...`)
    
    try {
      const prompt = buildPrompt(config)
      console.log(`  Prompt: ${prompt.substring(0, 150)}...`)
      
      const startTime = Date.now()
      const result = await generateAudio(prompt, journeySeed, 30)
      const duration = Math.floor((Date.now() - startTime) / 1000)
      
      if (result.type === 'audio') {
        const outputPath = path.join(outputDir, `${config.style}.wav`)
        fs.writeFileSync(outputPath, result.data)
        
        const stats = fs.statSync(outputPath)
        console.log(`  ✓ Successfully generated (${duration}s, ${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
      } else {
        console.log(`  ✗ Unexpected response type: ${result.type}`)
        console.log(`  Response: ${JSON.stringify(result.data).substring(0, 200)}`)
      }
    } catch (error) {
      console.error(`  ✗ Failed: ${error.message}`)
    }
    
    console.log('')
  }
  
  console.log('=== Generation Complete ===')
}

main().catch(console.error)