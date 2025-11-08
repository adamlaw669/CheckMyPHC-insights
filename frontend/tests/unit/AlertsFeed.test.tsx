import { render, screen } from '@testing-library/react'
import AlertsFeedNew from '../../app/dashboard/components/AlertsFeedNew'
import { AlertProvider } from '../../contexts/AlertContext'

// Mock the hooks
jest.mock('../../hooks/useApi', () => ({
  useAlertsFeed: jest.fn(() => ({
    data: [
      {
        id: 'alert_001',
        phc: 'Test PHC',
        lga: 'Test LGA',
        state: 'Test State',
        type: 'outbreak',
        level: 'High',
        message: 'Test alert message',
        timestamp: new Date().toISOString(),
        simulated: false,
      },
    ],
    isLoading: false,
    usingMockData: false,
    hasSimulatedAlerts: false,
  })),
}))

describe('AlertsFeedNew', () => {
  it('renders alert items', () => {
    render(
      <AlertProvider>
        <AlertsFeedNew />
      </AlertProvider>
    )
    expect(screen.getByText('Test PHC')).toBeInTheDocument()
  })

  it('renders compact view', () => {
    render(
      <AlertProvider>
        <AlertsFeedNew isCompact />
      </AlertProvider>
    )
    expect(screen.getByText('Test PHC')).toBeInTheDocument()
  })

  it('shows filters in non-compact mode', () => {
    render(
      <AlertProvider>
        <AlertsFeedNew isCompact={false} />
      </AlertProvider>
    )
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })
})
