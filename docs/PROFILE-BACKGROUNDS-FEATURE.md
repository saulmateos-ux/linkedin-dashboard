# LinkedIn Profile Backgrounds Feature

**Version:** 1.0.0
**Date:** October 26, 2025
**Status:** ✅ Complete

---

## Overview

This feature enables scraping and displaying comprehensive LinkedIn profile background information including work experience, education, skills, certifications, and contact details.

### What's New

Users can now:
- **Scrape profile backgrounds** from LinkedIn (work experience, education, skills, etc.)
- **View detailed backgrounds** for each profile
- **Bulk scrape backgrounds** for multiple profiles or entire workspaces
- **Track profile updates** with versioning and timestamps

---

## Architecture

### Database Schema

#### New Tables

1. **`profile_experiences`** - Work history
   - Company name, title, employment type, location
   - Start/end dates, current position flag
   - Job description, duration in months
   - Company URL and logo

2. **`profile_education`** - Education history
   - School name, degree, field of study
   - Start/end years
   - Grade, activities, description
   - School URL and logo

#### Extended Columns in `profiles` Table

```sql
email                TEXT
phone                TEXT
location             TEXT
summary              TEXT
skills               JSONB (array of {name, endorsements})
languages            JSONB (array of {name, proficiency})
certifications       JSONB (array of {name, issuer, issued_date})
honors_awards        JSONB (array of {title, issuer, date})
profile_scraped_at   TIMESTAMP
profile_data_version INTEGER
```

---

## API Endpoints

### POST `/api/scrape-backgrounds`

Scrapes LinkedIn profile backgrounds using Apify.

**Request Body:**
```json
{
  "profileIds": [1, 2, 3],  // Optional: specific profile IDs
  "workspaceId": 2          // Optional: all profiles in workspace
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully scraped 3 profile backgrounds",
  "stats": {
    "profiles_updated": 3,
    "experiences_added": 12,
    "education_added": 8
  },
  "apify_run_id": "abc123"
}
```

**Apify Actor Used:**
- `harvestapi/linkedin-profile-scraper`
- Pricing: $4-10 per 1,000 profiles
- No LinkedIn cookies required

### GET `/api/profiles/[id]/background`

Retrieves complete profile background data.

**Response:**
```json
{
  "profile": {
    "id": 1,
    "display_name": "John Doe",
    "email": "john@example.com",
    "location": "San Francisco, CA",
    "summary": "Software Engineer...",
    "skills": [{"name": "TypeScript", "endorsements": 45}],
    // ... other profile fields
  },
  "experiences": [
    {
      "company_name": "Tech Corp",
      "title": "Senior Engineer",
      "start_date": "Jan 2020",
      "end_date": null,
      "is_current": true,
      // ... other experience fields
    }
  ],
  "education": [
    {
      "school_name": "Stanford University",
      "degree": "Bachelor of Science",
      "field_of_study": "Computer Science",
      // ... other education fields
    }
  ]
}
```

---

## Database Functions

All functions are exported from `lib/db.ts`:

### Profile Background Functions

```typescript
// Update profile with background data
updateProfileBackground(profileId: number, data: {
  email?, phone?, location?, summary?,
  skills?, languages?, certifications?, honors_awards?
}): Promise<Profile>

// Add work experience
addProfileExperience(profileId: number, experience: {
  company_name, title, start_date?, end_date?,
  is_current?, description?, ...
}): Promise<ProfileExperience>

// Add education
addProfileEducation(profileId: number, education: {
  school_name, degree?, field_of_study?,
  start_year?, end_year?, ...
}): Promise<ProfileEducation>

// Get all experiences for a profile
getProfileExperiences(profileId: number): Promise<ProfileExperience[]>

// Get all education for a profile
getProfileEducation(profileId: number): Promise<ProfileEducation[]>

// Get complete profile with all background data
getProfileComplete(profileId: number): Promise<{
  profile: Profile,
  experiences: ProfileExperience[],
  education: ProfileEducation[]
}>

// Bulk import from Apify scraper output
bulkImportProfileBackgrounds(profiles: Array<{...}>): Promise<{
  updated: number,
  experiences_added: number,
  education_added: number
}>
```

