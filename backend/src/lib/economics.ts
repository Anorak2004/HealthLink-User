import type { IcerEvaluateRequest, IcerEvaluateResponse } from "./models"

/**
 * 根据给定的两个干预方案计算 ICER，并给出是否成本效果可接受的判断。
 * 公式：ICER = ΔCost / ΔDALY
 */
export function evaluateIcer(input: IcerEvaluateRequest): IcerEvaluateResponse {
  const { baseline, alternative, thresholdCnyPerDaly } = input

  const cost0 = baseline.annualCostCny
  const cost1 = alternative.annualCostCny

  const daly0 = baseline.expectedEventsAvoidedPerYear * baseline.dalyLossPerEvent
  const daly1 = alternative.expectedEventsAvoidedPerYear * alternative.dalyLossPerEvent

  const incrementalCost = cost1 - cost0
  const incrementalDaly = daly1 - daly0

  if (incrementalDaly === 0) {
    return {
      incrementalCost,
      incrementalDaly,
      icer: null,
      isCostEffective: null,
      recommendation: "invalid",
    }
  }

  const icer = incrementalCost / incrementalDaly

  // 简化判定规则：
  // - 如果 alternative 提供更多 DALY 且 ICER 小于等于阈值 → 推荐 alternative
  // - 如果 alternative 提供更少 DALY 且还更贵 → 坚持 baseline
  // - 其他情况视为待讨论，这里先返回 indifferent
  let recommendation: IcerEvaluateResponse["recommendation"] = "indifferent"
  let isCostEffective: boolean | null = null

  if (incrementalDaly > 0) {
    isCostEffective = icer <= thresholdCnyPerDaly
    recommendation = isCostEffective ? "alternative" : "baseline"
  } else if (incrementalDaly < 0) {
    // alternative 效果更差
    if (incrementalCost >= 0) {
      // 更贵且效果更差
      isCostEffective = false
      recommendation = "baseline"
    } else {
      // 更便宜但效果差一些，具体取舍依赖医生和患者偏好，这里不直接下结论
      isCostEffective = null
      recommendation = "indifferent"
    }
  }

  return {
    incrementalCost,
    incrementalDaly,
    icer,
    isCostEffective,
    recommendation,
  }
}

