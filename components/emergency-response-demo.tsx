'use client'

import React, { useState } from 'react'
import { EmergencyAlertDialog } from './emergency-alert-dialog'
import { useEmergencyAlert } from '../hooks/use-emergency-alert'
import { EmergencyResponse, VitalsSnapshot } from '../types/health-monitoring'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Heart, Thermometer, Activity, Droplets } from 'lucide-react'

/**
 * 紧急响应UI演示组件
 * 展示紧急情况检测和响应界面的完整功能
 */
export function EmergencyResponseDemo() {
  const [currentVitals, setCurrentVitals] = useState<VitalsSnapshot>({
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 36.5,
    oxygenSaturation: 98,
    timestamp: new Date()
  })

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
    doctorPhone: '138-0000-0000',
    onEmergencyTriggered: (response) => {
      console.log('Emergency triggered:', response)
    },
    onEmergencyAcknowledged: (responseId) => {
      console.log('Emergency acknowledged:', responseId)
    }
  })

  // 模拟不同严重程度的紧急情况
  const simulateEmergency = (severity: 'critical' | 'urgent' | 'warning') => {
    let testVitals: VitalsSnapshot
    
    switch (severity) {
      case 'critical':
        testVitals = {
          heartRate: 35, // 危险低心率
          bloodPressure: { systolic: 200, diastolic: 120 }, // 高血压危象
          temperature: 40.2, // 高热
          oxygenSaturation: 82, // 严重缺氧
          timestamp: new Date()
        }
        break
      case 'urgent':
        testVitals = {
          heartRate: 45, // 低心率
          bloodPressure: { systolic: 180, diastolic: 110 }, // 高血压
          temperature: 39.0, // 发热
          oxygenSaturation: 88, // 轻度缺氧
          timestamp: new Date()
        }
        break
      case 'warning':
        testVitals = {
          heartRate: 55, // 偏低心率
          bloodPressure: { systolic: 160, diastolic: 100 }, // 轻度高血压
          temperature: 38.2, // 低热
          oxygenSaturation: 92, // 轻微缺氧
          timestamp: new Date()
        }
        break
    }

    const mockEmergency: EmergencyResponse = {
      id: `emergency_${Date.now()}`,
      userId: 'demo-user',
      triggerTime: new Date(),
      vitalsData: testVitals,
      severity,
      responseActions: [
        { type: 'call_120', priority: 1, executed: false },
        { type: 'call_doctor', priority: 2, executed: false },
        { type: 'alert_family', priority: 3, executed: false }
      ],
      status: 'triggered'
    }

    setCurrentVitals(testVitals)
    handleEmergencyTriggered(mockEmergency)
  }

  // 更新生命体征
  const updateVitals = (field: keyof VitalsSnapshot, value: any) => {
    setCurrentVitals(prev => ({
      ...prev,
      [field]: value,
      timestamp: new Date()
    }))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'urgent': return 'secondary'
      case 'warning': return 'outline'
      default: return 'default'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">紧急响应系统演示</h1>
        <p className="text-muted-foreground">
          演示24小时健康监测中的紧急情况自动响应功能
        </p>
      </div>

      {/* 当前生命体征显示 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            当前生命体征
          </CardTitle>
          <CardDescription>
            实时监测的生命体征数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <Heart className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-sm text-muted-foreground">心率</div>
                <div className="font-semibold">{currentVitals.heartRate} bpm</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">血压</div>
                <div className="font-semibold">
                  {currentVitals.bloodPressure?.systolic}/{currentVitals.bloodPressure?.diastolic}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <Thermometer className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-sm text-muted-foreground">体温</div>
                <div className="font-semibold">{currentVitals.temperature}°C</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <Droplets className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">血氧</div>
                <div className="font-semibold">{currentVitals.oxygenSaturation}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 紧急情况模拟控制 */}
      <Card>
        <CardHeader>
          <CardTitle>紧急情况模拟</CardTitle>
          <CardDescription>
            点击按钮模拟不同严重程度的紧急情况
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => simulateEmergency('warning')}
              variant="outline"
              className="border-yellow-200 text-yellow-800 hover:bg-yellow-50"
            >
              <Badge variant="outline" className="mr-2">警告</Badge>
              模拟健康警告
            </Button>
            
            <Button
              onClick={() => simulateEmergency('urgent')}
              variant="outline"
              className="border-orange-200 text-orange-800 hover:bg-orange-50"
            >
              <Badge variant="secondary" className="mr-2">紧急</Badge>
              模拟紧急情况
            </Button>
            
            <Button
              onClick={() => simulateEmergency('critical')}
              variant="outline"
              className="border-red-200 text-red-800 hover:bg-red-50"
            >
              <Badge variant="destructive" className="mr-2">危急</Badge>
              模拟危急情况
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 通话状态显示 */}
      {(isCallInProgress || lastCallResult) && (
        <Card>
          <CardHeader>
            <CardTitle>通话状态</CardTitle>
          </CardHeader>
          <CardContent>
            {isCallInProgress && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                正在拨打电话...
              </div>
            )}
            
            {lastCallResult && (
              <div className={`p-3 rounded-lg ${
                lastCallResult.success 
                  ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200' 
                  : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200'
              }`}>
                <div className="font-semibold">
                  {lastCallResult.success ? '拨号成功' : '拨号失败'}
                </div>
                {lastCallResult.error && (
                  <div className="text-sm mt-1">{lastCallResult.error}</div>
                )}
                {lastCallResult.fallbackRequired && (
                  <div className="text-sm mt-1">请手动拨打电话号码</div>
                )}
                <Button
                  onClick={clearCallResult}
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                >
                  清除状态
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 功能说明 */}
      <Card>
        <CardHeader>
          <CardTitle>功能特性</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">自动检测功能</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 实时监测生命体征异常</li>
                <li>• 智能分级：警告/紧急/危急</li>
                <li>• 自动触发紧急响应流程</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">紧急响应功能</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 一键拨打120急救电话</li>
                <li>• 快速联系绑定医生</li>
                <li>• 30秒无响应强化警报</li>
                <li>• 手动拨号备选方案</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">用户界面特性</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 根据严重程度调整界面样式</li>
                <li>• 倒计时进度条显示</li>
                <li>• 生命体征详情展示</li>
                <li>• 响应式设计适配各种设备</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">跨平台支持</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 微信小程序自动拨号</li>
                <li>• 移动设备tel:协议支持</li>
                <li>• 桌面环境剪贴板备选</li>
                <li>• 音频警报提醒</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 紧急响应对话框 */}
      <EmergencyAlertDialog
        emergencyResponse={currentEmergency}
        isOpen={isDialogOpen}
        onClose={closeDialog}
        onAcknowledge={acknowledgeEmergency}
        onCall120={call120}
        onCallDoctor={callDoctor}
        doctorPhone="138-0000-0000"
        autoCloseTimeout={30000}
      />
    </div>
  )
}

export default EmergencyResponseDemo