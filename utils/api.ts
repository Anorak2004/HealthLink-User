// utils/api.ts
// 增强的API服务，集成服务抽象层功能

import { wx } from "./miniprogram-api"
import type { 
  HealthData, 
  HealthAssessment, 
  DoctorMessage, 
  HealthIndicator, 
  UserStats,
  ServiceStatus,
  IDataService 
} from "./service-interfaces"

class ApiService implements IDataService {
  private baseUrl = "https://your-api-domain.com/api"
  private currentMode: 'mock' | 'api' = 'mock'
  private status: ServiceStatus = {
    mode: 'mock',
    isOnline: true,
    lastApiCall: 0,
    errorCount: 0,
    fallbackActive: false
  }

  constructor() {
    // 从存储中加载模式设置
    this.loadModeFromStorage()
  }

  private loadModeFromStorage(): void {
    try {
      const storedMode = wx.getStorageSync('app_mode')
      if (storedMode === 'api' || storedMode === 'mock') {
        this.currentMode = storedMode
        this.status.mode = storedMode
      }
    } catch (error) {
      // 如果获取失败，使用默认的mock模式
      this.currentMode = 'mock'
      this.status.mode = 'mock'
    }
  }

  private saveModeToStorage(mode: 'mock' | 'api'): void {
    try {
      wx.setStorageSync('app_mode', mode)
    } catch (error) {
      console.error('保存模式设置失败:', error)
    }
  }

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

    if (this.currentMode === 'mock') {
      // 模拟模式
      return this.simulateApiDelay(() => this.mockHealthData, 500)
    }

