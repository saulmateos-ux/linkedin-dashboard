# Clay Enrichment Providers Guide

## Overview

Clay doesn't have its own database. Instead, it connects to 100+ data providers, allowing you to build custom enrichment workflows. This guide helps you choose the right providers for your use case.

## Major Data Provider Comparison

### Apollo.io
**Best for**: Budget-conscious teams needing all-in-one solution

**Strengths**:
- 210+ million verified contacts
- User-friendly interface
- Built-in email sequencing
- Affordable pricing ($49/user/month)
- Good for high-volume outreach

**Weaknesses**:
- Data quality varies by industry
- Better for US/tech markets
- Less accurate for niche industries

**Use cases**:
- Building large prospect lists
- Finding tech company contacts
- Budget-friendly outreach campaigns
- SMB and mid-market targeting

### ZoomInfo
**Best for**: Enterprise teams needing highest accuracy

**Strengths**:
- 321M+ active professionals, 104M+ companies
- 95% phone number accuracy
- Excellent US/North America coverage
- Intent data and buying signals
- Compliance-ready for regulated industries

**Weaknesses**:
- Expensive ($15,000+/year minimum)
- Overkill for small teams
- Less competitive internationally

**Use cases**:
- Enterprise B2B sales
- Regulated industries (finance, healthcare)
- Outbound calling campaigns
- Account-based marketing
- High-value deal cycles

### Clearbit (now Breeze Intelligence)
**Best for**: Marketing teams and HubSpot users

**Strengths**:
- Recently acquired by HubSpot
- 100+ B2B attributes from 250+ sources
- Excellent website visitor tracking
- Real-time enrichment
- Form enrichment (turn email → full profile)

**Weaknesses**:
- More expensive than alternatives
- Marketing-focused (less sales-oriented)
- Best value only for HubSpot customers

**Use cases**:
- Marketing automation
- Form fill enrichment
- Website visitor identification
- Ad targeting and personalization
- Lead scoring for marketing

### People Data Labs (PDL)
**Best for**: Developers and technical teams

**Strengths**:
- API-first approach
- 3+ billion people and company records
- Highly customizable
- Affordable for technical teams
- Real-time data

**Weaknesses**:
- Requires technical setup
- Less user-friendly for non-technical users
- Raw data requires cleaning

**Use cases**:
- Custom enrichment pipelines
- Building proprietary databases
- High-volume enrichment (millions of records)
- Technical GTM teams

## Enrichment Strategy: The Waterfall Approach

### What is a Waterfall?

A waterfall enriches data by trying multiple providers sequentially until data is found. This maximizes coverage while minimizing cost.

### Example: Email Finding Waterfall

```
Step 1: Check existing data (free)
  ↓ (if not found)
Step 2: Try Hunter.io ($0.01/lookup)
  ↓ (if not found)
Step 3: Try Apollo.io ($0.05/lookup)
  ↓ (if not found)
Step 4: Try ZoomInfo ($0.50/lookup)
  ↓ (if not found)
Step 5: Mark as "not found"
```

### Waterfall Best Practices

1. **Start with free/cached data**
   - Check your CRM first
   - Use previously enriched data
   - Save credits by avoiding re-lookups

2. **Order by cost (cheapest first)**
   - Free → Cheap → Moderate → Expensive
   - Most waterfalls find data in first 2-3 steps

3. **Order by quality (best first) for critical data**
   - Sometimes accuracy > cost
   - Example: Phone numbers for cold calling

4. **Limit waterfall depth**
   - Don't use 10 providers if first 3 cover 90%
   - Diminishing returns after 3-4 providers

5. **Use conditional logic**
   - Only run expensive providers for high-value leads
   - Example: "Only use ZoomInfo if company size > 1000"

## Provider Selection by Use Case

### Finding Work Emails
**Recommended waterfall**:
1. Hunter.io (cheap, good coverage)
2. Apollo.io (moderate cost, decent accuracy)
3. Prospeo (good for international)
4. RocketReach (premium option)

**When to use each**:
- Hunter: First attempt, bulk lookups
- Apollo: US-based tech companies
- Prospeo: European/international contacts
- RocketReach: Executive-level contacts

