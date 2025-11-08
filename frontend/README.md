# CheckMyPHC Insights - Frontend Dashboard

A modern, production-ready Next.js dashboard for monitoring and managing Primary Health Centers (PHCs) across Nigeria. Built with real-time data, AI-driven insights, and telecom-aware alert simulation.

## 🚀 Features

- **Interactive Map**: Leaflet-powered map showing PHC locations with color-coded markers based on alert severity
- **Real-time Alerts Feed**: Live-updating feed with filters, search, and simulated alert tracking
- **Analytics Dashboard**: Trends visualization, risk scores, and alert distribution charts
- **Smart Action Panel**: Telecom-aware alert simulation with channel selection (SMS, WhatsApp, Email)
- **Rankings Panel**: Top underserved PHCs with CSV export for reporting
- **Mock Data Fallback**: Automatic fallback to mock data if API is unavailable
- **Responsive Design**: Mobile-first, fully responsive across all devices
- **Accessible**: WCAG AA compliant with keyboard navigation and ARIA labels

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- Modern browser with ES6+ support

## 🛠️ Installation

```bash
# Clone the repository
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Copy environment variables
cp .env.example .env

# Edit .env if needed (default uses production API)
```

## 🏃 Running Locally

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js app router
│   ├── dashboard/
│   │   ├── components/          # Dashboard components
│   │   │   ├── MapOverview.tsx           # Interactive map
│   │   │   ├── AlertsFeedNew.tsx         # Alerts feed with filters
│   │   │   ├── TrendsPanel.tsx           # Analytics charts
│   │   │   ├── RankingsPanel.tsx         # Underserved PHC rankings
│   │   │   ├── SmartActionPanel.tsx      # Alert actions
│   │   │   └── DashboardLayoutNew.tsx    # Main layout
│   │   └── page.tsx             # Dashboard entry point
│   ├── login/                   # Login page
│   ├── signup/                  # Signup page
│   └── layout.tsx               # Root layout
├── lib/                         # Core utilities
│   ├── apiClient.ts            # API client with retry logic
│   ├── types.ts                # TypeScript interfaces
│   ├── utils.ts                # Helper functions
│   └── mapHelpers.ts           # Map utilities
├── hooks/                       # Custom React hooks
│   └── useApi.ts               # SWR data fetching hooks
├── contexts/                    # React contexts
│   └── AlertContext.tsx        # Alert state management
├── mocks/                       # Mock data for fallback
│   ├── sample_outbreak_alerts.json
│   ├── sample_underserved_phcs.json
│   ├── sample_resource_warnings.json
│   └── lga_centroids.json      # LGA geocoding data
├── tests/                       # Test files
│   ├── unit/                   # Unit tests
│   └── e2e/                    # E2E tests
├── components/                  # Reusable UI components
│   └── ui/                     # shadcn/ui components
└── public/                      # Static assets
```

## 🔌 API Integration

### Base URL

```
https://presight.onrender.com/api/v1
```

### Endpoints Used

1. **GET /outbreak-alerts**
   - Query params: `limit`, `offset`, `state`, `lga`, `level`
   - Returns: Array of PHC outbreak alerts

2. **GET /underserved**
   - Query params: `top_n`, `state`
   - Returns: Top underserved PHCs with metrics

3. **GET /alerts-feed**
   - Query params: `limit`, `types`, `state`
   - Returns: Aggregated alerts feed

4. **GET /telecom-advice**
   - Query params: `name` (PHC name)
   - Returns: Preferred communication channel

### Mock Data Fallback

If the API is unavailable, the dashboard automatically uses mock data from the `mocks/` directory. A yellow banner indicates when mock data is in use.

## 🎯 Key Components

### MapOverview

Interactive Leaflet map with:
- Color-coded markers (Red=High alert, Amber=Medium, Green=Low)
- Click to view PHC details
- Send alert buttons in popup
- Auto-clustering for dense areas

### AlertsFeedNew

Real-time alerts feed with:
- Search by PHC, LGA, or State
- Filter by alert type and state
- Simulated alerts tracking
- Clickable alerts for Smart Actions

### TrendsPanel

Analytics with Recharts:
- Top 5 PHCs by risk score
- Alert trends over time
- Distribution by alert level

### RankingsPanel

Underserved PHCs table:
- Top 10 ranking
- Export to CSV
- Sortable columns

### SmartActionPanel

Alert management:
- Suggested actions based on alert type
- Telecom-aware channel selection
- Alert log with localStorage persistence

## 🔧 Configuration

### Environment Variables

Create a `.env` file (see `.env.example`):

```bash
# API Configuration
NEXT_PUBLIC_API_BASE=https://presight.onrender.com/api/v1

