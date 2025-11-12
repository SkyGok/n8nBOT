# n8n Phone Analytics Dashboard

A React + TypeScript + Vite frontend dashboard for an n8n AI agent phone analytics system.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account (free tier works)

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a Supabase project at https://app.supabase.com
   - Create database tables using your SQL schema
   - Get your API credentials (Project URL and anon key)

3. **Configure environment variables:**
   Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_USE_SUPABASE=true
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### 📖 Full Setup Guide

For detailed step-by-step instructions, see:
- **[QUICK_START.md](./QUICK_START.md)** - Complete setup and deployment guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Detailed deployment instructions
- **[DATABASE_REQUIREMENTS.md](./DATABASE_REQUIREMENTS.md)** - Database schema and data requirements

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

### Run Tests

```bash
npm test
```

With UI:
```bash
npm run test:ui
```

With coverage:
```bash
npm run test:coverage
```

## 📁 Project Structure

```
n8nBOT/
├── public/
│   └── mockServiceWorker.js       # MSW service worker (generated)
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── SummaryCards.tsx   # Summary metrics cards
│   │   │   ├── TimeseriesChart.tsx # Time series chart widget
│   │   │   ├── EventsTable.tsx     # Phone events table
│   │   │   └── SummaryCards.test.tsx # Unit test example
│   │   └── Layout/
│   │       ├── Header.tsx          # App header
│   │       ├── Sidebar.tsx         # Navigation sidebar
│   │       └── MainLayout.tsx      # Main layout wrapper
│   ├── hooks/
│   │   └── useDashboardData.ts     # Data fetching hooks
│   ├── mocks/
│   │   ├── browser.ts              # MSW browser setup
│   │   ├── handlers.ts             # MSW request handlers
│   │   └── mockData.ts             # Mock data generators
│   ├── pages/
│   │   └── Dashboard.tsx           # Main dashboard page
│   ├── store/
│   │   └── useDashboardStore.ts    # Zustand state management
│   ├── test/
│   │   └── setup.ts                # Test configuration
│   ├── types/
│   │   └── api.ts                  # API contract types
│   ├── App.tsx                     # Root component with routing
│   ├── main.tsx                    # Application entry point
│   └── index.css                   # Global styles (Tailwind)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🔌 Data Integration

### Supabase Integration (Recommended)

The application is configured to use Supabase as the primary data source. It automatically falls back to mock data if Supabase is not configured.

**Setup:**
1. Create a Supabase project
2. Run your SQL schema to create tables
3. Set environment variables (see Quick Start above)
4. The app will automatically connect to Supabase

### Mock Data (Fallback)

If Supabase is not configured, the application uses MSW (Mock Service Worker) to intercept API requests and return mock data. This allows development without a backend.

### Integrating Real n8n Endpoints

Follow these steps to replace mock data with real n8n API calls:

#### Step 1: Update API Base URL

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=https://your-n8n-instance.com/api
```

Or if using n8n webhooks:

```env
VITE_API_BASE_URL=https://your-n8n-instance.com/webhook
```

#### Step 2: Update API Endpoints

Edit `src/hooks/useDashboardData.ts` and update the `API_BASE_URL`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

#### Step 3: Match n8n Response Format

Ensure your n8n workflows return data in the format defined in `src/types/api.ts`:

- **Summary Stats** (`/api/summary`):
  ```json
  {
    "success": true,
    "data": {
      "totalCalls": 1247,
      "answeredCalls": 892,
      "missedCalls": 355,
      "averageDuration": 187,
      "totalDuration": 166804,
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  }
  ```

- **Time Series** (`/api/timeseries?metric=calls&period=hour`):
  ```json
  {
    "success": true,
    "data": {
      "data": [
        { "timestamp": "2024-01-15T10:00:00Z", "value": 15 }
      ],
      "metric": "calls",
      "period": "hour",
      "startDate": "2024-01-08T10:00:00Z",
      "endDate": "2024-01-15T10:00:00Z"
    }
  }
  ```

