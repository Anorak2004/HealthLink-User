// 健康监护系统类型守卫和工具函数

import {
  VitalsSnapshot,
  EmergencyResponse,
  EmergencyAction,
  HealthArticle,
  HealthCategory,
  Doctor,
  ConsultationMessage,
  Consultation,
  ApiResponse,
  PaginatedResponse
} from '../types/health-monitoring'

// ============================================================================
// 类型守卫函数
// ============================================================================

export function isVitalsSnapshot(obj: any): obj is VitalsSnapshot {
  return obj && 
    typeof obj === 'object' &&
    obj.timestamp instanceof Date &&
    (obj.heartRate === undefined || typeof obj.heartRate === 'number') &&
    (obj.temperature === undefined || typeof obj.temperature === 'number') &&
    (obj.oxygenSaturation === undefined || typeof obj.oxygenSaturation === 'number') &&
    (obj.bloodPressure === undefined || (
      obj.bloodPressure &&
      typeof obj.bloodPressure.systolic === 'number' &&
      typeof obj.bloodPressure.diastolic === 'number'
    ))
}

export function isEmergencyAction(obj: any): obj is EmergencyAction {
  const validTypes = ['call_120', 'call_doctor', 'alert_family']
  return obj &&
    typeof obj === 'object' &&
    validTypes.includes(obj.type) &&
    typeof obj.priority === 'number' &&
    typeof obj.executed === 'boolean' &&
    (obj.executedAt === undefined || obj.executedAt instanceof Date)
}

export function isEmergencyResponse(obj: any): obj is EmergencyResponse {
  const validSeverities = ['critical', 'urgent', 'warning']
  const validStatuses = ['triggered', 'acknowledged', 'resolved']
  
  return obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    obj.triggerTime instanceof Date &&
    isVitalsSnapshot(obj.vitalsData) &&
    validSeverities.includes(obj.severity) &&
    Array.isArray(obj.responseActions) &&
    obj.responseActions.every(isEmergencyAction) &&
    validStatuses.includes(obj.status)
}

export function isHealthCategory(obj: any): obj is HealthCategory {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.icon === 'string' &&
    typeof obj.description === 'string' &&
    (obj.parentId === undefined || typeof obj.parentId === 'string')
}

export function isHealthArticle(obj: any): obj is HealthArticle {
  const validDifficulties = ['basic', 'intermediate', 'advanced']
  
  return obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.summary === 'string' &&
    isHealthCategory(obj.category) &&
    Array.isArray(obj.tags) &&
    obj.tags.every((tag: any) => typeof tag === 'string') &&
    Array.isArray(obj.images) &&
    typeof obj.author === 'string' &&
    obj.publishDate instanceof Date &&
    typeof obj.readCount === 'number' &&
    validDifficulties.includes(obj.difficulty)
}

export function isDoctor(obj: any): obj is Doctor {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.avatar === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.department === 'string' &&
    Array.isArray(obj.specialties) &&
    obj.specialties.every((specialty: any) => typeof specialty === 'string') &&
    typeof obj.experience === 'number' &&
    typeof obj.rating === 'number' &&
    typeof obj.reviewCount === 'number' &&
    typeof obj.isOnline === 'boolean' &&
    typeof obj.consultationFee === 'number' &&
    typeof obj.introduction === 'string'
}

export function isConsultationMessage(obj: any): obj is ConsultationMessage {
  const validSenderTypes = ['doctor', 'patient']
  const validMessageTypes = ['text', 'image', 'voice', 'file']
  
  return obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.consultationId === 'string' &&
    typeof obj.senderId === 'string' &&
    validSenderTypes.includes(obj.senderType) &&
    typeof obj.content === 'string' &&
    validMessageTypes.includes(obj.messageType) &&
    obj.timestamp instanceof Date &&
    typeof obj.isRead === 'boolean'
}

export function isConsultation(obj: any): obj is Consultation {
  const validStatuses = ['pending', 'active', 'completed', 'cancelled']
  
  return obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.doctorId === 'string' &&
    typeof obj.userId === 'string' &&
    validStatuses.includes(obj.status) &&
    obj.startTime instanceof Date &&
    (obj.endTime === undefined || obj.endTime instanceof Date) &&
    Array.isArray(obj.messages) &&
    obj.messages.every(isConsultationMessage) &&
    (obj.summary === undefined || typeof obj.summary === 'string')
}

export function isApiResponse<T>(obj: any, dataValidator?: (data: any) => data is T): obj is ApiResponse<T> {
  const isValid = obj &&
    typeof obj === 'object' &&
    typeof obj.success === 'boolean' &&
    obj.timestamp instanceof Date &&
    (obj.error === undefined || typeof obj.error === 'string')
  
  if (!isValid) return false
  
  if (obj.data !== undefined && dataValidator) {
    return dataValidator(obj.data)
  }
  
  return true
}

