// 健康监护系统数据验证工具

import { 
  VitalsSnapshot, 
  EmergencyResponse, 
  HealthArticle, 
  Doctor, 
  ConsultationMessage,
  Consultation 
} from '../types/health-monitoring'

// ============================================================================
// 生命体征数据验证
// ============================================================================

export function validateVitalsSnapshot(data: any): data is VitalsSnapshot {
  if (!data || typeof data !== 'object') {
    return false
  }

  // 验证时间戳
  if (!data.timestamp || !(data.timestamp instanceof Date)) {
    return false
  }

  // 验证心率 (正常范围: 60-100 bpm)
  if (data.heartRate !== undefined) {
    if (typeof data.heartRate !== 'number' || data.heartRate < 30 || data.heartRate > 200) {
      return false
    }
  }

  // 验证血压
  if (data.bloodPressure !== undefined) {
    const bp = data.bloodPressure
    if (!bp || typeof bp !== 'object') {
      return false
    }
    if (typeof bp.systolic !== 'number' || typeof bp.diastolic !== 'number') {
      return false
    }
    if (bp.systolic < 70 || bp.systolic > 250 || bp.diastolic < 40 || bp.diastolic > 150) {
      return false
    }
  }

  // 验证体温 (正常范围: 35-42°C)
  if (data.temperature !== undefined) {
    if (typeof data.temperature !== 'number' || data.temperature < 30 || data.temperature > 45) {
      return false
    }
  }

  // 验证血氧饱和度 (正常范围: 95-100%)
  if (data.oxygenSaturation !== undefined) {
    if (typeof data.oxygenSaturation !== 'number' || data.oxygenSaturation < 70 || data.oxygenSaturation > 100) {
      return false
    }
  }

  return true
}

export function isEmergencyVitals(vitals: VitalsSnapshot): boolean {
  // 心率异常 (< 50 或 > 120)
  if (vitals.heartRate && (vitals.heartRate < 50 || vitals.heartRate > 120)) {
    return true
  }

  // 血压异常 (收缩压 > 180 或 < 90, 舒张压 > 110 或 < 60)
  if (vitals.bloodPressure) {
    const { systolic, diastolic } = vitals.bloodPressure
    if (systolic > 180 || systolic < 90 || diastolic > 110 || diastolic < 60) {
      return true
    }
  }

  // 体温异常 (< 36 或 > 39)
  if (vitals.temperature && (vitals.temperature < 36 || vitals.temperature > 39)) {
    return true
  }

  // 血氧饱和度异常 (< 90%)
  if (vitals.oxygenSaturation && vitals.oxygenSaturation < 90) {
    return true
  }

  return false
}

// ============================================================================
// 紧急响应数据验证
// ============================================================================

export function validateEmergencyResponse(data: any): data is EmergencyResponse {
  if (!data || typeof data !== 'object') {
    return false
  }

  // 验证必需字段
  if (!data.id || typeof data.id !== 'string') {
    return false
  }
  if (!data.userId || typeof data.userId !== 'string') {
    return false
  }
  if (!data.triggerTime || !(data.triggerTime instanceof Date)) {
    return false
  }

  // 验证生命体征数据
  if (!validateVitalsSnapshot(data.vitalsData)) {
    return false
  }

  // 验证严重程度
  const validSeverities = ['critical', 'urgent', 'warning']
  if (!validSeverities.includes(data.severity)) {
    return false
  }

  // 验证状态
  const validStatuses = ['triggered', 'acknowledged', 'resolved']
  if (!validStatuses.includes(data.status)) {
    return false
  }

  // 验证响应动作数组
  if (!Array.isArray(data.responseActions)) {
    return false
  }

  return true
}

// ============================================================================
// 健康文章数据验证
// ============================================================================

