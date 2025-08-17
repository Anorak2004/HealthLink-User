// utils/api.ts

// Import WeChat Mini Program types and APIs
import type { WechatMiniprogram } from "wechat-miniprogram-types"
import { getApp, wx, type IAppOption } from "./miniprogram-api"

interface HealthData {
  id?: string
  type: "blood_pressure" | "blood_sugar" | "temperature" | "weight"
  value: string
  date: string
  time: string
}

interface HealthAssessment {
  score: number
  riskLevel: "low" | "medium" | "high"
  summary: string
  recommendations?: Array<{
    id: string
    icon: string
    title: string
    description: string
  }>
  date: string
}

interface DoctorMessage {
  id: string
  content: string
  sender: "user" | "doctor"
  timestamp: string
}

class ApiService {
  private baseUrl = "https://your-api-domain.com/api"

  // 模拟数据
  private mockHealthData: HealthData[] = [
    {
      id: "1",
      type: "blood_pressure",
      value: "120/80",
      date: "2024-01-15",
      time: "08:30",
    },
    {
      id: "2",
      type: "blood_sugar",
      value: "5.6",
      date: "2024-01-15",
      time: "09:00",
    },
    {
      id: "3",
      type: "temperature",
      value: "36.5",
      date: "2024-01-15",
      time: "07:00",
    },
  ]

  private mockAssessment: HealthAssessment = {
    score: 85,
    riskLevel: "low",
    summary: "您的整体健康状况良好，各项指标基本正常。建议继续保持良好的生活习惯。",
    recommendations: [
      {
        id: "1",
        icon: "🏃",
        title: "保持规律运动",
        description: "建议每周进行3-4次中等强度运动，每次30分钟以上",
      },
      {
        id: "2",
        icon: "🥗",
        title: "均衡饮食",
        description: "多吃蔬菜水果，控制油盐摄入，避免高糖高脂食物",
      },
    ],
    date: "2024-01-15",
  }

  private mockMessages: DoctorMessage[] = [
    {
      id: "1",
      content: "您好，我是您的家庭医生张医生，有什么健康问题可以随时咨询我。",
      sender: "doctor",
      timestamp: "2024-01-15 09:00",
    },
  ]

