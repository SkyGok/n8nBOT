-- ============================================
-- PROJECTS MANAGEMENT TABLES
-- ============================================
-- This migration adds tables for project management,
-- production tracking, and session management
-- ============================================

-- ============================================
-- TABLE 1: Projects
-- ============================================
-- Stores project information with target quantities

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_name ON public.projects(name);

-- Add comment
COMMENT ON TABLE public.projects IS 'Stores project information with target production quantities';

-- ============================================
-- TABLE 2: Project Sessions
-- ============================================
-- Tracks manufacturing sessions for each project

CREATE TABLE IF NOT EXISTS public.project_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  manufacturing_type TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_project_sessions_project_id ON public.project_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_sessions_started_at ON public.project_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_sessions_manufacturing_type ON public.project_sessions(manufacturing_type);

-- Add comment
COMMENT ON TABLE public.project_sessions IS 'Tracks manufacturing sessions for projects';

-- ============================================
-- TABLE 3: Production Updates
-- ============================================
-- Records production quantity updates during sessions

CREATE TABLE IF NOT EXISTS public.production_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.project_sessions(id) ON DELETE CASCADE,
  quantity_completed INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_production_updates_project_id ON public.production_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_production_updates_session_id ON public.production_updates(session_id);
CREATE INDEX IF NOT EXISTS idx_production_updates_created_at ON public.production_updates(created_at DESC);

-- Add comment
COMMENT ON TABLE public.production_updates IS 'Records production quantity updates during manufacturing sessions';

-- ============================================
-- TABLE 4: Workers (Optional - Future Feature)
-- ============================================
-- Stores worker information and assignments

CREATE TABLE IF NOT EXISTS public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  assigned_station TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_workers_name ON public.workers(name);
CREATE INDEX IF NOT EXISTS idx_workers_assigned_station ON public.workers(assigned_station);

-- Add comment
COMMENT ON TABLE public.workers IS 'Stores worker information and station assignments (future feature)';

-- ============================================
-- TRIGGERS: Auto-update updated_at timestamps
-- ============================================

-- Function to update updated_at (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to project_sessions
DROP TRIGGER IF EXISTS update_project_sessions_updated_at ON public.project_sessions;
CREATE TRIGGER update_project_sessions_updated_at
  BEFORE UPDATE ON public.project_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to workers
DROP TRIGGER IF EXISTS update_workers_updated_at ON public.workers;
CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON public.workers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- Projects: Allow public read/write for demo (adjust based on your needs)
DROP POLICY IF EXISTS "Allow public read access to projects" ON public.projects;
CREATE POLICY "Allow public read access to projects" ON public.projects
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to projects" ON public.projects;
CREATE POLICY "Allow public insert access to projects" ON public.projects
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to projects" ON public.projects;
CREATE POLICY "Allow public update access to projects" ON public.projects
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access to projects" ON public.projects;
CREATE POLICY "Allow public delete access to projects" ON public.projects
  FOR DELETE USING (true);

-- Project Sessions: Allow public read/write for demo
DROP POLICY IF EXISTS "Allow public read access to project_sessions" ON public.project_sessions;
CREATE POLICY "Allow public read access to project_sessions" ON public.project_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to project_sessions" ON public.project_sessions;
CREATE POLICY "Allow public insert access to project_sessions" ON public.project_sessions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to project_sessions" ON public.project_sessions;
CREATE POLICY "Allow public update access to project_sessions" ON public.project_sessions
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access to project_sessions" ON public.project_sessions;
CREATE POLICY "Allow public delete access to project_sessions" ON public.project_sessions
  FOR DELETE USING (true);

-- Production Updates: Allow public read/write for demo
DROP POLICY IF EXISTS "Allow public read access to production_updates" ON public.production_updates;
CREATE POLICY "Allow public read access to production_updates" ON public.production_updates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to production_updates" ON public.production_updates;
CREATE POLICY "Allow public insert access to production_updates" ON public.production_updates
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to production_updates" ON public.production_updates;
CREATE POLICY "Allow public update access to production_updates" ON public.production_updates
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access to production_updates" ON public.production_updates;
CREATE POLICY "Allow public delete access to production_updates" ON public.production_updates
  FOR DELETE USING (true);

-- Workers: Allow public read/write for demo
DROP POLICY IF EXISTS "Allow public read access to workers" ON public.workers;
CREATE POLICY "Allow public read access to workers" ON public.workers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to workers" ON public.workers;
CREATE POLICY "Allow public insert access to workers" ON public.workers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to workers" ON public.workers;
CREATE POLICY "Allow public update access to workers" ON public.workers
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access to workers" ON public.workers;
CREATE POLICY "Allow public delete access to workers" ON public.workers
  FOR DELETE USING (true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('projects', 'project_sessions', 'production_updates', 'workers')
ORDER BY table_name;

-- Verify indexes
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'project_sessions', 'production_updates', 'workers')
ORDER BY tablename, indexname;