export function isPaginatedResponse<T>(obj: any, itemValidator?: (item: any) => item is T): obj is PaginatedResponse<T> {
  const isValid = obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.items) &&
    typeof obj.total === 'number' &&
    typeof obj.page === 'number' &&
    typeof obj.pageSize === 'number' &&
    typeof obj.hasMore === 'boolean'
  
  if (!isValid) return false
  
  if (itemValidator) {
    return obj.items.every(itemValidator)
  }
  
  return true
}

// ============================================================================
// 工具函数
// ============================================================================

export function createEmergencyResponse(
  userId: string,
  vitalsData: VitalsSnapshot,
  severity: EmergencyResponse['severity']
): EmergencyResponse {
  const actions: EmergencyAction[] = []
  
  // 根据严重程度添加相应的响应动作
  if (severity === 'critical') {
    actions.push(
      { type: 'call_120', priority: 1, executed: false },
      { type: 'call_doctor', priority: 2, executed: false },
      { type: 'alert_family', priority: 3, executed: false }
    )
  } else if (severity === 'urgent') {
    actions.push(
      { type: 'call_doctor', priority: 1, executed: false },
      { type: 'alert_family', priority: 2, executed: false }
    )
  } else {
    actions.push(
      { type: 'alert_family', priority: 1, executed: false }
    )
  }
  
  return {
    id: generateId(),
    userId,
    triggerTime: new Date(),
    vitalsData,
    severity,
    responseActions: actions,
    status: 'triggered'
  }
}

export function createConsultationMessage(
  consultationId: string,
  senderId: string,
  senderType: ConsultationMessage['senderType'],
  content: string,
  messageType: ConsultationMessage['messageType'] = 'text'
): ConsultationMessage {
  return {
    id: generateId(),
    consultationId,
    senderId,
    senderType,
    content,
    messageType,
    timestamp: new Date(),
    isRead: false
  }
}

export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    timestamp: new Date()
  }
}

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total
  }
}

// ============================================================================
// 辅助函数
// ============================================================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function formatVitalsForDisplay(vitals: VitalsSnapshot): string {
  const parts: string[] = []
  
  if (vitals.heartRate) {
    parts.push(`心率: ${vitals.heartRate} bpm`)
  }
  
  if (vitals.bloodPressure) {
    parts.push(`血压: ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg`)
  }
  
  if (vitals.temperature) {
    parts.push(`体温: ${vitals.temperature}°C`)
  }
  
  if (vitals.oxygenSaturation) {
    parts.push(`血氧: ${vitals.oxygenSaturation}%`)
  }
  
  return parts.join(', ')
}

export function getSeverityLevel(vitals: VitalsSnapshot): EmergencyResponse['severity'] | null {
  let criticalCount = 0
  let urgentCount = 0
  
  // 检查心率
  if (vitals.heartRate) {
    if (vitals.heartRate < 40 || vitals.heartRate > 140) {
      criticalCount++
    } else if (vitals.heartRate < 50 || vitals.heartRate > 120) {
      urgentCount++
    }
  }
  
  // 检查血压
  if (vitals.bloodPressure) {
    const { systolic, diastolic } = vitals.bloodPressure
    if (systolic > 200 || systolic < 80 || diastolic > 120 || diastolic < 50) {
      criticalCount++
    } else if (systolic > 180 || systolic < 90 || diastolic > 110 || diastolic < 60) {
      urgentCount++
    }
  }
  
  // 检查体温
  if (vitals.temperature) {
    if (vitals.temperature < 35 || vitals.temperature > 40) {
      criticalCount++
    } else if (vitals.temperature < 36 || vitals.temperature > 39) {
      urgentCount++
    }
  }
  
  // 检查血氧饱和度
  if (vitals.oxygenSaturation) {
    if (vitals.oxygenSaturation < 85) {
      criticalCount++
    } else if (vitals.oxygenSaturation < 90) {
      urgentCount++
    }
  }
  
  if (criticalCount > 0) {
    return 'critical'
  } else if (urgentCount > 0) {
    return 'urgent'
  } else if (criticalCount + urgentCount > 0) {
    return 'warning'
  }
  
  return null
}

export function calculateDoctorScore(doctor: Doctor): number {
  // 综合评分算法：经验 * 0.3 + 评分 * 0.5 + 评价数量权重 * 0.2
  const experienceScore = Math.min(doctor.experience / 20, 1) * 30
  const ratingScore = (doctor.rating / 5) * 50
  const reviewScore = Math.min(doctor.reviewCount / 100, 1) * 20
  
  return Math.round(experienceScore + ratingScore + reviewScore)
}