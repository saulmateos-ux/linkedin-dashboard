#!/usr/bin/env node

/**
 * Scrape all competitor employee profiles
 * Batches requests to Apify (6 profiles at a time)
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function getEmployeeProfiles() {
  const response = await fetch(`${API_BASE}/api/profiles`);
  const data = await response.json();

  // Filter for competitor employees (has company_id, not a company)
  const employees = data.profiles.filter(p =>
    p.profile_type === 'competitor' &&
    p.company_id &&
    !p.is_company
  );

  return employees;
}

async function scrapeEmployees() {
  console.log('🚀 Starting competitor employee scraping\n');

  // Check if dev server is running
  try {
    const healthCheck = await fetch(`${API_BASE}/api/profiles`);
    if (!healthCheck.ok) throw new Error('API not responding');
  } catch (error) {
    console.error('❌ Error: Could not connect to API server');
    console.error('   Make sure dev server is running: npm run dev');
    process.exit(1);
  }

  const employees = await getEmployeeProfiles();

  console.log(`📊 Found ${employees.length} employee profiles to scrape\n`);
  console.log('⚠️  This will use Apify credits. Press Ctrl+C to cancel, or wait 3 seconds to proceed...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Use smart batch scraping with profileIds
  console.log('📥 Starting smart batch scrape...\n');
  console.log('⏳ This may take 10-15 minutes for 84 profiles...\n');
  console.log('💡 Using smart batching: Groups profiles by expected post volume\n');

  const profileIds = employees.map(e => e.id);

  try {
    const response = await fetch(`${API_BASE}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileIds: profileIds,  // Smart batch scraping API
        maxPosts: 50  // Default: will be adjusted per group
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Scraping failed');
    }

    const result = await response.json();

    console.log('\n' + '='.repeat(80));
    console.log('✅ Scraping Complete!');
    console.log('='.repeat(80));
    console.log(`📊 Total posts found: ${result.postsFound || 0}`);
    console.log(`📝 New posts: ${result.newPosts || 0}`);
    console.log(`🔄 Updated posts: ${result.updatedPosts || 0}`);
    console.log(`👥 Profiles scraped: ${result.profileCount || employees.length}`);

    if (result.groups) {
      console.log('\n📦 Batch Groups:');
      result.groups.forEach(g => {
        if (g.error) {
          console.log(`   ❌ ${g.group}: ${g.profileCount} profiles - ERROR: ${g.error}`);
        } else {
          console.log(`   ✅ ${g.group}: ${g.profileCount} profiles → ${g.postsScraped} posts (${g.newPosts} new, ${g.updatedPosts} updated)`);
        }
      });
    }

    const totalPosts = result.postsFound || result.newPosts || 0;
    console.log(`\n💰 Estimated Apify cost: ~$${(totalPosts * 0.002).toFixed(2)}`);
    console.log('\n👉 View posts at: http://localhost:3000/posts?workspace=3');
    console.log('👉 View employees: http://localhost:3000/profiles?workspace=3&type=competitor-employees');

  } catch (error) {
    console.error('\n❌ Scraping failed:', error.message);
    console.error('\nPossible issues:');
    console.error('- Apify API key not set or invalid');
    console.error('- Insufficient Apify credits');
    console.error('- Network connection issues');
    process.exit(1);
  }
}

scrapeEmployees().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
