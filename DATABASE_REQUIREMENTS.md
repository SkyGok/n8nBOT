# Database Requirements & Data Mapping

This document outlines all data requirements for the n8n Phone Analytics Dashboard and how they map to your Supabase database tables.

## 📊 Data Mapping

### 1. Summary Statistics (Dashboard Cards)

**Source:** `calls` table  
**Calculated Fields:**
- `totalCalls` = COUNT(*) from `calls`
- `answeredCalls` = COUNT(*) WHERE `status` = 'answered'
- `missedCalls` = COUNT(*) WHERE `status` = 'missed'
- `averageDuration` = AVG(`duration_seconds`) WHERE `status` = 'answered'
- `totalDuration` = SUM(`duration_seconds`) WHERE `status` = 'answered'
- `lastUpdated` = MAX(`timestamp`)

**Required Columns:**
```sql
- status (text): 'answered', 'missed', 'voicemail', 'busy', 'failed'
- duration_seconds (integer): Call duration in seconds
- timestamp (timestamp with time zone): When the call occurred
```

### 2. Engagement Metrics (WhatsApp & Appointments)

**Source:** `engagement_metrics` table  
**Required Columns:**
```sql
- metric_date (date): Date of the metrics (use CURRENT_DATE for today)
- appointments_via_agent (integer): Number of appointments made via AI agent
- whatsapp_conversations (integer): Number of WhatsApp conversations
- whatsapp_appointments (integer): Number of appointments from WhatsApp
- notes_count_today (integer): Number of notes received today
- last_updated (timestamp with time zone): When metrics were last updated
```

**Data Population:**
- Insert one row per day with today's date
- Update the row as new data comes in
- Or use a scheduled job to aggregate daily

### 3. Time Series Data (Charts)

**Source:** `timeseries` table (optional) or calculated from `calls`  
**Required Columns:**
```sql
- metric (text): 'calls', 'duration', 'answered_rate'
- timestamp (timestamp with time zone): Time of the data point
- value (numeric): The metric value
- metadata (jsonb): Optional additional data
```

**Fallback:** If `timeseries` table is empty, the app will calculate from `calls` table automatically.

### 4. Call Events (Events Table)

**Source:** `calls` table  
**Required Columns:**
```sql
- id (uuid): Unique identifier
- phone_number (text): Phone number
- contact_name (text, nullable): Contact name if available
- direction (text): 'inbound' or 'outbound'
- status (text): 'answered', 'missed', 'voicemail', 'busy', 'failed'
- duration_seconds (integer): Call duration (0 if not answered)
- timestamp (timestamp with time zone): When call occurred
- notes (text, nullable): Additional notes about the call
```

**Filtering:**
- Filter by `direction` for Inbound/Outbound pages
- Filter by `status` for status filtering
- Pagination handled automatically

### 5. Total Customers (Call Summary Chart)

**Source:** Calculated from `calls` table  
**Calculation:**
- Count of unique `phone_number` values
- Or maintain a separate `customers` table if you have one

## 📝 Sample Data Insertion Queries

### Insert Sample Calls

```sql
INSERT INTO public.calls (phone_number, contact_name, direction, status, duration_seconds, timestamp, notes)
VALUES 
  ('+1234567890', 'John Doe', 'inbound', 'answered', 180, NOW() - INTERVAL '1 day', 'Customer inquiry'),
  ('+1234567891', 'Jane Smith', 'outbound', 'answered', 240, NOW() - INTERVAL '2 hours', 'Follow-up call'),
  ('+1234567892', NULL, 'inbound', 'missed', 0, NOW() - INTERVAL '1 hour', NULL),
  ('+1234567893', 'Bob Johnson', 'inbound', 'answered', 120, NOW() - INTERVAL '30 minutes', 'Appointment scheduled'),
  ('+1234567894', 'Alice Williams', 'outbound', 'voicemail', 0, NOW() - INTERVAL '15 minutes', 'Left voicemail');
```

### Insert Engagement Metrics

```sql
-- Insert or update today's metrics
INSERT INTO public.engagement_metrics (
  metric_date, 
  appointments_via_agent, 
  whatsapp_conversations, 
  whatsapp_appointments, 
  notes_count_today
)
VALUES (CURRENT_DATE, 25, 150, 18, 12)
ON CONFLICT (metric_date) DO UPDATE SET
  appointments_via_agent = EXCLUDED.appointments_via_agent,
  whatsapp_conversations = EXCLUDED.whatsapp_conversations,
  whatsapp_appointments = EXCLUDED.whatsapp_appointments,
  notes_count_today = EXCLUDED.notes_count_today,
  last_updated = NOW();
```

