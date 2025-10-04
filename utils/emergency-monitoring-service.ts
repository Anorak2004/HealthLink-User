import { 
  IEmergencyMonitoringService, 
  VitalsSnapshot, 
  EmergencyResponse, 
  EmergencyAction 
} from '../types/health-monitoring'

// 生命体征异常阈值配置
interface VitalsThresholds {
  heartRate: {
    critical: { min: number; max: number }
    urgent: { min: number; max: number }
    warning: { min: number; max: number }
  }
  bloodPressure: {
    critical: { systolic: { min: number; max: number }; diastolic: { min: number; max: number } }
    urgent: { systolic: { min: number; max: number }; diastolic: { min: number; max: number } }
    warning: { systolic: { min: number; max: number }; diastolic: { min: number; max: number } }
  }
  temperature: {
    critical: { min: number; max: number }
    urgent: { min: number; max: number }
    warning: { min: number; max: number }
  }
  oxygenSaturation: {
    critical: { min: number; max: number }
    urgent: { min: number; max: number }
    warning: { min: number; max: number }
  }
}

// 监测状态类型
interface MonitoringStatus {
  userId: string
  isActive: boolean
  startTime: Date
  lastCheckTime?: Date
  emergencyCount: number
}

export class EmergencyMonitoringService implements IEmergencyMonitoringService {
  private monitoringStatuses: Map<string, MonitoringStatus> = new Map()
  private emergencyResponses: Map<string, EmergencyResponse> = new Map()
  
  // 默认生命体征阈值
  private readonly thresholds: VitalsThresholds = {
    heartRate: {
      critical: { min: 40, max: 150 },
      urgent: { min: 50, max: 120 },
      warning: { min: 60, max: 100 }
    },
    bloodPressure: {
      critical: { 
        systolic: { min: 70, max: 200 }, 
        diastolic: { min: 40, max: 120 } 
      },
      urgent: { 
        systolic: { min: 90, max: 180 }, 
        diastolic: { min: 50, max: 110 } 
      },
      warning: { 
        systolic: { min: 100, max: 160 }, 
        diastolic: { min: 60, max: 100 } 
      }
    },
    temperature: {
      critical: { min: 35.0, max: 40.0 },
      urgent: { min: 35.5, max: 39.0 },
      warning: { min: 36.0, max: 38.0 }
    },
    oxygenSaturation: {
      critical: { min: 85, max: 100 },
      urgent: { min: 90, max: 100 },
      warning: { min: 95, max: 100 }
    }
  }

  /**
   * 开始监测指定用户的生命体征
   */
  async startMonitoring(userId: string): Promise<void> {
    if (this.monitoringStatuses.has(userId)) {
      const status = this.monitoringStatuses.get(userId)!
      if (status.isActive) {
        throw new Error(`User ${userId} is already being monitored`)
      }
    }

    const monitoringStatus: MonitoringStatus = {
      userId,
      isActive: true,
      startTime: new Date(),
      emergencyCount: 0
    }

    this.monitoringStatuses.set(userId, monitoringStatus)
    console.log(`Started monitoring for user: ${userId}`)
  }

  /**
   * 停止监测指定用户的生命体征
   */
  async stopMonitoring(userId: string): Promise<void> {
    const status = this.monitoringStatuses.get(userId)
    if (!status) {
      throw new Error(`No monitoring found for user: ${userId}`)
    }

    status.isActive = false
    console.log(`Stopped monitoring for user: ${userId}`)
  }

  /**
   * 检查生命体征数据并判断是否需要触发紧急响应
   */
  async checkVitals(data: VitalsSnapshot): Promise<EmergencyResponse | null> {
    // 检测异常级别
    const severity = this.detectAbnormalityLevel(data)
    
    if (!severity) {
      return null // 无异常
    }

    // 生成紧急响应
    const emergencyResponse: EmergencyResponse = {
      id: this.generateId(),
      userId: 'current-user', // 在实际应用中应该从上下文获取
      triggerTime: new Date(),
      vitalsData: data,
      severity,
      responseActions: this.generateResponseActions(severity),
      status: 'triggered'
    }

    // 存储紧急响应记录
    this.emergencyResponses.set(emergencyResponse.id, emergencyResponse)
    
    // 触发紧急响应流程
    await this.triggerEmergencyResponse(emergencyResponse)
    
    return emergencyResponse
  }

  /**
   * 触发紧急响应流程
   */
  async triggerEmergencyResponse(response: EmergencyResponse): Promise<void> {
    console.log(`Emergency response triggered: ${response.id}`, {
      severity: response.severity,
      vitals: response.vitalsData,
      actions: response.responseActions
    })

    // 更新监测状态
    const status = this.monitoringStatuses.get(response.userId)
    if (status) {
      status.emergencyCount++
      status.lastCheckTime = new Date()
    }

    // 这里可以添加实际的通知逻辑，如推送通知、发送短信等
    // 目前只是记录日志
  }

  /**
   * 确认紧急情况已处理
   */
  async acknowledgeEmergency(responseId: string): Promise<void> {
    const response = this.emergencyResponses.get(responseId)
    if (!response) {
      throw new Error(`Emergency response not found: ${responseId}`)
    }

    response.status = 'acknowledged'
    console.log(`Emergency acknowledged: ${responseId}`)
  }

