// utils/__tests__/config-manager.test.ts
// ConfigManager 单元测试

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ConfigManager, type AppConfig } from '../config-manager'

// Mock miniprogram-api
vi.mock('../miniprogram-api', () => ({
  safeWx: {
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn()
  }
}))

describe('ConfigManager', () => {
  let configManager: any
  let mockStorage: Map<string, string>

  beforeEach(() => {
    // Reset singleton instance
    ;(ConfigManager as any).instance = undefined
    
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
    configManager = (ConfigManager as any).getInstance()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = (ConfigManager as any).getInstance()
      const instance2 = (ConfigManager as any).getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('Default Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = configManager.getFullConfig()
      
      expect(config.appName).toBe('HealthLink')
      expect(config.version).toBe('1.0.0')
      expect(config.environment).toBe('development')
      expect(config.modeConfig.defaultMode).toBe('mock')
      expect(config.uiConfig.theme).toBe('light')
      expect(config.debugConfig.logLevel).toBe('info')
    })

    it('should have valid default API configuration', () => {
      const apiConfig = configManager.getConfig('apiConfig')
      
      expect(apiConfig.baseUrl).toBe('https://your-api-domain.com/api')
      expect(apiConfig.timeout).toBe(10000)
      expect(apiConfig.retryCount).toBe(3)
      expect(apiConfig.retryDelay).toBe(1000)
    })
  })

  describe('Configuration Access', () => {
    it('should get configuration values by key', () => {
      expect(configManager.getConfig('appName')).toBe('HealthLink')
      expect(configManager.getConfig('apiConfig.baseUrl')).toBe('https://your-api-domain.com/api')
      expect(configManager.getConfig('uiConfig.theme')).toBe('light')
    })

    it('should return undefined for non-existent keys', () => {
      expect(configManager.getConfig('nonExistent')).toBeUndefined()
      expect(configManager.getConfig('apiConfig.nonExistent')).toBeUndefined()
    })

    it('should set configuration values by key', () => {
      configManager.setConfig('appName', 'NewHealthLink')
      configManager.setConfig('apiConfig.baseUrl', 'https://new-api.com')
      
      expect(configManager.getConfig('appName')).toBe('NewHealthLink')
      expect(configManager.getConfig('apiConfig.baseUrl')).toBe('https://new-api.com')
    })

    it('should create nested objects when setting deep keys', () => {
      configManager.setConfig('newSection.newKey', 'newValue')
      
      expect(configManager.getConfig('newSection.newKey')).toBe('newValue')
    })
  })

  describe('Configuration Validation', () => {
    it('should validate default configuration as valid', () => {
      const validation = configManager.validateConfig()
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      configManager.setConfig('appName', '')
      
      const validation = configManager.validateConfig()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('appName is required')
    })

    it('should validate API URL format', () => {
      configManager.setConfig('apiConfig.baseUrl', 'invalid-url')
      
      const validation = configManager.validateConfig()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('apiConfig.baseUrl must be a valid URL')
    })

    it('should validate timeout values', () => {
      configManager.setConfig('apiConfig.timeout', -1)
      
      const validation = configManager.validateConfig()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('apiConfig.timeout must be greater than 0')
    })

    it('should validate mode configuration', () => {
      configManager.setConfig('modeConfig.defaultMode', 'invalid')
      
      const validation = configManager.validateConfig()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('modeConfig.defaultMode must be "mock" or "api"')
    })

    it('should provide warnings for production environment', () => {
      configManager.setConfig('environment', 'production')
      configManager.setConfig('debugConfig.enableConsoleLog', true)
      configManager.setConfig('modeConfig.defaultMode', 'mock')
      
      const validation = configManager.validateConfig()
      
      expect(validation.warnings).toContain('Console logging should be disabled in production')
      expect(validation.warnings).toContain('Default mode should not be "mock" in production')
    })
  })

  describe('Configuration Persistence', () => {
    it('should save configuration to storage', () => {
      configManager.setConfig('appName', 'TestApp')
      
      const { safeWx } = require('../miniprogram-api')
      expect(safeWx.setStorageSync).toHaveBeenCalledWith(
        'app_config',
        expect.stringContaining('"appName":"TestApp"')
      )
    })

    it('should load configuration from storage', async () => {
      const storedConfig = {
        appName: 'StoredApp',
        version: '2.0.0',
        apiConfig: {
          baseUrl: 'https://stored-api.com'
        }
      }
      
      mockStorage.set('app_config', JSON.stringify(storedConfig))
      
      // Create new instance to test loading
      ;(ConfigManager as any).instance = undefined
      const newManager = (ConfigManager as any).getInstance()
      await newManager.loadConfig()
      
      expect(newManager.getConfig('appName')).toBe('StoredApp')
      expect(newManager.getConfig('version')).toBe('2.0.0')
      expect(newManager.getConfig('apiConfig.baseUrl')).toBe('https://stored-api.com')
    })

    it('should handle storage errors gracefully', async () => {
      const { safeWx } = require('../miniprogram-api')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      safeWx.getStorageSync.mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      // Create new instance to test error handling
      ;(ConfigManager as any).instance = undefined
      const newManager = (ConfigManager as any).getInstance()
      await newManager.loadConfig()
      
      expect(newManager.getConfig('appName')).toBe('HealthLink') // Should use default
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load config:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('Configuration Updates', () => {
    it('should update configuration with partial config', () => {
      const partialConfig = {
        appName: 'UpdatedApp',
        apiConfig: {
          timeout: 15000
        }
      }
      
      configManager.updateConfig(partialConfig)
      
      expect(configManager.getConfig('appName')).toBe('UpdatedApp')
      expect(configManager.getConfig('apiConfig.timeout')).toBe(15000)
      expect(configManager.getConfig('apiConfig.baseUrl')).toBe('https://your-api-domain.com/api') // Should preserve
    })

    it('should reset configuration to defaults', () => {
      configManager.setConfig('appName', 'ModifiedApp')
      configManager.resetConfig()
      
      expect(configManager.getConfig('appName')).toBe('HealthLink')
    })
  })

  describe('Event System', () => {
    it('should notify callbacks on configuration change', () => {
      const callback = vi.fn()
      configManager.onConfigChange(callback)
      
      configManager.setConfig('appName', 'NewApp')
      
      expect(callback).toHaveBeenCalledWith('appName', 'NewApp')
    })

    it('should support multiple callbacks', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      configManager.onConfigChange(callback1)
      configManager.onConfigChange(callback2)
      
      configManager.setConfig('version', '2.0.0')
      
      expect(callback1).toHaveBeenCalledWith('version', '2.0.0')
      expect(callback2).toHaveBeenCalledWith('version', '2.0.0')
    })

    it('should remove callbacks correctly', () => {
      const callback = vi.fn()
      
      configManager.onConfigChange(callback)
      configManager.offConfigChange(callback)
      
      configManager.setConfig('appName', 'TestApp')
      
      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error')
      })
      const normalCallback = vi.fn()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      configManager.onConfigChange(errorCallback)
      configManager.onConfigChange(normalCallback)
      
      configManager.setConfig('appName', 'TestApp')
      
      expect(consoleSpy).toHaveBeenCalledWith('Error in config change callback:', expect.any(Error))
      expect(normalCallback).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Import/Export', () => {
    it('should export configuration to JSON', () => {
      const exported = configManager.exportConfig()
      const parsed = JSON.parse(exported)
      
      expect(parsed.appName).toBe('HealthLink')
      expect(parsed.version).toBe('1.0.0')
    })

    it('should import valid configuration', () => {
      const configJson = JSON.stringify({
        appName: 'ImportedApp',
        version: '3.0.0'
      })
      
      const result = configManager.importConfig(configJson)
      
      expect(result).toBe(true)
      expect(configManager.getConfig('appName')).toBe('ImportedApp')
      expect(configManager.getConfig('version')).toBe('3.0.0')
    })

    it('should reject invalid configuration import', () => {
      const invalidConfigJson = JSON.stringify({
        appName: '',
        apiConfig: {
          baseUrl: 'invalid-url'
        }
      })
      
      const result = configManager.importConfig(invalidConfigJson)
      
      expect(result).toBe(false)
      expect(configManager.getConfig('appName')).toBe('HealthLink') // Should remain unchanged
    })

    it('should handle malformed JSON import', () => {
      const result = configManager.importConfig('invalid json')
      
      expect(result).toBe(false)
    })
  })

  describe('Statistics', () => {
    it('should provide configuration statistics', () => {
      const stats = configManager.getConfigStats()
      
      expect(stats.totalKeys).toBeGreaterThan(0)
      expect(stats.lastModified).toBeGreaterThan(0)
      expect(stats.configSize).toBeGreaterThan(0)
      expect(stats.validationStatus.isValid).toBe(true)
    })
  })
})