import { NextRequest, NextResponse } from 'next/server'

type Severity = 'critical' | 'urgent' | 'warning' | 'normal'

interface VitalsSnapshot {
  heartRate?: number
  bloodPressure?: { systolic: number; diastolic: number }
  temperature?: number
  oxygenSaturation?: number
}

function detectSeverity(data: VitalsSnapshot): Severity {
  // 与前端 emergency-monitoring-service.ts 保持大致一致的简化规则
  const abnormalities: Severity[] = []

  if (data.heartRate !== undefined) {
    if (data.heartRate < 40 || data.heartRate > 150) abnormalities.push('critical')
    else if (data.heartRate < 50 || data.heartRate > 120) abnormalities.push('urgent')
    else if (data.heartRate < 60 || data.heartRate > 100) abnormalities.push('warning')
  }

  if (data.temperature !== undefined) {
    if (data.temperature < 35.0 || data.temperature > 40.0) abnormalities.push('critical')
    else if (data.temperature < 35.5 || data.temperature > 39.0) abnormalities.push('urgent')
    else if (data.temperature < 36.0 || data.temperature > 38.0) abnormalities.push('warning')
  }

  if (data.oxygenSaturation !== undefined) {
    if (data.oxygenSaturation < 85) abnormalities.push('critical')
    else if (data.oxygenSaturation < 90) abnormalities.push('urgent')
    else if (data.oxygenSaturation < 95) abnormalities.push('warning')
  }

  if (abnormalities.includes('critical')) return 'critical'
  if (abnormalities.includes('urgent')) return 'urgent'
  if (abnormalities.includes('warning')) return 'warning'
  return 'normal'
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as VitalsSnapshot
  const severity = detectSeverity(body)

  const actions =
    severity === 'critical'
      ? ['call_120', 'call_doctor', 'alert_family']
      : severity === 'urgent'
      ? ['call_doctor', 'call_120', 'alert_family']
      : severity === 'warning'
      ? ['call_doctor', 'alert_family']
      : []

  return NextResponse.json(
    {
      severity,
      actions
    },
    { status: 200 }
  )
}

