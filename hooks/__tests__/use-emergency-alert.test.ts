import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useEmergencyAlert, isAutoDialSupported, getDialingInstructions } from '../use-emergency-alert'
import { EmergencyResponse } from '../../types/health-monitoring'

// Mock the emergency monitoring service
vi.mock('../../utils/emergency-monitoring-service', () => ({
  emergencyMonitoringService: {
    acknowledgeEmergency: vi.fn()
  }
}))

// Mock navigator and window objects
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  clipboard: {
    writeText: vi.fn()
  }
}

const mockWindow = {
  location: {
    href: ''
  }
}

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
})

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
})

describe('useEmergencyAlert', () => {
  const mockEmergencyResponse: EmergencyResponse = {
    id: 'test-emergency-1',
    userId: 'test-user',
    triggerTime: new Date('2024-01-01T12:00:00Z'),
    vitalsData: {
      heartRate: 35,
      bloodPressure: { systolic: 180, diastolic: 110 },
      temperature: 39.5,
      oxygenSaturation: 80,
      timestamp: new Date('2024-01-01T12:00:00Z')
    },
    severity: 'critical',
    responseActions: [
      { type: 'call_120', priority: 1, executed: false },
      { type: 'call_doctor', priority: 2, executed: false }
    ],
    status: 'triggered'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockWindow.location.href = ''
    mockNavigator.clipboard.writeText.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useEmergencyAlert())
    
    expect(result.current.currentEmergency).toBeNull()
    expect(result.current.isDialogOpen).toBe(false)
    expect(result.current.isCallInProgress).toBe(false)
    expect(result.current.lastCallResult).toBeNull()
  })

  it('handles emergency triggered correctly', () => {
    const onEmergencyTriggered = vi.fn()
    const { result } = renderHook(() => useEmergencyAlert({ onEmergencyTriggered }))
    
    act(() => {
      result.current.handleEmergencyTriggered(mockEmergencyResponse)
    })
    
    expect(result.current.currentEmergency).toEqual(mockEmergencyResponse)
    expect(result.current.isDialogOpen).toBe(true)
    expect(onEmergencyTriggered).toHaveBeenCalledWith(mockEmergencyResponse)
  })

  it('acknowledges emergency correctly', async () => {
    const onEmergencyAcknowledged = vi.fn()
    const { result } = renderHook(() => useEmergencyAlert({ onEmergencyAcknowledged }))
    
    // First trigger an emergency
    act(() => {
      result.current.handleEmergencyTriggered(mockEmergencyResponse)
    })
    
    // Then acknowledge it
    await act(async () => {
      await result.current.acknowledgeEmergency('test-emergency-1')
    })
    
    expect(result.current.currentEmergency).toBeNull()
    expect(result.current.isDialogOpen).toBe(false)
    expect(onEmergencyAcknowledged).toHaveBeenCalledWith('test-emergency-1')
  })

  it('handles call120 on mobile device', async () => {
    // Mock mobile user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      writable: true
    })
    
    const { result } = renderHook(() => useEmergencyAlert())
    
    let callResult
    await act(async () => {
      callResult = await result.current.call120()
    })
    
    expect(result.current.isCallInProgress).toBe(false)
    expect(callResult).toEqual({ success: true })
    expect(mockWindow.location.href).toBe('tel:120')
  })

  it('handles call120 fallback on desktop', async () => {
    // Mock desktop user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      writable: true
    })
    
    const { result } = renderHook(() => useEmergencyAlert())
    
    let callResult
    await act(async () => {
      callResult = await result.current.call120()
    })
    
    expect(result.current.isCallInProgress).toBe(false)
    expect(callResult).toEqual({
      success: false,
      error: 'Phone number copied to clipboard. Please dial manually.',
      fallbackRequired: true
    })
    expect(mockNavigator.clipboard.writeText).toHaveBeenCalledWith('120')
  })

  it('handles callDoctor with provided phone number', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      writable: true
    })
    
    const { result } = renderHook(() => useEmergencyAlert({ doctorPhone: '138-0000-0000' }))
    
    let callResult
    await act(async () => {
      callResult = await result.current.callDoctor()
    })
    
    expect(callResult).toEqual({ success: true })
    expect(mockWindow.location.href).toBe('tel:13800000000')
  })

  it('handles callDoctor without phone number', async () => {
    const { result } = renderHook(() => useEmergencyAlert())
    
    let callResult
    await act(async () => {
      callResult = await result.current.callDoctor()
    })
    
    expect(callResult).toEqual({
      success: false,
      error: 'No doctor phone number available',
      fallbackRequired: true
    })
  })

  it('handles callDoctor with parameter override', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      writable: true
    })
    
    const { result } = renderHook(() => useEmergencyAlert({ doctorPhone: '138-0000-0000' }))
    
    let callResult
    await act(async () => {
      callResult = await result.current.callDoctor('139-1111-1111')
    })
    
    expect(callResult).toEqual({ success: true })
    expect(mockWindow.location.href).toBe('tel:13911111111')
  })

  it('closes dialog and acknowledges emergency', async () => {
    const { result } = renderHook(() => useEmergencyAlert())
    
    // First trigger an emergency
    act(() => {
      result.current.handleEmergencyTriggered(mockEmergencyResponse)
    })
    
    expect(result.current.isDialogOpen).toBe(true)
    
    // Then close dialog
    await act(async () => {
      result.current.closeDialog()
    })
    
    expect(result.current.currentEmergency).toBeNull()
    expect(result.current.isDialogOpen).toBe(false)
  })

  it('clears call result', () => {
    const { result } = renderHook(() => useEmergencyAlert())
    
    // Manually set a call result (normally set by call functions)
    act(() => {
      result.current.setCurrentEmergency(mockEmergencyResponse)
    })
    
    act(() => {
      result.current.clearCallResult()
    })
    
    expect(result.current.lastCallResult).toBeNull()
  })

  it('handles WeChat miniprogram environment', async () => {
    // Mock WeChat environment
    const mockWx = {
      makePhoneCall: vi.fn((options: any) => {
        options.success()
      })
    }
    
    ;(global as any).wx = mockWx
    
    const { result } = renderHook(() => useEmergencyAlert())
    
    let callResult
    await act(async () => {
      callResult = await result.current.call120()
    })
    
    expect(callResult).toEqual({ success: true })
    expect(mockWx.makePhoneCall).toHaveBeenCalledWith({
      phoneNumber: '120',
      success: expect.any(Function),
      fail: expect.any(Function)
    })
    
    // Clean up
    delete (global as any).wx
  })

  it('handles WeChat miniprogram call failure', async () => {
    // Mock WeChat environment with failure
    const mockWx = {
      makePhoneCall: vi.fn((options: any) => {
        options.fail({ errMsg: 'makePhoneCall:fail' })
      })
    }
    
    ;(global as any).wx = mockWx
    
    const { result } = renderHook(() => useEmergencyAlert())
    
    let callResult
    await act(async () => {
      callResult = await result.current.call120()
    })
    
    expect(callResult).toEqual({
      success: false,
      error: 'makePhoneCall:fail',
      fallbackRequired: true
    })
    
    // Clean up
    delete (global as any).wx
  })
})

