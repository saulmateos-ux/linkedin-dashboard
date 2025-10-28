#!/usr/bin/env node

/**
 * Add competitor companies to the LinkedIn Analytics Dashboard
 * Optionally creates a "Competitors" workspace
 */

const fs = require('fs');
const path = require('path');

const COMPANIES_FILE = path.join(__dirname, 'competitor-companies.json');
const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Options
const CREATE_WORKSPACE = true;
const WORKSPACE_NAME = 'Competitors';
const WORKSPACE_COLOR = '#ef4444'; // Red color for competitors

async function createWorkspace() {
  console.log(`\n🏢 Creating workspace: "${WORKSPACE_NAME}"...`);

  const response = await fetch(`${API_BASE}/api/workspaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: WORKSPACE_NAME,
      description: 'Competitor companies in the legal/litigation funding space',
      color: WORKSPACE_COLOR
    })
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.error && error.error.includes('already exists')) {
      console.log(`   ℹ️  Workspace already exists, fetching existing...`);

      // Get existing workspace
      const listResponse = await fetch(`${API_BASE}/api/workspaces`);
      const workspaces = await listResponse.json();
      const existing = workspaces.find(w => w.name === WORKSPACE_NAME);

      if (existing) {
        console.log(`   ✅ Found existing workspace (ID: ${existing.id})`);
        return existing;
      }
    }
    throw new Error(`Failed to create workspace: ${error.error}`);
  }

  const workspace = await response.json();
  console.log(`   ✅ Created workspace (ID: ${workspace.id})`);
  return workspace;
}

async function addProfile(company, workspaceId = null) {
  const displayName = `${company.name} (Company)`;

  const response = await fetch(`${API_BASE}/api/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profileUrl: company.linkedinUrl,
      displayName: displayName,
      profileType: 'competitor',
      workspaceId: workspaceId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unknown error');
  }

  return await response.json();
}

async function main() {
  console.log('🚀 Starting competitor import process\n');

  // Check if dev server is running
  try {
    const healthCheck = await fetch(`${API_BASE}/api/profiles`);
    if (!healthCheck.ok) throw new Error('API not responding');
  } catch (error) {
    console.error('❌ Error: Could not connect to the API server');
    console.error('   Make sure the dev server is running: npm run dev');
    process.exit(1);
  }

  // Load companies
  if (!fs.existsSync(COMPANIES_FILE)) {
    console.error('❌ Error: competitor-companies.json not found');
    console.error('   Run: node scripts/import-competitors.js first');
    process.exit(1);
  }

  const companies = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf8'));
  console.log(`📊 Loaded ${companies.length} companies to import\n`);

  // Create workspace if needed
  let workspace = null;
  if (CREATE_WORKSPACE) {
    workspace = await createWorkspace();
  }

  // Import companies
  console.log('\n📥 Importing companies...\n');

  const results = {
    success: [],
    skipped: [],
    failed: []
  };

  for (const company of companies) {
    const displayName = `${company.name} (Company)`;
    process.stdout.write(`   Adding: ${displayName}... `);

    try {
      await addProfile(company, workspace?.id);
      results.success.push(company.name);
      console.log('✅');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('already tracked')) {
        results.skipped.push(company.name);
        console.log('⏭️  (already exists)');
      } else {
        results.failed.push({ name: company.name, error: error.message });
        console.log(`❌ (${error.message})`);
      }
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Import Summary');
  console.log('='.repeat(80));
  console.log(`✅ Successfully added: ${results.success.length}`);
  console.log(`⏭️  Skipped (already exist): ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed imports:');
    results.failed.forEach(f => {
      console.log(`   - ${f.name}: ${f.error}`);
    });
  }

  if (workspace && results.success.length > 0) {
    console.log(`\n🏢 All profiles added to workspace: "${WORKSPACE_NAME}"`);
    console.log(`   View at: ${API_BASE}/profiles?workspace=${workspace.id}`);
  }

  console.log('\n✨ Import complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Review profiles in the dashboard');
  console.log('   2. Run a workspace batch scrape to collect posts');
  console.log(`   3. Navigate to: ${API_BASE}/profiles?workspace=${workspace?.id || '[workspace-id]'}`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