# Map Tile URL
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### Changing API Base URL

Edit `.env` or set the environment variable:

```bash
export NEXT_PUBLIC_API_BASE=https://your-api-url.com/api/v1
```

## 📊 Data Flow

1. **Data Fetching**: SWR hooks (`useApi.ts`) fetch data with caching and auto-revalidation
2. **State Management**: AlertContext provides shared state for selected alerts
3. **Mock Fallback**: If API fails, hooks automatically use mock data
4. **Simulated Alerts**: Stored in localStorage and merged with API alerts

## 🎨 Styling

- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Accessible component library
- **Responsive**: Mobile-first with breakpoints at sm, md, lg, xl

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel

# Or connect GitHub repo to Vercel for auto-deployment
```

### Docker

```bash
# Build Docker image
docker build -t checkmyphc-frontend .

# Run container
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE=https://presight.onrender.com/api/v1 checkmyphc-frontend
```

### Environment Variables on Deploy

Make sure to set:
- `NEXT_PUBLIC_API_BASE`
- `NEXT_PUBLIC_MAP_TILE_URL` (optional)

## 🐛 Troubleshooting

### Issue: Map not loading

**Solution**: Ensure you're using a client-side component with `"use client"` and dynamic import:

```tsx
const MapOverview = dynamic(() => import('./MapOverview'), { ssr: false })
```

### Issue: API returning 404

**Solution**: The dashboard will automatically use mock data. Check:
1. Backend is deployed and running
2. API base URL is correct in `.env`
3. Endpoint paths match backend routes

### Issue: Simulated alerts not persisting

**Solution**: Check localStorage is enabled in browser. Clear localStorage if corrupt:

```javascript
localStorage.removeItem('simulatedAlerts')
```

### Issue: Tests failing

**Solution**: Run tests with proper setup:

```bash
# Unit tests
npm test -- --clearCache
npm test

# E2E tests
npx playwright install
npm run test:e2e
```

## 📈 Performance

- **Code Splitting**: Dynamic imports for heavy components (Map, Charts)
- **Memoization**: React.memo and useMemo for expensive computations
- **SWR Caching**: Intelligent caching and revalidation
- **Lazy Loading**: Images and components load on demand

## 🔐 Security

- No sensitive data in frontend
- API keys server-side only
- Input sanitization for search and filters
- CORS handled by backend

## 📝 Next Improvements

For pitch deck and future roadmap:

1. **Offline Sync**: Service workers for offline functionality
2. **User Authentication**: Role-based access control (admin, viewer, coordinator)
3. **SMS Gateway Integration**: Real SMS/WhatsApp sending via Twilio/AfricasTalking
4. **Advanced Analytics**: Predictive models, trend forecasting
5. **Multi-language**: Support for local languages (Hausa, Yoruba, Igbo)
6. **Mobile App**: React Native version for field workers
7. **Push Notifications**: Browser push for critical alerts
8. **Report Builder**: Custom PDF/Excel report generation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Team

Built by Team CheckMyPHC for Nigeria PHC Intelligence

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Email: support@checkmyphc.com
- Docs: https://docs.checkmyphc.com

---

**Built with ❤️ for Nigeria's Healthcare**
