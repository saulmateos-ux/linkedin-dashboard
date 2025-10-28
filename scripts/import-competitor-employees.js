#!/usr/bin/env node

/**
 * Import competitor employees from Apollo CSV export
 * Links employees to their company profiles
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CSV_FILE = path.join(__dirname, '..', 'apollo-contacts-export-4.csv');
const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const GAIN_WORKSPACE_ID = 3;

// Company name mapping (CSV name -> Database company ID)
const companyMapping = new Map();

// Store employee records
const employees = [];

// Seniority levels to filter for (C-suite and VPs)
const SENIOR_ROLES = ['C suite', 'Vp', 'Founder', 'Partner', 'Owner'];

async function loadCompanyMapping() {
  console.log('📊 Loading company profiles from database...\n');

  const response = await fetch(`${API_BASE}/api/workspaces/3/profiles`);
  const data = await response.json();

  const companies = data.profiles.filter(p => p.is_company);

  companies.forEach(company => {
    // Map various company name formats to profile ID
    const cleanName = company.display_name
      .replace(/ \(Company\)$/, '')
      .trim();

    companyMapping.set(cleanName, company.id);

    // Also map URL-based company names
    if (company.profile_url) {
      const match = company.profile_url.match(/linkedin\.com\/company\/([^\/\?]+)/);
      if (match) {
        const urlSlug = match[1];
        companyMapping.set(urlSlug, company.id);
      }
    }
  });

  console.log(`✅ Loaded ${companyMapping.size} company mappings\n`);
}

async function parseCSV() {
  console.log('📄 Parsing CSV for employee data...\n');

  const fileStream = fs.createReadStream(CSV_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isFirstLine = true;
  let headers = [];

  for await (const line of rl) {
    if (isFirstLine) {
      headers = parseCSVLine(line);
      isFirstLine = false;
      continue;
    }

    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    const firstName = row['First Name'];
    const lastName = row['Last Name'];
    const title = row['Title'];
    const companyName = row['Company Name'];
    const personLinkedinUrl = row['Person Linkedin Url'];
    const companyLinkedinUrl = row['Company Linkedin Url'];
    const seniority = row['Seniority'];

    // Filter: Only senior roles
    if (!SENIOR_ROLES.includes(seniority)) {
      continue;
    }

    // Must have personal LinkedIn URL
    if (!personLinkedinUrl || !personLinkedinUrl.includes('linkedin.com/in/')) {
      continue;
    }

    // Must have company name
    if (!companyName) {
      continue;
    }

    // Try to match company
    let companyId = null;

    // Try direct name match
    companyId = companyMapping.get(companyName);

    // Try without common suffixes
    if (!companyId) {
      const cleanCompanyName = companyName
        .replace(/, LLC$/, '')
        .replace(/, Inc\.?$/, '')
        .replace(/\s+LLC$/, '')
        .trim();
      companyId = companyMapping.get(cleanCompanyName);
    }

    // Try to extract from company URL
    if (!companyId && companyLinkedinUrl) {
      const match = companyLinkedinUrl.match(/linkedin\.com\/company\/([^\/\?]+)/);
      if (match) {
        const urlSlug = match[1];
        companyId = companyMapping.get(urlSlug);
      }
    }

    if (companyId) {
      employees.push({
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        title,
        companyName,
        companyId,
        linkedinUrl: personLinkedinUrl,
        seniority
      });
    }
  }

  console.log(`✅ Found ${employees.length} senior employees\n`);
}

// Simple CSV line parser
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

async function addEmployee(employee) {
  const response = await fetch(`${API_BASE}/api/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profileUrl: employee.linkedinUrl,
      displayName: employee.fullName,
      profileType: 'competitor',
      companyId: employee.companyId,
      workspaceId: GAIN_WORKSPACE_ID
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unknown error');
  }

  return await response.json();
}

async function importEmployees() {
  console.log('👥 Importing employees...\n');

  const results = {
    success: [],
    skipped: [],
    failed: []
  };

  // Group by company for better display
  const byCompany = employees.reduce((acc, emp) => {
    if (!acc[emp.companyName]) acc[emp.companyName] = [];
    acc[emp.companyName].push(emp);
    return acc;
  }, {});

  for (const [companyName, companyEmployees] of Object.entries(byCompany)) {
    console.log(`\n📍 ${companyName} (${companyEmployees.length} employees)`);

    for (const employee of companyEmployees) {
      process.stdout.write(`   ${employee.fullName} (${employee.title})... `);

      try {
        await addEmployee(employee);
        results.success.push(employee.fullName);
        console.log('✅');
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('already tracked')) {
          results.skipped.push(employee.fullName);
          console.log('⏭️');
        } else {
          results.failed.push({ name: employee.fullName, error: error.message });
          console.log(`❌ (${error.message})`);
        }
      }

      // Small delay to avoid overwhelming API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
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

  console.log('\n✨ Employee import complete!');
}

async function main() {
  console.log('🚀 Starting competitor employee import\n');
  console.log('📋 Criteria:');
  console.log('   - Seniority: C-suite, VPs, Founders, Partners, Owners');
  console.log('   - Must have LinkedIn profile URL');
  console.log('   - Company must be in database\n');

  // Check if dev server is running
  try {
    const healthCheck = await fetch(`${API_BASE}/api/profiles`);
    if (!healthCheck.ok) throw new Error('API not responding');
  } catch (error) {
    console.error('❌ Error: Could not connect to API server');
    console.error('   Make sure dev server is running: npm run dev');
    process.exit(1);
  }

  await loadCompanyMapping();
  await parseCSV();

  console.log('📊 Employees by Company:\n');
  const byCompany = employees.reduce((acc, emp) => {
    if (!acc[emp.companyName]) acc[emp.companyName] = 0;
    acc[emp.companyName]++;
    return acc;
  }, {});

  Object.entries(byCompany)
    .sort((a, b) => b[1] - a[1])
    .forEach(([company, count]) => {
      console.log(`   ${company}: ${count} employees`);
    });

  console.log('\n' + '='.repeat(80));
  console.log(`Total employees to import: ${employees.length}`);
  console.log('='.repeat(80));

  // Ask for confirmation
  console.log('\n⚠️  Ready to import. Press Ctrl+C to cancel, or wait 3 seconds to proceed...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  await importEmployees();

  console.log(`\n👉 View at: ${API_BASE}/profiles?workspace=${GAIN_WORKSPACE_ID}`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
