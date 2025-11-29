import { NextRequest, NextResponse } from "next/server"
import { evaluateIcer } from "@/lib/economics"
import type { IcerEvaluateRequest } from "@/lib/models"

// 中国 ICER 阈值示例：37,446 元 / DALY（可从环境变量或配置文件加载）
const DEFAULT_THRESHOLD_CNY_PER_DALY = 37446

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<IcerEvaluateRequest>

    if (!body.baseline || !body.alternative) {
      return NextResponse.json(
        { error: "baseline and alternative are required" },
        { status: 400 },
      )
    }

    const threshold =
      typeof body.thresholdCnyPerDaly === "number" && body.thresholdCnyPerDaly > 0
        ? body.thresholdCnyPerDaly
        : DEFAULT_THRESHOLD_CNY_PER_DALY

    const result = evaluateIcer({
      baseline: body.baseline,
      alternative: body.alternative,
      thresholdCnyPerDaly: threshold,
    })

    return NextResponse.json(
      {
        ...result,
        thresholdCnyPerDaly: threshold,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("ICER evaluate error", error)
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    )
  }
}

