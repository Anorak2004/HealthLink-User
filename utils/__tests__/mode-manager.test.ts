// utils/__tests__/mode-manager.test.ts
// ModeManager 单元测试

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ModeManager, type AppMode, type ModeChangeEvent } from '../mode-manager'

// Mock miniprogram-api
vi.mock('../miniprogram-api', () => ({
  safeWx: {
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn()
  }
}))

describe('ModeManager', () => {
  let modeManager: any
  let mockStorage: Map<string, string>

  beforeEach(() => {
    // Reset singleton instance
    ;(ModeManager as any).instance = undefined
    
    // Setup mock storage
    mockStorage = new Map()
    const { safeWx } = require('../miniprogram-api')
    
    safeWx.getStorageSync.mockImplementation((key: string) => {
      return mockStorage.get(key) || null
    })
    
    safeWx.setStorageSync.mockImplementation((key: string, value: string) => {
      mockStorage.set(key, value)
    })

    // Get fresh instance
    modeManager = (ModeManager as any).getInstance()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = (ModeManager as any).getInstance()
      const instance2 = (ModeManager as any).getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('Default Configuration', () => {
    it('should initialize with default mock mode', () => {
      expect(modeManager.getCurrentMode()).toBe('mock')
      expect(modeManager.isMockMode()).toBe(true)
      expect(modeManager.isApiMode()).toBe(false)
    })

    it('should have correct default configuration', () => {
      const config = modeManager.getConfig()
      expect(config.currentMode).toBe('mock')
      expect(config.mockDataEnabled).toBe(true)
      expect(config.fallbackEnabled).toBe(true)
      expect(config.switchCount).toBe(0)
      expect(config.apiBaseUrl).toBe('https://your-api-domain.com/api')
    })
  })

  describe('Mode Switching', () => {
    it('should switch from mock to api mode', async () => {
      const result = await modeManager.switchMode('api')
      
      expect(result).toBe(true)
      expect(modeManager.getCurrentMode()).toBe('api')
      expect(modeManager.isApiMode()).toBe(true)
      expect(modeManager.isMockMode()).toBe(false)
    })

    it('should switch from api to mock mode', async () => {
      await modeManager.switchMode('api')
      const result = await modeManager.switchMode('mock')
      
      expect(result).toBe(true)
      expect(modeManager.getCurrentMode()).toBe('mock')
      expect(modeManager.isMockMode()).toBe(true)
      expect(modeManager.isApiMode()).toBe(false)
    })

    it('should not switch if already in the same mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const result = await modeManager.switchMode('mock')
      
      expect(result).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('Already in mock mode')
      
      consoleSpy.mockRestore()
    })

    it('should update switch count and timestamp', async () => {
      const initialConfig = modeManager.getConfig()
      const initialSwitchCount = initialConfig.switchCount
      
      await modeManager.switchMode('api')
      
      const updatedConfig = modeManager.getConfig()
      expect(updatedConfig.switchCount).toBe(initialSwitchCount + 1)
      expect(updatedConfig.lastSwitchTime).toBeGreaterThan(initialConfig.lastSwitchTime)
    })
  })

  describe('Event System', () => {
    it('should notify callbacks on mode change', async () => {
      const callback = vi.fn()
      modeManager.onModeChange(callback)
      
      await modeManager.switchMode('api')
      
      expect(callback).toHaveBeenCalledWith({
        oldMode: 'mock',
        newMode: 'api',
        timestamp: expect.any(Number)
      })
    })

    it('should support multiple callbacks', async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      modeManager.onModeChange(callback1)
      modeManager.onModeChange(callback2)
      
      await modeManager.switchMode('api')
      
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    it('should remove callbacks correctly', async () => {
      const callback = vi.fn()
      
      modeManager.onModeChange(callback)
      modeManager.offModeChange(callback)
      
      await modeManager.switchMode('api')
      
      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle callback errors gracefully', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error')
      })
      const normalCallback = vi.fn()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      modeManager.onModeChange(errorCallback)
      modeManager.onModeChange(normalCallback)
      
      await modeManager.switchMode('api')
      
      expect(consoleSpy).toHaveBeenCalledWith('Error in mode change callback:', expect.any(Error))
      expect(normalCallback).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        apiBaseUrl: 'https://new-api.com',
        fallbackEnabled: false
      }
      
      modeManager.updateConfig(newConfig)
      
      const config = modeManager.getConfig()
      expect(config.apiBaseUrl).toBe('https://new-api.com')
      expect(config.fallbackEnabled).toBe(false)
      expect(config.currentMode).toBe('mock') // Should preserve other values
    })

    it('should reset configuration to defaults', () => {
      modeManager.updateConfig({ apiBaseUrl: 'https://custom.com' })
      modeManager.resetConfig()
      
      const config = modeManager.getConfig()
      expect(config.apiBaseUrl).toBe('https://your-api-domain.com/api')
      expect(config.currentMode).toBe('mock')
    })
  })

  describe('Persistence', () => {
    it('should save configuration to storage', async () => {
      await modeManager.switchMode('api')
      
      const { safeWx } = require('../miniprogram-api')
      expect(safeWx.setStorageSync).toHaveBeenCalledWith(
        'mode_config',
        expect.stringContaining('"currentMode":"api"')
      )
    })

    it('should load configuration from storage', () => {
      const storedConfig = {
        currentMode: 'api',
        switchCount: 5,
        apiBaseUrl: 'https://stored-api.com'
      }
      
      mockStorage.set('mode_config', JSON.stringify(storedConfig))
      
      // Create new instance to test loading
      ;(ModeManager as any).instance = undefined
      const newManager = (ModeManager as any).getInstance()
      
      expect(newManager.getCurrentMode()).toBe('api')
      expect(newManager.getConfig().switchCount).toBe(5)
      expect(newManager.getConfig().apiBaseUrl).toBe('https://stored-api.com')
    })

    it('should handle storage errors gracefully', () => {
      const { safeWx } = require('../miniprogram-api')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      safeWx.getStorageSync.mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      // Create new instance to test error handling
      ;(ModeManager as any).instance = undefined
      const newManager = (ModeManager as any).getInstance()
      
      expect(newManager.getCurrentMode()).toBe('mock') // Should use default
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load mode config:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('Statistics', () => {
    it('should provide correct statistics', async () => {
      await modeManager.switchMode('api')
      
      const stats = modeManager.getStats()
      
      expect(stats.switchCount).toBe(1)
      expect(stats.currentMode).toBe('api')
      expect(stats.lastSwitchTime).toBeGreaterThan(0)
      expect(stats.uptime).toBeGreaterThanOrEqual(0)
    })
  })
})