describe('isAutoDialSupported', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true for WeChat miniprogram', () => {
    ;(global as any).wx = { makePhoneCall: vi.fn() }
    
    expect(isAutoDialSupported()).toBe(true)
    
    delete (global as any).wx
  })

  it('returns true for mobile devices', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      writable: true
    })
    
    expect(isAutoDialSupported()).toBe(true)
  })

  it('returns true for Android devices', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F)',
      writable: true
    })
    
    expect(isAutoDialSupported()).toBe(true)
  })

  it('returns false for desktop browsers', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      writable: true
    })
    
    expect(isAutoDialSupported()).toBe(false)
  })

  it('returns false in server environment', () => {
    const originalWindow = global.window
    delete (global as any).window
    
    expect(isAutoDialSupported()).toBe(false)
    
    global.window = originalWindow
  })
})

describe('getDialingInstructions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns WeChat instructions for miniprogram', () => {
    ;(global as any).wx = { makePhoneCall: vi.fn() }
    
    expect(getDialingInstructions()).toBe('点击按钮将自动拨打电话')
    
    delete (global as any).wx
  })

  it('returns mobile instructions for mobile devices', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      writable: true
    })
    
    expect(getDialingInstructions()).toBe('点击按钮将打开拨号界面')
  })

  it('returns desktop instructions for desktop browsers', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      writable: true
    })
    
    expect(getDialingInstructions()).toBe('电话号码已复制到剪贴板，请使用您的电话应用拨打')
  })

  it('returns fallback instructions in server environment', () => {
    const originalWindow = global.window
    delete (global as any).window
    
    expect(getDialingInstructions()).toBe('请手动拨打电话号码')
    
    global.window = originalWindow
  })
})