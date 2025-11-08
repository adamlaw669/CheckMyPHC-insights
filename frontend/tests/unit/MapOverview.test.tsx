import { render, screen } from '@testing-library/react'
import MapOverview from '@/app/dashboard/components/MapOverview'
import { AlertProvider } from '@/contexts/AlertContext'

// Mock the hooks
jest.mock('@/hooks/useApi', () => ({
  useOutbreakAlerts: jest.fn(() => ({
    data: [
      {
        id: 'phc_001',
        name: 'Test PHC',
        lga: 'Test LGA',
        state: 'Test State',
        lat: 9.0,
        lon: 7.0,
        alert_level: 'High',
        shortage_score: 0.8,
      },
    ],
    isLoading: false,
    usingMockData: false,
  })),
}))

// Mock Leaflet
jest.mock('leaflet', () => ({
  map: jest.fn(() => ({
    setView: jest.fn().mockReturnThis(),
    fitBounds: jest.fn(),
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
    on: jest.fn(),
    remove: jest.fn(),
  })),
  divIcon: jest.fn(),
  latLngBounds: jest.fn(() => ({})),
}))

describe('MapOverview', () => {
  it('renders loading state initially', () => {
    render(
      <AlertProvider>
        <MapOverview />
      </AlertProvider>
    )
    expect(screen.getByText(/loading map/i)).toBeInTheDocument()
  })

  it('renders map container after mount', async () => {
    const { container } = render(
      <AlertProvider>
        <MapOverview />
      </AlertProvider>
    )
    // Wait for component to mount
    await new Promise((resolve) => setTimeout(resolve, 100))
    const mapContainer = container.querySelector('.w-full.h-\\[500px\\]')
    expect(mapContainer).toBeInTheDocument()
  })
})
