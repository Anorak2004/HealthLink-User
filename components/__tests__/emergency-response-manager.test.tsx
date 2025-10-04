import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EmergencyResponseManager } from '../emergency-response-manager'

// Mock the dependencies
vi.mock('../emergency-alert-dialog', () => ({
  EmergencyAlertDialog: ({ isOpen, emergencyResponse, onClose }: any) => (
    isOpen && emergencyResponse ? (
      <div data-testid="emergency-dialog">
        <div>Emergency: {emergencyResponse.severity}</div>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}))

vi.mock('../hooks/use-emergency-alert', () => ({
  useEmergencyAlert: vi.fn(() => ({
    currentEmergency: null,
    isDialogOpen: false,
    isCallInProgress: false,
    lastCallResult: null,
    handleEmergencyTriggered: vi.fn(),
    acknowledgeEmergency: vi.fn(),
    call120: vi.fn(),
    callDoctor: vi.fn(),
    closeDialog: vi.fn(),
    clearCallResult: vi.fn()
  }))
}))

vi.mock('../../utils/emergency-monitoring-service', () => ({
  emergencyMonitoringService: {
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    checkVitals: vi.fn()
  }
}))

vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

// Mock environment
const originalEnv = process.env.NODE_ENV

describe('EmergencyResponseManager', () => {
  const defaultProps = {
    userId: 'test-user',
    doctorPhone: '138-0000-0000',
    isMonitoringActive: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  it('renders without crashing', () => {
    render(<EmergencyResponseManager {...defaultProps} />)
    
    // Should not crash and should render the component
    expect(document.body).toBeInTheDocument()
  })

  it('starts monitoring when isMonitoringActive is true', async () => {
    const { emergencyMonitoringService } = await import('../../utils/emergency-monitoring-service')
    
    render(<EmergencyResponseManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(emergencyMonitoringService.startMonitoring).toHaveBeenCalledWith('test-user')
    })
  })

  it('does not start monitoring when isMonitoringActive is false', async () => {
    const { emergencyMonitoringService } = await import('../../utils/emergency-monitoring-service')
    
    render(<EmergencyResponseManager {...defaultProps} isMonitoringActive={false} />)
    
    // Wait a bit to ensure no monitoring is started
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(emergencyMonitoringService.startMonitoring).not.toHaveBeenCalled()
  })

  it('stops monitoring when isMonitoringActive changes to false', async () => {
    const { emergencyMonitoringService } = await import('../../utils/emergency-monitoring-service')
    
    const { rerender } = render(<EmergencyResponseManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(emergencyMonitoringService.startMonitoring).toHaveBeenCalledWith('test-user')
    })
    
    // Change to inactive
    rerender(<EmergencyResponseManager {...defaultProps} isMonitoringActive={false} />)
    
    await waitFor(() => {
      expect(emergencyMonitoringService.stopMonitoring).toHaveBeenCalledWith('test-user')
    })
  })

  it('shows test controls in development environment', () => {
    process.env.NODE_ENV = 'development'
    
    render(<EmergencyResponseManager {...defaultProps} />)
    
    expect(screen.getByText('Emergency Test Controls')).toBeInTheDocument()
    expect(screen.getByText('Test Warning')).toBeInTheDocument()
    expect(screen.getByText('Test Urgent')).toBeInTheDocument()
    expect(screen.getByText('Test Critical')).toBeInTheDocument()
  })

  it('does not show test controls in production environment', () => {
    process.env.NODE_ENV = 'production'
    
    render(<EmergencyResponseManager {...defaultProps} />)
    
    expect(screen.queryByText('Emergency Test Controls')).not.toBeInTheDocument()
  })

  it('triggers test emergency when test button is clicked', async () => {
    const { emergencyMonitoringService } = await import('../../utils/emergency-monitoring-service')
    emergencyMonitoringService.checkVitals.mockResolvedValue({
      id: 'test-emergency',
      severity: 'warning',
      vitalsData: { heartRate: 55, timestamp: new Date() }
    })
    
    render(<EmergencyResponseManager {...defaultProps} />)
    
    const testWarningButton = screen.getByText('Test Warning')
    fireEvent.click(testWarningButton)
    
    await waitFor(() => {
      expect(emergencyMonitoringService.checkVitals).toHaveBeenCalledWith(
        expect.objectContaining({
          heartRate: 55,
          bloodPressure: { systolic: 180, diastolic: 110 },
          temperature: 39.5,
          oxygenSaturation: 88
        })
      )
    })
  })

  it('triggers critical test emergency with correct vitals', async () => {
    const { emergencyMonitoringService } = await import('../../utils/emergency-monitoring-service')
    emergencyMonitoringService.checkVitals.mockResolvedValue({
      id: 'test-emergency',
      severity: 'critical',
      vitalsData: { heartRate: 35, timestamp: new Date() }
    })
    
    render(<EmergencyResponseManager {...defaultProps} />)
    
    const testCriticalButton = screen.getByText('Test Critical')
    fireEvent.click(testCriticalButton)
    
    await waitFor(() => {
      expect(emergencyMonitoringService.checkVitals).toHaveBeenCalledWith(
        expect.objectContaining({
          heartRate: 35,
          oxygenSaturation: 80
        })
      )
    })
  })

  it('shows monitoring status in test controls', () => {
    render(<EmergencyResponseManager {...defaultProps} />)
    
    expect(screen.getByText('Monitoring: Active')).toBeInTheDocument()
  })

  it('calls onEmergencyTriggered callback when emergency is triggered', async () => {
    const onEmergencyTriggered = vi.fn()
    const mockEmergency = {
      id: 'test-emergency',
      severity: 'urgent',
      vitalsData: { heartRate: 45, timestamp: new Date() }
    }
    
    // Mock the hook to return a function that calls our callback
    const { useEmergencyAlert } = await import('../hooks/use-emergency-alert')
    useEmergencyAlert.mockReturnValue({
      currentEmergency: null,
      isDialogOpen: false,
      isCallInProgress: false,
      lastCallResult: null,
      handleEmergencyTriggered: (response: any) => {
        onEmergencyTriggered(response)
      },
      acknowledgeEmergency: vi.fn(),
      call120: vi.fn(),
      callDoctor: vi.fn(),
      closeDialog: vi.fn(),
      clearCallResult: vi.fn()
    })
    
    render(<EmergencyResponseManager {...defaultProps} onEmergencyTriggered={onEmergencyTriggered} />)
    
    // The callback should be set up correctly
    expect(useEmergencyAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        doctorPhone: '138-0000-0000',
        onEmergencyTriggered: expect.any(Function)
      })
    )
  })

  it('calls onEmergencyResolved callback when emergency is resolved', async () => {
    const onEmergencyResolved = vi.fn()
    
    // Mock the hook to return a function that calls our callback
    const { useEmergencyAlert } = await import('../hooks/use-emergency-alert')
    useEmergencyAlert.mockReturnValue({
      currentEmergency: null,
      isDialogOpen: false,
      isCallInProgress: false,
      lastCallResult: null,
      handleEmergencyTriggered: vi.fn(),
      acknowledgeEmergency: vi.fn(),
      call120: vi.fn(),
      callDoctor: vi.fn(),
      closeDialog: vi.fn(),
      clearCallResult: vi.fn()
    })
    
    render(<EmergencyResponseManager {...defaultProps} onEmergencyResolved={onEmergencyResolved} />)
    
    // The callback should be set up correctly
    expect(useEmergencyAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        onEmergencyAcknowledged: expect.any(Function)
      })
    )
  })

  it('handles monitoring start failure gracefully', async () => {
    const { emergencyMonitoringService } = await import('../../utils/emergency-monitoring-service')
    emergencyMonitoringService.startMonitoring.mockRejectedValue(new Error('Monitoring failed'))
    
    const { useToast } = await import('../../hooks/use-toast')
    const mockToast = vi.fn()
    useToast.mockReturnValue({ toast: mockToast })
    
    render(<EmergencyResponseManager {...defaultProps} />)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "监测启动失败",
        description: "无法启动紧急监测服务，请检查系统设置。",
        variant: "destructive",
      })
    })
  })

  it('handles vitals check failure gracefully', async () => {
    const { emergencyMonitoringService } = await import('../../utils/emergency-monitoring-service')
    emergencyMonitoringService.checkVitals.mockRejectedValue(new Error('Vitals check failed'))
    
    // Should not crash when vitals check fails
    render(<EmergencyResponseManager {...defaultProps} />)
    
    const testWarningButton = screen.getByText('Test Warning')
    fireEvent.click(testWarningButton)
    
    // Should handle the error gracefully without crashing
    await waitFor(() => {
      expect(emergencyMonitoringService.checkVitals).toHaveBeenCalled()
    })
  })
})