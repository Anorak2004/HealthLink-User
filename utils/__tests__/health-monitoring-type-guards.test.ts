// 健康监护系统类型守卫测试

import { describe, it, expect } from 'vitest'
import {
  isVitalsSnapshot,
  isEmergencyAction,
  isEmergencyResponse,
  isHealthCategory,
  isHealthArticle,
  isDoctor,
  isConsultationMessage,
  isConsultation,
  isApiResponse,
  isPaginatedResponse,
  createEmergencyResponse,
  createConsultationMessage,
  createApiResponse,
  createPaginatedResponse,
  generateId,
  formatVitalsForDisplay,
  getSeverityLevel,
  calculateDoctorScore
} from '../health-monitoring-type-guards'
import {
  VitalsSnapshot,
  EmergencyAction,
  EmergencyResponse,
  HealthCategory,
  HealthArticle,
  Doctor,
  ConsultationMessage,
  Consultation
} from '../../types/health-monitoring'

describe('健康监护类型守卫测试', () => {
  
  // ============================================================================
  // 类型守卫测试
  // ============================================================================
  
  describe('isVitalsSnapshot', () => {
    it('应该识别有效的生命体征数据', () => {
      const validVitals: VitalsSnapshot = {
        heartRate: 75,
        bloodPressure: { systolic: 120, diastolic: 80 },
        temperature: 36.5,
        oxygenSaturation: 98,
        timestamp: new Date()
      }
      
      expect(isVitalsSnapshot(validVitals)).toBe(true)
    })

    it('应该拒绝无效的生命体征数据', () => {
      const invalidVitals = {
        heartRate: '75', // 应该是数字
        timestamp: new Date()
      }
      
      expect(isVitalsSnapshot(invalidVitals)).toBe(false)
    })

    it('应该接受部分字段的生命体征数据', () => {
      const partialVitals: VitalsSnapshot = {
        heartRate: 75,
        timestamp: new Date()
      }
      
      expect(isVitalsSnapshot(partialVitals)).toBe(true)
    })
  })

  describe('isEmergencyAction', () => {
    it('应该识别有效的紧急动作', () => {
      const validAction: EmergencyAction = {
        type: 'call_120',
        priority: 1,
        executed: false
      }
      
      expect(isEmergencyAction(validAction)).toBe(true)
    })

    it('应该拒绝无效的动作类型', () => {
      const invalidAction = {
        type: 'invalid_action',
        priority: 1,
        executed: false
      }
      
      expect(isEmergencyAction(invalidAction)).toBe(false)
    })
  })

  describe('isEmergencyResponse', () => {
    it('应该识别有效的紧急响应', () => {
      const validResponse: EmergencyResponse = {
        id: 'emergency-001',
        userId: 'user-001',
        triggerTime: new Date(),
        vitalsData: {
          heartRate: 45,
          timestamp: new Date()
        },
        severity: 'critical',
        responseActions: [
          {
            type: 'call_120',
            priority: 1,
            executed: false
          }
        ],
        status: 'triggered'
      }
      
      expect(isEmergencyResponse(validResponse)).toBe(true)
    })

    it('应该拒绝无效的严重程度', () => {
      const invalidResponse = {
        id: 'emergency-001',
        userId: 'user-001',
        triggerTime: new Date(),
        vitalsData: {
          heartRate: 45,
          timestamp: new Date()
        },
        severity: 'invalid',
        responseActions: [],
        status: 'triggered'
      }
      
      expect(isEmergencyResponse(invalidResponse)).toBe(false)
    })
  })

  describe('isDoctor', () => {
    it('应该识别有效的医生信息', () => {
      const validDoctor: Doctor = {
        id: 'doctor-001',
        name: '李医生',
        avatar: '/avatars/doctor-001.jpg',
        title: '主任医师',
        department: '心内科',
        specialties: ['高血压', '冠心病'],
        experience: 15,
        rating: 4.8,
        reviewCount: 324,
        isOnline: true,
        consultationFee: 200,
        introduction: '从事心血管疾病诊治15年'
      }
      
      expect(isDoctor(validDoctor)).toBe(true)
    })

    it('应该拒绝缺少必需字段的医生信息', () => {
      const invalidDoctor = {
        id: 'doctor-001',
        name: '李医生',
        // 缺少其他必需字段
      }
      
      expect(isDoctor(invalidDoctor)).toBe(false)
    })
  })

  describe('isConsultationMessage', () => {
    it('应该识别有效的问诊消息', () => {
      const validMessage: ConsultationMessage = {
        id: 'msg-001',
        consultationId: 'consultation-001',
        senderId: 'doctor-001',
        senderType: 'doctor',
        content: '您好，请描述症状',
        messageType: 'text',
        timestamp: new Date(),
        isRead: false
      }
      
      expect(isConsultationMessage(validMessage)).toBe(true)
    })

    it('应该拒绝无效的消息类型', () => {
      const invalidMessage = {
        id: 'msg-001',
        consultationId: 'consultation-001',
        senderId: 'doctor-001',
        senderType: 'doctor',
        content: '您好，请描述症状',
        messageType: 'invalid_type',
        timestamp: new Date(),
        isRead: false
      }
      
      expect(isConsultationMessage(invalidMessage)).toBe(false)
    })
  })

  // ============================================================================
  // 工具函数测试
  // ============================================================================

  describe('createEmergencyResponse', () => {
    it('应该为critical级别创建完整的响应动作', () => {
      const vitals: VitalsSnapshot = {
        heartRate: 35,
        timestamp: new Date()
      }
      
      const response = createEmergencyResponse('user-001', vitals, 'critical')
      
      expect(response.severity).toBe('critical')
      expect(response.responseActions).toHaveLength(3)
      expect(response.responseActions.some(action => action.type === 'call_120')).toBe(true)
      expect(response.responseActions.some(action => action.type === 'call_doctor')).toBe(true)
      expect(response.responseActions.some(action => action.type === 'alert_family')).toBe(true)
    })

    it('应该为urgent级别创建适当的响应动作', () => {
      const vitals: VitalsSnapshot = {
        heartRate: 125,
        timestamp: new Date()
      }
      
      const response = createEmergencyResponse('user-001', vitals, 'urgent')
      
      expect(response.severity).toBe('urgent')
      expect(response.responseActions).toHaveLength(2)
      expect(response.responseActions.some(action => action.type === 'call_doctor')).toBe(true)
      expect(response.responseActions.some(action => action.type === 'alert_family')).toBe(true)
    })

    it('应该为warning级别创建基本的响应动作', () => {
      const vitals: VitalsSnapshot = {
        temperature: 38.5,
        timestamp: new Date()
      }
      
      const response = createEmergencyResponse('user-001', vitals, 'warning')
      
      expect(response.severity).toBe('warning')
      expect(response.responseActions).toHaveLength(1)
      expect(response.responseActions[0].type).toBe('alert_family')
    })
  })

  describe('createConsultationMessage', () => {
    it('应该创建有效的问诊消息', () => {
      const message = createConsultationMessage(
        'consultation-001',
        'doctor-001',
        'doctor',
        '您好，请描述症状'
      )
      
      expect(message.consultationId).toBe('consultation-001')
      expect(message.senderId).toBe('doctor-001')
      expect(message.senderType).toBe('doctor')
      expect(message.content).toBe('您好，请描述症状')
      expect(message.messageType).toBe('text')
      expect(message.isRead).toBe(false)
      expect(message.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('createApiResponse', () => {
    it('应该创建成功的API响应', () => {
      const data = { id: '1', name: 'test' }
      const response = createApiResponse(true, data)
      
      expect(response.success).toBe(true)
      expect(response.data).toEqual(data)
      expect(response.error).toBeUndefined()
      expect(response.timestamp).toBeInstanceOf(Date)
    })

    it('应该创建失败的API响应', () => {
      const response = createApiResponse(false, undefined, '网络错误')
      
      expect(response.success).toBe(false)
      expect(response.data).toBeUndefined()
      expect(response.error).toBe('网络错误')
      expect(response.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('createPaginatedResponse', () => {
    it('应该创建分页响应', () => {
      const items = [1, 2, 3, 4, 5]
      const response = createPaginatedResponse(items, 20, 1, 5)
      
      expect(response.items).toEqual(items)
      expect(response.total).toBe(20)
      expect(response.page).toBe(1)
      expect(response.pageSize).toBe(5)
      expect(response.hasMore).toBe(true)
    })

    it('应该正确计算hasMore标志', () => {
      const items = [1, 2, 3]
      const response = createPaginatedResponse(items, 3, 1, 5)
      
      expect(response.hasMore).toBe(false)
    })
  })

  describe('generateId', () => {
    it('应该生成唯一的ID', () => {
      const id1 = generateId()
      const id2 = generateId()
      
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(10)
    })
  })

  describe('formatVitalsForDisplay', () => {
    it('应该格式化完整的生命体征数据', () => {
      const vitals: VitalsSnapshot = {
        heartRate: 75,
        bloodPressure: { systolic: 120, diastolic: 80 },
        temperature: 36.5,
        oxygenSaturation: 98,
        timestamp: new Date()
      }
      
      const formatted = formatVitalsForDisplay(vitals)
      
      expect(formatted).toContain('心率: 75 bpm')
      expect(formatted).toContain('血压: 120/80 mmHg')
      expect(formatted).toContain('体温: 36.5°C')
      expect(formatted).toContain('血氧: 98%')
    })

    it('应该格式化部分生命体征数据', () => {
      const vitals: VitalsSnapshot = {
        heartRate: 75,
        timestamp: new Date()
      }
      
      const formatted = formatVitalsForDisplay(vitals)
      
      expect(formatted).toBe('心率: 75 bpm')
    })
  })

  describe('getSeverityLevel', () => {
    it('应该识别critical级别的异常', () => {
      const criticalVitals: VitalsSnapshot = {
        heartRate: 35, // 严重心动过缓
        timestamp: new Date()
      }
      
      expect(getSeverityLevel(criticalVitals)).toBe('critical')
    })

    it('应该识别urgent级别的异常', () => {
      const urgentVitals: VitalsSnapshot = {
        heartRate: 125, // 心动过速
        timestamp: new Date()
      }
      
      expect(getSeverityLevel(urgentVitals)).toBe('urgent')
    })

    it('应该识别正常的生命体征', () => {
      const normalVitals: VitalsSnapshot = {
        heartRate: 75,
        bloodPressure: { systolic: 120, diastolic: 80 },
        temperature: 36.5,
        oxygenSaturation: 98,
        timestamp: new Date()
      }
      
      expect(getSeverityLevel(normalVitals)).toBeNull()
    })
  })

  describe('calculateDoctorScore', () => {
    it('应该计算医生综合评分', () => {
      const doctor: Doctor = {
        id: 'doctor-001',
        name: '李医生',
        avatar: '/avatars/doctor-001.jpg',
        title: '主任医师',
        department: '心内科',
        specialties: ['高血压'],
        experience: 20, // 满分经验
        rating: 5.0, // 满分评价
        reviewCount: 100, // 满分评价数量
        isOnline: true,
        consultationFee: 200,
        introduction: '经验丰富的医生'
      }
      
      const score = calculateDoctorScore(doctor)
      
      expect(score).toBe(100) // 满分
    })

    it('应该计算新医生的评分', () => {
      const newDoctor: Doctor = {
        id: 'doctor-002',
        name: '张医生',
        avatar: '/avatars/doctor-002.jpg',
        title: '住院医师',
        department: '内科',
        specialties: ['内科'],
        experience: 2, // 较少经验
        rating: 4.0, // 中等评价
        reviewCount: 10, // 较少评价
        isOnline: true,
        consultationFee: 100,
        introduction: '年轻有为的医生'
      }
      
      const score = calculateDoctorScore(newDoctor)
      
      expect(score).toBeLessThan(100)
      expect(score).toBeGreaterThan(0)
    })
  })
})