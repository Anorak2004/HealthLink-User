import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EmergencyAlertDialog } from '../emergency-alert-dialog'
import { EmergencyResponse } from '../../types/health-monitoring'

// Mock the UI components
vi.mock('../ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  )
}))

vi.mock('../ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }: any) => (
    <div className={className} data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children, className }: any) => (
    <h2 className={className} data-testid="dialog-title">{children}</h2>
  )
}))

vi.mock('../ui/alert', () => ({
  Alert: ({ children, className }: any) => (
    <div className={className} data-testid="alert">{children}</div>
  ),
  AlertDescription: ({ children, className }: any) => (
    <div className={className} data-testid="alert-description">{children}</div>
  )
}))

vi.mock('../ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div className={className} data-testid="progress" data-value={value} />
  )
}))

describe('EmergencyAlertDialog', () => {
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

  const defaultProps = {
    emergencyResponse: mockEmergencyResponse,
    isOpen: true,
    onClose: vi.fn(),
    onAcknowledge: vi.fn(),
    onCall120: vi.fn(),
    onCallDoctor: vi.fn(),
    doctorPhone: '138-0000-0000'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders emergency dialog when open', () => {
    render(<EmergencyAlertDialog {...defaultProps} />)
    
    expect(screen.getByTestId('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('危急情况！')
  })

  it('does not render when closed', () => {
    render(<EmergencyAlertDialog {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('does not render when no emergency response', () => {
    render(<EmergencyAlertDialog {...defaultProps} emergencyResponse={null} />)
    
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('displays correct severity information for critical emergency', () => {
    render(<EmergencyAlertDialog {...defaultProps} />)
    
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('危急情况！')
    expect(screen.getByTestId('alert-description')).toHaveTextContent('检测到生命体征严重异常，请立即寻求医疗帮助！')
  })

  it('displays correct severity information for urgent emergency', () => {
    const urgentEmergency = { ...mockEmergencyResponse, severity: 'urgent' as const }
    render(<EmergencyAlertDialog {...defaultProps} emergencyResponse={urgentEmergency} />)
    
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('紧急情况')
    expect(screen.getByTestId('alert-description')).toHaveTextContent('检测到生命体征异常，建议尽快联系医生。')
  })

  it('displays correct severity information for warning emergency', () => {
    const warningEmergency = { ...mockEmergencyResponse, severity: 'warning' as const }
    render(<EmergencyAlertDialog {...defaultProps} emergencyResponse={warningEmergency} />)
    
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('健康警告')
    expect(screen.getByTestId('alert-description')).toHaveTextContent('检测到生命体征异常，请注意身体状况。')
  })

  it('displays vitals data correctly', () => {
    render(<EmergencyAlertDialog {...defaultProps} />)
    
    expect(screen.getByText('心率: 35 bpm')).toBeInTheDocument()
    expect(screen.getByText('血压: 180/110 mmHg')).toBeInTheDocument()
    expect(screen.getByText('体温: 39.5°C')).toBeInTheDocument()
    expect(screen.getByText('血氧: 80%')).toBeInTheDocument()
  })

  it('calls onCall120 when 120 button is clicked', () => {
    render(<EmergencyAlertDialog {...defaultProps} />)
    
    const call120Button = screen.getByText('拨打 120 急救电话')
    fireEvent.click(call120Button)
    
    expect(defaultProps.onCall120).toHaveBeenCalledTimes(1)
    expect(defaultProps.onAcknowledge).toHaveBeenCalledWith('test-emergency-1')
  })

  it('calls onCallDoctor when doctor button is clicked', () => {
    render(<EmergencyAlertDialog {...defaultProps} />)
    
    const callDoctorButton = screen.getByText('拨打医生电话')
    fireEvent.click(callDoctorButton)
    
    expect(defaultProps.onCallDoctor).toHaveBeenCalledWith('138-0000-0000')
    expect(defaultProps.onAcknowledge).toHaveBeenCalledWith('test-emergency-1')
  })

  it('does not show doctor button when no doctor phone provided', () => {
    render(<EmergencyAlertDialog {...defaultProps} doctorPhone={undefined} />)
    
    expect(screen.queryByText('拨打医生电话')).not.toBeInTheDocument()
  })

  it('shows manual dialing information', () => {
    render(<EmergencyAlertDialog {...defaultProps} />)
    
    expect(screen.getByText('如果自动拨号失败，请手动拨打：')).toBeInTheDocument()
    expect(screen.getByText('急救电话: 120')).toBeInTheDocument()
    expect(screen.getByText('医生电话: 138-0000-0000')).toBeInTheDocument()
  })

  it('calls onClose when manual close button is clicked', () => {
    render(<EmergencyAlertDialog {...defaultProps} />)
    
    const closeButton = screen.getByText('我已处理此情况')
    fireEvent.click(closeButton)
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    expect(defaultProps.onAcknowledge).toHaveBeenCalledWith('test-emergency-1')
  })

  it('shows countdown timer', async () => {
    render(<EmergencyAlertDialog {...defaultProps} autoCloseTimeout={5000} />)
    
    expect(screen.getByText('5s')).toBeInTheDocument()
    
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    
    await waitFor(() => {
      expect(screen.getByText('4s')).toBeInTheDocument()
    })
  })

  it('triggers enhanced alert after timeout', async () => {
    render(<EmergencyAlertDialog {...defaultProps} autoCloseTimeout={2000} />)
    
    expect(screen.getByText('请选择操作')).toBeInTheDocument()
    
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    
    await waitFor(() => {
      expect(screen.getByText('强化警报已激活')).toBeInTheDocument()
    })
  })

  it('stops countdown when user responds', () => {
    render(<EmergencyAlertDialog {...defaultProps} autoCloseTimeout={5000} />)
    
    const call120Button = screen.getByText('拨打 120 急救电话')
    fireEvent.click(call120Button)
    
    // Timer should stop, no more countdown updates
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    
    // Should not show countdown anymore after user response
    expect(screen.queryByText('4s')).not.toBeInTheDocument()
  })

  it('updates progress bar correctly', async () => {
    render(<EmergencyAlertDialog {...defaultProps} autoCloseTimeout={4000} />)
    
    const progressBar = screen.getByTestId('progress')
    expect(progressBar).toHaveAttribute('data-value', '0')
    
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    
    await waitFor(() => {
      expect(progressBar).toHaveAttribute('data-value', '25')
    })
    
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    
    await waitFor(() => {
      expect(progressBar).toHaveAttribute('data-value', '50')
    })
  })

  it('resets state when dialog reopens', () => {
    const { rerender } = render(<EmergencyAlertDialog {...defaultProps} isOpen={false} />)
    
    // Open dialog
    rerender(<EmergencyAlertDialog {...defaultProps} isOpen={true} />)
    
    expect(screen.getByText('30s')).toBeInTheDocument()
    expect(screen.getByText('请选择操作')).toBeInTheDocument()
  })

  it('handles missing vitals data gracefully', () => {
    const incompleteEmergency = {
      ...mockEmergencyResponse,
      vitalsData: {
        heartRate: 35,
        timestamp: new Date('2024-01-01T12:00:00Z')
      }
    }
    
    render(<EmergencyAlertDialog {...defaultProps} emergencyResponse={incompleteEmergency} />)
    
    expect(screen.getByText('心率: 35 bpm')).toBeInTheDocument()
    expect(screen.queryByText('血压:')).not.toBeInTheDocument()
    expect(screen.queryByText('体温:')).not.toBeInTheDocument()
    expect(screen.queryByText('血氧:')).not.toBeInTheDocument()
  })
})