**Note:** You may need to add a unique constraint on `metric_date`:

```sql
ALTER TABLE public.engagement_metrics 
ADD CONSTRAINT engagement_metrics_metric_date_key UNIQUE (metric_date);
```

### Insert Time Series Data (Optional)

```sql
-- Insert monthly call counts
INSERT INTO public.timeseries (metric, timestamp, value)
SELECT 
  'calls' as metric,
  DATE_TRUNC('month', timestamp) as timestamp,
  COUNT(*) as value
FROM public.calls
WHERE timestamp >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', timestamp);
```

## 🔄 Data Update Strategies

### Option 1: Real-time Updates (Recommended)
- Insert new calls as they happen via n8n webhook
- Update engagement metrics in real-time
- Use Supabase Realtime subscriptions for live updates (future enhancement)

### Option 2: Batch Updates
- Run scheduled jobs (cron) to aggregate data
- Update `engagement_metrics` table daily
- Populate `timeseries` table periodically

### Option 3: Hybrid
- Real-time for calls (insert immediately)
- Batch for aggregations (daily/hourly jobs)

## 📋 Data Validation

### Required Data Types

**Status Values:**
- Must be one of: `'answered'`, `'missed'`, `'voicemail'`, `'busy'`, `'failed'`

**Direction Values:**
- Must be one of: `'inbound'`, `'outbound'`

**Duration:**
- Integer (seconds)
- Should be 0 for non-answered calls
- Should be > 0 for answered calls

**Timestamps:**
- Use `timestamp with time zone`
- Store in UTC (Supabase default)
- Frontend handles timezone conversion

## 🔍 Data Quality Checks

Run these queries to verify data quality:

```sql
-- Check for invalid status values
SELECT DISTINCT status FROM public.calls 
WHERE status NOT IN ('answered', 'missed', 'voicemail', 'busy', 'failed');

-- Check for invalid direction values
SELECT DISTINCT direction FROM public.calls 
WHERE direction NOT IN ('inbound', 'outbound');

-- Check for answered calls with 0 duration
SELECT COUNT(*) FROM public.calls 
WHERE status = 'answered' AND duration_seconds = 0;

-- Check for missing timestamps
SELECT COUNT(*) FROM public.calls WHERE timestamp IS NULL;
```

## 🚀 Production Recommendations

1. **Indexes:** Add indexes for better query performance:
```sql
CREATE INDEX idx_calls_timestamp ON public.calls(timestamp);
CREATE INDEX idx_calls_status ON public.calls(status);
CREATE INDEX idx_calls_direction ON public.calls(direction);
CREATE INDEX idx_engagement_metrics_date ON public.engagement_metrics(metric_date);
CREATE INDEX idx_timeseries_metric_timestamp ON public.timeseries(metric, timestamp);
```

2. **Constraints:** Add check constraints:
```sql
ALTER TABLE public.calls 
ADD CONSTRAINT calls_status_check 
CHECK (status IN ('answered', 'missed', 'voicemail', 'busy', 'failed'));

ALTER TABLE public.calls 
ADD CONSTRAINT calls_direction_check 
CHECK (direction IN ('inbound', 'outbound'));
```

3. **RLS Policies:** Configure appropriate Row Level Security policies based on your access requirements.

4. **Backups:** Enable automatic backups in Supabase dashboard.

## 📊 Minimum Data Requirements

For the dashboard to display meaningful data, you need at minimum:

- **At least 1 row** in `calls` table (for summary stats)
- **At least 1 row** in `engagement_metrics` table with today's date (for engagement cards)
- **Optional:** Data in `timeseries` table (will calculate from calls if empty)

## 🔗 Integration with n8n

Your n8n workflows should:

1. **Insert calls** when a call is made/received:
   - Use Supabase HTTP request node
   - POST to Supabase REST API or use Supabase node
   - Insert into `calls` table

2. **Update engagement metrics**:
   - Track WhatsApp conversations
   - Track appointments
   - Update `engagement_metrics` table daily

3. **Optional:** Populate `timeseries` table for faster chart loading

Example n8n workflow structure:
```
Trigger → Process Call Data → Insert to Supabase → Update Metrics
```

