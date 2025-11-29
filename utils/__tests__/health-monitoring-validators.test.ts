// 健康监护系统数据验证测试

import { describe, it, expect } from 'vitest'
import {
  validateVitalsSnapshot,
  isEmergencyVitals,
  validateEmergencyResponse,
  validateHealthArticle,
  validateDoctor,
  validateConsultationMessage,
  validateConsultation,
  sanitizeString,
  validateId,
  validateEmail,
  validatePhoneNumber
} from '../health-monitoring-validators'
import {
  VitalsSnapshot,
  EmergencyResponse,
  HealthArticle,
  Doctor,
  ConsultationMessage,
  Consultation
} from '../../types/health-monitoring'

describe('健康监护数据验证测试', () => {
  
  // ============================================================================
  // 生命体征数据验证测试
  // ============================================================================
  
  describe('validateVitalsSnapshot', () => {
    it('应该验证有效的生命体征数据', () => {
      const validVitals: VitalsSnapshot = {
        heartRate: 75,
        bloodPressure: { systolic: 120, diastolic: 80 },
        temperature: 36.5,
        oxygenSaturation: 98,
        timestamp: new Date()
      }
      
      expect(validateVitalsSnapshot(validVitals)).toBe(true)
    })

    it('应该拒绝无效的心率数据', () => {
      const invalidVitals = {
        heartRate: 300, // 超出正常范围
        timestamp: new Date()
      }
      
      expect(validateVitalsSnapshot(invalidVitals)).toBe(false)
    })

    it('应该拒绝无效的血压数据', () => {
      const invalidVitals = {
        bloodPressure: { systolic: 300, diastolic: 200 }, // 超出正常范围
        timestamp: new Date()
      }
      
      expect(validateVitalsSnapshot(invalidVitals)).toBe(false)
    })

    it('应该拒绝缺少时间戳的数据', () => {
      const invalidVitals = {
        heartRate: 75
        // 缺少 timestamp
      }
      
      expect(validateVitalsSnapshot(invalidVitals)).toBe(false)
    })
  })

  describe('isEmergencyVitals', () => {
    it('应该识别心率异常的紧急情况', () => {
      const emergencyVitals: VitalsSnapshot = {
        heartRate: 45, // 低于正常范围
        timestamp: new Date()
      }
      
      expect(isEmergencyVitals(emergencyVitals)).toBe(true)
    })

    it('应该识别血压异常的紧急情况', () => {
      const emergencyVitals: VitalsSnapshot = {
        bloodPressure: { systolic: 190, diastolic: 120 }, // 高血压危象
        timestamp: new Date()
      }
      
      expect(isEmergencyVitals(emergencyVitals)).toBe(true)
    })

    it('应该识别血氧饱和度异常的紧急情况', () => {
      const emergencyVitals: VitalsSnapshot = {
        oxygenSaturation: 85, // 低于正常范围
        timestamp: new Date()
      }
      
      expect(isEmergencyVitals(emergencyVitals)).toBe(true)
    })

    it('应该识别正常的生命体征', () => {
      const normalVitals: VitalsSnapshot = {
        heartRate: 75,
        bloodPressure: { systolic: 120, diastolic: 80 },
        temperature: 36.5,
        oxygenSaturation: 98,
        timestamp: new Date()
      }
      
      expect(isEmergencyVitals(normalVitals)).toBe(false)
    })
  })

  // ============================================================================
  // 紧急响应数据验证测试
  // ============================================================================

  describe('validateEmergencyResponse', () => {
    it('应该验证有效的紧急响应数据', () => {
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
      
      expect(validateEmergencyResponse(validResponse)).toBe(true)
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
        severity: 'invalid-severity', // 无效的严重程度
        responseActions: [],
        status: 'triggered'
      }
      
      expect(validateEmergencyResponse(invalidResponse)).toBe(false)
    })
  })

  // ============================================================================
  // 健康文章数据验证测试
  // ============================================================================

  describe('validateHealthArticle', () => {
    it('应该验证有效的健康文章数据', () => {
      const validArticle: HealthArticle = {
        id: 'article-001',
        title: '高血压的预防与治疗',
        content: '详细的文章内容...',
        summary: '文章摘要',
        category: {
          id: 'cat-001',
          name: '心血管疾病',
          icon: 'heart',
          description: '心血管相关疾病'
        },
        tags: ['高血压', '预防', '治疗'],
        images: [
          {
            url: '/images/assessment.png',
            caption: '血压测量',
            alt: '血压计图片'
          }
        ],
        author: '张医生',
        publishDate: new Date(),
        readCount: 1250,
        difficulty: 'basic'
      }
      
      expect(validateHealthArticle(validArticle)).toBe(true)
    })

    it('应该拒绝缺少必需字段的文章', () => {
      const invalidArticle = {
        id: 'article-001',
        // 缺少 title
        content: '详细的文章内容...',
        summary: '文章摘要',
        author: '张医生',
        publishDate: new Date(),
        readCount: 1250,
        difficulty: 'basic',
        tags: [],
        images: []
      }
      
      expect(validateHealthArticle(invalidArticle)).toBe(false)
    })
  })

  // ============================================================================
  // 医生信息数据验证测试
  // ============================================================================

  describe('validateDoctor', () => {
    it('应该验证有效的医生信息', () => {
      const validDoctor: Doctor = {
        id: 'doctor-001',
        name: '李医生',
        avatar: '/avatars/doctor-001.jpg',
        title: '主任医师',
        department: '心内科',
        specialties: ['高血压', '冠心病', '心律失常'],
        experience: 15,
        rating: 4.8,
        reviewCount: 324,
        isOnline: true,
        consultationFee: 200,
        introduction: '从事心血管疾病诊治15年，擅长...'
      }
      
      expect(validateDoctor(validDoctor)).toBe(true)
    })

    it('应该拒绝无效的评分', () => {
      const invalidDoctor = {
        id: 'doctor-001',
        name: '李医生',
        avatar: '/avatars/doctor-001.jpg',
        title: '主任医师',
        department: '心内科',
        specialties: ['高血压'],
        experience: 15,
        rating: 6.0, // 超出有效范围 (0-5)
        reviewCount: 324,
        isOnline: true,
        consultationFee: 200,
        introduction: '从事心血管疾病诊治15年'
      }
      
      expect(validateDoctor(invalidDoctor)).toBe(false)
    })
  })

  // ============================================================================
  // 问诊消息数据验证测试
  // ============================================================================

  describe('validateConsultationMessage', () => {
    it('应该验证有效的问诊消息', () => {
      const validMessage: ConsultationMessage = {
        id: 'msg-001',
        consultationId: 'consultation-001',
        senderId: 'doctor-001',
        senderType: 'doctor',
        content: '您好，请描述一下您的症状',
        messageType: 'text',
        timestamp: new Date(),
        isRead: false
      }
      
      expect(validateConsultationMessage(validMessage)).toBe(true)
    })

    it('应该拒绝无效的发送者类型', () => {
      const invalidMessage = {
        id: 'msg-001',
        consultationId: 'consultation-001',
        senderId: 'doctor-001',
        senderType: 'invalid-type', // 无效的发送者类型
        content: '您好，请描述一下您的症状',
        messageType: 'text',
        timestamp: new Date(),
        isRead: false
      }
      
      expect(validateConsultationMessage(invalidMessage)).toBe(false)
    })
  })

  // ============================================================================
  // 问诊记录数据验证测试
  // ============================================================================

  describe('validateConsultation', () => {
    it('应该验证有效的问诊记录', () => {
      const validConsultation: Consultation = {
        id: 'consultation-001',
        doctorId: 'doctor-001',
        userId: 'user-001',
        status: 'active',
        startTime: new Date(),
        endTime: undefined,
        messages: [],
        summary: undefined
      }
      
      expect(validateConsultation(validConsultation)).toBe(true)
    })

    it('应该拒绝无效的状态', () => {
      const invalidConsultation = {
        id: 'consultation-001',
        doctorId: 'doctor-001',
        userId: 'user-001',
        status: 'invalid-status', // 无效状态
        startTime: new Date(),
        messages: []
      }
      
      expect(validateConsultation(invalidConsultation)).toBe(false)
    })
  })

  // ============================================================================
  // 通用验证工具测试
  // ============================================================================

  describe('通用验证工具', () => {
    describe('sanitizeString', () => {
      it('应该清理字符串中的危险字符', () => {
        const input = '  <script>alert("xss")</script>  '
        const expected = 'scriptalert("xss")/script'
        expect(sanitizeString(input)).toBe(expected)
      })
    })

    describe('validateId', () => {
      it('应该验证有效的ID', () => {
        expect(validateId('valid-id-123')).toBe(true)
        expect(validateId('')).toBe(false)
        expect(validateId('a'.repeat(37))).toBe(false) // 超过36个字符
      })
    })

    describe('validateEmail', () => {
      it('应该验证有效的邮箱地址', () => {
        expect(validateEmail('user@example.com')).toBe(true)
        expect(validateEmail('invalid-email')).toBe(false)
        expect(validateEmail('user@')).toBe(false)
      })
    })

    describe('validatePhoneNumber', () => {
      it('应该验证有效的中国手机号', () => {
        expect(validatePhoneNumber('13812345678')).toBe(true)
        expect(validatePhoneNumber('12345678901')).toBe(false) // 不是1开头的有效号段
        expect(validatePhoneNumber('1381234567')).toBe(false) // 位数不够
      })
    })
  })
})
