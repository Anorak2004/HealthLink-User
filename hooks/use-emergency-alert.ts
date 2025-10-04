'use client'

import { useState, useCallback, useEffect } from 'react'
import { EmergencyResponse } from '../types/health-monitoring'
import { emergencyMonitoringService } from '../utils/emergency-monitoring-service'

interface UseEmergencyAlertOptions {
  onEmergencyTriggered?: (response: EmergencyResponse) => void
  onEmergencyAcknowledged?: (responseId: string) => void
  doctorPhone?: string
  autoCloseTimeout?: number
}

interface PhoneCallResult {
  success: boolean
  error?: string
  fallbackRequired?: boolean
}

export function useEmergencyAlert(options: UseEmergencyAlertOptions = {}) {
  const [currentEmergency, setCurrentEmergency] = useState<EmergencyResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCallInProgress, setIsCallInProgress] = useState(false)
  const [lastCallResult, setLastCallResult] = useState<PhoneCallResult | null>(null)

  // 处理紧急情况触发
  const handleEmergencyTriggered = useCallback((response: EmergencyResponse) => {
    setCurrentEmergency(response)
    setIsDialogOpen(true)
    options.onEmergencyTriggered?.(response)
  }, [options])

  // 确认紧急情况已处理
  const acknowledgeEmergency = useCallback(async (responseId: string) => {
    try {
      await emergencyMonitoringService.acknowledgeEmergency(responseId)
      setCurrentEmergency(null)
      setIsDialogOpen(false)
      options.onEmergencyAcknowledged?.(responseId)
    } catch (error) {
      console.error('Failed to acknowledge emergency:', error)
    }
  }, [options])

  // 拨打120急救电话
  const call120 = useCallback(async (): Promise<PhoneCallResult> => {
    setIsCallInProgress(true)
    setLastCallResult(null)

    try {
      // 尝试自动拨号
      const result = await makePhoneCall('120')
      setLastCallResult(result)
      return result
    } catch (error) {
      const result: PhoneCallResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackRequired: true
      }
      setLastCallResult(result)
      return result
    } finally {
      setIsCallInProgress(false)
    }
  }, [])

  // 拨打医生电话
  const callDoctor = useCallback(async (phoneNumber?: string): Promise<PhoneCallResult> => {
    const doctorPhone = phoneNumber || options.doctorPhone
    
    if (!doctorPhone) {
      const result: PhoneCallResult = {
        success: false,
        error: 'No doctor phone number available',
        fallbackRequired: true
      }
      setLastCallResult(result)
      return result
    }

    setIsCallInProgress(true)
    setLastCallResult(null)

    try {
      const result = await makePhoneCall(doctorPhone)
      setLastCallResult(result)
      return result
    } catch (error) {
      const result: PhoneCallResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackRequired: true
      }
      setLastCallResult(result)
      return result
    } finally {
      setIsCallInProgress(false)
    }
  }, [options.doctorPhone])

  // 关闭对话框
  const closeDialog = useCallback(() => {
    if (currentEmergency) {
      acknowledgeEmergency(currentEmergency.id)
    } else {
      setIsDialogOpen(false)
    }
  }, [currentEmergency, acknowledgeEmergency])

  // 清除通话结果
  const clearCallResult = useCallback(() => {
    setLastCallResult(null)
  }, [])

  return {
    // 状态
    currentEmergency,
    isDialogOpen,
    isCallInProgress,
    lastCallResult,
    
    // 操作
    handleEmergencyTriggered,
    acknowledgeEmergency,
    call120,
    callDoctor,
    closeDialog,
    clearCallResult,
    
    // 手动控制
    setIsDialogOpen,
    setCurrentEmergency
  }
}

/**
 * 执行电话拨打操作
 * 支持多种平台的拨号方式
 */
async function makePhoneCall(phoneNumber: string): Promise<PhoneCallResult> {
  // 清理电话号码
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '')
  
  try {
    // 检测运行环境
    if (typeof window === 'undefined') {
      throw new Error('Phone calls not supported in server environment')
    }

    // 微信小程序环境
    if (typeof wx !== 'undefined' && wx.makePhoneCall) {
      return new Promise((resolve) => {
        wx.makePhoneCall({
          phoneNumber: cleanNumber,
          success: () => {
            resolve({ success: true })
          },
          fail: (error: any) => {
            resolve({
              success: false,
              error: error.errMsg || 'WeChat phone call failed',
              fallbackRequired: true
            })
          }
        })
      })
    }

    // Web环境 - 使用tel: protocol
    if (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Android') || navigator.userAgent.includes('iPhone')) {
      // 移动设备
      window.location.href = `tel:${cleanNumber}`
      
      // 由于无法直接检测拨号是否成功，我们假设成功
      // 在实际应用中，可能需要用户确认
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true })
        }, 1000)
      })
    }

    // 桌面环境 - 尝试使用系统默认电话应用
    if ('serviceWorker' in navigator) {
      // 尝试使用 Web API
      try {
        await navigator.clipboard.writeText(cleanNumber)
        // 复制号码到剪贴板作为备选方案
        return {
          success: false,
          error: 'Phone number copied to clipboard. Please dial manually.',
          fallbackRequired: true
        }
      } catch (clipboardError) {
        // 剪贴板访问失败
      }
    }

    // 最后的备选方案 - 显示号码让用户手动拨打
    return {
      success: false,
      error: 'Automatic dialing not supported. Please dial manually.',
      fallbackRequired: true
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Phone call failed',
      fallbackRequired: true
    }
  }
}

/**
 * 检测是否支持自动拨号
 */
export function isAutoDialSupported(): boolean {
  if (typeof window === 'undefined') return false
  
  // 微信小程序支持
  if (typeof wx !== 'undefined' && wx.makePhoneCall) return true
  
  // 移动设备支持 tel: protocol
  if (navigator.userAgent.includes('Mobile') || 
      navigator.userAgent.includes('Android') || 
      navigator.userAgent.includes('iPhone')) {
    return true
  }
  
  return false
}

/**
 * 获取平台特定的拨号说明
 */
export function getDialingInstructions(): string {
  if (typeof window === 'undefined') return '请手动拨打电话号码'
  
  if (typeof wx !== 'undefined') return '点击按钮将自动拨打电话'
  
  if (navigator.userAgent.includes('Mobile')) return '点击按钮将打开拨号界面'
  
  return '电话号码已复制到剪贴板，请使用您的电话应用拨打'
}