### Finding Phone Numbers
**Recommended waterfall**:
1. Apollo.io (affordable mobile numbers)
2. Kaspr (good European coverage)
3. ZoomInfo (highest accuracy, expensive)
4. Lusha (backup option)

**When to use each**:
- Apollo: Budget-friendly, US focus
- Kaspr: GDPR-compliant, Europe
- ZoomInfo: Mission-critical calling campaigns
- Lusha: B2C or mixed B2B/B2C

### Company Enrichment
**Recommended waterfall**:
1. Clearbit (comprehensive firmographics)
2. Apollo (good for tech companies)
3. ZoomInfo (enterprise data)
4. Crunchbase (funding & startup data)

**When to use each**:
- Clearbit: Marketing use cases
- Apollo: Sales prospecting
- ZoomInfo: Large enterprises
- Crunchbase: Startups and investors

### Job Title & Seniority
**Recommended providers**:
1. LinkedIn (most current)
2. Apollo.io (structured data)
3. ZoomInfo (verified data)

**Tips**:
- LinkedIn data is freshest but requires scraping
- Structured databases lag by 30-90 days
- Combine multiple sources for accuracy

### Finding Personal Emails
**Recommended waterfall**:
1. Hunter.io (pattern-based guessing)
2. Snov.io (pattern verification)
3. RocketReach (premium option)
4. ContactOut (LinkedIn-focused)

**When to use each**:
- Hunter: Bulk email pattern finding
- Snov.io: Email verification + finding
- RocketReach: High-value targets
- ContactOut: LinkedIn → email enrichment

### Technology Stack
**Recommended providers**:
1. BuiltWith (comprehensive tech tracking)
2. Clearbit (tech categories)
3. Apollo.io (basic tech data)

**Use cases**:
- Sales teams selling to companies using specific tools
- Competitive intelligence
- Market research

## Credit Optimization Strategies

### 1. Pre-filter Your List
**Don't enrich everyone - filter first!**

Example filters:
- Company size > 50 employees
- Job title contains "VP" or "Director"
- Industry = "Software"
- Location = "United States"

**Result**: Enrich 1,000 qualified leads instead of 10,000 unqualified ones

### 2. Use Conditional Enrichments
**Only run expensive enrichments on high-value leads**

Example:
- If company_size > 1000 AND industry = "Enterprise Software"
  - Then: Use ZoomInfo (expensive but accurate)
- Else: Use Apollo (cheaper)

### 3. Cache and Reuse Data
**Store enriched data in master tables**

- Build a "master contacts" table
- Lookup existing data before enriching
- Avoid re-enriching same person/company

### 4. Validate Before Enriching
**Clean your inputs to reduce failed lookups**

Example validations:
- Email format is valid
- LinkedIn URL is complete
- Company name is not generic ("LLC", "Inc.")

**Result**: Fewer wasted credits on bad data

### 5. Monitor Your Spend
**Track credits by provider and use case**

Clay provides:
- Daily credit usage dashboard
- Per-enrichment cost visibility
- Monthly spend reports

**Action**: Review weekly, adjust waterfalls as needed

## Common Mistakes to Avoid

### 1. Using Premium Providers First
**❌ Wrong**: ZoomInfo → Apollo → Hunter
**✅ Right**: Hunter → Apollo → ZoomInfo

**Why**: Premium providers should be last resort, not first choice

### 2. Enriching Before Filtering
**❌ Wrong**: Enrich all 50,000 leads → Filter
**✅ Right**: Filter to 5,000 qualified leads → Enrich

**Why**: Wasting 90% of credits on unqualified leads

### 3. Not Using Waterfalls
**❌ Wrong**: Only using one provider (e.g., Apollo only)
**✅ Right**: Waterfall across 3-4 providers

**Why**: Single provider might have 60% coverage, waterfall achieves 90%+

### 4. Re-enriching Same Data
**❌ Wrong**: Enriching same person multiple times across different tables
**✅ Right**: Use master lookup table, reference it

**Why**: Burning credits unnecessarily

### 5. Ignoring Data Quality
**❌ Wrong**: Enrich without validating inputs
**✅ Right**: Clean data first, enrich second