    // API模式，带降级处理
    try {
      const data = await this.makeApiCall<HealthData[]>('/health-data', 'GET')
      this.onApiSuccess()
      return data
    } catch (error) {
      console.warn('API调用失败，使用模拟数据:', error)
      this.handleApiError(error)
      return this.mockHealthData
    }
  }

  // 提交健康数据
  async submitHealthData(data: Omit<HealthData, "id">): Promise<boolean> {
    if (this.currentMode === 'mock') {
      // 模拟模式
      return this.simulateApiDelay(() => {
        this.mockHealthData.push({
          ...data,
          id: Date.now().toString(),
        })
        return true
      }, 500)
    }

    // API模式，带降级处理
    try {
      await this.makeApiCall('/health-data', 'POST', data)
      this.onApiSuccess()
      return true
    } catch (error) {
      console.error('提交健康数据失败:', error)
      this.handleApiError(error)
      return false
    }
  }

  // 获取健康评估
  async getHealthAssessment(): Promise<HealthAssessment> {
    if (this.currentMode === 'mock') {
      // 模拟模式
      return this.simulateApiDelay(() => this.mockAssessment, 800)
    }

    // API模式，带降级处理
    try {
      const assessment = await this.makeApiCall<HealthAssessment>('/health-assessment', 'GET')
      this.onApiSuccess()
      return assessment
    } catch (error) {
      console.warn('API调用失败，使用模拟数据:', error)
      this.handleApiError(error)
      return this.mockAssessment
    }
  }

  // 获取医生消息
  async getDoctorMessages(): Promise<DoctorMessage[]> {
    if (this.currentMode === 'mock') {
      return this.simulateApiDelay(() => this.mockMessages, 300)
    }

    try {
      const messages = await this.makeApiCall<DoctorMessage[]>('/doctor-messages', 'GET')
      this.onApiSuccess()
      return messages
    } catch (error) {
      console.warn('API调用失败，使用模拟数据:', error)
      this.handleApiError(error)
      return this.mockMessages
    }
  }

  // 发送消息给医生
  async sendMessageToDoctor(content: string): Promise<boolean> {
    if (this.currentMode === 'mock') {
      return this.simulateApiDelay(() => {
        this.mockMessages.push({
          id: Date.now().toString(),
          content,
          sender: "user",
          timestamp: new Date().toLocaleString(),
        })
        return true
      }, 300)
    }

    try {
      await this.makeApiCall('/doctor-messages', 'POST', { content })
      this.onApiSuccess()
      return true
    } catch (error) {
      console.error('发送消息失败:', error)
      this.handleApiError(error)
      return false
    }
  }

  // 获取健康指标
  async getHealthIndicators(): Promise<HealthIndicator[]> {
    const mockIndicators: HealthIndicator[] = [
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
    ]

    if (this.currentMode === 'mock') {
      return this.simulateApiDelay(() => mockIndicators, 500)
    }

    try {
      const indicators = await this.makeApiCall<HealthIndicator[]>('/health-indicators', 'GET')
      this.onApiSuccess()
      return indicators
    } catch (error) {
      console.warn('API调用失败，使用模拟数据:', error)
      this.handleApiError(error)
      return mockIndicators
    }
  }

  // 执行健康评估
  async performHealthAssessment(): Promise<HealthAssessment> {
    if (this.currentMode === 'mock') {
      return this.simulateApiDelay(() => this.mockAssessment, 2000)
    }

    try {
      const assessment = await this.makeApiCall<HealthAssessment>('/health-assessment/analyze', 'POST')
      this.onApiSuccess()
      return assessment
    } catch (error) {
      console.warn('API调用失败，使用模拟数据:', error)
      this.handleApiError(error)
      return this.mockAssessment
    }
  }

  // 获取用户统计数据
  async getUserStats(): Promise<UserStats> {
    const mockStats: UserStats = {
      recordCount: 25,
      assessmentCount: 3,
      consultCount: 2,
      daysUsed: 15,
    }

    if (this.currentMode === 'mock') {
      return this.simulateApiDelay(() => mockStats, 500)
    }

    try {
      const stats = await this.makeApiCall<UserStats>('/user/stats', 'GET')
      this.onApiSuccess()
      return stats
    } catch (error) {
      console.warn('API调用失败，使用模拟数据:', error)
      this.handleApiError(error)
      return mockStats
    }
  }

  // 新增的服务状态和管理方法
  getServiceStatus(): ServiceStatus {
    return { ...this.status }
  }

  async isOnline(): Promise<boolean> {
    try {
      await this.makeApiCall('/health-check', 'GET')
      this.onApiSuccess()
      return true
    } catch (error) {
      this.status.isOnline = false
      return false
    }
  }

  getCurrentMode(): 'mock' | 'api' {
    return this.currentMode
  }

  switchMode(mode: 'mock' | 'api'): void {
    this.currentMode = mode
    this.status.mode = mode
    this.saveModeToStorage(mode)
    console.log(`服务模式已切换到: ${mode}`)
  }

  // 私有辅助方法
  private simulateApiDelay<T>(operation: () => T, delay: number = 500): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.status.lastApiCall = Date.now()
        resolve(operation())
      }, delay)
    })
  }

  private async makeApiCall<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    data?: any
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.status.lastApiCall = Date.now()

      wx.request({
        url: `${this.baseUrl}${endpoint}`,
        method,
        data,
        timeout: 10000,
        success: (res: any) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data as T)
          } else {
            const error = new Error(`API请求失败: ${res.statusCode}`) as any
            error.code = `HTTP_${res.statusCode}`
            error.context = `${method} ${endpoint}`
            error.shouldFallback = true
            error.userMessage = '服务暂时不可用，正在使用离线数据'
            reject(error)
          }
        },
        fail: (err: any) => {
          const error = new Error(`网络请求失败: ${err.errMsg}`) as any
          error.code = 'NETWORK_ERROR'
          error.context = `${method} ${endpoint}`
          error.shouldFallback = true
          error.userMessage = '网络连接失败，正在使用离线数据'
          reject(error)
        }
      })
    })
  }

  private handleApiError(error: any): void {
    this.status.errorCount++
    
    if (error.shouldFallback) {
      this.status.fallbackActive = true
      console.log(`API服务降级: ${error.userMessage}`)
    }

    if (this.status.errorCount >= 3) {
      this.status.isOnline = false
    }
  }

  private onApiSuccess(): void {
    const wasOffline = !this.status.isOnline
    
    this.status.errorCount = 0
    this.status.fallbackActive = false
    this.status.isOnline = true
    
    if (wasOffline) {
      console.log('API服务已恢复')
    }
  }
}

export const apiService = new ApiService()
