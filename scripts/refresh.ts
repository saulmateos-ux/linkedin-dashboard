#!/usr/bin/env npx ts-node
/**
 * LinkedIn Refresh Script
 * CLI tool to trigger LinkedIn post scraping via the dashboard API
 *
 * Usage:
 *   npx ts-node scripts/refresh.ts --type competitor   # Only competitors
 *   npx ts-node scripts/refresh.ts --type inspiration  # Only inspiration
 *   npx ts-node scripts/refresh.ts --type own          # Your profiles
 *   npx ts-node scripts/refresh.ts --all               # All profiles
 *   npx ts-node scripts/refresh.ts --ids 1,2,3         # Specific profile IDs
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
});

interface Profile {
  id: number;
  username: string;
  display_name: string;
  profile_type: string;
  last_scraped_at: Date | null;
}

interface ScrapeResult {
  success: boolean;
  message: string;
  postsFound?: number;
  newPosts?: number;
  updatedPosts?: number;
  profileCount?: number;
  groups?: Array<{
    group: string;
    profileCount: number;
    maxPosts: number;
    postsScraped?: number;
    newPosts?: number;
    updatedPosts?: number;
    error?: string;
  }>;
  error?: string;
}

async function getProfilesByType(type: string): Promise<Profile[]> {
  const query = 'SELECT id, username, display_name, profile_type, last_scraped_at FROM profiles WHERE profile_type = $1 ORDER BY display_name ASC';
  const result = await pool.query(query, [type]);
  return result.rows;
}

async function getProfilesByIds(ids: number[]): Promise<Profile[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  const query = `SELECT id, username, display_name, profile_type, last_scraped_at FROM profiles WHERE id IN (${placeholders}) ORDER BY display_name ASC`;
  const result = await pool.query(query, ids);
  return result.rows;
}

async function getAllProfiles(): Promise<Profile[]> {
  const query = 'SELECT id, username, display_name, profile_type, last_scraped_at FROM profiles ORDER BY display_name ASC';
  const result = await pool.query(query);
  return result.rows;
}

async function callScrapeAPI(profileIds: number[]): Promise<ScrapeResult> {
  // Determine the API URL - use local dev server or Vercel deployment
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  console.log(`\n📡 Calling scrape API at ${baseUrl}/api/scrape`);
  console.log(`   Sending ${profileIds.length} profile IDs...`);

  try {
    const response = await fetch(`${baseUrl}/api/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileIds }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'API call failed',
        error: data.message,
      };
    }

    return data as ScrapeResult;
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to API',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function parseArgs(): { type?: string; ids?: number[]; all?: boolean } {
  const args = process.argv.slice(2);
  const result: { type?: string; ids?: number[]; all?: boolean } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' && args[i + 1]) {
      result.type = args[i + 1];
      i++;
    } else if (args[i] === '--ids' && args[i + 1]) {
      result.ids = args[i + 1].split(',').map(id => parseInt(id.trim(), 10));
      i++;
    } else if (args[i] === '--all') {
      result.all = true;
    }
  }

  return result;
}

function formatTimeSince(date: Date | null): string {
  if (!date) return 'never';
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

async function main() {
  console.log('🔄 LinkedIn Refresh Script');
  console.log('==========================\n');

  const { type, ids, all } = parseArgs();

  let profiles: Profile[] = [];
  let description = '';

  // Determine which profiles to scrape
  if (ids && ids.length > 0) {
    profiles = await getProfilesByIds(ids);
    description = `specific profiles (${ids.join(', ')})`;
  } else if (all) {
    profiles = await getAllProfiles();
    description = 'all profiles';
  } else if (type) {
    profiles = await getProfilesByType(type);
    description = `${type} profiles`;
  } else {
    // Default: competitor profiles only
    profiles = await getProfilesByType('competitor');
    description = 'competitor profiles (default)';
  }

  if (profiles.length === 0) {
    console.log(`❌ No profiles found for: ${description}`);
    await pool.end();
    process.exit(1);
  }

  console.log(`📋 Found ${profiles.length} ${description}:\n`);

  // Display profiles to be scraped
  const typeGroups: Record<string, Profile[]> = {};
  for (const profile of profiles) {
    if (!typeGroups[profile.profile_type]) {
      typeGroups[profile.profile_type] = [];
    }
    typeGroups[profile.profile_type].push(profile);
  }

  for (const [profileType, typeProfiles] of Object.entries(typeGroups)) {
    console.log(`   ${profileType.toUpperCase()} (${typeProfiles.length}):`);
    for (const p of typeProfiles) {
      const lastScraped = formatTimeSince(p.last_scraped_at);
      console.log(`     - ${p.display_name} (@${p.username}) [last: ${lastScraped}]`);
    }
    console.log('');
  }

  // Call the scrape API
  const profileIds = profiles.map(p => p.id);
  const result = await callScrapeAPI(profileIds);

  // Display results
  console.log('\n📊 Results');
  console.log('==========\n');

  if (result.success) {
    console.log(`✅ ${result.message}\n`);
    console.log(`   Posts found:   ${result.postsFound || 0}`);
    console.log(`   New posts:     ${result.newPosts || 0}`);
    console.log(`   Updated posts: ${result.updatedPosts || 0}`);
    console.log(`   Profiles:      ${result.profileCount || profiles.length}`);

    if (result.groups && result.groups.length > 0) {
      console.log('\n   Scrape Groups:');
      for (const group of result.groups) {
        if (group.error) {
          console.log(`     ❌ ${group.group}: ${group.error}`);
        } else {
          console.log(`     ✅ ${group.group}: ${group.postsScraped} posts (${group.newPosts} new, ${group.updatedPosts} updated)`);
        }
      }
    }
  } else {
    console.log(`❌ Scrape failed: ${result.message}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  await pool.end();
  console.log('\n✨ Done!\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  pool.end();
  process.exit(1);
});
