# Website Features & Data Requirements

Complete documentation of all features and data needed for the n8n Phone Analytics Dashboard.

## 🎯 Website Features

### 1. **Responsive Layout**
- ✅ Toggleable sidebar navigation (mobile drawer, desktop sidebar)
- ✅ Sticky header with menu button
- ✅ Mobile-first responsive design
- ✅ Touch-friendly interactions (44px minimum touch targets)

### 2. **Main Dashboard Page** (`/`)
- ✅ Welcome header with personalized greeting
- ✅ **4 Key Metric Cards:**
  - Total Calls (green card)
  - Answered Calls (yellow card)
  - Appointments (blue card)
  - Missed Calls (red card)
  - Each shows: value, percentage change, weekly change
- ✅ **Call Stats Chart:** Line chart showing monthly call volume (Jan-Dec)
- ✅ **Calls by Status Chart:** Donut chart showing distribution (Answered/Missed/Other)
- ✅ Period selector dropdowns on charts

### 3. **Analytics Page** (`/analytics`)
- ✅ **Call Performance Summary:** Two pie charts
  - Customer Coverage (Called vs Not Called)
  - Call Success Rate (Successful vs Failed)
- ✅ **Time Series Chart:** Call volume over time with period selection

### 4. **WhatsApp Page** (`/whatsapp`)
- ✅ **Engagement Metrics Cards:**
  - Appointments via AI Agent
  - WhatsApp Conversations
  - WhatsApp Appointments
  - Notes Received Today
- ✅ Placeholder for future WhatsApp conversation details

### 5. **Calls Section**
- ✅ **Inbound Calls Page** (`/calls/inbound`)
  - Summary cards
  - Inbound call events table
  - Placeholder for inbound trends
- ✅ **Outbound Calls Page** (`/calls/outbound`)
  - Summary cards
  - Outbound call events table
  - Placeholder for outbound performance

### 6. **Events Table** (Multiple Pages)
- ✅ Paginated table (10 items per page)
- ✅ Filtering by status (answered, missed, voicemail, busy, failed)
- ✅ Filtering by direction (inbound, outbound)
- ✅ Mobile card view, desktop table view
- ✅ Shows: Timestamp, Phone Number, Contact, Direction, Status, Duration

### 7. **ROI Calculator Widget**
- ✅ Interactive calculator with inputs:
  - Ad Spend
  - Appointments
  - Show→Sale Rate
  - Avg Revenue per Sale
- ✅ Calculates: Estimated Sales, Total Revenue, Cost/Appointment, ROI %

### 8. **Additional Features**
- ✅ Loading states (skeleton animations)
- ✅ Error handling with user-friendly messages
- ✅ Empty states
- ✅ Accessibility features (ARIA labels, keyboard navigation)
- ✅ State management with Zustand
- ✅ Supabase integration (with fallback to mock data)

---

## 📊 Complete Data Requirements

### **Table 1: `calls`** (REQUIRED - Primary Data Source)

**Purpose:** Stores all phone call records

**Required Columns:**
```sql
id              uuid PRIMARY KEY
phone_number    text NOT NULL
contact_name    text (nullable)
direction       text NOT NULL        -- 'inbound' or 'outbound'
status          text NOT NULL        -- 'answered', 'missed', 'voicemail', 'busy', 'failed'
duration_seconds integer DEFAULT 0   -- Call duration in seconds
timestamp       timestamp with time zone NOT NULL
notes           text (nullable)
agent_id        uuid (nullable)      -- Foreign key to users table
created_at      timestamp with time zone DEFAULT now()
```

**Data Used For:**
- Summary statistics (total, answered, missed, avg duration)
- Events table (all pages)
- Time series calculations (if timeseries table is empty)
- Inbound/Outbound filtering
- Status filtering

**Minimum Data:** At least 1 row for dashboard to show data

---

### **Table 2: `engagement_metrics`** (REQUIRED)

**Purpose:** Daily aggregated engagement metrics

**Required Columns:**
```sql
id                      bigint PRIMARY KEY
metric_date            date NOT NULL UNIQUE
appointments_via_agent integer DEFAULT 0
whatsapp_conversations integer DEFAULT 0
whatsapp_appointments  integer DEFAULT 0
notes_count_today      integer DEFAULT 0
last_updated           timestamp with time zone DEFAULT now()
```

**Data Used For:**
- WhatsApp page engagement cards
- Dashboard "Appointments" metric card
- ROI calculator context

**Minimum Data:** 1 row with `metric_date = CURRENT_DATE`

**Update Frequency:** Daily (or real-time as events occur)

---

### **Table 3: `timeseries`** (OPTIONAL - Auto-calculated if empty)

**Purpose:** Pre-aggregated time series data for faster chart loading

**Required Columns:**
```sql
id        bigint PRIMARY KEY
metric    text NOT NULL              -- 'calls', 'duration', 'answered_rate'
timestamp timestamp with time zone NOT NULL
value     numeric NOT NULL
metadata  jsonb DEFAULT '{}'
```

**Data Used For:**
- Revenue Stats chart (monthly data)
- Time Series chart on Analytics page

**Fallback:** If empty, app calculates from `calls` table automatically

