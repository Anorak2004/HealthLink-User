'use client'

import React, { useEffect, useState } from 'react'
import { EmergencyAlertDialog } from './emergency-alert-dialog'
import { useEmergencyAlert } from '../hooks/use-emergency-alert'
import { EmergencyResponse, VitalsSnapshot } from '../types/health-monitoring'
import { emergencyMonitoringService } from '../utils/emergency-monitoring-service'
import { useToast } from '../hooks/use-toast'

interface EmergencyResponseManagerProps {
  userId: string
  doctorPhone?: string
  isMonitoringActive?: boolean
  onEmergencyTriggered?: (response: EmergencyResponse) => void
  onEmergencyResolved?: (responseId: string) => void
}

export function EmergencyResponseManager({
  userId,
  doctorPhone,
  isMonitoringActive = true,
  onEmergencyTriggered,
  onEmergencyResolved
}: EmergencyResponseManagerProps) {
  const { toast } = useToast()
  const [isMonitoring, setIsMonitoring] = useState(false)
  
  const {
    currentEmergency,
    isDialogOpen,
    isCallInProgress,
    lastCallResult,
    handleEmergencyTriggered,
    acknowledgeEmergency,
    call120,
    callDoctor,
    closeDialog,
    clearCallResult
  } = useEmergencyAlert({
    doctorPhone,
    onEmergencyTriggered: (response) => {
      // 显示系统通知
      toast({
        title: "紧急情况检测",
        description: `检测到${getSeverityText(response.severity)}，请立即查看！`,
        variant: response.severity === 'critical' ? 'destructive' : 'default',
      })
      
      // 触发音频警报（如果支持）
      playEmergencySound(response.severity)
      
      onEmergencyTriggered?.(response)
    },
    onEmergencyAcknowledged: (responseId) => {
      toast({
        title: "紧急情况已确认",
        description: "紧急响应已记录，请注意后续健康状况。",
      })
      onEmergencyResolved?.(responseId)
    }
  })

  // 启动/停止监测
  useEffect(() => {
    const startMonitoring = async () => {
      if (isMonitoringActive && !isMonitoring) {
        try {
          await emergencyMonitoringService.startMonitoring(userId)
          setIsMonitoring(true)
          console.log('Emergency monitoring started for user:', userId)
        } catch (error) {
          console.error('Failed to start emergency monitoring:', error)
          toast({
            title: "监测启动失败",
            description: "无法启动紧急监测服务，请检查系统设置。",
            variant: "destructive",
          })
        }
      } else if (!isMonitoringActive && isMonitoring) {
        try {
          await emergencyMonitoringService.stopMonitoring(userId)
          setIsMonitoring(false)
          console.log('Emergency monitoring stopped for user:', userId)
        } catch (error) {
          console.error('Failed to stop emergency monitoring:', error)
        }
      }
    }

    startMonitoring()
  }, [isMonitoringActive, isMonitoring, userId, toast])

  // 处理拨号结果
  useEffect(() => {
    if (lastCallResult) {
      if (lastCallResult.success) {
        toast({
          title: "拨号成功",
          description: "电话拨打成功，请等待接通。",
        })
      } else if (lastCallResult.fallbackRequired) {
        toast({
          title: "需要手动拨号",
          description: lastCallResult.error || "自动拨号失败，请手动拨打电话。",
          variant: "destructive",
        })
      } else {
        toast({
          title: "拨号失败",
          description: lastCallResult.error || "电话拨打失败，请重试。",
          variant: "destructive",
        })
      }
      
      // 清除结果以避免重复显示
      setTimeout(clearCallResult, 3000)
    }
  }, [lastCallResult, toast, clearCallResult])

  // 模拟生命体征检测（在实际应用中，这应该来自真实的传感器数据）
  const simulateVitalsCheck = async (vitalsData: VitalsSnapshot) => {
    if (!isMonitoring) return

    try {
      const emergencyResponse = await emergencyMonitoringService.checkVitals(vitalsData)
      if (emergencyResponse) {
        handleEmergencyTriggered(emergencyResponse)
      }
    } catch (error) {
      console.error('Error checking vitals:', error)
    }
  }

  // 手动触发紧急情况（用于测试）
  const triggerTestEmergency = (severity: 'critical' | 'urgent' | 'warning' = 'urgent') => {
    const testVitals: VitalsSnapshot = {
      heartRate: severity === 'critical' ? 35 : severity === 'urgent' ? 45 : 55,
      bloodPressure: { systolic: 180, diastolic: 110 },
      temperature: 39.5,
      oxygenSaturation: severity === 'critical' ? 80 : 88,
      timestamp: new Date()
    }
    
    simulateVitalsCheck(testVitals)
  }

  return (
    <>
      <EmergencyAlertDialog
        emergencyResponse={currentEmergency}
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onAcknowledge={acknowledgeEmergency}
        onCall120={call120}
        onCallDoctor={callDoctor}
        doctorPhone={doctorPhone}
        autoCloseTimeout={30000}
      />
      
      {/* 开发环境测试按钮 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
            <h4 className="text-sm font-semibold mb-2">Emergency Test Controls</h4>
            <div className="space-y-2">
              <button
                onClick={() => triggerTestEmergency('warning')}
                className="block w-full px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Test Warning
              </button>
              <button
                onClick={() => triggerTestEmergency('urgent')}
                className="block w-full px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Test Urgent
              </button>
              <button
                onClick={() => triggerTestEmergency('critical')}
                className="block w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              >
                Test Critical
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Monitoring: {isMonitoring ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * 获取严重程度的中文描述
 */
function getSeverityText(severity: string): string {
  switch (severity) {
    case 'critical':
      return '危急情况'
    case 'urgent':
      return '紧急情况'
    case 'warning':
      return '健康警告'
    default:
      return '健康提醒'
  }
}

/**
 * 播放紧急情况音频警报
 */
function playEmergencySound(severity: string) {
  if (typeof window === 'undefined') return

  try {
    // 创建音频上下文
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // 根据严重程度设置不同的音频参数
    const frequency = severity === 'critical' ? 800 : severity === 'urgent' ? 600 : 400
    const duration = severity === 'critical' ? 2000 : 1000
    
    // 创建振荡器
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
    oscillator.type = 'sine'
    
    // 设置音量包络
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration / 1000)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration / 1000)
    
    // 对于危急情况，播放多次警报
    if (severity === 'critical') {
      setTimeout(() => playEmergencySound('urgent'), 500)
      setTimeout(() => playEmergencySound('urgent'), 1000)
    }
  } catch (error) {
    console.warn('Could not play emergency sound:', error)
  }
}

export default EmergencyResponseManager