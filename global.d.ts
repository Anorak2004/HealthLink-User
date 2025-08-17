// 全局类型声明文件
// 确保TypeScript正确识别微信小程序环境

/// <reference types="wechat-miniprogram" />

declare global {
  // 微信小程序全局对象
  const wx: WechatMiniprogram.Wx
  const getApp: <T = any>() => T & WechatMiniprogram.App.Instance<T>
  const getCurrentPages: () => WechatMiniprogram.Page.Instance<any, any>[]
  const Page: <TData = any, TCustom = any>(
    options: WechatMiniprogram.Page.Options<TData, TCustom>
  ) => void
  const Component: <TData = any, TProperty = any, TMethod = any>(
    options: WechatMiniprogram.Component.Options<TData, TProperty, TMethod>
  ) => void
  const App: <T = any>(options: WechatMiniprogram.App.Options<T>) => void
  const Behavior: (options: WechatMiniprogram.Behavior.Options) => string

  // 扩展全局对象类型
  interface Window {
    wx?: WechatMiniprogram.Wx
  }

  // Node.js 全局对象
  var globalThis: typeof globalThis & {
    wx?: WechatMiniprogram.Wx
    getApp?: <T = any>() => T & WechatMiniprogram.App.Instance<T>
    getCurrentPages?: () => WechatMiniprogram.Page.Instance<any, any>[]
    Page?: <TData = any, TCustom = any>(
      options: WechatMiniprogram.Page.Options<TData, TCustom>
    ) => void
    Component?: <TData = any, TProperty = any, TMethod = any>(
      options: WechatMiniprogram.Component.Options<TData, TProperty, TMethod>
    ) => void
    App?: <T = any>(options: WechatMiniprogram.App.Options<T>) => void
    Behavior?: (options: WechatMiniprogram.Behavior.Options) => string
  }
}

export {}