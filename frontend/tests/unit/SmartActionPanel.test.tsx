import { render, screen } from '@testing-library/react'
import SmartActionPanel from '@/app/dashboard/components/SmartActionPanel'
import { AlertProvider } from '@/contexts/AlertContext'

describe('SmartActionPanel', () => {
  it('renders empty state when no alert is selected', () => {
    render(
      <AlertProvider>
        <SmartActionPanel />
      </AlertProvider>
    )
    expect(screen.getByText(/no alert selected/i)).toBeInTheDocument()
  })

  it('renders Smart Actions title', () => {
    render(
      <AlertProvider>
        <SmartActionPanel />
      </AlertProvider>
    )
    expect(screen.getByText('Smart Actions')).toBeInTheDocument()
  })
})