**Update Frequency:** Can be populated via scheduled job or real-time

---

### **Table 4: `appointments`** (OPTIONAL - For Future Features)

**Purpose:** Individual appointment records

**Required Columns:**
```sql
id           uuid PRIMARY KEY
source       text (nullable)         -- 'agent', 'whatsapp', etc.
scheduled_at timestamp with time zone (nullable)
created_by   uuid (nullable)         -- Foreign key to users
call_id      uuid (nullable)         -- Foreign key to calls
status       text DEFAULT 'scheduled'
created_at   timestamp with time zone DEFAULT now()
```

**Data Used For:**
- Future appointment management features
- Currently used indirectly via `engagement_metrics`

---

### **Table 5: `status_summary`** (OPTIONAL)

**Purpose:** Aggregated status summaries

**Required Columns:**
```sql
id        integer PRIMARY KEY
period    text NOT NULL              -- 'day', 'week', 'month', 'year'
answered  integer DEFAULT 0
missed    integer DEFAULT 0
other     integer DEFAULT 0
updated_at timestamp with time zone DEFAULT now()
```

**Data Used For:**
- Potential future optimizations
- Currently calculated on-the-fly from `calls` table

---

### **Table 6: `users`** (OPTIONAL - For User Management)

**Purpose:** User accounts and agents

**Required Columns:**
```sql
id         uuid PRIMARY KEY
email      text UNIQUE
full_name  text (nullable)
role       text (nullable)
created_at timestamp with time zone DEFAULT now()
```

**Data Used For:**
- Future user authentication
- Agent assignment in calls
- Currently optional

---

## 🔄 Data Flow

### Real-time Data Flow:
```
n8n Workflow → Supabase Database → React Dashboard
     ↓                ↓                    ↓
  Call Event    Insert to `calls`    Auto-refresh
  Appointment   Update `engagement_`  Display updated
  WhatsApp      metrics` table        metrics
```

### Data Aggregation:
- **Summary Stats:** Calculated from `calls` table in real-time
- **Time Series:** Uses `timeseries` table if available, else calculates from `calls`
- **Engagement Metrics:** Stored in `engagement_metrics` table (updated daily/real-time)

---

## 📋 Minimum Viable Data

To get the dashboard working, you need:

1. **At least 1 call record** in `calls` table
2. **At least 1 engagement metric** row with today's date
3. **Optional:** Time series data (will calculate if missing)

### Quick Start SQL:

```sql
-- Insert sample call
INSERT INTO public.calls (phone_number, direction, status, duration_seconds, timestamp)
VALUES ('+1234567890', 'inbound', 'answered', 180, NOW());

-- Insert today's engagement metrics
INSERT INTO public.engagement_metrics (metric_date, appointments_via_agent, whatsapp_conversations, whatsapp_appointments, notes_count_today)
VALUES (CURRENT_DATE, 0, 0, 0, 0);
```

---

## 🔐 Security & Access

### Row Level Security (RLS) Policies Needed:

```sql
-- Allow public read access (adjust based on your needs)
CREATE POLICY "Public read access" ON public.calls FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.engagement_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.timeseries FOR SELECT USING (true);
```

**For Production:** Consider authenticated access instead of public access.

---

## 📈 Performance Optimization

### Recommended Indexes:

```sql
-- Calls table indexes
CREATE INDEX idx_calls_timestamp ON public.calls(timestamp DESC);
CREATE INDEX idx_calls_status ON public.calls(status);
CREATE INDEX idx_calls_direction ON public.calls(direction);
CREATE INDEX idx_calls_phone_number ON public.calls(phone_number);

-- Engagement metrics index
CREATE INDEX idx_engagement_metrics_date ON public.engagement_metrics(metric_date DESC);

-- Timeseries indexes
CREATE INDEX idx_timeseries_metric_timestamp ON public.timeseries(metric, timestamp DESC);
```

---

## 🎨 Feature Summary by Page

| Page | Features | Data Source |
|------|----------|-------------|
| **Dashboard** | Welcome header, 4 metric cards, 2 charts | `calls`, `engagement_metrics` |
| **Analytics** | Call summary charts, time series chart | `calls`, `timeseries` (optional) |
| **WhatsApp** | 4 engagement cards, placeholder | `engagement_metrics` |
| **Inbound Calls** | Summary cards, events table | `calls` (filtered) |
| **Outbound Calls** | Summary cards, events table | `calls` (filtered) |

---

## ✅ Deployment Checklist

- [ ] Supabase project created
- [ ] All tables created with correct schema
- [ ] RLS policies configured
- [ ] Environment variables set (local `.env` file)
- [ ] Test data inserted
- [ ] Local testing successful
- [ ] Production environment variables configured
- [ ] Deployment successful
- [ ] Live site verified

---

## 📞 Next Steps

1. **Set up Supabase:** Follow `SUPABASE_SETUP.md`
2. **Populate Data:** Use sample SQL from `DATABASE_REQUIREMENTS.md`
3. **Deploy:** Follow `DEPLOYMENT_GUIDE.md`
4. **Integrate n8n:** Connect your n8n workflows to insert data into Supabase

Your dashboard is now ready to connect to Supabase and go live! 🚀