export function validateHealthArticle(data: any): data is HealthArticle {
  if (!data || typeof data !== 'object') {
    return false
  }

  // 验证必需字段
  const requiredStringFields = ['id', 'title', 'content', 'summary', 'author']
  for (const field of requiredStringFields) {
    if (!data[field] || typeof data[field] !== 'string') {
      return false
    }
  }

  // 验证发布日期
  if (!data.publishDate || !(data.publishDate instanceof Date)) {
    return false
  }

  // 验证阅读次数
  if (typeof data.readCount !== 'number' || data.readCount < 0) {
    return false
  }

  // 验证难度级别
  const validDifficulties = ['basic', 'intermediate', 'advanced']
  if (!validDifficulties.includes(data.difficulty)) {
    return false
  }

  // 验证标签数组
  if (!Array.isArray(data.tags)) {
    return false
  }

  // 验证图片数组
  if (!Array.isArray(data.images)) {
    return false
  }

  return true
}

// ============================================================================
// 医生信息数据验证
// ============================================================================

export function validateDoctor(data: any): data is Doctor {
  if (!data || typeof data !== 'object') {
    return false
  }

  // 验证必需字段
  const requiredStringFields = ['id', 'name', 'title', 'department', 'introduction']
  for (const field of requiredStringFields) {
    if (!data[field] || typeof data[field] !== 'string') {
      return false
    }
  }

  // 验证专长数组
  if (!Array.isArray(data.specialties)) {
    return false
  }

  // 验证数值字段
  if (typeof data.experience !== 'number' || data.experience < 0) {
    return false
  }
  if (typeof data.rating !== 'number' || data.rating < 0 || data.rating > 5) {
    return false
  }
  if (typeof data.reviewCount !== 'number' || data.reviewCount < 0) {
    return false
  }
  if (typeof data.consultationFee !== 'number' || data.consultationFee < 0) {
    return false
  }

  // 验证布尔字段
  if (typeof data.isOnline !== 'boolean') {
    return false
  }

  return true
}

// ============================================================================
// 问诊消息数据验证
// ============================================================================

export function validateConsultationMessage(data: any): data is ConsultationMessage {
  if (!data || typeof data !== 'object') {
    return false
  }

  // 验证必需字段
  const requiredStringFields = ['id', 'consultationId', 'senderId', 'content']
  for (const field of requiredStringFields) {
    if (!data[field] || typeof data[field] !== 'string') {
      return false
    }
  }

  // 验证发送者类型
  const validSenderTypes = ['doctor', 'patient']
  if (!validSenderTypes.includes(data.senderType)) {
    return false
  }

  // 验证消息类型
  const validMessageTypes = ['text', 'image', 'voice', 'file']
  if (!validMessageTypes.includes(data.messageType)) {
    return false
  }

  // 验证时间戳
  if (!data.timestamp || !(data.timestamp instanceof Date)) {
    return false
  }

  // 验证已读状态
  if (typeof data.isRead !== 'boolean') {
    return false
  }

  return true
}

// ============================================================================
// 问诊记录数据验证
// ============================================================================

export function validateConsultation(data: any): data is Consultation {
  if (!data || typeof data !== 'object') {
    return false
  }

  // 验证必需字段
  const requiredStringFields = ['id', 'doctorId', 'userId']
  for (const field of requiredStringFields) {
    if (!data[field] || typeof data[field] !== 'string') {
      return false
    }
  }

  // 验证状态
  const validStatuses = ['pending', 'active', 'completed', 'cancelled']
  if (!validStatuses.includes(data.status)) {
    return false
  }

  // 验证开始时间
  if (!data.startTime || !(data.startTime instanceof Date)) {
    return false
  }

  // 验证结束时间（可选）
  if (data.endTime && !(data.endTime instanceof Date)) {
    return false
  }

  // 验证消息数组
  if (!Array.isArray(data.messages)) {
    return false
  }

  return true
}

// ============================================================================
// 通用验证工具
// ============================================================================

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function validateId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && id.length <= 36
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}