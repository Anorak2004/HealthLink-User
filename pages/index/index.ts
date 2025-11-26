import { apiService } from "../../utils/api"
import { Page, wx, getApp } from "../../utils/miniprogram-api"
import type { WechatMiniprogram } from "wechat-miniprogram-types"

interface IndexData {
  data: {
    userInfo: WechatMiniprogram.UserInfo | {}
    hasUserInfo: boolean
    canIUseGetUserProfile: boolean
    healthScore: number
    healthStatus: {
      text: string
      class: string
    }
    healthIndicators: Array<{
      label: string
      value: string
      status: string
    }>
    reminders: Array<{
      id: string
      title: string
      time: string
    }>
    currentMode: string
  }

  methods: {
    onLoad: () => void
    onShow: () => void
    loadHealthData: () => void
    getUserProfile: () => void
    getUserInfo: (e: any) => void
    goToHealthRecord: () => void
    goToEmergencyMonitoring: () => void
    goToVoiceInput: () => void
    goToAssessment: () => void
    goToDoctor: () => void
    goToEducation: () => void
  }
}

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse("getUserProfile"),
    healthScore: 85,
    healthStatus: {
      text: "良好",
      class: "status-good",
    },
    healthIndicators: [
      { label: "血压", value: "正常", status: "normal" },
      { label: "血糖", value: "正常", status: "normal" },
      { label: "体温", value: "正常", status: "normal" },
      { label: "体重", value: "标准", status: "normal" },
    ],
    reminders: [
      {
        id: "1",
        title: "服用降压药",
        time: "今天 18:00",
      },
      {
        id: "2",
        title: "测量血糖",
        time: "明天 08:00",
      },
    ],
    currentMode: "模拟模式",
  },

  onLoad() {
    const app = getApp()
    this.setData({
      currentMode: app.globalData.isApiMode ? "API模式" : "模拟模式",
    })

    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true,
      })
    }

    this.loadHealthData()
  },

  onShow() {
    const app = getApp()
    this.setData({
      currentMode: app.globalData.isApiMode ? "API模式" : "模拟模式",
    })
  },

  async loadHealthData() {
    try {
      wx.showLoading({ title: "加载中..." })

      // 获取健康评估数据
      const assessment = await apiService.getHealthAssessment()

      this.setData({
        healthScore: assessment.score,
        healthStatus: {
          text: assessment.riskLevel === "low" ? "良好" : assessment.riskLevel === "medium" ? "注意" : "警告",
          class:
            assessment.riskLevel === "low"
              ? "status-good"
              : assessment.riskLevel === "medium"
                ? "status-warning"
                : "status-danger",
        },
      })

      wx.hideLoading()
    } catch (error) {
      wx.hideLoading()
      console.error("加载健康数据失败", error)
    }
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: "用于完善用户资料",
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true,
        })
      },
    })
  },

  getUserInfo(e: any) {
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true,
    })
  },

  // 导航到各个页面
  goToHealthRecord() {
    wx.navigateTo({
      url: "/pages/health-record/health-record",
    })
  },

  goToEmergencyMonitoring() {
    wx.navigateTo({
      url: "/pages/emergency-monitoring/emergency-monitoring",
    })
  },

  goToVoiceInput() {
    wx.navigateTo({
      url: "/pages/voice-input/voice-input",
    })
  },

  goToAssessment() {
    wx.navigateTo({
      url: "/pages/health-assessment/health-assessment",
    })
  },

  goToDoctor() {
    wx.switchTab({
      // 直接切换到底部导航的医生咨询 tab
      url: "/pages/doctor-consult/doctor-consult",
    })
  },

  goToEducation() {
    wx.navigateTo({
      url: "/pages/education/education",
    })
  },
} as unknown as IndexData)  // 使用类型断言为 IndexData
