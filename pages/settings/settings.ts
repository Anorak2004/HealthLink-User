import { Page, getApp, type IAppOption, wx } from "../../utils/miniprogram-api"

// settings.ts
Page({
  data: {
    isApiMode: false,
    healthReminder: true,
    dataSync: false,
  },

  onLoad() {
    const app = getApp<IAppOption>()
    this.setData({
      isApiMode: app.globalData.isApiMode,
    })

    // 加载其他设置
    this.loadSettings()
  },

  loadSettings() {
    const healthReminder = wx.getStorageSync("healthReminder")
    const dataSync = wx.getStorageSync("dataSync")

    this.setData({
      healthReminder: healthReminder !== false, // 默认开启
      dataSync: dataSync === true, // 默认关闭
    })
  },

  toggleApiMode(e: any) {
    const app = getApp<IAppOption>()
    app.toggleApiMode()

    this.setData({
      isApiMode: app.globalData.isApiMode,
    })
  },

  toggleHealthReminder(e: any) {
    const enabled = e.detail.value
    this.setData({
      healthReminder: enabled,
    })
    wx.setStorageSync("healthReminder", enabled)

    if (enabled) {
      // 请求通知权限
      wx.requestSubscribeMessage({
        tmplIds: ["your-template-id"], // 替换为实际的模板ID
        success: (res) => {
          console.log("订阅消息成功", res)
        },
        fail: (err) => {
          console.log("订阅消息失败", err)
        },
      })
    }
  },

  toggleDataSync(e: any) {
    const enabled = e.detail.value
    this.setData({
      dataSync: enabled,
    })
    wx.setStorageSync("dataSync", enabled)

    wx.showToast({
      title: enabled ? "数据同步已开启" : "数据同步已关闭",
      icon: "success",
    })
  },

  editProfile() {
    wx.navigateTo({
      url: "/pages/profile/profile",
    })
  },

  showPrivacyPolicy() {
    wx.showModal({
      title: "隐私政策",
      content: "我们承诺保护您的隐私和健康数据安全。所有数据都经过加密存储和传输，仅用于为您提供健康管理服务。",
      showCancel: false,
      confirmText: "我知道了",
    })
  },

  clearData() {
    wx.showModal({
      title: "确认清除",
      content: "此操作将清除所有本地健康数据，且无法恢复。确定要继续吗？",
      success: (res) => {
        if (res.confirm) {
          // 清除本地数据
          wx.clearStorageSync()
          wx.showToast({
            title: "数据已清除",
            icon: "success",
          })
        }
      },
    })
  },

  contactSupport() {
    wx.showModal({
      title: "联系客服",
      content: "如需帮助，请添加客服微信：healthlink-support",
      showCancel: false,
      confirmText: "我知道了",
    })
  },
})
