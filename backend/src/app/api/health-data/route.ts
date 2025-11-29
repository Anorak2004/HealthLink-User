import { NextRequest, NextResponse } from 'next/server'

// 临时内存存储，后续可替换为数据库
const records: any[] = []

export async function GET(_req: NextRequest) {
  // 返回最近的健康记录（简化版）
  return NextResponse.json(records, { status: 200 })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const record = {
    id: Date.now().toString(),
    type: body.type,
    value: body.value,
    date: body.date,
    time: body.time
  }
  records.unshift(record)
  return NextResponse.json({ success: true, id: record.id }, { status: 201 })
}