**Why**: "Garbage in, garbage out" - bad inputs = wasted credits

## Quick Reference: Cost Per Lookup

**Approximate costs (vary by plan and volume):**

### Email Finding
- Hunter.io: $0.01 - $0.03
- Apollo.io: $0.05 - $0.10
- RocketReach: $0.15 - $0.30
- ZoomInfo: $0.50+

### Phone Numbers
- Apollo.io: $0.10 - $0.20
- Kaspr: $0.15 - $0.25
- ZoomInfo: $0.50 - $1.00
- Lusha: $0.30 - $0.50

### Company Data
- Clearbit: $0.02 - $0.05
- Apollo.io: $0.01 - $0.03
- ZoomInfo: $0.10 - $0.50

### LinkedIn Scraping
- Apify: $0.05 - $0.15 per profile
- PhantomBuster: $0.10 - $0.20 per profile

**Note**: Actual costs depend on your Clay plan, provider contracts, and data type. Check in-app pricing for accurate rates.

## Provider Selection Decision Tree

```
What are you looking for?

├─ Work Email
│  ├─ US/Tech companies → Hunter → Apollo → RocketReach
│  └─ International → Prospeo → Hunter → Apollo
│
├─ Phone Number
│  ├─ US, budget-conscious → Apollo → Lusha
│  ├─ US, accuracy-critical → ZoomInfo → Apollo
│  └─ Europe → Kaspr → Apollo
│
├─ Company Data
│  ├─ Marketing use case → Clearbit → Apollo
│  ├─ Sales use case → Apollo → ZoomInfo
│  └─ Startup/funding data → Crunchbase → Clearbit
│
├─ Personal Email
│  └─ Hunter → Snov.io → RocketReach → ContactOut
│
├─ Technology Stack
│  └─ BuiltWith → Clearbit → Apollo
│
└─ Job Title/Seniority
   └─ LinkedIn scraping → Apollo → ZoomInfo
```

## Advanced: Multi-Step Enrichment Workflows

### Example 1: Complete Contact Enrichment
```
1. Start with LinkedIn URL
2. Scrape LinkedIn profile (Apify)
3. Find work email (waterfall: Hunter → Apollo)
4. Find phone number (waterfall: Apollo → Kaspr)
5. Enrich company data (Clearbit)
6. Verify email deliverability (Hunter verification)
7. Export to CRM
```

### Example 2: Account-Based Marketing
```
1. Start with company domain
2. Enrich company data (Clearbit)
3. Find all employees (Apollo + LinkedIn)
4. Filter by job titles (formula)
5. Enrich individual contacts (waterfall)
6. Score accounts (formula)
7. Push to ABM platform
```

### Example 3: Inbound Lead Enrichment
```
1. Trigger: New form submission (email only)
2. Enrich email → full profile (Clearbit)
3. Find LinkedIn profile (Apollo)
4. Enrich company data (Clearbit)
5. Score lead (formula)
6. Route to sales rep (CRM integration)
7. Create personalized outreach (AI)
```

## Troubleshooting Common Issues

### Low Match Rates
**Problem**: Provider only finding data 20% of the time

**Solutions**:
- Check input data quality (are LinkedIn URLs complete?)
- Try different provider (Apollo vs ZoomInfo coverage differs)
- Use waterfall to combine multiple providers
- Verify you're targeting right market (US vs international)

### High Costs
**Problem**: Burning through credits too fast

**Solutions**:
- Add filters before enriching
- Reorder waterfall (cheapest first)
- Check for duplicate enrichments
- Use conditional runs for expensive providers
- Cache frequently used data

### Inaccurate Data
**Problem**: Enriched data is wrong or outdated

**Solutions**:
- Use multiple providers and cross-validate
- Prefer real-time providers over cached databases
- Add validation formulas (check email format, phone length)
- Use premium providers for critical data
- Implement email verification step

### Compliance Concerns
**Problem**: Need GDPR/CCPA compliant enrichment

**Solutions**:
- Use compliant providers (Kaspr for EU, Lusha for privacy-first)
- Implement consent tracking
- Offer opt-out mechanisms
- Document data sources and retention
- Consult legal team for specific requirements
