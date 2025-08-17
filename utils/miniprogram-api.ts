// 微信小程序API包装器
// 提供类型安全的API调用

import type { IAppOption } from '../types/miniprogram'

// 导出微信小程序全局对象和函数
export const wx = (globalThis as any).wx as WechatMiniprogram.Wx
export const getApp = (globalThis as any).getApp as <T = IAppOption>() => T & WechatMiniprogram.App.Instance<T>
export const getCurrentPages = (globalThis as any).getCurrentPages as () => WechatMiniprogram.Page.Instance<any, any>[]
export const Page = (globalThis as any).Page as <TData = any, TCustom = any>(
  options: WechatMiniprogram.Page.Options<TData, TCustom>
) => void
export const Component = (globalThis as any).Component as <TData = any, TProperty = any, TMethod = any>(
  options: WechatMiniprogram.Component.Options<TData, TProperty, TMethod>
) => void
export const App = (globalThis as any).App as <T = any>(options: WechatMiniprogram.App.Options<T>) => void
export const Behavior = (globalThis as any).Behavior as (options: WechatMiniprogram.Behavior.Options) => string

// 导出类型
export type { IAppOption }

// 检查微信小程序环境
export const isMiniProgramEnv = (): boolean => {
  return typeof wx !== 'undefined' && wx.getSystemInfoSync
}

// 安全的API调用包装器
export const safeApiCall = <T = any>(
  apiCall: () => T,
  fallback?: T,
  errorHandler?: (error: Error) => void
): T => {
  try {
    if (!isMiniProgramEnv()) {
      console.warn('Not in WeChat Mini Program environment')
      return fallback as T
    }
    return apiCall()
  } catch (error) {
    console.error('API call failed:', error)
    if (errorHandler) {
      errorHandler(error as Error)
    }
    return fallback as T
  }
}

// 常用的安全API调用
export const safeWx = {
  getStorageSync: (key: string, fallback: any = null) => 
    safeApiCall(() => wx.getStorageSync(key), fallback),
  
  setStorageSync: (key: string, data: any) => 
    safeApiCall(() => wx.setStorageSync(key, data), undefined),
  
  showToast: (options: WechatMiniprogram.ShowToastOption) => 
    safeApiCall(() => wx.showToast(options), undefined),
  
  showLoading: (options: WechatMiniprogram.ShowLoadingOption) => 
    safeApiCall(() => wx.showLoading(options), undefined),
  
  hideLoading: () => 
    safeApiCall(() => wx.hideLoading(), undefined),
  
  navigateTo: (options: WechatMiniprogram.NavigateToOption) => 
    safeApiCall(() => wx.navigateTo(options), undefined),
  
  switchTab: (options: WechatMiniprogram.SwitchTabOption) => 
    safeApiCall(() => wx.switchTab(options), undefined),
  
  request: (options: WechatMiniprogram.RequestOption) => 
    safeApiCall(() => wx.request(options), undefined)
}