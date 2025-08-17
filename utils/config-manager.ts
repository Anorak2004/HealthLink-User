// utils/config-manager.ts
// 配置管理器 - 管理应用配置和模式设置

import { safeWx } from './miniprogram-api'

export interface AppConfig {
  // 应用基础配置
  appName: string
  version: string
  environment: 'development' | 'production' | 'testing'
  
  // API配置
  apiConfig: {
    baseUrl: string
    timeout: number
    retryCount: number
    retryDelay: number
  }
  
  // 模式配置
  modeConfig: {
    defaultMode: 'mock' | 'api'
    allowModeSwitch: boolean
    mockDataEnabled: boolean
    fallbackEnabled: boolean
  }
  
  // UI配置
  uiConfig: {
    theme: 'light' | 'dark' | 'auto'
    language: 'zh-CN' | 'en-US'
    showModeIndicator: boolean
    animationEnabled: boolean
  }
  
  // 功能配置
  featureConfig: {
    healthRecordEnabled: boolean
    healthAssessmentEnabled: boolean
    doctorConsultEnabled: boolean
    notificationEnabled: boolean
  }
  
  // 调试配置
  debugConfig: {
    logLevel: 'debug' | 'info' | 'warn' | 'error'
    enableConsoleLog: boolean
    enableErrorReporting: boolean
    mockApiDelay: number
  }
}

export interface ConfigValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface IConfigManager {
  getConfig<T = any>(key: string): T | undefined
  setConfig(key: string, value: any): void
  loadConfig(): Promise<void>
  saveConfig(): Promise<void>
  resetConfig(): void
  validateConfig(): ConfigValidationResult
  getFullConfig(): AppConfig
  updateConfig(config: Partial<AppConfig>): void
  onConfigChange(callback: (key: string, value: any) => void): void
  offConfigChange(callback: (key: string, value: any) => void): void
}

type ConfigChangeCallback = (key: string, value: any) => void

class ConfigManager implements IConfigManager {
  private static instance: ConfigManager
  private config: AppConfig
  private callbacks: Set<ConfigChangeCallback> = new Set()
  private readonly STORAGE_KEY = 'app_config'
  
  private readonly DEFAULT_CONFIG: AppConfig = {
    appName: 'HealthLink',
    version: '1.0.0',
    environment: 'development',
    
    apiConfig: {
      baseUrl: 'https://your-api-domain.com/api',
      timeout: 10000,
      retryCount: 3,
      retryDelay: 1000
    },
    
    modeConfig: {
      defaultMode: 'mock',
      allowModeSwitch: true,
      mockDataEnabled: true,
      fallbackEnabled: true
    },
    
    uiConfig: {
      theme: 'light',
      language: 'zh-CN',
      showModeIndicator: true,
      animationEnabled: true
    },
    
    featureConfig: {
      healthRecordEnabled: true,
      healthAssessmentEnabled: true,
      doctorConsultEnabled: true,
      notificationEnabled: true
    },
    
    debugConfig: {
      logLevel: 'info',
      enableConsoleLog: true,
      enableErrorReporting: false,
      mockApiDelay: 500
    }
  }

  private constructor() {
    this.config = this.getDefaultConfig()
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  /**
   * 获取配置值
   */
  getConfig<T = any>(key: string): T | undefined {
    try {
      const keys = key.split('.')
      let value: any = this.config
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k]
        } else {
          return undefined
        }
      }
      
