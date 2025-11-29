import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  // 简化版：返回固定的健康评估结果，后续可接入真实模型/规则
  return NextResponse.json(
    {
      score: 85,
      riskLevel: 'low',
      summary: '您的整体健康状况良好，各项指标基本正常。建议继续保持良好生活方式。',
      recommendations: [
        {
          id: '1',
          icon: '🏃',
          title: '保持规律运动',
          description: '每周中等强度运动 3–4 次，每次 30 分钟以上。'
        }
      ],
      date: new Date().toISOString().slice(0, 10)
    },
    { status: 200 }
  )
}

