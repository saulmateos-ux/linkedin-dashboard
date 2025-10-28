/**
 * Script to manually add Eliezer profile to Gain workspace
 * Run with: npx tsx scripts/add-eliezer-to-gain.ts
 */

import { pool } from '../lib/db';

async function addEliezerToGain() {
  try {
    console.log('🔍 Finding Gain workspace...');

    // Find Gain workspace
    const workspaceResult = await pool.query(
      "SELECT id, name FROM workspaces WHERE name ILIKE '%gain%'"
    );

    if (workspaceResult.rows.length === 0) {
      console.error('❌ Gain workspace not found!');
      process.exit(1);
    }

    const workspace = workspaceResult.rows[0];
    console.log(`✅ Found workspace: ${workspace.name} (ID: ${workspace.id})`);

    // Find Eliezer profile
    console.log('\n🔍 Finding Eliezer profile...');
    const profileResult = await pool.query(
      "SELECT id, username, display_name FROM profiles WHERE username = 'eliezer-nerenberg'"
    );

    if (profileResult.rows.length === 0) {
      console.error('❌ Eliezer profile not found!');
      process.exit(1);
    }

    const profile = profileResult.rows[0];
    console.log(`✅ Found profile: ${profile.display_name} (@${profile.username}, ID: ${profile.id})`);

    // Check if already in workspace
    console.log('\n🔍 Checking if already in workspace...');
    const existingResult = await pool.query(
      'SELECT * FROM workspace_profiles WHERE workspace_id = $1 AND profile_id = $2',
      [workspace.id, profile.id]
    );

    if (existingResult.rows.length > 0) {
      console.log('⚠️  Eliezer is already in the Gain workspace!');
      process.exit(0);
    }

    // Add to workspace
    console.log('\n➕ Adding Eliezer to Gain workspace...');
    await pool.query(
      'INSERT INTO workspace_profiles (workspace_id, profile_id, added_at) VALUES ($1, $2, NOW())',
      [workspace.id, profile.id]
    );

    console.log('✅ SUCCESS! Eliezer has been added to the Gain workspace!');

    // Verify
    console.log('\n🔍 Verifying...');
    const verifyResult = await pool.query(
      `SELECT p.username, p.display_name, w.name as workspace_name, wp.added_at
       FROM workspace_profiles wp
       JOIN profiles p ON wp.profile_id = p.id
       JOIN workspaces w ON wp.workspace_id = w.id
       WHERE wp.workspace_id = $1 AND wp.profile_id = $2`,
      [workspace.id, profile.id]
    );

    if (verifyResult.rows.length > 0) {
      const row = verifyResult.rows[0];
      console.log(`✅ Confirmed: ${row.display_name} (@${row.username}) is now in "${row.workspace_name}" workspace`);
      console.log(`   Added at: ${row.added_at}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the script
addEliezerToGain();