- **Events** (`/api/events?page=1&pageSize=50`):
  ```json
  {
    "success": true,
    "data": {
      "events": [
        {
          "id": "event-1",
          "phoneNumber": "+1234567890",
          "direction": "inbound",
          "status": "answered",
          "duration": 180,
          "timestamp": "2024-01-15T10:00:00Z",
          "contactName": "John Doe",
          "notes": "Important call"
        }
      ],
      "total": 50,
      "page": 1,
      "pageSize": 50,
      "hasMore": false
    }
  }
  ```

#### Step 4: Disable MSW in Production

MSW is automatically disabled in production builds. For development, you can disable it by:

1. Commenting out the MSW initialization in `src/main.tsx`:
   ```typescript
   // const { worker } = await import('./mocks/browser');
   // return worker.start();
   ```

2. Or set environment variable:
   ```env
   VITE_DISABLE_MSW=true
   ```

#### Step 5: Handle CORS (if needed)

If your n8n instance is on a different domain, configure CORS in n8n or use a proxy in `vite.config.ts`:

```typescript
export default defineConfig({
  // ... existing config
  server: {
    proxy: {
      '/api': {
        target: 'https://your-n8n-instance.com',
        changeOrigin: true,
      },
    },
  },
});
```

#### Step 6: Error Handling

The hooks already handle errors. Ensure your n8n workflows return error responses in this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## 🎨 Features

- ✅ **Summary Cards**: Key metrics (total calls, answered, missed, avg duration)
- ✅ **Time Series Chart**: Call volume over time (using Recharts)
- ✅ **Events Table**: Recent phone events with filtering and pagination
- ✅ **State Management**: Zustand for global state
- ✅ **Data Fetching**: Custom hooks with loading/error states
- ✅ **Mock Data**: MSW for development without backend
- ✅ **Responsive Design**: Mobile-friendly with Tailwind CSS
- ✅ **Accessibility**: ARIA labels, semantic HTML, keyboard navigation
- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **Testing**: Unit test example with Vitest

## ♿ Accessibility Features

- Semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<aside>`)
- ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Screen reader friendly
- Color contrast compliance

## 🔧 Configuration

### Tailwind CSS

Custom colors and utilities are defined in `tailwind.config.js`. The primary color scheme uses blue tones.

### TypeScript

Strict mode enabled. Path aliases configured (`@/*` maps to `src/*`).

### Vite

React plugin configured. Path aliases match TypeScript config.

## 📝 Improvement Tasks

### Priority 1: High Impact, Low Complexity

1. **Add Refresh Button** (Low)
   - Add manual refresh button to dashboard
   - Implement refresh functionality in hooks
   - Add loading indicator during refresh

2. **Real-time Updates** (Medium)
   - Implement WebSocket connection to n8n
   - Auto-refresh data every 30 seconds
   - Show "live" indicator when connected

### Priority 2: High Impact, Medium Complexity

3. **Advanced Filtering** (Medium)
   - Add date range picker for events table
   - Add search by phone number/contact name
   - Save filter preferences in localStorage

4. **Export Functionality** (Medium)
   - Export events table to CSV
   - Export chart data to JSON
   - Add print-friendly view

### Priority 3: Medium Impact, High Complexity

5. **Multiple Chart Types** (High)
   - Add chart type selector (line, bar, area)
   - Add metric selector (calls, duration, answer rate)
   - Add period selector (hour, day, week, month)
   - Implement chart comparison mode

6. **User Preferences & Settings** (High)
   - User dashboard customization
   - Widget visibility toggles
   - Theme switcher (light/dark mode)
   - Save preferences to backend/localStorage

## 🐛 Troubleshooting

### MSW not working

1. Ensure `public/mockServiceWorker.js` exists (run `npx msw init public/ --save`)
2. Check browser console for MSW initialization messages
3. Verify you're in development mode (`npm run dev`)

### Build errors

1. Run `npm install` to ensure all dependencies are installed
2. Check TypeScript errors: `npx tsc --noEmit`
3. Check ESLint errors: `npm run lint`

### API calls failing

1. Check network tab in browser DevTools
2. Verify API base URL in `.env` file
3. Check CORS settings if calling external API
4. Verify n8n workflow is active and accessible

## 📄 License

MIT

## 🤝 Contributing

This is a frontend-only project. For backend integration, refer to the n8n workflow documentation.

