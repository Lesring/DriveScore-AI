export interface AnalyzeRoutePromptInput {
  start: string
  end: string
  weather: string
  estimatedTime: number
  driverStyle: string
}

export interface GenerateMusicPromptInput {
  journeyBlueprint: {
    steps: Array<{
      name: string
      type: string
      duration: number
      speed: number
      energy?: number
      tempo?: number
    }>
  }
}

export interface PredictPromptInput {
  currentSpeed: number
  currentRoad: string
  nextRoad: string
  estimatedTime: number
}

export const analyzeRoutePrompt = (input: AnalyzeRoutePromptInput): string => {
  return `You are an AI Journey Music Engine. Analyze the driving route and create a Journey Blueprint for ONE continuous cinematic-electronic driving soundtrack suite.

Input:
- Start: ${input.start}
- End: ${input.end}
- Weather: ${input.weather}
- Estimated Time: ${input.estimatedTime} minutes
- Driver Style: ${input.driverStyle}

Generate a Journey Blueprint with 5 phases: Urban → Build → Highway → Peak → Ending.

IMPORTANT CONSTRAINTS:
- All 5 phases must share the SAME musical palette, same instrument family, and same tonal color
- Use a journey-level unified mood (cinematic electronic / ambient synthwave style)
- Each phase only changes: energy level, tempo, arrangement density, not genre or instrument family
- Recommend the SAME key or closely related keys (e.g., all in C major / A minor family)
- Energy curve: Calm < Build < Cruise < Peak > Ending

For each phase, provide:
- name: The phase name (Urban, Build, Highway, Peak, Ending)
- type: Road type (city, elevated, highway, urban, end)
- duration: Duration in seconds
- speed: Average speed in km/h
- energy: Energy level 0-100 (following energy curve)
- tempo: BPM (beats per minute, following energy curve)
- emotion: Emotion intensity description (same theme, different intensity)
- reason: Why this phase intensity is selected

Output ONLY valid JSON with this structure:
{
  "destination": "${input.end}",
  "estimatedTime": ${input.estimatedTime},
  "weather": "${input.weather}",
  "traffic": "Light",
  "driverStyle": "${input.driverStyle}",
  "mood": "Cinematic Electronic",
  "musicalKey": "string (e.g., C Major)",
  "steps": [
    { "id": 1, "name": "Urban", "type": "city", "duration": number, "speed": number, "energy": number, "tempo": number, "emotion": "string", "reason": "string" },
    { "id": 2, "name": "Build", "type": "elevated", "duration": number, "speed": number, "energy": number, "tempo": number, "emotion": "string", "reason": "string" },
    { "id": 3, "name": "Highway", "type": "highway", "duration": number, "speed": number, "energy": number, "tempo": number, "emotion": "string", "reason": "string" },
    { "id": 4, "name": "Peak", "type": "highway", "duration": number, "speed": number, "energy": number, "tempo": number, "emotion": "string", "reason": "string" },
    { "id": 5, "name": "Ending", "type": "urban", "duration": number, "speed": number, "energy": number, "tempo": number, "emotion": "string", "reason": "string" }
  ]
}

Do NOT include any markdown formatting or extra text.`
}

export const generateMusicPrompt = (input: GenerateMusicPromptInput): string => {
  const steps = input.journeyBlueprint.steps.map(s => 
    `- ${s.name}: ${s.type}, ${s.duration}s, ${s.speed}km/h, energy ${s.energy ?? 50}, tempo ${s.tempo ?? 100}`
  ).join('\n')
  
  return `You are an AI Music Composer for driving experiences. Generate music segments for ONE continuous cinematic-electronic driving soundtrack suite.

Journey Blueprint:
${steps}

IMPORTANT CONSTRAINTS:
- All 5 segments must share the SAME musical palette, same instrument family, and same tonal color
- Use cinematic electronic / ambient synthwave style for all segments
- All segments should be in the SAME key or closely related keys (e.g., C major / A minor family)
- Emotion/reason should emphasize: "same soundtrack suite, different intensity"
- Energy curve: Calm < Build < Cruise < Peak > Ending
- Only change: energy level, tempo, arrangement density. Do NOT change genre or instrument family
- NO conflicting style descriptions (e.g., Calm=jazz, Peak=metal is FORBIDDEN)

Generate 5 music segments (Calm, Build, Cruise, Peak, Ending) for this journey.

For each segment, provide:
- id: Segment ID (e.g., Calm_01)
- style: Music style (Calm, Build, Cruise, Peak, Ending)
- energy: Energy level 0-100 (following energy curve)
- tempo: BPM (following energy curve)
- emotion: Emotion description (same theme, different intensity)
- key: Musical key (same or closely related across all segments)
- duration: Duration in seconds
- reason: Why this intensity is selected (emphasize same soundtrack variation)

Output ONLY valid JSON with this structure:
{
  "status": "completed",
  "segments": [
    { "id": "Calm_01", "style": "Calm", "energy": number, "tempo": number, "emotion": "string", "key": "string", "duration": number, "reason": "string" },
    { "id": "Build_01", "style": "Build", "energy": number, "tempo": number, "emotion": "string", "key": "string", "duration": number, "reason": "string" },
    { "id": "Cruise_02", "style": "Cruise", "energy": number, "tempo": number, "emotion": "string", "key": "string", "duration": number, "reason": "string" },
    { "id": "Peak_01", "style": "Peak", "energy": number, "tempo": number, "emotion": "string", "key": "string", "duration": number, "reason": "string" },
    { "id": "Ending_01", "style": "Ending", "energy": number, "tempo": number, "emotion": "string", "key": "string", "duration": number, "reason": "string" }
  ]
}

Do NOT include any markdown formatting or extra text.`
}

export const predictPrompt = (input: PredictPromptInput): string => {
  return `You are an AI Driving Predictor. Analyze current driving conditions and predict the next music segment.

Current Conditions:
- Current Speed: ${input.currentSpeed} km/h
- Current Road: ${input.currentRoad}
- Next Road: ${input.nextRoad}
- Estimated Time to Next Segment: ${input.estimatedTime} seconds

Predict what music segment should play next and explain why.

Output ONLY valid JSON with this structure:
{
  "upcomingRoad": "${input.nextRoad}",
  "distance": number,
  "eta": ${input.estimatedTime},
  "expectedMusic": "string (Calm, Build, Cruise, Peak, or Ending)",
  "confidence": number (0-100),
  "reason": "string explaining the prediction",
  "nextEnergy": number,
  "nextTempo": number
}

Do NOT include any markdown formatting or extra text.`
}
