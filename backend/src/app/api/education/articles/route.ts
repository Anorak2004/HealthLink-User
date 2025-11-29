import { NextRequest, NextResponse } from 'next/server'

// 简化版：与前端 mock 科普服务保持一致的数据结构
const articles = [
  {
    id: 'bp-home-measurement',
    title: '家庭血压监测全指南',
    summary: '教你在家里正确测量和记录血压，帮助医生判断病情。',
    category: { id: 'cardio', name: '心血管健康' },
    readCount: 320,
    difficulty: 'basic'
  },
  {
    id: 'diabetes-diet',
    title: '糖尿病饮食控制的 5 个关键点',
    summary: '从主食、油脂、饮料等方面，帮你搭建合理饮食结构。',
    category: { id: 'chronic', name: '慢病管理' },
    readCount: 260,
    difficulty: 'basic'
  }
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = (searchParams.get('q') || '').toLowerCase()
  const category = searchParams.get('category') || ''

  let list = articles

  if (query) {
    list = list.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.summary.toLowerCase().includes(query)
    )
  }

  if (category) {
    list = list.filter((a) => a.category.id === category)
  }

  return NextResponse.json(list, { status: 200 })
}