      return value as T
    } catch (error) {
      console.error('Failed to get config:', key, error)
      return undefined
    }
  }

  /**
   * 设置配置值
   */
  setConfig(key: string, value: any): void {
    try {
      const keys = key.split('.')
      let target: any = this.config
      
      // 导航到目标对象
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]
        if (!target[k] || typeof target[k] !== 'object') {
          target[k] = {}
        }
        target = target[k]
      }
      
      // 设置值
      const lastKey = keys[keys.length - 1]
      const oldValue = target[lastKey]
      target[lastKey] = value
      
      // 触发变更事件
      if (oldValue !== value) {
        this.notifyConfigChange(key, value)
      }
      
      // 自动保存
      this.saveConfig()
    } catch (error) {
      console.error('Failed to set config:', key, value, error)
    }
  }

  /**
   * 从本地存储加载配置
   */
  async loadConfig(): Promise<void> {
    try {
      const stored = safeWx.getStorageSync(this.STORAGE_KEY)
      if (stored) {
        const parsedConfig = typeof stored === 'string' ? JSON.parse(stored) : stored
        this.config = this.mergeConfig(this.getDefaultConfig(), parsedConfig)
        console.log('Config loaded successfully')
      } else {
        console.log('No stored config found, using defaults')
      }
    } catch (error) {
      console.error('Failed to load config:', error)
      this.config = this.getDefaultConfig()
    }
  }

  /**
   * 保存配置到本地存储
   */
  async saveConfig(): Promise<void> {
    try {
      safeWx.setStorageSync(this.STORAGE_KEY, JSON.stringify(this.config))
      console.log('Config saved successfully')
    } catch (error) {
      console.error('Failed to save config:', error)
    }
  }

  /**
   * 重置配置到默认值
   */
  resetConfig(): void {
    this.config = this.getDefaultConfig()
    this.saveConfig()
    console.log('Config reset to defaults')
  }

  /**
   * 验证配置
   */
  validateConfig(): ConfigValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // 验证必需字段
      if (!this.config.appName) {
        errors.push('appName is required')
      }
      
      if (!this.config.version) {
        errors.push('version is required')
      }

      // 验证API配置
      if (!this.config.apiConfig.baseUrl) {
        errors.push('apiConfig.baseUrl is required')
      } else if (!this.isValidUrl(this.config.apiConfig.baseUrl)) {
        errors.push('apiConfig.baseUrl must be a valid URL')
      }

      if (this.config.apiConfig.timeout <= 0) {
        errors.push('apiConfig.timeout must be greater than 0')
      }

      if (this.config.apiConfig.retryCount < 0) {
        errors.push('apiConfig.retryCount must be non-negative')
      }

      // 验证模式配置
      if (!['mock', 'api'].includes(this.config.modeConfig.defaultMode)) {
        errors.push('modeConfig.defaultMode must be "mock" or "api"')
      }

      // 验证UI配置
      if (!['light', 'dark', 'auto'].includes(this.config.uiConfig.theme)) {
        errors.push('uiConfig.theme must be "light", "dark", or "auto"')
      }

      if (!['zh-CN', 'en-US'].includes(this.config.uiConfig.language)) {
        errors.push('uiConfig.language must be "zh-CN" or "en-US"')
      }

      // 验证调试配置
      if (!['debug', 'info', 'warn', 'error'].includes(this.config.debugConfig.logLevel)) {
        errors.push('debugConfig.logLevel must be one of: debug, info, warn, error')
      }

      if (this.config.debugConfig.mockApiDelay < 0) {
        warnings.push('debugConfig.mockApiDelay should be non-negative')
      }

      // 环境特定验证
      if (this.config.environment === 'production') {
        if (this.config.debugConfig.enableConsoleLog) {
          warnings.push('Console logging should be disabled in production')
        }
        
        if (this.config.modeConfig.defaultMode === 'mock') {
          warnings.push('Default mode should not be "mock" in production')
        }
      }

    } catch (error) {
      errors.push(`Config validation error: ${error}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 获取完整配置
   */
  getFullConfig(): AppConfig {
    return JSON.parse(JSON.stringify(this.config))
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AppConfig>): void {
    this.config = this.mergeConfig(this.config, config)
    this.saveConfig()
  }

  /**
   * 注册配置变更回调
   */
  onConfigChange(callback: ConfigChangeCallback): void {
    this.callbacks.add(callback)
  }

  /**
   * 取消注册配置变更回调
   */
  offConfigChange(callback: ConfigChangeCallback): void {
    this.callbacks.delete(callback)
  }

  /**
   * 获取默认配置的深拷贝
   */
  private getDefaultConfig(): AppConfig {
    return JSON.parse(JSON.stringify(this.DEFAULT_CONFIG))
  }

  /**
   * 深度合并配置对象
   */
  private mergeConfig(target: any, source: any): any {
    const result = { ...target }
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.mergeConfig(target[key] || {}, source[key])
        } else {
          result[key] = source[key]
        }
      }
    }
    
    return result
  }

  /**
   * 验证URL格式
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * 通知配置变更
   */
  private notifyConfigChange(key: string, value: any): void {
    this.callbacks.forEach(callback => {
      try {
        callback(key, value)
      } catch (error) {
        console.error('Error in config change callback:', error)
      }
    })
  }

  /**
   * 导出配置到JSON字符串
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2)
  }

  /**
   * 从JSON字符串导入配置
   */
  importConfig(configJson: string): boolean {
    try {
      const importedConfig = JSON.parse(configJson)
      const validation = this.validateImportedConfig(importedConfig)
      
      if (validation.isValid) {
        this.config = this.mergeConfig(this.getDefaultConfig(), importedConfig)
        this.saveConfig()
        return true
      } else {
        console.error('Invalid config import:', validation.errors)
        return false
      }
    } catch (error) {
      console.error('Failed to import config:', error)
      return false
    }
  }

  /**
   * 验证导入的配置
   */
  private validateImportedConfig(config: any): ConfigValidationResult {
    // 临时设置配置进行验证
    const originalConfig = this.config
    this.config = this.mergeConfig(this.getDefaultConfig(), config)
    
    const result = this.validateConfig()
    
    // 恢复原配置
    this.config = originalConfig
    
    return result
  }

  /**
   * 获取配置统计信息
   */
  getConfigStats(): {
    totalKeys: number
    lastModified: number
    configSize: number
    validationStatus: ConfigValidationResult
  } {
    const configString = JSON.stringify(this.config)
    
    return {
      totalKeys: this.countKeys(this.config),
      lastModified: Date.now(),
      configSize: configString.length,
      validationStatus: this.validateConfig()
    }
  }

  /**
   * 递归计算配置键的数量
   */
  private countKeys(obj: any): number {
    let count = 0
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        count++
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          count += this.countKeys(obj[key])
        }
      }
    }
    
    return count
  }
}

// 导出单例实例
export const configManager = ConfigManager.getInstance()
export default configManager