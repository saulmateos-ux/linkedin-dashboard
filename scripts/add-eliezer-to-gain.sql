-- Add Eliezer profile to Gain workspace

-- First, verify the workspace and profile exist
SELECT 'Workspace:' as type, id, name FROM workspaces WHERE name ILIKE '%gain%';
SELECT 'Profile:' as type, id, username, display_name FROM profiles WHERE username = 'eliezer-nerenberg';

-- Add Eliezer to Gain workspace (will fail if already exists due to unique constraint)
INSERT INTO workspace_profiles (workspace_id, profile_id, added_at)
SELECT
  (SELECT id FROM workspaces WHERE name ILIKE '%gain%' LIMIT 1) as workspace_id,
  (SELECT id FROM profiles WHERE username = 'eliezer-nerenberg' LIMIT 1) as profile_id,
  NOW() as added_at
WHERE NOT EXISTS (
  SELECT 1 FROM workspace_profiles
  WHERE workspace_id = (SELECT id FROM workspaces WHERE name ILIKE '%gain%' LIMIT 1)
  AND profile_id = (SELECT id FROM profiles WHERE username = 'eliezer-nerenberg' LIMIT 1)
);

-- Verify the addition
SELECT
  'Result:' as status,
  w.name as workspace_name,
  p.username,
  p.display_name,
  wp.added_at
FROM workspace_profiles wp
JOIN profiles p ON wp.profile_id = p.id
JOIN workspaces w ON wp.workspace_id = w.id
WHERE p.username = 'eliezer-nerenberg';
