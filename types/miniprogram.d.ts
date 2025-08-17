// 微信小程序类型定义文件
// 解决 miniprogram-api 模块未定义的问题

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
}

// 应用全局数据接口
export interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo
    isApiMode: boolean
    userId?: string
  }
  userInfoReadyCallback?: (userInfo: WechatMiniprogram.UserInfo) => void
  toggleApiMode: () => void
}

// 页面基础数据接口
export interface IPageData {
  [key: string]: any
}

// 页面基础方法接口
export interface IPageMethods {
  [key: string]: (...args: any[]) => any
}

// 导出常用的微信小程序API和类型
export { wx, getApp, getCurrentPages, Page, Component, App, Behavior }

// 导出微信小程序命名空间
export namespace WechatMiniprogram {
  export = WechatMiniprogram
}