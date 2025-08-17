import { App, wx, type IAppOption } from "./utils/miniprogram-api"

App({
  globalData: {
    isApiMode: false, // 默认使用模拟模式
  },

  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync("logs") || []
    logs.unshift(Date.now())
    wx.setStorageSync("logs", logs)

    // 登录
    wx.login({
      success: (res: { code: any }) => {
        console.log("登录成功", res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })

    // 检查API模式设置
    const apiMode = wx.getStorageSync("apiMode")
    if (apiMode !== undefined) {
      this.globalData.isApiMode = apiMode
    }
  },

  // 切换API模式
  toggleApiMode() {
    this.globalData.isApiMode = !this.globalData.isApiMode
    wx.setStorageSync("apiMode", this.globalData.isApiMode)

    wx.showToast({
      title: this.globalData.isApiMode ? "已切换到API模式" : "已切换到模拟模式",
      icon: "success",
    })
  },
} as IAppOption) // 这里使用类型断言
