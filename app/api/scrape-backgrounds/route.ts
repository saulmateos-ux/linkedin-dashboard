import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import {
  getProfiles,
  getWorkspaceProfiles,
  bulkImportProfileBackgrounds,
} from '@/lib/db';

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_KEY || '',
});

// Using harvestapi/linkedin-profile-scraper (LinkedIn Profile Bulk Scraper)
// Pricing: $4 per 1k profiles (basic mode) or $10 per 1k (with email search)
// Extracts work experience, education, skills, certifications, languages, etc.
const PROFILE_SCRAPER_ACTOR_ID = 'harvestapi/linkedin-profile-scraper';

interface ApifyProfileResult {
  // Match actual output from harvestapi/linkedin-profile-scraper
  element: {
    publicIdentifier: string;
    linkedinUrl: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    headline?: string;
    about?: string;  // LinkedIn "About" section (not "summary")
    location?: {
      linkedinText?: string;
      parsed?: {
        city?: string;
        state?: string;
        country?: string;
      };
    };

    // Experience
    experience?: Array<{
      position: string;  // Job title
      companyName: string;
      companyLinkedinUrl?: string;
      location?: string;
      employmentType?: string;
      duration?: string;
      description?: string;
      startDate?: {
        month?: string;
        year?: number;
        text?: string;
      };
      endDate?: {
        text?: string;
      };
    }>;

    // Education
    education?: Array<{
      schoolName: string;
      schoolLinkedinUrl?: string;
      degree?: string;
      fieldOfStudy?: string;
      startDate?: {
        year?: number;
        text?: string;
      };
      endDate?: {
        year?: number;
        text?: string;
      };
      period?: string;
    }>;

    // Skills and other data
    skills?: Array<{ name: string; endorsements?: string }>;
    languages?: Array<{ name: string; proficiency?: string }>;
    certifications?: Array<{ title: string; issuedBy?: string; issuedAt?: string }>;
    honorsAndAwards?: Array<{ title: string; issuedBy?: string; issuedAt?: string; description?: string }>;
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileIds, workspaceId, onlyNew = false } = body;

    if (!profileIds && !workspaceId) {
      return NextResponse.json(
        { error: 'Must provide either profileIds or workspaceId' },
        { status: 400 }
      );
    }

    // Get profiles to scrape
    let profilesToScrape;
    if (workspaceId) {
      profilesToScrape = await getWorkspaceProfiles(workspaceId);
    } else {
      const allProfiles = await getProfiles();
      profilesToScrape = allProfiles.filter(p => profileIds.includes(p.id));
    }

    // Filter for only new profiles if requested (profiles without background data)
    if (onlyNew) {
      profilesToScrape = profilesToScrape.filter(p => !p.profile_scraped_at);
    }

    if (profilesToScrape.length === 0) {
      const errorMessage = onlyNew
        ? 'No new profiles to scrape. All profiles already have background data! Uncheck "Only scrape new profiles" to re-scrape them.'
        : 'No profiles found to scrape';
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      );
    }

    // Build profiles array - actor accepts URLs, public identifiers, or profile IDs
    // Let's try full HTTPS URLs (converted from HTTP if needed)
    const profiles = profilesToScrape.map(p => {
      const url = p.profile_url.replace('http://', 'https://').replace('www.', '');
      return url;
    });

    console.log(`🔍 Scraping backgrounds for ${profiles.length} profiles...`);
    console.log('📋 Profile URLs:', profiles);

    // Call Apify actor with correct input format
    // Using 'urls' parameter (not 'profiles') based on actor documentation
    const input = {
      urls: profiles,  // Array of LinkedIn URLs (HTTPS, no www)
      profileScraperMode: 'Profile details no email ($4 per 1k)',  // Basic mode
    };

    console.log('📤 Sending to Apify:', JSON.stringify(input, null, 2));

    const run = await apifyClient.actor(PROFILE_SCRAPER_ACTOR_ID).call(input);

    console.log('🏃 Apify run ID:', run.id);
    console.log('📊 Run status:', run.status);

    // Get results from default dataset
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    console.log(`✅ Scraped ${items.length} profiles from Apify`);
    console.log('📦 Raw items:', JSON.stringify(items, null, 2));

    // Map Apify results to our database schema
    const profileBackgrounds = (items as unknown as ApifyProfileResult[]).map((item) => {
      const data = item.element;  // Data is nested in 'element' field

      // Find matching profile by public identifier
      const profile = profilesToScrape.find(p =>
        p.username === data.publicIdentifier ||
        data.publicIdentifier?.includes(p.username) ||
        p.username?.includes(data.publicIdentifier)
      );

      if (!profile) {
        console.warn(`⚠️  Could not match profile: ${data.publicIdentifier} (${data.fullName})`);
        return null;
      }

      console.log(`✅ Matched ${data.publicIdentifier} to profile ID ${profile.id}`);

      return {
        profile_id: profile.id,
        // email and phone not included in basic scraping mode
        location: data.location?.linkedinText || data.location?.parsed?.city,
        summary: data.about,  // LinkedIn "About" section

        skills: data.skills?.map(s => ({
          name: s.name,
          endorsements: s.endorsements ? parseInt(s.endorsements) : undefined,
        })),

        languages: data.languages?.map(l => ({
          name: l.name,
          proficiency: l.proficiency,
        })),

        certifications: data.certifications?.map(c => ({
          name: c.title,
          issuer: c.issuedBy,
          issued_date: c.issuedAt,
        })),

        honors_awards: data.honorsAndAwards?.map(h => ({
          title: h.title,
          issuer: h.issuedBy,
          date: h.issuedAt,
        })),

        experiences: data.experience?.map(exp => ({
          company_name: exp.companyName,
          company_url: exp.companyLinkedinUrl,
          title: exp.position,  // Note: field is called 'position'
          employment_type: exp.employmentType,
          location: exp.location,
          start_date: exp.startDate?.text || `${exp.startDate?.month} ${exp.startDate?.year}`,
          end_date: exp.endDate?.text === 'Present' ? undefined : exp.endDate?.text,
          is_current: exp.endDate?.text === 'Present',
          description: exp.description,
        })),

        education: data.education?.map(edu => ({
          school_name: edu.schoolName,
          school_url: edu.schoolLinkedinUrl,
          degree: edu.degree,
          field_of_study: edu.fieldOfStudy,
          start_year: edu.startDate?.year?.toString() || edu.startDate?.text,
          end_year: edu.endDate?.year?.toString() || edu.endDate?.text,
        })),
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null); // Remove nulls from unmatched profiles

    // Bulk import to database
    const result = await bulkImportProfileBackgrounds(profileBackgrounds);

    console.log(`📊 Import complete:`, result);

    return NextResponse.json({
      success: true,
      message: `Successfully scraped ${items.length} profile backgrounds`,
      stats: {
        profiles_updated: result.updated,
        experiences_added: result.experiences_added,
        education_added: result.education_added,
      },
      apify_run_id: run.id,
    });

  } catch (error) {
    console.error('Error scraping profile backgrounds:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to scrape profile backgrounds',
      },
      { status: 500 }
    );
  }
}

/**
 * Extract username from LinkedIn URL
 * Examples:
 * - https://linkedin.com/in/johndoe -> johndoe
 * - https://www.linkedin.com/in/jane-smith/ -> jane-smith
 */
function extractUsernameFromUrl(url: string): string {
  const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/i);
  return match ? match[1] : '';
}
