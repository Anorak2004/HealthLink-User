import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EmergencyMonitoringService } from '../emergency-monitoring-service'
import { VitalsSnapshot, EmergencyResponse } from '../../types/health-monitoring'

describe('EmergencyMonitoringService', () => {
  let service: EmergencyMonitoringService
  const testUserId = 'test-user-123'

  beforeEach(() => {
    service = new EmergencyMonitoringService()
    vi.clearAllMocks()
  })

  describe('监测服务启动和停止', () => {
    it('应该能够成功启动用户监测', async () => {
      await expect(service.startMonitoring(testUserId)).resolves.toBeUndefined()
      
      const status = service.getMonitoringStatus(testUserId)
      expect(status).toBeDefined()
      expect(status?.isActive).toBe(true)
      expect(status?.userId).toBe(testUserId)
    })

    it('应该能够成功停止用户监测', async () => {
      await service.startMonitoring(testUserId)
      await expect(service.stopMonitoring(testUserId)).resolves.toBeUndefined()
      
      const status = service.getMonitoringStatus(testUserId)
      expect(status?.isActive).toBe(false)
    })

    it('重复启动监测应该抛出错误', async () => {
      await service.startMonitoring(testUserId)
      await expect(service.startMonitoring(testUserId)).rejects.toThrow('already being monitored')
    })

    it('停止不存在的监测应该抛出错误', async () => {
      await expect(service.stopMonitoring('non-existent-user')).rejects.toThrow('No monitoring found')
    })
  })

  describe('心率异常检测', () => {
    it('应该检测到危急心率异常', async () => {
      const vitals: VitalsSnapshot = {
        heartRate: 35, // 低于危急阈值40
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('critical')
      expect(response?.responseActions).toHaveLength(3)
      expect(response?.responseActions[0].type).toBe('call_120')
    })

    it('应该检测到紧急心率异常', async () => {
      const vitals: VitalsSnapshot = {
        heartRate: 45, // 在危急和紧急阈值之间
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('urgent')
      expect(response?.responseActions[0].type).toBe('call_doctor')
    })

    it('应该检测到警告级心率异常', async () => {
      const vitals: VitalsSnapshot = {
        heartRate: 55, // 在紧急和警告阈值之间
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('warning')
      expect(response?.responseActions).toHaveLength(2)
    })

    it('正常心率不应该触发响应', async () => {
      const vitals: VitalsSnapshot = {
        heartRate: 75, // 正常范围
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeNull()
    })

    it('应该检测到高心率异常', async () => {
      const vitals: VitalsSnapshot = {
        heartRate: 160, // 高于危急阈值150
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('critical')
    })
  })

  describe('血压异常检测', () => {
    it('应该检测到危急血压异常', async () => {
      const vitals: VitalsSnapshot = {
        bloodPressure: { systolic: 60, diastolic: 30 }, // 低于危急阈值
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('critical')
    })

    it('应该检测到高血压危急异常', async () => {
      const vitals: VitalsSnapshot = {
        bloodPressure: { systolic: 210, diastolic: 130 }, // 高于危急阈值
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('critical')
    })

    it('应该检测到紧急血压异常', async () => {
      const vitals: VitalsSnapshot = {
        bloodPressure: { systolic: 85, diastolic: 45 }, // 在危急和紧急阈值之间
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('urgent')
    })

    it('正常血压不应该触发响应', async () => {
      const vitals: VitalsSnapshot = {
        bloodPressure: { systolic: 120, diastolic: 80 }, // 正常范围
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeNull()
    })
  })

  describe('体温异常检测', () => {
    it('应该检测到危急低体温', async () => {
      const vitals: VitalsSnapshot = {
        temperature: 34.5, // 低于危急阈值35.0
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('critical')
    })

    it('应该检测到危急高体温', async () => {
      const vitals: VitalsSnapshot = {
        temperature: 40.5, // 高于危急阈值40.0
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('critical')
    })

    it('应该检测到紧急体温异常', async () => {
      const vitals: VitalsSnapshot = {
        temperature: 35.2, // 在危急和紧急阈值之间
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('urgent')
    })

    it('正常体温不应该触发响应', async () => {
      const vitals: VitalsSnapshot = {
        temperature: 37.0, // 正常范围
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeNull()
    })
  })

  describe('血氧饱和度异常检测', () => {
    it('应该检测到危急血氧饱和度', async () => {
      const vitals: VitalsSnapshot = {
        oxygenSaturation: 80, // 低于危急阈值85
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('critical')
    })

    it('应该检测到紧急血氧饱和度', async () => {
      const vitals: VitalsSnapshot = {
        oxygenSaturation: 88, // 在危急和紧急阈值之间
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('urgent')
    })

    it('应该检测到警告血氧饱和度', async () => {
      const vitals: VitalsSnapshot = {
        oxygenSaturation: 93, // 在紧急和警告阈值之间
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('warning')
    })

    it('正常血氧饱和度不应该触发响应', async () => {
      const vitals: VitalsSnapshot = {
        oxygenSaturation: 98, // 正常范围
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeNull()
    })
  })

  describe('多指标综合异常检测', () => {
    it('应该返回最严重的异常级别', async () => {
      const vitals: VitalsSnapshot = {
        heartRate: 55, // warning级别
        temperature: 34.0, // critical级别
        oxygenSaturation: 93, // warning级别
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('critical') // 应该返回最严重的级别
    })

    it('应该正确处理部分指标异常', async () => {
      const vitals: VitalsSnapshot = {
        heartRate: 75, // 正常
        bloodPressure: { systolic: 85, diastolic: 45 }, // urgent级别
        temperature: 37.0, // 正常
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()
      expect(response?.severity).toBe('urgent')
    })

    it('所有指标正常时不应该触发响应', async () => {
      const vitals: VitalsSnapshot = {
        heartRate: 75,
        bloodPressure: { systolic: 120, diastolic: 80 },
        temperature: 37.0,
        oxygenSaturation: 98,
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeNull()
    })
  })

  describe('紧急响应管理', () => {
    it('应该能够确认紧急响应', async () => {
      const vitals: VitalsSnapshot = {
        heartRate: 35,
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeDefined()

      await expect(service.acknowledgeEmergency(response!.id)).resolves.toBeUndefined()
      
      const updatedResponse = service.getEmergencyResponse(response!.id)
      expect(updatedResponse?.status).toBe('acknowledged')
    })

    it('确认不存在的紧急响应应该抛出错误', async () => {
      await expect(service.acknowledgeEmergency('non-existent-id')).rejects.toThrow('Emergency response not found')
    })

    it('应该能够获取用户的紧急响应记录', async () => {
      const vitals1: VitalsSnapshot = {
        heartRate: 35,
        timestamp: new Date()
      }
      const vitals2: VitalsSnapshot = {
        temperature: 34.0,
        timestamp: new Date()
      }

      await service.checkVitals(vitals1)
      await service.checkVitals(vitals2)

      const responses = service.getUserEmergencyResponses('current-user')
      expect(responses).toHaveLength(2)
      expect(responses.every(r => r.userId === 'current-user')).toBe(true)
    })
  })

  describe('响应动作生成', () => {
    it('危急情况应该生成正确的响应动作', async () => {
      const vitals: VitalsSnapshot = {
        heartRate: 35,
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response?.responseActions).toHaveLength(3)
      expect(response?.responseActions[0]).toEqual({
        type: 'call_120',
        priority: 1,
        executed: false
      })
      expect(response?.responseActions[1]).toEqual({
        type: 'call_doctor',
        priority: 2,
        executed: false
      })
      expect(response?.responseActions[2]).toEqual({
        type: 'alert_family',
        priority: 3,
        executed: false
      })
    })

    it('紧急情况应该生成正确的响应动作', async () => {
      const vitals: VitalsSnapshot = {
        heartRate: 45,
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response?.responseActions).toHaveLength(3)
      expect(response?.responseActions[0].type).toBe('call_doctor')
      expect(response?.responseActions[1].type).toBe('call_120')
      expect(response?.responseActions[2].type).toBe('alert_family')
    })

    it('警告情况应该生成正确的响应动作', async () => {
      const vitals: VitalsSnapshot = {
        heartRate: 55,
        timestamp: new Date()
      }

      const response = await service.checkVitals(vitals)
      expect(response?.responseActions).toHaveLength(2)
      expect(response?.responseActions[0].type).toBe('call_doctor')
      expect(response?.responseActions[1].type).toBe('alert_family')
    })
  })

  describe('边界值测试', () => {
    it('应该正确处理阈值边界值', async () => {
      // 测试心率边界值
      const criticalBoundary: VitalsSnapshot = {
        heartRate: 40, // 正好等于危急阈值
        timestamp: new Date()
      }

      const response = await service.checkVitals(criticalBoundary)
      expect(response).toBeNull() // 等于阈值应该不触发

      const justBelowCritical: VitalsSnapshot = {
        heartRate: 39, // 刚好低于危急阈值
        timestamp: new Date()
      }

      const response2 = await service.checkVitals(justBelowCritical)
      expect(response2?.severity).toBe('critical')
    })

    it('应该正确处理undefined值', async () => {
      const vitals: VitalsSnapshot = {
        timestamp: new Date()
        // 所有生命体征都是undefined
      }

      const response = await service.checkVitals(vitals)
      expect(response).toBeNull()
    })
  })
})