// utils/mode-manager.ts
// 模式管理器 - 负责模式切换和状态管理

import { safeWx } from './miniprogram-api'

export type AppMode = 'mock' | 'api'

export interface ModeConfig {
  currentMode: AppMode
  apiBaseUrl: string
  mockDataEnabled: boolean
  fallbackEnabled: boolean
  lastSwitchTime: number
  switchCount: number
}

export interface ModeChangeEvent {
  oldMode: AppMode
  newMode: AppMode
  timestamp: number
}

type ModeChangeCallback = (event: ModeChangeEvent) => void

export interface IModeManager {
  getCurrentMode(): AppMode
  switchMode(mode: AppMode): Promise<boolean>
  isApiMode(): boolean
  isMockMode(): boolean
  onModeChange(callback: ModeChangeCallback): void
  offModeChange(callback: ModeChangeCallback): void
  getConfig(): ModeConfig
  updateConfig(config: Partial<ModeConfig>): void
}

class ModeManager implements IModeManager {
  private static instance: ModeManager
  private config: ModeConfig
  private callbacks: Set<ModeChangeCallback> = new Set()
  private readonly STORAGE_KEY = 'mode_config'
  
  private readonly DEFAULT_CONFIG: ModeConfig = {
    currentMode: 'mock',
    apiBaseUrl: 'https://your-api-domain.com/api',
    mockDataEnabled: true,
    fallbackEnabled: true,
    lastSwitchTime: Date.now(),
    switchCount: 0
  }

  private constructor() {
    this.config = this.loadConfig()
  }

  public static getInstance(): ModeManager {
    if (!ModeManager.instance) {
      ModeManager.instance = new ModeManager()
    }
    return ModeManager.instance
  }

  /**
   * 获取当前运行模式
   */
  getCurrentMode(): AppMode {
    return this.config.currentMode
  }

  /**
   * 切换运行模式
   */
  async switchMode(mode: AppMode): Promise<boolean> {
    try {
      const oldMode = this.config.currentMode
      
      if (oldMode === mode) {
        console.log(`Already in ${mode} mode`)
        return true
      }

      // 更新配置
      this.config.currentMode = mode
      this.config.lastSwitchTime = Date.now()
      this.config.switchCount += 1

      // 保存配置
      this.saveConfig()

      // 触发模式变更事件
      const event: ModeChangeEvent = {
        oldMode,
        newMode: mode,
        timestamp: Date.now()
      }

      this.notifyModeChange(event)

      console.log(`Mode switched from ${oldMode} to ${mode}`)
      return true
    } catch (error) {
      console.error('Failed to switch mode:', error)
      return false
    }
  }

  /**
   * 检查是否为API模式
   */
  isApiMode(): boolean {
    return this.config.currentMode === 'api'
  }

  /**
   * 检查是否为模拟模式
   */
  isMockMode(): boolean {
    return this.config.currentMode === 'mock'
  }

  /**
   * 注册模式变更回调
   */
  onModeChange(callback: ModeChangeCallback): void {
    this.callbacks.add(callback)
  }

  /**
   * 取消注册模式变更回调
   */
  offModeChange(callback: ModeChangeCallback): void {
    this.callbacks.delete(callback)
  }

  /**
   * 获取完整配置
   */
  getConfig(): ModeConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ModeConfig>): void {
    this.config = { ...this.config, ...config }
    this.saveConfig()
  }

  /**
   * 从本地存储加载配置
   */
  private loadConfig(): ModeConfig {
    try {
      const stored = safeWx.getStorageSync(this.STORAGE_KEY)
      if (stored) {
        const parsedConfig = typeof stored === 'string' ? JSON.parse(stored) : stored
        return { ...this.DEFAULT_CONFIG, ...parsedConfig }
      }
    } catch (error) {
      console.error('Failed to load mode config:', error)
    }
    
    return { ...this.DEFAULT_CONFIG }
  }

  /**
   * 保存配置到本地存储
   */
  private saveConfig(): void {
    try {
      safeWx.setStorageSync(this.STORAGE_KEY, JSON.stringify(this.config))
    } catch (error) {
      console.error('Failed to save mode config:', error)
    }
  }

  /**
   * 通知所有注册的回调函数
   */
  private notifyModeChange(event: ModeChangeEvent): void {
    this.callbacks.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in mode change callback:', error)
      }
    })
  }

  /**
   * 重置配置到默认值
   */
  resetConfig(): void {
    this.config = { ...this.DEFAULT_CONFIG }
    this.saveConfig()
  }

  /**
   * 获取模式切换统计信息
   */
  getStats(): {
    switchCount: number
    lastSwitchTime: number
    currentMode: AppMode
    uptime: number
  } {
    return {
      switchCount: this.config.switchCount,
      lastSwitchTime: this.config.lastSwitchTime,
      currentMode: this.config.currentMode,
      uptime: Date.now() - this.config.lastSwitchTime
    }
  }
}

// 导出单例实例
export const modeManager = ModeManager.getInstance()
export default modeManager