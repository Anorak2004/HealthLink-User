// health-assessment.ts
import { apiService } from "../../utils/api"
import { Page, wx } from "../../utils/miniprogram-api"

interface AssessmentData {
  assessmentResult: {
    score: number
    riskLevel: "low" | "medium" | "high"
    riskText: string
    summary: string
  } | null
  healthIndicators: Array<{
    type: string
    name: string
    value: string
    unit: string
    status: "normal" | "warning" | "danger"
    statusText: string
  }>
  recommendations: Array<{
    id: string
    icon: string
    title: string
    description: string
  }>
}

Page<AssessmentData, {}>({
  data: {
    assessmentResult: null,
    healthIndicators: [
      {
        type: "blood_pressure",
        name: "血压",
        value: "120/80",
        unit: "mmHg",
        status: "normal",
        statusText: "正常",
      },
      {
        type: "blood_sugar",
        name: "血糖",
        value: "5.6",
        unit: "mmol/L",
        status: "normal",
        statusText: "正常",
      },
      {
        type: "bmi",
        name: "BMI",
        value: "22.5",
        unit: "",
        status: "normal",
        statusText: "正常",
      },
      {
        type: "heart_rate",
        name: "心率",
        value: "72",
        unit: "bpm",
        status: "normal",
        statusText: "正常",
      },
    ],
    recommendations: [],
  },

  onLoad() {
    this.loadHealthIndicators()
  },

  async loadHealthIndicators() {
    try {
      const indicators = await apiService.getHealthIndicators()
      this.setData({
        healthIndicators: indicators,
      })
    } catch (error) {
      console.error("加载健康指标失败", error)
    }
  },

  async startAssessment() {
    wx.showLoading({ title: "评估中..." })

    try {
      const result = await apiService.performHealthAssessment()

      this.setData({
        assessmentResult: {
          score: result.score,
          riskLevel: result.riskLevel,
          riskText: this.getRiskText(result.riskLevel),
          summary: result.summary,
        },
        recommendations: result.recommendations || [],
      })

      wx.hideLoading()
      wx.showToast({
        title: "评估完成",
        icon: "success",
      })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: "评估失败，请重试",
        icon: "none",
      })
      console.error("健康评估失败", error)
    }
  },

  refreshAssessment() {
    this.setData({
      assessmentResult: null,
      recommendations: [],
    })
    this.startAssessment()
  },

  getRiskText(riskLevel: string): string {
    switch (riskLevel) {
      case "low":
        return "低风险"
      case "medium":
        return "中等风险"
      case "high":
        return "高风险"
      default:
        return "未知"
    }
  },
})
