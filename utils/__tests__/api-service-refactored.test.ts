// utils/__tests__/api-service-refactored.test.ts
// 重构后API服务的测试

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiService } from '../api'

// Mock dependencies
vi.mock('../miniprogram-api', () => ({
  wx: {
    request: vi.fn(),
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn()
  },
  getApp: vi.fn(() => ({
    globalData: {
      isApiMode: true
    }
  }))
}))

// 不再需要mock ModeManager

describe('Refactored ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should get health data in mock mode', async () => {
    const result = await apiService.getHealthData()
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('should submit health data in mock mode', async () => {
    const testData = {
      type: 'blood_pressure' as const,
      value: '120/80',
      date: '2024-01-16',
      time: '09:00'
    }

    const result = await apiService.submitHealthData(testData)
    expect(result).toBe(true)
  })

  it('should get health assessment', async () => {
    const result = await apiService.getHealthAssessment()
    expect(result).toBeDefined()
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('riskLevel')
    expect(result).toHaveProperty('summary')
  })

  it('should get doctor messages', async () => {
    const result = await apiService.getDoctorMessages()
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
  })

  it('should send message to doctor', async () => {
    const result = await apiService.sendMessageToDoctor('Test message')
    expect(result).toBe(true)
  })

  it('should get health indicators', async () => {
    const result = await apiService.getHealthIndicators()
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('should get user stats', async () => {
    const result = await apiService.getUserStats()
    expect(result).toBeDefined()
    expect(result).toHaveProperty('recordCount')
    expect(result).toHaveProperty('assessmentCount')
    expect(result).toHaveProperty('consultCount')
    expect(result).toHaveProperty('daysUsed')
  })

  it('should get service status', () => {
    const status = apiService.getServiceStatus()
    expect(status).toBeDefined()
    expect(status).toHaveProperty('mode')
    expect(status).toHaveProperty('isOnline')
    expect(status).toHaveProperty('lastApiCall')
    expect(status).toHaveProperty('errorCount')
    expect(status).toHaveProperty('fallbackActive')
  })

  it('should get current mode', () => {
    const mode = apiService.getCurrentMode()
    expect(mode).toBe('mock')
  })

  it('should switch mode', () => {
    apiService.switchMode('api')
    expect(apiService.getCurrentMode()).toBe('api')
    
    apiService.switchMode('mock')
    expect(apiService.getCurrentMode()).toBe('mock')
  })
})