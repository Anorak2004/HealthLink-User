// Test setup file
import { vi } from 'vitest'

// Mock global WeChat Mini Program environment
global.wx = {
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  request: vi.fn(),
  showToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  navigateTo: vi.fn(),
  switchTab: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({}))
} as any

global.getApp = vi.fn(() => ({
  globalData: {
    isApiMode: false
  }
})) as any