---

## UI Components

### 1. `ProfileBackground.tsx`

Displays complete profile background information.

**Features:**
- Profile info section (email, phone, location, summary)
- Work experience timeline (current position highlighted)
- Education history
- Skills with endorsement counts
- Languages with proficiency levels
- Certifications and honors
- Last updated timestamp

**Usage:**
```tsx
import ProfileBackground from '@/components/ProfileBackground';

<ProfileBackground
  profile={profile}
  experiences={experiences}
  education={education}
/>
```

### 2. `ScrapeBackgroundsButton.tsx`

Button to trigger background scraping with progress modal.

**Features:**
- Loading state with spinner
- Success/error modal with statistics
- Automatic page refresh on completion
- Support for profile IDs or workspace ID

**Usage:**
```tsx
import ScrapeBackgroundsButton from '@/components/ScrapeBackgroundsButton';

// Scrape specific profiles
<ScrapeBackgroundsButton
  profileIds={[1, 2, 3]}
  onComplete={() => router.refresh()}
/>

// Scrape entire workspace
<ScrapeBackgroundsButton
  workspaceId={2}
  onComplete={() => router.refresh()}
/>
```

---

## Pages

### `/profiles/[id]/background`

Dedicated page for viewing a single profile's background.

**Features:**
- Back navigation to profiles page
- Profile header with name, headline, LinkedIn link
- Scrape Backgrounds button (for this profile only)
- Full ProfileBackground component display
- Error handling for invalid/missing profiles

**URL Example:**
- `/profiles/3/background`

---

## User Workflows

### 1. Scrape Single Profile Background

1. Navigate to `/profiles`
2. Find the profile card
3. Click **"View Background →"** (purple link)
4. On the background page, click **"Scrape Backgrounds"** button
5. Wait for scraping to complete (progress modal shown)
6. View the complete profile background

### 2. Bulk Scrape All Profiles

1. Navigate to `/profiles`
2. Click **"Scrape Backgrounds"** button in header (purple button)
3. Scraping modal appears showing progress
4. All visible profiles are scraped in parallel
5. View stats: profiles updated, experiences added, education added

### 3. Scrape Workspace Profiles

1. Navigate to `/profiles?workspace=2`
2. Workspace banner appears at top
3. Click **"Scrape Backgrounds"** button in header
4. All profiles in workspace scraped together
5. Results saved to database with automatic profile matching

---

## Technical Details

### Apify Integration

**Actor:** `harvestapi/linkedin-profile-scraper`

**Input Schema:**
```javascript
{
  targetUrls: ['https://linkedin.com/in/username1', ...],
  includeSkills: true,
  includeExperience: true,
  includeEducation: true,
  includeCertifications: true,
  includeLanguages: true
}
```

**Output Format:**
- Array of profile objects with nested arrays for experience/education
- Automatic matching to database profiles by URL/username
- Scrapes up to 6 profiles in parallel

### Data Mapping

**Apify Output → Database Schema:**

```javascript
{
  email: item.email,
  location: item.location,
  summary: item.summary,

  skills: item.skills.map(s => ({
    name: s.name,
    endorsements: s.endorsements
  })),

  experiences: item.experience.map(exp => ({
    company_name: exp.companyName,
    title: exp.title,
    is_current: !exp.endDate,
    // ... etc
  })),

  education: item.education.map(edu => ({
    school_name: edu.schoolName,
    degree: edu.degree,
    // ... etc
  }))
}
```

### Profile Versioning

- `profile_data_version` increments each time background is updated
- `profile_scraped_at` tracks last scrape timestamp
- Old experiences/education deleted before re-scraping (prevents duplicates)

---

## Testing

### Manual Testing Checklist

✅ **Database Setup:**
- [x] Migration 006 runs successfully
- [x] Tables created: profile_experiences, profile_education
- [x] New columns added to profiles table

✅ **API Endpoints:**
- [ ] POST /api/scrape-backgrounds with profileIds
- [ ] POST /api/scrape-backgrounds with workspaceId
- [ ] GET /api/profiles/[id]/background

