// 通用后端数据模型定义（初稿）

// GBD / DALY 相关疾病负担数据
export interface GbdDalyRecord {
  id: string
  causeCode: string
  causeName: string
  location: string // e.g. "China"
  ageGroup: string // e.g. "45-69"
  sex: "male" | "female" | "both"
  dalyPer100k: number
  yldPer100k?: number
  yllPer100k?: number
}

// 干预方案定义
export interface InterventionOption {
  id: string
  name: string
  description: string
  // 单位人群（例如 1 人或 100 人）一年内的总成本（人民币）
  annualCostCny: number
  // 预期每年减少的事件数量（例如少多少次卒中、心梗）
  expectedEventsAvoidedPerYear: number
  // 每次事件对应的 DALY 损失（可由 GBD 数据推算，也可在项目早期先用文献估计）
  dalyLossPerEvent: number
}

// ICER 计算请求与响应
export interface IcerEvaluateRequest {
  baseline: InterventionOption
  alternative: InterventionOption
  thresholdCnyPerDaly: number
}

export interface IcerEvaluateResponse {
  incrementalCost: number
  incrementalDaly: number
  icer: number | null
  isCostEffective: boolean | null
  recommendation: "baseline" | "alternative" | "indifferent" | "invalid"
}

