#!/usr/bin/env node

/**
 * Import competitor companies from Apollo CSV export
 * Phase 1: Company pages only
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CSV_FILE = path.join(__dirname, '..', 'apollo-contacts-export-4.csv');

// Store unique companies
const companies = new Map();

async function parseCSV() {
  const fileStream = fs.createReadStream(CSV_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isFirstLine = true;
  let headers = [];

  for await (const line of rl) {
    if (isFirstLine) {
      // Parse headers
      headers = parseCSVLine(line);
      isFirstLine = false;
      continue;
    }

    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    const companyName = row['Company Name'];
    const companyLinkedinUrl = row['Company Linkedin Url'];
    const website = row['Website'];

    if (companyName && companyLinkedinUrl && companyLinkedinUrl.includes('linkedin.com/company/')) {
      if (!companies.has(companyName)) {
        companies.set(companyName, {
          name: companyName,
          linkedinUrl: companyLinkedinUrl,
          website: website
        });
      }
    }
  }
}

// Simple CSV line parser (handles quoted fields)
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

async function main() {
  console.log('📊 Parsing Apollo CSV export...\n');

  await parseCSV();

  console.log(`✅ Found ${companies.size} unique companies\n`);
  console.log('Companies to import:');
  console.log('='.repeat(80));

  const sortedCompanies = Array.from(companies.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  sortedCompanies.forEach((company, index) => {
    console.log(`${index + 1}. ${company.name}`);
    console.log(`   LinkedIn: ${company.linkedinUrl}`);
    console.log(`   Website: ${company.website || 'N/A'}`);
    console.log('');
  });

  // Save to JSON for next step
  const outputFile = path.join(__dirname, 'competitor-companies.json');
  fs.writeFileSync(outputFile, JSON.stringify(sortedCompanies, null, 2));

  console.log('='.repeat(80));
  console.log(`\n💾 Saved company data to: ${outputFile}`);
  console.log(`\n📝 Next step: Review the list and run the import script`);
}

main().catch(console.error);