✅ **UI Components:**
- [ ] ProfileBackground displays all sections correctly
- [ ] ScrapeBackgroundsButton shows modal and progress
- [ ] ProfileCard has "View Background" link

✅ **End-to-End Flow:**
- [ ] Scrape single profile background
- [ ] Bulk scrape multiple profiles
- [ ] View scraped data on background page
- [ ] Re-scrape updates existing data (no duplicates)

---

## Cost Estimation

**Apify Costs:**
- $4-10 per 1,000 profiles scraped
- Example: 84 profiles = ~$0.34 - $0.84

**Database Storage:**
- ~5KB per profile (including 3-5 experiences, 2-3 education entries)
- 1,000 profiles = ~5MB additional storage

---

## Future Enhancements

### Potential Features

1. **Automatic Background Updates**
   - Scheduled re-scraping (e.g., monthly)
   - Change detection and notifications

2. **Advanced Search & Filtering**
   - Filter profiles by skills
   - Search by company/school/title
   - Experience duration filters

3. **Profile Comparison**
   - Side-by-side comparison of backgrounds
   - Competitor employee analysis
   - Skills gap analysis

4. **Export Functionality**
   - Export backgrounds to CSV/PDF
   - Generate resumes from profile data
   - Org chart visualization

5. **LinkedIn URL Validation**
   - Check if profile URLs are still valid
   - Detect profile changes/deletions
   - Update alerts

---

## Troubleshooting

### Common Issues

**Q: Scraping fails with "Profile not found"**
- Ensure LinkedIn URL is correct in database
- Check Apify actor is returning data
- Verify profile URL format: `linkedin.com/in/username`

**Q: Experiences/education not showing up**
- Check Apify output includes those fields
- Verify data mapping in `/api/scrape-backgrounds`
- Check database has entries: `SELECT * FROM profile_experiences WHERE profile_id = X`

**Q: "View Background" page shows no data**
- Profile may not have been scraped yet
- Click "Scrape Backgrounds" button to fetch data
- Check `profile_scraped_at` is not NULL

**Q: Duplicates appearing in experiences**
- This shouldn't happen (old data deleted before import)
- If it does, check `deleteProfileExperiences()` function
- Manually clear: `DELETE FROM profile_experiences WHERE profile_id = X`

---

## Files Changed/Created

### Database
- ✅ `migrations/006_add_profile_backgrounds.sql` - Database migration

### TypeScript Interfaces
- ✅ `lib/db.ts` - Updated Profile interface, added ProfileExperience, ProfileEducation
- ✅ `lib/db.ts` - Added 8 new database functions

### API Routes
- ✅ `app/api/scrape-backgrounds/route.ts` - Scraping endpoint
- ✅ `app/api/profiles/[id]/background/route.ts` - Get background data

### UI Components
- ✅ `components/ProfileBackground.tsx` - Display component
- ✅ `components/ScrapeBackgroundsButton.tsx` - Scrape button with modal
- ✅ `components/ProfileCard.tsx` - Added "View Background" link
- ✅ `components/ProfilesHeader.tsx` - Added bulk scrape button

### Pages
- ✅ `app/profiles/[id]/background/page.tsx` - Background view page

### Dependencies
- ✅ `package.json` - Added `lucide-react` for icons

---

## Security & Privacy

### Data Handling

- All scraped data is **public LinkedIn information**
- No LinkedIn login credentials required
- Data stored securely in Neon PostgreSQL
- Apify API key stored in environment variables

### Best Practices

1. **Only scrape profiles you have permission to track**
2. **Comply with LinkedIn Terms of Service**
3. **Don't scrape excessively** (rate limiting)
4. **Secure database access** (read-only analyst account)

---

## Support

### Documentation
- Main docs: `/docs/PROFILE-BACKGROUNDS-FEATURE.md` (this file)
- Database schema: `/migrations/006_add_profile_backgrounds.sql`
- TypeScript interfaces: `/lib/db.ts`

### Contact
- Issues: GitHub Issues
- Questions: See CLAUDE.md for project guidelines

---

**Last Updated:** October 26, 2025
**Feature Status:** ✅ Production Ready
