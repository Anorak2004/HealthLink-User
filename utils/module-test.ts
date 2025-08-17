// 模块加载测试文件
// 用于验证所有模块是否正确导入和工作

import { wx, getApp, Page, isMiniProgramEnv, safeWx } from './miniprogram-api'
import type { IAppOption } from './miniprogram-api'

// 测试函数
export const testModuleLoading = (): boolean => {
  try {
    console.log('开始测试模块加载...')
    
    // 测试环境检测
    const isEnv = isMiniProgramEnv()
    console.log('微信小程序环境检测:', isEnv)
    
    // 测试安全API调用
    const testStorage = safeWx.getStorageSync('test-key', 'default-value')
    console.log('安全存储测试:', testStorage)
    
    // 测试类型定义
    if (typeof Page === 'function') {
      console.log('Page 函数可用')
    }
    
    if (typeof getApp === 'function') {
      console.log('getApp 函数可用')
    }
    
    console.log('模块加载测试完成 ✓')
    return true
  } catch (error) {
    console.error('模块加载测试失败:', error)
    return false
  }
}

// 导出测试结果
export const moduleTestResult = {
  timestamp: Date.now(),
  success: false,
  errors: [] as string[]
}

// 运行测试
try {
  moduleTestResult.success = testModuleLoading()
} catch (error) {
  moduleTestResult.errors.push((error as Error).message)
}