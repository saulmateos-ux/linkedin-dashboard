#!/usr/bin/env node

/**
 * Script to manually add Eliezer profile to Gain workspace
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import chalk from 'chalk';

// Load environment variables
config({ path: '.env.local' });

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
});

async function addEliezerToGain() {
  try {
    console.log(chalk.blue('🔍 Finding Gain workspace...'));

    // Find Gain workspace
    const workspaceResult = await pool.query(
      "SELECT id, name FROM workspaces WHERE name ILIKE '%gain%'"
    );

    if (workspaceResult.rows.length === 0) {
      console.error(chalk.red('❌ Gain workspace not found!'));
      process.exit(1);
    }

    const workspace = workspaceResult.rows[0];
    console.log(chalk.green(`✅ Found workspace: ${workspace.name} (ID: ${workspace.id})`));

    // Find Eliezer profile
    console.log(chalk.blue('\n🔍 Finding Eliezer profile...'));
    const profileResult = await pool.query(
      "SELECT id, username, display_name FROM profiles WHERE username = 'eliezer-nerenberg'"
    );

    if (profileResult.rows.length === 0) {
      console.error(chalk.red('❌ Eliezer profile not found!'));
      process.exit(1);
    }

    const profile = profileResult.rows[0];
    console.log(chalk.green(`✅ Found profile: ${profile.display_name} (@${profile.username}, ID: ${profile.id})`));

    // Check if already in workspace
    console.log(chalk.blue('\n🔍 Checking if already in workspace...'));
    const existingResult = await pool.query(
      'SELECT * FROM workspace_profiles WHERE workspace_id = $1 AND profile_id = $2',
      [workspace.id, profile.id]
    );

    if (existingResult.rows.length > 0) {
      console.log(chalk.yellow('⚠️  Eliezer is already in the Gain workspace!'));
      process.exit(0);
    }

    // Add to workspace
    console.log(chalk.blue('\n➕ Adding Eliezer to Gain workspace...'));
    await pool.query(
      'INSERT INTO workspace_profiles (workspace_id, profile_id, added_at) VALUES ($1, $2, NOW())',
      [workspace.id, profile.id]
    );

    console.log(chalk.green('✅ SUCCESS! Eliezer has been added to the Gain workspace!'));

    // Verify
    console.log(chalk.blue('\n🔍 Verifying...'));
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
      console.log(chalk.green(`✅ Confirmed: ${row.display_name} (@${row.username}) is now in "${row.workspace_name}" workspace`));
      console.log(chalk.gray(`   Added at: ${row.added_at}`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
addEliezerToGain();
