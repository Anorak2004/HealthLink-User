// profile.ts
import { apiService } from "../../utils/api"
import { Page, wx, getApp, type IAppOption } from "../../utils/miniprogram-api"

interface ProfileData {
  userInfo: {
    nickName?: string
    avatarUrl?: string
  }
  userId: string
  isApiMode: boolean
  healthStats: {
    recordCount: number
    assessmentCount: number
    consultCount: number
    daysUsed: number
  }
}

Page<ProfileData, {}>({
  data: {
    userInfo: {},
    userId: "HL001",
    isApiMode: false,
    healthStats: {
      recordCount: 0,
      assessmentCount: 0,
      consultCount: 0,
      daysUsed: 0,
    },
  },

  onLoad() {
    const app = getApp<IAppOption>()
    this.setData({
      isApiMode: app.globalData.isApiMode,
    })

    this.loadUserInfo()
    this.loadHealthStats()
  },

  onShow() {
    const app = getApp<IAppOption>()
    this.setData({
      isApiMode: app.globalData.isApiMode,
    })
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync("userInfo")
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
      })
    }
  },

  async loadHealthStats() {
    try {
      const stats = await apiService.getUserStats()
      this.setData({
        healthStats: stats,
      })
    } catch (error) {
      console.error("加载用户统计失败", error)
      // 使用模拟数据
      this.setData({
        healthStats: {
          recordCount: 25,
          assessmentCount: 3,
          consultCount: 2,
          daysUsed: 15,
        },
      })
    }
  },

  editProfile() {
    wx.showToast({
      title: "功能开发中",
      icon: "none",
    })
  },

  goToHealthHistory() {
    wx.navigateTo({
      url: "/pages/health-history/health-history",
    })
  },

  goToReminders() {
    wx.showToast({
      title: "功能开发中",
      icon: "none",
    })
  },

  goToSettings() {
    wx.showToast({
      title: "功能开发中",
      icon: "none",
    })
  },

  showAbout() {
    wx.showModal({
      title: "关于HealthLink",
      content:
        "HealthLink是一款专业的健康管理小程序，帮助用户记录健康数据、评估健康风险、咨询专业医生。\n\n版本：1.0.0",
      showCancel: false,
    })
  },

  onModeChange(e: any) {
    const app = getApp<IAppOption>()
    const isApiMode = e.detail.value

    this.setData({
      isApiMode: isApiMode,
    })

    app.globalData.isApiMode = isApiMode
    wx.setStorageSync("apiMode", isApiMode)

    wx.showToast({
      title: isApiMode ? "已切换到API模式" : "已切换到模拟模式",
      icon: "success",
    })
  },

  logout() {
    wx.showModal({
      title: "确认退出",
      content: "确定要退出登录吗？",
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.showToast({
            title: "已退出登录",
            icon: "success",
          })

          setTimeout(() => {
            wx.reLaunch({
              url: "/pages/index/index",
            })
          }, 1500)
        }
      },
    })
  },
})
