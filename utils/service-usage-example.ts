// utils/service-usage-example.ts
// 服务抽象层使用示例

import { apiService } from './api'

// 使用示例：在页面中使用重构后的API服务
export class HealthDataManager {
  
  // 获取健康数据
  async loadHealthData() {
    try {
      const data = await apiService.getHealthData()
      console.log('获取健康数据:', data)
      return data
    } catch (error) {
      console.error('获取健康数据失败:', error)
      return []
    }
  }

  // 提交健康数据
  async saveHealthData(healthData: any) {
    try {
      const success = await apiService.submitHealthData(healthData)
      if (success) {
        console.log('健康数据保存成功')
      } else {
        console.log('健康数据保存失败')
      }
      return success
    } catch (error) {
      console.error('保存健康数据时出错:', error)
      return false
    }
  }

  // 切换服务模式
  switchServiceMode(mode: 'mock' | 'api') {
    apiService.switchMode(mode)
    console.log(`服务模式已切换到: ${mode}`)
  }

  // 获取服务状态
  getServiceInfo() {
    const status = apiService.getServiceStatus()
    const currentMode = apiService.getCurrentMode()
    
    return {
      currentMode,
      isOnline: status.isOnline,
      errorCount: status.errorCount,
      fallbackActive: status.fallbackActive,
      lastApiCall: new Date(status.lastApiCall).toLocaleString()
    }
  }

  // 检查服务健康状态
  async checkServiceHealth() {
    const isOnline = await apiService.isOnline()
    const status = apiService.getServiceStatus()
    
    return {
      isHealthy: isOnline && status.errorCount < 3,
      isOnline,
      errorCount: status.errorCount,
      recommendation: this.getHealthRecommendation(status)
    }
  }

  private getHealthRecommendation(status: any): string {
    if (!status.isOnline) {
      return '服务离线，建议检查网络连接'
    }
    if (status.errorCount > 0) {
      return '服务不稳定，正在使用降级模式'
    }
    if (status.fallbackActive) {
      return '服务已降级，使用本地数据'
    }
    return '服务运行正常'
  }
}

// 使用示例
export const healthDataManager = new HealthDataManager()

// 页面中的使用方式：
/*
// 在页面的onLoad或mounted中
const data = await healthDataManager.loadHealthData()

// 提交数据
const success = await healthDataManager.saveHealthData({
  type: 'blood_pressure',
  value: '120/80',
  date: '2024-01-16',
  time: '09:00'
})

// 切换模式
healthDataManager.switchServiceMode('mock')

// 获取服务状态
const serviceInfo = healthDataManager.getServiceInfo()
console.log('服务信息:', serviceInfo)

// 检查服务健康状态
const health = await healthDataManager.checkServiceHealth()
console.log('服务健康状态:', health)
*/