  /**
   * 检测生命体征异常级别
   */
  private detectAbnormalityLevel(data: VitalsSnapshot): 'critical' | 'urgent' | 'warning' | null {
    const abnormalities: Array<'critical' | 'urgent' | 'warning'> = []

    // 检查心率
    if (data.heartRate !== undefined) {
      const heartRateLevel = this.checkHeartRate(data.heartRate)
      if (heartRateLevel) abnormalities.push(heartRateLevel)
    }

    // 检查血压
    if (data.bloodPressure) {
      const bpLevel = this.checkBloodPressure(data.bloodPressure)
      if (bpLevel) abnormalities.push(bpLevel)
    }

    // 检查体温
    if (data.temperature !== undefined) {
      const tempLevel = this.checkTemperature(data.temperature)
      if (tempLevel) abnormalities.push(tempLevel)
    }

    // 检查血氧饱和度
    if (data.oxygenSaturation !== undefined) {
      const o2Level = this.checkOxygenSaturation(data.oxygenSaturation)
      if (o2Level) abnormalities.push(o2Level)
    }

    // 返回最严重的异常级别
    if (abnormalities.includes('critical')) return 'critical'
    if (abnormalities.includes('urgent')) return 'urgent'
    if (abnormalities.includes('warning')) return 'warning'
    
    return null
  }

  /**
   * 检查心率异常
   */
  private checkHeartRate(heartRate: number): 'critical' | 'urgent' | 'warning' | null {
    const { critical, urgent, warning } = this.thresholds.heartRate
    
    if (heartRate <= critical.min || heartRate >= critical.max) return 'critical'
    if (heartRate <= urgent.min || heartRate >= urgent.max) return 'urgent'
    if (heartRate <= warning.min || heartRate >= warning.max) return 'warning'
    
    return null
  }

  /**
   * 检查血压异常
   */
  private checkBloodPressure(bp: { systolic: number; diastolic: number }): 'critical' | 'urgent' | 'warning' | null {
    const { critical, urgent, warning } = this.thresholds.bloodPressure
    
    // 检查收缩压和舒张压
    const systolicLevel = this.checkValueAgainstThreshold(bp.systolic, {
      critical: critical.systolic,
      urgent: urgent.systolic,
      warning: warning.systolic
    })
    
    const diastolicLevel = this.checkValueAgainstThreshold(bp.diastolic, {
      critical: critical.diastolic,
      urgent: urgent.diastolic,
      warning: warning.diastolic
    })
    
    // 返回更严重的级别
    const levels = [systolicLevel, diastolicLevel].filter(Boolean)
    if (levels.includes('critical')) return 'critical'
    if (levels.includes('urgent')) return 'urgent'
    if (levels.includes('warning')) return 'warning'
    
    return null
  }

  /**
   * 检查体温异常
   */
  private checkTemperature(temperature: number): 'critical' | 'urgent' | 'warning' | null {
    const { critical, urgent, warning } = this.thresholds.temperature
    
    if (temperature <= critical.min || temperature >= critical.max) return 'critical'
    if (temperature <= urgent.min || temperature >= urgent.max) return 'urgent'
    if (temperature <= warning.min || temperature >= warning.max) return 'warning'
    
    return null
  }

  /**
   * 检查血氧饱和度异常
   */
  private checkOxygenSaturation(oxygenSaturation: number): 'critical' | 'urgent' | 'warning' | null {
    const { critical, urgent, warning } = this.thresholds.oxygenSaturation
    
    if (oxygenSaturation <= critical.min) return 'critical'
    if (oxygenSaturation <= urgent.min) return 'urgent'
    if (oxygenSaturation <= warning.min) return 'warning'
    
    return null
  }

  /**
   * 通用阈值检查方法
   */
  private checkValueAgainstThreshold(
    value: number, 
    thresholds: {
      critical: { min: number; max: number }
      urgent: { min: number; max: number }
      warning: { min: number; max: number }
    }
  ): 'critical' | 'urgent' | 'warning' | null {
    if (value <= thresholds.critical.min || value >= thresholds.critical.max) return 'critical'
    if (value <= thresholds.urgent.min || value >= thresholds.urgent.max) return 'urgent'
    if (value <= thresholds.warning.min || value >= thresholds.warning.max) return 'warning'
    return null
  }

  /**
   * 根据严重程度生成响应动作
   */
  private generateResponseActions(severity: 'critical' | 'urgent' | 'warning'): EmergencyAction[] {
    const actions: EmergencyAction[] = []

    switch (severity) {
      case 'critical':
        actions.push(
          { type: 'call_120', priority: 1, executed: false },
          { type: 'call_doctor', priority: 2, executed: false },
          { type: 'alert_family', priority: 3, executed: false }
        )
        break
      case 'urgent':
        actions.push(
          { type: 'call_doctor', priority: 1, executed: false },
          { type: 'call_120', priority: 2, executed: false },
          { type: 'alert_family', priority: 3, executed: false }
        )
        break
      case 'warning':
        actions.push(
          { type: 'call_doctor', priority: 1, executed: false },
          { type: 'alert_family', priority: 2, executed: false }
        )
        break
    }

    return actions
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取用户监测状态
   */
  getMonitoringStatus(userId: string): MonitoringStatus | undefined {
    return this.monitoringStatuses.get(userId)
  }

  /**
   * 获取紧急响应记录
   */
  getEmergencyResponse(responseId: string): EmergencyResponse | undefined {
    return this.emergencyResponses.get(responseId)
  }

  /**
   * 获取用户的所有紧急响应记录
   */
  getUserEmergencyResponses(userId: string): EmergencyResponse[] {
    return Array.from(this.emergencyResponses.values())
      .filter(response => response.userId === userId)
  }
}

// 导出单例实例
export const emergencyMonitoringService = new EmergencyMonitoringService()