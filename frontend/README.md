# CheckMyPHC Insights

A real-time PHC (Primary Health Centers) intelligence dashboard built with Next.js 15, TypeScript, and React-Leaflet. Designed for hackathon-ready demo purposes with a focus on outbreak detection, resource monitoring, and telecommunication optimization for healthcare centers across Nigeria.

## Features

- **Real-time Outbreak Detection**: Automatic anomaly detection based on malaria case trends
- **Interactive Map**: React-Leaflet powered map with color-coded PHC markers (red for outbreaks, orange for underserved, green for normal)
- **Analytics Dashboard**: Comprehensive charts showing malaria cases, maternal visits, and drug stock distribution
- **Alerts Management**: Create, monitor, and resolve alerts with real-time updates
- **User Authentication**: Demo-mode auth using localStorage (email/password)
- **Responsive Design**: Mobile-first layout that scales across all devices
- **Simulated Backend**: Mock data engine ready for FastAPI swap

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Maps**: React-Leaflet (Leaflet.js)
- **Charts**: Recharts
- **Authentication**: localStorage-based (demo only)

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm)

### Installation

\`\`\`bash
git clone <repository-url>
cd checkmyphc-insights
pnpm install
\`\`\`

### Run Development Server

\`\`\`bash
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## User Flow

1. **Landing Page** → Click "Try Demo"
2. **Signup** → Create account (stored in localStorage)
3. **Login** → Authenticate with credentials
4. **Dashboard** → View metrics, map, and charts
5. **Alerts** → Monitor and manage all alerts
6. **Logout** → Sign out and return to landing

## Project Structure

\`\`\`
checkmyphc-insights/
├── app/
│   ├── layout.tsx                 # Root layout with Leaflet CSS
│   ├── globals.css                # Tailwind + design tokens
│   ├── page.tsx                   # Landing page
│   ├── login/page.tsx             # Login form
│   ├── signup/page.tsx            # Signup form
│   ├── dashboard/
│   │   ├── page.tsx               # Dashboard page (protected)
│   │   └── components/
│   │       ├── DashboardLayout.tsx      # Main dashboard shell
│   │       ├── MapView.tsx             # Leaflet map
│   │       ├── MetricCard.tsx          # KPI cards
│   │       ├── ChartCard.tsx           # Recharts
│   │       └── AlertsFeed.tsx          # Alert list
│   └── alerts/page.tsx            # Full alerts center (protected)
├── lib/
│   ├── mockData.ts                # PHC data + alert shapes
│   └── insightEngine.ts           # Detection + alert functions
└── public/
    └── [assets]
\`\`\`

## Key Files & Their Purpose

### `/lib/mockData.ts`
Defines PHC types and mock dataset. Replace with API calls to real FastAPI backend:

\`\`\`typescript
// Current: Local array
export const PHCS: PHC[] = [...]

// Future: API call
// export async function getPHCs() {
//   const res = await fetch('/api/phcs');
//   return res.json();
// }
\`\`\`

### `/lib/insightEngine.ts`
Outbreak detection, underserved ranking, and alert management. All functions are ready to swap for backend API calls:

\`\`\`typescript
// Current: Local logic
export function detectOutbreaks(thresholdPct = 30): OutbreakAlert[] { ... }

// Future: API call
// export async function detectOutbreaks() {
//   const res = await fetch('/api/outbreak-alerts');
//   return res.json();
// }
\`\`\`

### `/app/dashboard/components/MapView.tsx`
Interactive Leaflet map showing PHC locations with color-coded alerts. Marker colors indicate:
- **Red (#DC2626)**: Outbreak detected
- **Orange (#F59E0B)**: Underserved PHC (top 20%)
- **Green (#10B981)**: Normal status

### Authentication
- Signup stores user to `localStorage.users`
- Login validates and sets `localStorage.sessionUser`
- Protected pages check `sessionUser` and redirect to login if not found
- Logout clears `sessionUser`

**⚠️ Security Note**: This demo stores passwords in localStorage. For production, use proper authentication (JWT, OAuth, etc.) with secure backend storage.

## Real-time Simulation

The dashboard refreshes data every 10 seconds to simulate backend updates:

\`\`\`typescript
// In AlertsFeed.tsx and MapView.tsx
const interval = setInterval(() => {
  // Refresh alerts and markers
}, 10000);
\`\`\`

## Marker Colors & Logic

Markers prioritize alerts based on severity:

1. **Outbreak Alert** (30%+ case increase) → RED
2. **Underserved** (top 20% by infrastructure/inclusivity/service) → ORANGE
3. **Normal** → GREEN

Popup shows:
- PHC name and LGA
- Current vs. previous malaria cases
- Telecom strength (2G/3G/4G)
- "Send Alert" button to trigger outbreak notification

## Charts & Visualizations

- **Bar Chart**: Malaria cases by top PHCs
- **Line Chart**: Maternal visits trend
- **Pie Chart**: Drug stock distribution

All charts use Recharts and update with simulated data refresh.

## API Endpoints (for FastAPI Integration)

Replace local `lib/insightEngine.ts` functions with these endpoints:

\`\`\`
GET  /api/phcs                    # Get all PHCs
GET  /api/outbreak-alerts         # Detect outbreaks
GET  /api/underserved             # Rank underserved PHCs
GET  /api/alerts-feed             # Get all alerts
GET  /api/telecom-advice          # Get telecom recommendations
POST /api/send-alert              # Create alert
PATCH /api/alerts/:id/resolve     # Mark alert resolved
GET  /api/dashboard-metrics       # Get summary metrics
\`\`\`

## Mobile Responsiveness

- Landing page: Full-screen hero
- Dashboard: Single-column on mobile, multi-column on tablet/desktop
- Map: Full-width on all screens
- Alerts: Compact on mobile, full layout on desktop

## Testing the Demo

### Demo Credentials

Create a new account or use:
- Email: demo@example.com
- Password: demo123

### Features to Test

1. **Signup & Login**: Create account, verify localStorage, login
2. **Dashboard**: Check metrics, view map, interact with markers
3. **Send Alert**: Click map marker popup "Send Alert" button
4. **Alerts Page**: View all alerts, filter by status, mark resolved
5. **Real-time Updates**: Wait 10s to see map/alert changes
6. **Logout**: Clear session and redirect to login

## Performance Notes

- **Leaflet Map**: Optimized with `dynamic(() => import(...), { ssr: false })`
- **Charts**: Lazy-loaded on dashboard
- **Marker Clustering**: Can be added with `react-leaflet-markercluster` for 50+ markers
- **Max Zoom**: Limited to 12 for performance

## Known Limitations

- Passwords stored in plain text (localStorage demo only)
- No real database persistence
- Markers reload on every data refresh (can optimize with state management)
- No export/reporting features yet

## Future Enhancements

- [ ] Real FastAPI backend integration
- [ ] User roles (admin, health worker, supervisor)
- [ ] Map marker clustering
- [ ] Historical data charts
- [ ] Export reports (PDF/CSV)
- [ ] SMS/WhatsApp notifications (via telecom advice)
- [ ] Data caching with SWR
- [ ] Dark mode toggle

## Deployment

### Deploy to Vercel

\`\`\`bash
vercel
\`\`\`

### Environment Variables

None required for demo mode. For production:

\`\`\`env
NEXT_PUBLIC_API_URL=https://your-fastapi-backend.com
DATABASE_URL=your-db-url
\`\`\`

## Development Tips

- **Edit mock data**: `/lib/mockData.ts`
- **Adjust detection logic**: `/lib/insightEngine.ts`
- **Customize styling**: `/app/globals.css` (design tokens)
- **Add new pages**: Create in `/app/[route]/page.tsx`
- **Add components**: Create in `/app/[route]/components/`

## Troubleshooting

### Map not rendering?
- Ensure Leaflet CSS is linked in `app/layout.tsx`
- Check browser console for errors
- Verify MapView component is dynamically imported with `ssr: false`

### Alerts not updating?
- Check localStorage for alerts
- Verify interval is running (check Network tab)
- Clear cache and hard refresh

### Login not working?
- Verify user exists in `localStorage.users`
- Check email/password match exactly
- Open DevTools → Application → Local Storage

## License

Hackathon Demo - 2025

## Support

For issues or questions, check the code comments or reach out to the development team.
