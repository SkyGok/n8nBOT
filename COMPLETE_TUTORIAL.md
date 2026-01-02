# Complete Tutorial: n8n Phone Analytics Dashboard
## A Beginner's Guide to Understanding the Dashboard and Backend

---

## 📚 Table of Contents

1. [What is This System?](#what-is-this-system)
2. [System Architecture Overview](#system-architecture-overview)
3. [Frontend (Dashboard) Tutorial](#frontend-dashboard-tutorial)
4. [Backend (Supabase) Tutorial](#backend-supabase-tutorial)
5. [How Frontend and Backend Work Together](#how-frontend-and-backend-work-together)
6. [Key Concepts Explained](#key-concepts-explained)
7. [Common Workflows](#common-workflows)
8. [Troubleshooting Guide](#troubleshooting-guide)

---

## What is This System?

This is a **multi-tenant analytics dashboard** for managing AI-powered phone systems built with n8n. Think of it as a control panel where businesses can:

- **Track phone calls**: See inbound/outbound calls, missed calls, call duration
- **Manage appointments**: Schedule and track appointments made via AI agents
- **Monitor WhatsApp conversations**: View and manage WhatsApp messages
- **View analytics**: See charts, metrics, and insights about their business
- **Manage multiple businesses**: Support multiple "tenants" (like different spa locations or car dealerships) in one system

### Real-World Example
Imagine you run a spa business with multiple locations. Each location is a "tenant" in this system. The dashboard lets you:
- See how many calls each location received today
- Track appointments booked by your AI phone agent
- Monitor WhatsApp conversations with customers
- View revenue and engagement metrics

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         React Dashboard (Frontend)                   │   │
│  │  - Pages (Dashboard, Analytics, WhatsApp, etc.)     │   │
│  │  - Components (Charts, Tables, Forms)                │   │
│  │  - Contexts (Tenant, Theme, i18n)                   │   │
│  │  - Services (Database, Calendar, n8n)                │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS Requests
                        │ (Supabase JS Client)
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              SUPABASE (Backend)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                 │   │
│  │  - Tables: calls, appointments, whatsapp_messages    │   │
│  │  - Row Level Security (RLS) for tenant isolation   │   │
│  │  - Functions: get_user_tenant_id()                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Supabase Auth                                        │   │
│  │  - User authentication                                │   │
│  │  - Session management                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Webhooks/API Calls
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              n8n Workflows (External)                       │
│  - AI Phone Agent                                           │
│  - WhatsApp Integration                                     │
│  - Calendar Sync                                             │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation
- **Recharts** - Charts and graphs
- **Supabase JS Client** - Database client

**Backend:**
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Real-time subscriptions (optional)

**External:**
- **n8n** - Workflow automation (AI agents, integrations)

---

## Frontend (Dashboard) Tutorial

### Project Structure

```
src/
├── main.tsx                 # Entry point - initializes React app
├── App.tsx                  # Root component - sets up routing
├── index.css                # Global styles (Tailwind)
│
├── pages/                   # Page components (screens)
│   ├── Dashboard.tsx        # Main dashboard page
│   ├── Analytics.tsx        # Analytics page
│   ├── WhatsApp/
│   │   └── WhatsAppPage.tsx # WhatsApp conversations
│   ├── Calls/
│   │   └── CallsPage.tsx    # Call history
│   ├── Calendar/
│   │   └── CalendarPage.tsx # Calendar view
│   ├── Settings/
│   │   └── SettingsPage.tsx  # User settings
│   └── Auth/
│       └── Login.tsx        # Login page
│
├── components/               # Reusable UI components
│   ├── Dashboard/           # Dashboard-specific components
│   │   ├── SummaryCards.tsx  # Metric cards
│   │   ├── TimeseriesChart.tsx
│   │   └── EventsTable.tsx
│   ├── Layout/               # Layout components
│   │   ├── Header.tsx        # Top navigation
│   │   ├── Sidebar.tsx       # Side navigation
│   │   └── MainLayout.tsx    # Wrapper layout
│   └── Auth/                # Auth components
│       ├── ProtectedRoute.tsx
│       ├── AdminRoute.tsx
│       └── TenantRoute.tsx
│
├── contexts/                # React Context providers
│   ├── TenantContext.tsx     # Tenant management
│   ├── ThemeContext.tsx     # Dark/light theme
│   └── I18nContext.tsx      # Internationalization
│
├── services/                # Business logic / API calls
│   ├── database.ts          # Supabase queries
│   ├── calendar.ts           # Calendar operations
│   ├── n8n.ts               # n8n webhook calls
│   └── settings.ts          # Settings management
│
├── hooks/                   # Custom React hooks
│   └── useDashboardData.ts  # Data fetching hooks
│
├── store/                   # Global state (Zustand)
│   └── useDashboardStore.ts
│
├── types/                   # TypeScript type definitions
│   ├── api.ts               # API response types
│   ├── calendar.ts
│   └── settings.ts
│
└── lib/                     # Library configurations
    ├── supabase.ts          # Supabase client setup
    └── i18n.ts              # Translation setup
```

### How the Frontend Works

#### 1. Application Entry Point (`main.tsx`)

```typescript
// This is the first file that runs
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize theme before rendering
initializeTheme();

// Start the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**What happens:**
1. React mounts the app to the DOM
2. Theme is initialized (dark/light mode)
3. App component is rendered

#### 2. Root Component (`App.tsx`)

```typescript
function App() {
  return (
    <ThemeProvider>        {/* Provides theme context */}
      <I18nProvider>       {/* Provides translation context */}
        <TenantProvider>   {/* Provides tenant context */}
          <BrowserRouter> {/* Provides routing */}
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<ProtectedRoute>...</ProtectedRoute>} />
              {/* More routes... */}
            </Routes>
          </BrowserRouter>
        </TenantProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
```

**What happens:**
1. **Context Providers** wrap the app to provide global state:
   - `ThemeProvider` - Dark/light mode
   - `I18nProvider` - Language translations
   - `TenantProvider` - Current tenant and user permissions
2. **BrowserRouter** enables navigation between pages
3. **Routes** define which component to show for each URL path

#### 3. Authentication Flow

**Step 1: User visits `/login`**
```typescript
// User enters email and password
// Clicks "Sign in" button
```

**Step 2: Login Page (`Login.tsx`)**
```typescript
async function handleLogin(e: React.FormEvent) {
  // 1. Validate input
  // 2. Call Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  // 3. Verify user exists in public.users table
  // 4. Check user is assigned to a tenant
  // 5. Redirect to dashboard
  navigate('/dashboard');
}
```

**Step 3: Protected Route (`ProtectedRoute.tsx`)**
```typescript
export function ProtectedRoute({ children }) {
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Redirect to login
    return <Navigate to="/login" />;
  }
  
  // Check if tenant is loaded
  const { tenant, loading } = useTenant();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!tenant) {
    return <Error>No tenant assigned</Error>;
  }
  
  // User is authenticated and has tenant - show the page
  return children;
}
```

#### 4. Tenant Context (`TenantContext.tsx`)

This is the **heart of multi-tenancy**. It manages:

```typescript
// What TenantContext provides:
{
  tenant: { id, name, supabaseUrl, ... },  // Current tenant
  tenantSupabase: SupabaseClient,          // Tenant-scoped database client
  loading: boolean,                        // Is tenant loading?
  error: string | null,                    // Any errors?
  isAdmin: boolean,                        // Is user an admin?
  isOwner: boolean,                        // Is user an owner?
  userRole: string,                        // Current user's role
  tenantName: string,                      // Current tenant name
  switchTenant: (id) => void,              // Switch to different tenant
}
```

**How it works:**
1. After login, `TenantContext` automatically loads the user's tenant
2. It queries `tenant_users` table to find which tenant(s) the user belongs to
3. It creates a tenant-specific Supabase client (for RLS to work)
4. All database queries use this tenant client, ensuring data isolation

#### 5. Data Fetching (`useDashboardData.ts`)

```typescript
// Custom hook to fetch summary statistics
export function useSummaryStats() {
  const { tenant } = useTenant();  // Get current tenant
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Only fetch if tenant is loaded
    if (!tenant?.id) return;
    
    // Call service function
    const stats = await fetchSummaryStats();
    setData(stats);
  }, [tenant?.id]);  // Re-fetch when tenant changes
  
  return { data, loading, error };
}
```

**Usage in a component:**
```typescript
function Dashboard() {
  const { summaryStats, isLoading } = useSummaryStats();
  
  return (
    <div>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <MetricCard value={summaryStats?.totalCalls} />
      )}
    </div>
  );
}
```

#### 6. Service Layer (`services/database.ts`)

This is where **actual database queries** happen:

```typescript
export async function fetchSummaryStats() {
  // Get tenant-scoped Supabase client
  const supabase = getTenantSupabase();
  
  // Query calls table (RLS automatically filters by tenant)
  const { data: calls, error } = await supabase
    .from('calls')
    .select('status, duration_seconds, timestamp');
  
  // Calculate statistics
  const totalCalls = calls.length;
  const answeredCalls = calls.filter(c => c.status === 'answered').length;
  // ...
  
  return {
    totalCalls,
    answeredCalls,
    missedCalls,
    averageDuration,
    // ...
  };
}
```

**Key point:** `getTenantSupabase()` returns a client that automatically filters data by tenant using Row Level Security (RLS).

### Frontend Development Workflow

1. **Start development server:**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:5173`

2. **Create a new page:**
   - Add component in `src/pages/`
   - Add route in `src/App.tsx`
   - Wrap with `<ProtectedRoute>` if it needs authentication

3. **Create a new component:**
   - Add to `src/components/`
   - Import and use in pages

4. **Fetch data:**
   - Create service function in `src/services/`
   - Create hook in `src/hooks/`
   - Use hook in component

5. **Build for production:**
   ```bash
   npm run build
   ```
   Creates `dist/` folder with optimized files

---

## Backend (Supabase) Tutorial

### What is Supabase?

Supabase is a **Backend-as-a-Service** (BaaS) that provides:
- **PostgreSQL database** - SQL database
- **Authentication** - User login/signup
- **Row Level Security** - Automatic data filtering
- **Real-time subscriptions** - Live data updates (optional)
- **Storage** - File uploads (not used in this project)

### Database Schema

#### Core Tables

**1. `users` table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,           -- Matches auth.users.id
  email TEXT,
  full_name TEXT,
  role TEXT,                     -- 'admin', 'owner', 'member', 'viewer'
  created_at TIMESTAMPTZ
);
```
- Stores user profile information
- Linked to Supabase Auth (`auth.users`)

**2. `tenants` table**
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,            -- 'Spa', 'Dentist', 'Car Dealership'
  subdomain TEXT,                -- Optional: for subdomain routing
  supabase_url TEXT,             -- Tenant-specific Supabase URL (if separate)
  supabase_anon_key TEXT,        -- Tenant-specific key
  n8n_webhook_base_url TEXT,     -- n8n webhook URL for this tenant
  status TEXT,                   -- 'active', 'suspended', 'trial'
  config JSONB,                  -- Additional settings
  created_at TIMESTAMPTZ
);
```
- Each business/organization is a tenant
- Stores tenant-specific configuration

**3. `tenant_users` table**
```sql
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  role TEXT,                     -- 'owner', 'admin', 'member', 'viewer'
  created_at TIMESTAMPTZ,
  UNIQUE(tenant_id, user_id)     -- User can only have one role per tenant
);
```
- **Many-to-many relationship** between users and tenants
- A user can belong to multiple tenants
- Each membership has a role

**4. Data Tables (all have `tenant_id`)**

```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),  -- ⭐ Tenant isolation
  phone_number TEXT,
  direction TEXT,                         -- 'inbound' or 'outbound'
  status TEXT,                            -- 'answered', 'missed', 'voicemail'
  duration_seconds INTEGER,
  timestamp TIMESTAMPTZ,
  contact_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),  -- ⭐ Tenant isolation
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  service_type TEXT,
  therapist_name TEXT,
  appointment_datetime TIMESTAMPTZ,
  status TEXT,                            -- 'Confirmed', 'Cancelled'
  calendar_event_id UUID,                 -- Links to Google Calendar
  created_at TIMESTAMPTZ
);

CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),  -- ⭐ Tenant isolation
  conversation_id TEXT,
  phone_number TEXT,
  direction TEXT,                         -- 'inbound' or 'outbound'
  message_type TEXT,                      -- 'text', 'image', 'video'
  content TEXT,
  timestamp TIMESTAMPTZ,
  status TEXT,                            -- 'sent', 'delivered', 'read'
  created_at TIMESTAMPTZ
);
```

**Key point:** Every data table has `tenant_id` to ensure data isolation.

### Row Level Security (RLS)

RLS is **PostgreSQL's built-in security feature** that automatically filters rows based on policies.

#### How RLS Works

1. **Enable RLS on a table:**
   ```sql
   ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
   ```

2. **Create a policy:**
   ```sql
   CREATE POLICY "Users can view their tenant's calls"
   ON calls
   FOR SELECT
   USING (
     tenant_id IN (
       SELECT tenant_id FROM tenant_users 
       WHERE user_id = auth.uid()
     )
   );
   ```

3. **What happens:**
   - When a user queries `SELECT * FROM calls`
   - PostgreSQL automatically adds `WHERE tenant_id IN (...)` 
   - User only sees rows where `tenant_id` matches their tenant(s)

#### Helper Functions

```sql
-- Get current user's primary tenant_id
CREATE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM tenant_users 
  WHERE user_id = auth.uid() 
  ORDER BY created_at ASC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user belongs to a tenant
CREATE FUNCTION user_belongs_to_tenant(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_users 
    WHERE user_id = auth.uid() 
    AND tenant_id = check_tenant_id
  );
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

**Usage in policies:**
```sql
CREATE POLICY "Users can view their tenant's calls"
ON calls FOR SELECT
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(tenant_id)
);
```

### Database Setup Steps

1. **Create Supabase project:**
   - Go to https://app.supabase.com
   - Create new project
   - Wait for database to initialize

2. **Run SQL migrations in order:**
   ```sql
   -- 1. Base schema
   COMPLETE_DATABASE_SCHEMA.sql
   
   -- 2. Multi-tenant setup
   MULTI_TENANT_SCHEMA.sql
   
   -- 3. Data migration (if you have existing data)
   MIGRATE_TO_MULTI_TENANT.sql
   
   -- 4. Final optimizations
   FINAL_MULTI_TENANT_MIGRATION.sql
   ```

3. **Set up authentication:**
   - Go to Authentication > Settings
   - Enable email authentication
   - Configure email templates (optional)

4. **Create test users:**
   ```sql
   -- Insert into auth.users (via Supabase dashboard or API)
   -- Then sync to public.users
   INSERT INTO users (id, email, full_name, role)
   VALUES ('user-uuid', 'user@example.com', 'John Doe', 'member');
   
   -- Assign to tenant
   INSERT INTO tenant_users (tenant_id, user_id, role)
   VALUES ('tenant-uuid', 'user-uuid', 'owner');
   ```

### Backend Development Workflow

1. **Make schema changes:**
   - Edit SQL files
   - Run in Supabase SQL Editor
   - Test queries

2. **Add new table:**
   ```sql
   CREATE TABLE my_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id UUID REFERENCES tenants(id),
     -- other columns...
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- Enable RLS
   ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
   
   -- Create policies
   CREATE POLICY "Users can view their tenant's my_table"
   ON my_table FOR SELECT
   USING (user_belongs_to_tenant(tenant_id));
   ```

3. **Add new function:**
   ```sql
   CREATE OR REPLACE FUNCTION my_function(param TEXT)
   RETURNS TABLE(...) AS $$
   BEGIN
     -- Function logic
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

---

## How Frontend and Backend Work Together

### Complete Data Flow Example

**Scenario:** User opens dashboard and sees call statistics

#### Step 1: User Authentication
```
Browser → Login Page → Supabase Auth API
  ↓
User enters email/password
  ↓
Supabase validates credentials
  ↓
Returns JWT token (stored in browser)
```

#### Step 2: Tenant Loading
```
TenantContext → Supabase Database
  ↓
Query: SELECT * FROM tenant_users WHERE user_id = auth.uid()
  ↓
Returns: [{ tenant_id: 'spa-123', role: 'owner' }]
  ↓
Query: SELECT * FROM tenants WHERE id = 'spa-123'
  ↓
Returns: { id: 'spa-123', name: 'Spa', ... }
  ↓
TenantContext creates tenant-specific Supabase client
```

#### Step 3: Data Fetching
```
Dashboard Component → useSummaryStats() hook
  ↓
Hook calls: fetchSummaryStats() service
  ↓
Service uses: getTenantSupabase() (tenant-scoped client)
  ↓
Query: SELECT * FROM calls
  ↓
PostgreSQL RLS automatically adds: WHERE tenant_id = 'spa-123'
  ↓
Returns: Only calls for 'Spa' tenant
  ↓
Service calculates statistics
  ↓
Hook updates state
  ↓
Component re-renders with data
```

### Authentication Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. POST /auth/v1/token
       │    { email, password }
       ▼
┌─────────────────┐
│ Supabase Auth   │
│ (auth.users)    │
└──────┬──────────┘
       │
       │ 2. Returns JWT token
       │    { access_token, user: { id, email } }
       ▼
┌─────────────┐
│   Browser   │
│ (stores JWT)│
└──────┬──────┘
       │
       │ 3. All subsequent requests include JWT in header
       │    Authorization: Bearer <token>
       ▼
┌─────────────────┐
│ Supabase Client │
│ (with JWT)      │
└──────┬──────────┘
       │
       │ 4. Query database
       │    SELECT * FROM calls
       ▼
┌─────────────────┐
│ PostgreSQL      │
│ (with RLS)      │
└─────────────────┘
       │
       │ 5. RLS checks: Does user belong to tenant?
       │    SELECT tenant_id FROM tenant_users 
       │    WHERE user_id = auth.uid()
       │
       │ 6. Returns filtered data
       │    Only rows where tenant_id matches
```

### Multi-Tenant Isolation

**How data is isolated:**

1. **User belongs to Tenant A:**
   ```sql
   -- User queries calls
   SELECT * FROM calls;
   
   -- RLS automatically filters to:
   SELECT * FROM calls 
   WHERE tenant_id IN (
     SELECT tenant_id FROM tenant_users 
     WHERE user_id = 'user-123'
   );
   -- Returns only Tenant A's calls
   ```

2. **User belongs to Tenant A and B (admin):**
   ```sql
   -- User queries calls
   SELECT * FROM calls;
   
   -- RLS automatically filters to:
   SELECT * FROM calls 
   WHERE tenant_id IN ('tenant-a', 'tenant-b');
   -- Returns calls from both tenants
   ```

3. **User tries to access Tenant C (not assigned):**
   ```sql
   -- User queries calls
   SELECT * FROM calls;
   
   -- RLS automatically filters to:
   SELECT * FROM calls 
   WHERE tenant_id IN ();  -- Empty!
   -- Returns no rows (data is isolated)
   ```

---

## Key Concepts Explained

### 1. Multi-Tenancy

**What it means:** One application serves multiple independent organizations (tenants).

**Example:**
- Tenant A: "Downtown Spa" - has its own calls, appointments, customers
- Tenant B: "Uptown Dentist" - has its own calls, appointments, customers
- They never see each other's data

**How it works:**
- Every data row has `tenant_id`
- RLS policies filter by `tenant_id`
- Users are assigned to tenants via `tenant_users` table

### 2. Row Level Security (RLS)

**What it means:** Database automatically filters rows based on who's querying.

**Without RLS:**
```sql
-- User queries:
SELECT * FROM calls;
-- Returns ALL calls from ALL tenants (security risk!)
```

**With RLS:**
```sql
-- User queries:
SELECT * FROM calls;
-- Database automatically adds:
WHERE tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
-- Returns only user's tenant's calls (secure!)
```

**Benefits:**
- Security at database level (can't bypass)
- Automatic filtering (no manual WHERE clauses needed)
- Prevents data leaks

### 3. Tenant Context

**What it means:** React Context that manages current tenant state.

**Provides:**
- Current tenant information
- Tenant-specific Supabase client
- User role and permissions
- Tenant switching functionality

**Why it's needed:**
- All database queries need to know which tenant
- RLS uses `auth.uid()` but we also need tenant context for UI
- Allows switching between tenants (for admins)

### 4. Service Layer Pattern

**What it means:** Business logic separated from UI components.

**Structure:**
```
Component (UI)
  ↓ calls
Hook (data fetching)
  ↓ calls
Service (business logic)
  ↓ calls
Database (Supabase)
```

**Benefits:**
- Reusable logic (multiple components can use same service)
- Easier testing (test services independently)
- Clear separation of concerns

### 5. Protected Routes

**What it means:** Routes that require authentication.

**How it works:**
```typescript
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

**ProtectedRoute checks:**
1. Is user authenticated? → Redirect to login if not
2. Is tenant loaded? → Show loading if not
3. Does user have tenant? → Show error if not
4. All good? → Render the page

---

## Common Workflows

### Workflow 1: New User Registration

1. **Create user in Supabase Auth:**
   ```typescript
   const { data } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'password123',
   });
   ```

2. **Sync to public.users table:**
   ```sql
   INSERT INTO users (id, email, full_name)
   VALUES (auth_user_id, 'user@example.com', 'John Doe');
   ```

3. **Assign to tenant:**
   ```sql
   INSERT INTO tenant_users (tenant_id, user_id, role)
   VALUES ('tenant-uuid', 'user-uuid', 'member');
   ```

4. **User can now log in and see their tenant's data**

### Workflow 2: Adding a New Tenant

1. **Create tenant:**
   ```sql
   INSERT INTO tenants (name, n8n_webhook_base_url, status)
   VALUES ('New Business', 'https://n8n.example.com/webhook/new', 'active');
   ```

2. **Assign users:**
   ```sql
   INSERT INTO tenant_users (tenant_id, user_id, role)
   VALUES ('new-tenant-uuid', 'user-uuid', 'owner');
   ```

3. **Tenant is ready!** Users assigned to it will see it in their dashboard

### Workflow 3: Creating a New Call Record

1. **n8n workflow receives phone call**
2. **n8n calls Supabase API:**
   ```typescript
   await supabase
     .from('calls')
     .insert({
       phone_number: '+1234567890',
       direction: 'inbound',
       status: 'answered',
       duration_seconds: 180,
       timestamp: new Date().toISOString(),
       // tenant_id is auto-set by trigger or RLS
     });
   ```

3. **Database trigger sets tenant_id:**
   ```sql
   -- Trigger automatically sets tenant_id from user's tenant
   NEW.tenant_id := get_user_tenant_id();
   ```

4. **RLS ensures data is isolated to correct tenant**
5. **Dashboard automatically shows new call** (if using real-time subscriptions)

### Workflow 4: User Switching Tenants (Admin)

1. **Admin clicks "Switch Tenant" in UI**
2. **Frontend calls:**
   ```typescript
   await switchTenant('new-tenant-id');
   ```

3. **TenantContext loads new tenant:**
   ```typescript
   // Queries tenant_users to verify admin has access
   // Creates new tenant-specific Supabase client
   ```

4. **All subsequent queries use new tenant's data**
5. **Dashboard refreshes with new tenant's data**

---

## Troubleshooting Guide

### Problem: "User not assigned to any tenant"

**Cause:** User exists in `auth.users` but not in `tenant_users` table.

**Solution:**
```sql
-- Check if user exists
SELECT * FROM users WHERE email = 'user@example.com';

-- Check tenant assignment
SELECT * FROM tenant_users WHERE user_id = 'user-uuid';

-- If missing, assign to tenant
INSERT INTO tenant_users (tenant_id, user_id, role)
VALUES ('tenant-uuid', 'user-uuid', 'member');
```

### Problem: "RLS blocking all queries"

**Cause:** RLS policies not set up correctly or `get_user_tenant_id()` returning NULL.

**Solution:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'calls';

-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'calls';

-- Test get_user_tenant_id() function
SELECT get_user_tenant_id();

-- If NULL, check tenant_users table
SELECT * FROM tenant_users WHERE user_id = auth.uid();
```

### Problem: "Can't see any data after login"

**Possible causes:**
1. **No data in database** - Check if calls/appointments exist
2. **Wrong tenant_id** - Data might belong to different tenant
3. **RLS too restrictive** - Policies might be blocking access

**Solution:**
```sql
-- Check if data exists
SELECT COUNT(*) FROM calls;

-- Check tenant_id of data
SELECT tenant_id, COUNT(*) 
FROM calls 
GROUP BY tenant_id;

-- Check user's tenant
SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid();

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'calls';
```

### Problem: "Supabase connection failed"

**Cause:** Missing or incorrect environment variables.

**Solution:**
1. Check `.env` file exists in project root
2. Verify variables:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_USE_SUPABASE=true
   ```
3. Restart dev server after changing `.env`

### Problem: "TypeScript errors"

**Cause:** Type definitions out of sync with database.

**Solution:**
1. Update `src/lib/supabase.ts` Database interface
2. Or generate types from Supabase:
   ```bash
   npx supabase gen types typescript --project-id your-project-id > src/types/database.ts
   ```

### Problem: "Build fails"

**Common causes:**
- TypeScript errors
- Missing dependencies
- Environment variables not set

**Solution:**
```bash
# Install dependencies
npm install

# Check TypeScript errors
npm run build

# Check for linting errors
npm run lint

# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## Quick Reference

### Frontend Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run linter
npm run lint
```

### Backend SQL Queries

```sql
-- Check user's tenants
SELECT t.name, tu.role 
FROM tenant_users tu
JOIN tenants t ON t.id = tu.tenant_id
WHERE tu.user_id = auth.uid();

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public';

-- Test tenant isolation
SELECT COUNT(*) FROM calls;  -- Should only return user's tenant's calls
```

### Environment Variables

```env
# Required for Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_USE_SUPABASE=true

# Optional
VITE_DEBUG=true              # Enable debug logging
VITE_DISABLE_MSW=true        # Disable mock service worker
```

---

## Next Steps

1. **Read the code:**
   - Start with `src/App.tsx` to understand routing
   - Read `src/contexts/TenantContext.tsx` to understand multi-tenancy
   - Check `src/services/database.ts` to see how data is fetched

2. **Set up your environment:**
   - Create Supabase project
   - Run SQL migrations
   - Configure `.env` file
   - Start dev server

3. **Experiment:**
   - Create a new page
   - Add a new database table
   - Create a new service function
   - Test tenant isolation

4. **Learn more:**
   - [Supabase Documentation](https://supabase.com/docs)
   - [React Documentation](https://react.dev)
   - [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Summary

This system is a **multi-tenant analytics dashboard** that:

- **Frontend (React):** Provides UI for viewing and managing data
- **Backend (Supabase):** Stores data securely with automatic tenant isolation
- **Multi-tenancy:** One system serves multiple independent organizations
- **RLS:** Database-level security ensures data isolation
- **Authentication:** Supabase Auth handles user login/sessions

The key to understanding it is:
1. **Users** belong to **Tenants** via `tenant_users` table
2. **Data** belongs to **Tenants** via `tenant_id` column
3. **RLS** automatically filters data by tenant
4. **Frontend** uses tenant context to know which tenant is active
5. **Services** use tenant-scoped Supabase client for queries

Happy coding! 🚀
