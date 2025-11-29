import { NextRequest, NextResponse } from 'next/server'

const articleDetails = {
  'bp-home-measurement': {
    id: 'bp-home-measurement',
    title: '家庭血压监测全指南',
    summary: '教你在家里正确测量和记录血压，帮助医生判断病情。',
    content:
      '1. 建议在安静环境下坐位休息 5 分钟后再测量血压。\n\n2. 测量前 30 分钟内避免剧烈运动、喝浓茶或咖啡、吸烟等。',
    category: { id: 'cardio', name: '心血管健康' },
    readCount: 320,
    difficulty: 'basic'
  }
} as const

interface Params {
  params: { id: keyof typeof articleDetails }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const article = articleDetails[params.id]
  if (!article) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(article, { status: 200 })
}

