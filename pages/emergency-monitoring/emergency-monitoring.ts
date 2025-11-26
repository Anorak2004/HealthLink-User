import { Page, wx } from "../../utils/miniprogram-api"
import { emergencyMonitoringService } from "../../utils/emergency-monitoring-service"
import type { VitalsSnapshot, EmergencyResponse } from "../../types/health-monitoring"

// 监测配置：为了兼顾演示效果和 24h 监测场景，这里默认 60 秒采集一次
// 实际接入穿戴设备或后端推送时，可以将采集逻辑放到设备/服务端，前端只负责展示和告警。
const MONITOR_USER_ID = "current-user"
const MONITOR_INTERVAL_MS = 60 * 1000
const CRITICAL_PROMPT_COOLDOWN_MS = 5 * 60 * 1000 // 同一严重事件 5 分钟内只提醒一次

interface LastSnapshotView {
  heartRate?: number
  bloodPressureText?: string
  temperature?: number
  oxygenSaturation?: number
  time?: string
  severityText?: string
  severityClass?: string
}

interface EmergencyMonitoringPageData {
  isMonitoring: boolean
  emergencyCount: number
  lastSnapshot: LastSnapshotView
}

let monitorTimer: number | null = null
let lastCriticalPromptAt: number | null = null

Page<EmergencyMonitoringPageData, any>({
  data: {
    isMonitoring: false,
    emergencyCount: 0,
    lastSnapshot: {},
  },

  async onLoad() {
    // 初始化监测状态
    const status = emergencyMonitoringService.getMonitoringStatus(MONITOR_USER_ID)
    if (status?.isActive) {
      this.setData({
        isMonitoring: true,
        emergencyCount: status.emergencyCount,
      })
      this.startMonitorLoop()
    }
  },

  async onUnload() {
    await this.stopMonitoring()
  },

  async toggleMonitoring() {
    if (this.data.isMonitoring) {
      await this.stopMonitoring()
    } else {
      await this.startMonitoring()
    }
  },

  async startMonitoring() {
    try {
      await emergencyMonitoringService.startMonitoring(MONITOR_USER_ID)
      this.setData({ isMonitoring: true })
      this.startMonitorLoop()
      wx.showToast({
        title: "监测已启动",
        icon: "success",
      })
    } catch (error) {
      console.error("启动监测失败", error)
      wx.showToast({
        title: "监测启动失败",
        icon: "none",
      })
    }
  },

  async stopMonitoring() {
    if (monitorTimer !== null) {
      clearInterval(monitorTimer)
      monitorTimer = null
    }

    try {
      const status = emergencyMonitoringService.getMonitoringStatus(MONITOR_USER_ID)
      if (status?.isActive) {
        await emergencyMonitoringService.stopMonitoring(MONITOR_USER_ID)
      }
    } catch (error) {
      console.error("停止监测失败", error)
    }

    this.setData({ isMonitoring: false })
  },

  startMonitorLoop() {
    if (monitorTimer !== null) {
      clearInterval(monitorTimer)
    }

    // 为了便于演示，这里默认 60 秒采集一次；实际 24h 监测可根据设备能力调整
    monitorTimer = setInterval(() => {
      this.collectAndCheckVitals()
    }, MONITOR_INTERVAL_MS) as unknown as number

    // 立即采集一次，避免用户等待
    this.collectAndCheckVitals()
  },

  async collectAndCheckVitals() {
    // 这里使用模拟数据，实际应用中应从设备或后端获取实时生命体征
    const snapshot: VitalsSnapshot = this.generateMockSnapshot()

    let response: EmergencyResponse | null = null
    try {
      response = await emergencyMonitoringService.checkVitals(snapshot)
    } catch (error) {
      console.error("检查生命体征失败", error)
    }

    const time = new Date(snapshot.timestamp).toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    const severityText =
      response?.severity === "critical"
        ? "严重异常"
        : response?.severity === "urgent"
          ? "中度异常"
          : response?.severity === "warning"
            ? "轻度异常"
            : "正常"

    const severityClass =
      response?.severity === "critical"
        ? "severity-critical"
        : response?.severity === "urgent"
          ? "severity-urgent"
          : response?.severity === "warning"
            ? "severity-warning"
            : "severity-normal"

    this.setData({
      lastSnapshot: {
        heartRate: snapshot.heartRate,
        bloodPressureText: snapshot.bloodPressure
          ? `${snapshot.bloodPressure.systolic}/${snapshot.bloodPressure.diastolic} mmHg`
          : undefined,
        temperature: snapshot.temperature,
        oxygenSaturation: snapshot.oxygenSaturation,
        time,
        severityText,
        severityClass,
      },
      emergencyCount: emergencyMonitoringService.getMonitoringStatus(MONITOR_USER_ID)?.emergencyCount || 0,
    })

    // 当检测到严重异常时，引导用户主动拨打 120（增加冷却时间，避免频繁打扰）
    if (response && response.severity === "critical") {
      const now = Date.now()
      if (!lastCriticalPromptAt || now - lastCriticalPromptAt > CRITICAL_PROMPT_COOLDOWN_MS) {
        lastCriticalPromptAt = now
        wx.showModal({
          title: "紧急健康提醒",
          content: "24 小时监测发现多次严重生命体征异常，建议立即拨打 120 急救电话。",
          confirmText: "拨打 120",
          cancelText: "稍后",
          success: (res) => {
            if (res.confirm) {
              wx.makePhoneCall({
                phoneNumber: "120",
              })
            }
          },
        })
      }
    }
  },

  generateMockSnapshot(): VitalsSnapshot {
    // 简单的模拟逻辑：大部分时间为正常，少量时间出现轻/重度异常
    const now = new Date()
    const random = Math.random()

    let heartRate = 75
    let systolic = 120
    let diastolic = 80
    let temperature = 36.6
    let oxygen = 98

    if (random > 0.98) {
      // 严重异常场景（约 2%）
      heartRate = 40 + Math.floor(Math.random() * 20) // 40-60
      systolic = 70 + Math.floor(Math.random() * 20) // 70-90
      diastolic = 40 + Math.floor(Math.random() * 10) // 40-50
      temperature = 39 + Math.random() // >39
      oxygen = 85 + Math.floor(Math.random() * 5) // 85-90
    } else if (random > 0.9) {
      // 中度异常（约 8%）
      heartRate = 55 + Math.floor(Math.random() * 40)
      systolic = 90 + Math.floor(Math.random() * 40)
      diastolic = 50 + Math.floor(Math.random() * 20)
      temperature = 38 + Math.random() * 0.5
      oxygen = 90 + Math.floor(Math.random() * 5)
    } else if (random > 0.7) {
      // 轻度异常（约 20%）
      heartRate = 60 + Math.floor(Math.random() * 30)
      temperature = 37.5 + Math.random() * 0.3
    } else {
      // 正常范围内波动（约 70%）
      heartRate = 65 + Math.floor(Math.random() * 15)
      systolic = 110 + Math.floor(Math.random() * 15)
      diastolic = 70 + Math.floor(Math.random() * 10)
      temperature = 36.3 + Math.random() * 0.4
      oxygen = 96 + Math.floor(Math.random() * 3)
    }

    const snapshot: VitalsSnapshot = {
      heartRate,
      bloodPressure: { systolic, diastolic },
      temperature,
      oxygenSaturation: oxygen,
      timestamp: now,
    }

    return snapshot
  },
})
