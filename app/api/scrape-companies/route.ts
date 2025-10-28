import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { getProfiles, bulkUpdateCompanyData } from '@/lib/db';

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_KEY || '',
});

// Using dev_fusion/linkedin-company-scraper
// Pricing: $8 per 1k companies
// Extracts follower count, description, industry, size, location, specialties
const COMPANY_SCRAPER_ACTOR_ID = 'dev_fusion/linkedin-company-scraper';

interface ApifyCompanyResult {
  companyName?: string;
  industry?: string;
  website?: string;
  linkedinUrl?: string;
  employeeCount?: string | number;  // Can be either string or number
  description?: string;
  specialties?: string[];
  foundingYear?: string;
  headquarters?: string;
  followerCount?: number;
  companyLogo?: string;
  coverImage?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyIds } = body;

    if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
      return NextResponse.json(
        { error: 'companyIds array is required' },
        { status: 400 }
      );
    }

    console.log(`📋 Scraping ${companyIds.length} companies...`);

    // Get company profiles
    const allProfiles = await getProfiles();
    const companiesToScrape = allProfiles.filter(
      p => companyIds.includes(p.id) && p.is_company
    );

    if (companiesToScrape.length === 0) {
      return NextResponse.json(
        { error: 'No company profiles found with the provided IDs' },
        { status: 404 }
      );
    }

    // Build company URLs array
    const companies = companiesToScrape.map(c => {
      const url = c.profile_url.replace('http://', 'https://').replace('www.', '');
      return url;
    });

    console.log(`🔍 Scraping company data for ${companies.length} companies...`);
    console.log('📋 Company URLs:', companies);

    // Call Apify actor
    const input = {
      profileUrls: companies,  // Array of LinkedIn company URLs
    };

    console.log('📤 Sending to Apify:', JSON.stringify(input, null, 2));

    const run = await apifyClient.actor(COMPANY_SCRAPER_ACTOR_ID).call(input);

    console.log('🏃 Apify run ID:', run.id);
    console.log('📊 Run status:', run.status);

    // Get results from default dataset
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    console.log(`✅ Scraped ${items.length} companies from Apify`);
    console.log('📦 Raw items:', JSON.stringify(items, null, 2));

    // Map Apify results to our database schema
    const companyData = (items as ApifyCompanyResult[]).map((item) => {
      // Find matching company by name (fuzzy match)
      const itemName = item.companyName?.toLowerCase().trim() || '';

      const company = companiesToScrape.find(c => {
        const displayName = c.display_name.toLowerCase()
          .replace(' (company)', '')
          .replace(', llc', '')
          .replace(' llc', '')
          .trim();

        // Try exact match first
        if (displayName === itemName) return true;

        // Try contains match
        if (displayName.includes(itemName) || itemName.includes(displayName)) return true;

        // Try matching by URL if available
        if (item.linkedinUrl && c.profile_url === item.linkedinUrl) return true;

        return false;
      });

      if (!company) {
        console.warn(`⚠️  Could not match company: ${item.companyName}`);
        return null;
      }

      console.log(`✅ Matched "${item.companyName}" to company ID ${company.id} (${company.display_name})`);

      // Parse employee count (could be string or number)
      const followerCount = item.followerCount;
      let employeeCountNum: number | undefined;

      if (item.employeeCount) {
        // Check if it's already a number
        if (typeof item.employeeCount === 'number') {
          employeeCountNum = item.employeeCount;
        } else if (typeof item.employeeCount === 'string') {
          // Try to parse string like "11-50 employees"
          const match = item.employeeCount.match(/(\d+)-(\d+)/);
          if (match) {
            // Use midpoint of range
            employeeCountNum = Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
          } else {
            // Try to parse as number
            const parsed = parseInt(item.employeeCount.replace(/\D/g, ''));
            if (!isNaN(parsed)) {
              employeeCountNum = parsed;
            }
          }
        }
      }

      return {
        profile_id: company.id,
        display_name: item.companyName || company.display_name,
        headline: item.industry,
        summary: item.description,
        industry: item.industry,
        location: item.headquarters,
        follower_count: followerCount,
        notes: JSON.stringify({
          website: item.website,
          specialties: item.specialties,
          employee_count: employeeCountNum,
          employee_count_range: item.employeeCount,
          founding_year: item.foundingYear,
          logo: item.companyLogo,
          cover_image: item.coverImage,
        }),
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    // Bulk update company data
    const result = await bulkUpdateCompanyData(companyData);

    console.log(`📊 Import complete:`, result);

    return NextResponse.json({
      success: true,
      message: `Scraped ${items.length} companies successfully`,
      scraped: items.length,
      updated: result.updated,
      failed: result.failed,
    });
  } catch (error) {
    console.error('Error scraping companies:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to scrape companies',
      },
      { status: 500 }
    );
  }
}
