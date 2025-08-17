// utils/service-interfaces.ts
// 服务接口定义，放在utils目录下避免路径问题

export interface HealthData {
  id?: string
  type: "blood_pressure" | "blood_sugar" | "temperature" | "weight"
  value: string
  date: string
  time: string
}

export interface HealthDataInput extends Omit<HealthData, "id"> {}

export interface HealthAssessment {
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

export interface DoctorMessage {
  id: string
  content: string
  sender: "user" | "doctor"
  timestamp: string
}

export interface HealthIndicator {
  type: string
  name: string
  value: string
  unit: string
  status: "normal" | "warning" | "danger"
  statusText: string
}

export interface UserStats {
  recordCount: number
  assessmentCount: number
  consultCount: number
  daysUsed: number
}

export interface ServiceStatus {
  mode: 'mock' | 'api'
  isOnline: boolean
  lastApiCall: number
  errorCount: number
  fallbackActive: boolean
}

// 统一的数据服务接口
export interface IDataService {
  // 健康数据相关
  getHealthData(): Promise<HealthData[]>
  submitHealthData(data: HealthDataInput): Promise<boolean>
  
  // 健康评估相关
  getHealthAssessment(): Promise<HealthAssessment>
  performHealthAssessment(): Promise<HealthAssessment>
  
  // 医生咨询相关
  getDoctorMessages(): Promise<DoctorMessage[]>
  sendMessageToDoctor(content: string): Promise<boolean>
  
  // 健康指标相关
  getHealthIndicators(): Promise<HealthIndicator[]>
  
  // 用户统计相关
  getUserStats(): Promise<UserStats>
  
  // 服务状态相关
  getServiceStatus(): ServiceStatus
  isOnline(): Promise<boolean>
}

// 错误处理相关接口
export interface ServiceError extends Error {
  code: string
  context: string
  shouldFallback: boolean
  userMessage: string
}