import { NextRequest, NextResponse } from 'next/server'

// 简化版：暂时返回固定统计数据，后续可接入数据库中的紧急事件记录
export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      last24hCount: 0,
      totalCount: 0
    },
    { status: 200 }
  )
}