  // 获取健康数据
  async getHealthData(): Promise<HealthData[]> {
    const app = getApp<IAppOption>()

    if (!app.globalData.isApiMode) {
      // 模拟模式
      return new Promise((resolve) => {
        setTimeout(() => resolve(this.mockHealthData), 500)
      })
    }

    // API模式
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseUrl}/health-data`,
        method: "GET",
        success: (res: { data: HealthData[] }) => {
          resolve(res.data as HealthData[])
        },
        fail: (err: any) => {
          console.error("API请求失败，使用模拟数据", err)
          resolve(this.mockHealthData)
        },
      })
    })
  }

  // 提交健康数据
  async submitHealthData(data: Omit<HealthData, "id">): Promise<boolean> {
    const app = getApp<IAppOption>()

    if (!app.globalData.isApiMode) {
      // 模拟模式
      return new Promise((resolve) => {
        setTimeout(() => {
          this.mockHealthData.push({
            ...data,
            id: Date.now().toString(),
          })
          resolve(true)
        }, 500)
      })
    }

    // API模式
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseUrl}/health-data`,
        method: "POST",
        data: data,
        success: (res: any) => {
          resolve(true)
        },
        fail: (err: any) => {
          console.error("提交失败", err)
          resolve(false)
        },
      })
    })
  }

  // 获取健康评估
  async getHealthAssessment(): Promise<HealthAssessment> {
    const app = getApp<IAppOption>()

    if (!app.globalData.isApiMode) {
      // 模拟模式
      return new Promise((resolve) => {
        setTimeout(() => resolve(this.mockAssessment), 800)
      })
    }

    // API模式
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseUrl}/health-assessment`,
        method: "GET",
        success: (res) => {
          resolve(res.data as HealthAssessment)
        },
        fail: (err) => {
          console.error("API请求失败，使用模拟数据", err)
          resolve(this.mockAssessment)
        },
      })
    })
  }

  // 获取医生消息
  async getDoctorMessages(): Promise<DoctorMessage[]> {
    const app = getApp<IAppOption>()

    if (!app.globalData.isApiMode) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(this.mockMessages), 300)
      })
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseUrl}/doctor-messages`,
        method: "GET",
        success: (res) => {
          resolve(res.data as DoctorMessage[])
        },
        fail: (err) => {
          console.error("API请求失败，使用模拟数据", err)
          resolve(this.mockMessages)
        },
      })
    })
  }

  // 发送消息给医生
  async sendMessageToDoctor(content: string): Promise<boolean> {
    const app = getApp<IAppOption>()

    if (!app.globalData.isApiMode) {
      return new Promise((resolve) => {
        setTimeout(() => {
          this.mockMessages.push({
            id: Date.now().toString(),
            content,
            sender: "user",
            timestamp: new Date().toLocaleString(),
          })
          resolve(true)
        }, 300)
      })
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseUrl}/doctor-messages`,
        method: "POST",
        data: { content },
        success: (res) => {
          resolve(true)
        },
        fail: (err) => {
          console.error("发送失败", err)
          resolve(false)
        },
      })
    })
  }

  // 获取健康指标
  async getHealthIndicators(): Promise<
    Array<{
      type: string
      name: string
      value: string
      unit: string
      status: "normal" | "warning" | "danger"
      statusText: string
    }>
  > {
    const app = getApp<IAppOption>()

    if (!app.globalData.isApiMode) {
      return new Promise((resolve) => {
        setTimeout(
          () =>
            resolve([
              {
                type: "blood_pressure",
                name: "血压",
                value: "120/80",
                unit: "mmHg",
                status: "normal",
                statusText: "正常",
              },
              { type: "blood_sugar", name: "血糖", value: "5.6", unit: "mmol/L", status: "normal", statusText: "正常" },
              { type: "bmi", name: "BMI", value: "22.5", unit: "", status: "normal", statusText: "正常" },
              { type: "heart_rate", name: "心率", value: "72", unit: "bpm", status: "normal", statusText: "正常" },
            ]),
          500,
        )
      })
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseUrl}/health-indicators`,
        method: "GET",
        success: (res) => {
          resolve(res.data)
        },
        fail: (err) => {
          console.error("API请求失败，使用模拟数据", err)
          resolve([])
        },
      })
    })
  }

  // 执行健康评估
  async performHealthAssessment(): Promise<HealthAssessment> {
    const app = getApp<IAppOption>()

    if (!app.globalData.isApiMode) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(this.mockAssessment), 2000)
      })
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseUrl}/health-assessment/analyze`,
        method: "POST",
        success: (res) => {
          resolve(res.data as HealthAssessment)
        },
        fail: (err) => {
          console.error("API请求失败，使用模拟数据", err)
          resolve(this.mockAssessment)
        },
      })
    })
  }

  // 获取用户统计数据
  async getUserStats(): Promise<{
    recordCount: number
    assessmentCount: number
    consultCount: number
    daysUsed: number
  }> {
    const app = getApp<IAppOption>()

    if (!app.globalData.isApiMode) {
      return new Promise((resolve) => {
        setTimeout(
          () =>
            resolve({
              recordCount: 25,
              assessmentCount: 3,
              consultCount: 2,
              daysUsed: 15,
            }),
          500,
        )
      })
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseUrl}/user/stats`,
        method: "GET",
        success: (res) => {
          resolve(res.data)
        },
        fail: (err) => {
          console.error("API请求失败，使用模拟数据", err)
          resolve({
            recordCount: 0,
            assessmentCount: 0,
            consultCount: 0,
            daysUsed: 0,
          })
        },
      })
    })
  }
}

export const apiService = new ApiService()
