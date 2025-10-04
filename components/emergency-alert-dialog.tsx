'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Phone, PhoneCall, Clock, X } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Alert, AlertDescription } from './ui/alert'
import { Progress } from './ui/progress'
import { EmergencyResponse } from '../types/health-monitoring'

interface EmergencyAlertDialogProps {
  emergencyResponse: EmergencyResponse | null
  isOpen: boolean
  onClose: () => void
  onAcknowledge: (responseId: string) => void
  onCall120: () => void
  onCallDoctor: (doctorPhone?: string) => void
  doctorPhone?: string
  autoCloseTimeout?: number // 30秒默认超时
}

export function EmergencyAlertDialog({
  emergencyResponse,
  isOpen,
  onClose,
  onAcknowledge,
  onCall120,
  onCallDoctor,
  doctorPhone,
  autoCloseTimeout = 30000
}: EmergencyAlertDialogProps) {
  const [timeLeft, setTimeLeft] = useState(autoCloseTimeout / 1000)
  const [isEnhancedAlert, setIsEnhancedAlert] = useState(false)
  const [hasUserResponded, setHasUserResponded] = useState(false)

  // 重置计时器当对话框打开时
  useEffect(() => {
    if (isOpen && emergencyResponse) {
      setTimeLeft(autoCloseTimeout / 1000)
      setIsEnhancedAlert(false)
      setHasUserResponded(false)
    }
  }, [isOpen, emergencyResponse, autoCloseTimeout])

  // 倒计时逻辑
  useEffect(() => {
    if (!isOpen || hasUserResponded) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 30秒无响应，触发强化警报
          setIsEnhancedAlert(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, hasUserResponded])

  // 处理用户响应
  const handleUserResponse = useCallback(() => {
    setHasUserResponded(true)
    if (emergencyResponse) {
      onAcknowledge(emergencyResponse.id)
    }
  }, [emergencyResponse, onAcknowledge])

  // 拨打120
  const handleCall120 = useCallback(() => {
    handleUserResponse()
    onCall120()
  }, [handleUserResponse, onCall120])

  // 拨打医生电话
  const handleCallDoctor = useCallback(() => {
    handleUserResponse()
    onCallDoctor(doctorPhone)
  }, [handleUserResponse, onCallDoctor, doctorPhone])

  // 手动关闭（确认已处理）
  const handleManualClose = useCallback(() => {
    handleUserResponse()
    onClose()
  }, [handleUserResponse, onClose])

  if (!emergencyResponse) return null

  // 根据严重程度确定样式
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'destructive',
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-900 dark:text-red-100',
          title: '危急情况！',
          description: '检测到生命体征严重异常，请立即寻求医疗帮助！'
        }
      case 'urgent':
        return {
          color: 'default',
          bgColor: 'bg-orange-50 dark:bg-orange-950',
          borderColor: 'border-orange-200 dark:border-orange-800',
          textColor: 'text-orange-900 dark:text-orange-100',
          title: '紧急情况',
          description: '检测到生命体征异常，建议尽快联系医生。'
        }
      case 'warning':
        return {
          color: 'default',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-900 dark:text-yellow-100',
          title: '健康警告',
          description: '检测到生命体征异常，请注意身体状况。'
        }
      default:
        return {
          color: 'default',
          bgColor: 'bg-gray-50 dark:bg-gray-950',
          borderColor: 'border-gray-200 dark:border-gray-800',
          textColor: 'text-gray-900 dark:text-gray-100',
          title: '健康提醒',
          description: '请注意您的健康状况。'
        }
    }
  }

  const config = getSeverityConfig(emergencyResponse.severity)
  const progressValue = ((autoCloseTimeout / 1000 - timeLeft) / (autoCloseTimeout / 1000)) * 100

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className={`
          max-w-md mx-auto
          ${config.bgColor} 
          ${config.borderColor} 
          border-2
          ${isEnhancedAlert ? 'animate-pulse shadow-2xl' : ''}
        `}
        hideCloseButton={true}
      >
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className={`
              p-3 rounded-full 
              ${emergencyResponse.severity === 'critical' ? 'bg-red-100 dark:bg-red-900' : 
                emergencyResponse.severity === 'urgent' ? 'bg-orange-100 dark:bg-orange-900' : 
                'bg-yellow-100 dark:bg-yellow-900'}
            `}>
              <AlertTriangle 
                className={`
                  h-8 w-8 
                  ${emergencyResponse.severity === 'critical' ? 'text-red-600 dark:text-red-400' : 
                    emergencyResponse.severity === 'urgent' ? 'text-orange-600 dark:text-orange-400' : 
                    'text-yellow-600 dark:text-yellow-400'}
                  ${isEnhancedAlert ? 'animate-bounce' : ''}
                `} 
              />
            </div>
          </div>
          <DialogTitle className={`text-xl font-bold ${config.textColor}`}>
            {config.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 警告信息 */}
          <Alert className={`${config.borderColor} ${config.bgColor}`}>
            <AlertDescription className={config.textColor}>
              {config.description}
            </AlertDescription>
          </Alert>

          {/* 生命体征信息 */}
          <div className={`p-3 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
            <h4 className={`font-semibold mb-2 ${config.textColor}`}>异常生命体征：</h4>
            <div className={`text-sm space-y-1 ${config.textColor}`}>
              {emergencyResponse.vitalsData.heartRate && (
                <div>心率: {emergencyResponse.vitalsData.heartRate} bpm</div>
              )}
              {emergencyResponse.vitalsData.bloodPressure && (
                <div>
                  血压: {emergencyResponse.vitalsData.bloodPressure.systolic}/
                  {emergencyResponse.vitalsData.bloodPressure.diastolic} mmHg
                </div>
              )}
              {emergencyResponse.vitalsData.temperature && (
                <div>体温: {emergencyResponse.vitalsData.temperature}°C</div>
              )}
              {emergencyResponse.vitalsData.oxygenSaturation && (
                <div>血氧: {emergencyResponse.vitalsData.oxygenSaturation}%</div>
              )}
            </div>
          </div>

          {/* 倒计时进度条 */}
          {!hasUserResponded && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className={config.textColor}>
                  {isEnhancedAlert ? '强化警报已激活' : '请选择操作'}
                </span>
                <span className={`flex items-center ${config.textColor}`}>
                  <Clock className="h-4 w-4 mr-1" />
                  {timeLeft}s
                </span>
              </div>
              <Progress 
                value={progressValue} 
                className={`h-2 ${isEnhancedAlert ? 'bg-red-200' : ''}`}
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div className="space-y-3">
            {/* 拨打120按钮 */}
            <Button
              onClick={handleCall120}
              className={`
                w-full h-12 text-lg font-semibold
                ${emergencyResponse.severity === 'critical' 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
                }
                ${isEnhancedAlert ? 'animate-pulse' : ''}
              `}
              size="lg"
            >
              <PhoneCall className="h-5 w-5 mr-2" />
              拨打 120 急救电话
            </Button>

            {/* 拨打医生电话按钮 */}
            {doctorPhone && (
              <Button
                onClick={handleCallDoctor}
                variant="outline"
                className={`
                  w-full h-12 text-lg font-semibold
                  ${config.borderColor} ${config.textColor}
                  hover:${config.bgColor}
                `}
                size="lg"
              >
                <Phone className="h-5 w-5 mr-2" />
                拨打医生电话
              </Button>
            )}

            {/* 手动拨号选项 */}
            <div className={`text-center text-sm ${config.textColor}`}>
              <p>如果自动拨号失败，请手动拨打：</p>
              <div className="mt-1 space-y-1">
                <p className="font-mono font-bold">急救电话: 120</p>
                {doctorPhone && (
                  <p className="font-mono font-bold">医生电话: {doctorPhone}</p>
                )}
              </div>
            </div>

            {/* 确认处理按钮 */}
            <Button
              onClick={handleManualClose}
              variant="ghost"
              className={`w-full ${config.textColor} hover:${config.bgColor}`}
            >
              <X className="h-4 w-4 mr-2" />
              我已处理此情况
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}