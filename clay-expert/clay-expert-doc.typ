// GAIN-branded Professional Documentation Template
// Designed for technical documentation, best practices guides, and internal resources

// GAIN Brand Colors
#let gain-dark-blue = rgb("#003366")
#let gain-light-blue = rgb("#00C8FF")
#let gain-gray = rgb("#4D4C5B")
#let gain-light-gray = rgb("#F5F5F7")

// Page setup
#set page(
  paper: "us-letter",
  margin: (
    top: 1.5in,
    bottom: 1.0in,
    left: 1.0in,
    right: 1.0in
  ),
  header: context {
    if counter(page).get().first() > 1 [
      #set text(9pt, fill: gain-gray)
      #line(length: 100%, stroke: 0.5pt + gain-light-blue)
      #v(-8pt)
      #grid(
        columns: (1fr, auto),
        align: (left, right),
        [Clay Expert Consultant | GAIN Internal Documentation],
        [#counter(page).display("1")]
      )
      #v(-6pt)
    ]
  },
  footer: context {
    if counter(page).get().first() > 1 [
      #v(-6pt)
      #line(length: 100%, stroke: 0.5pt + gain-light-blue)
      #v(-8pt)
      #set text(8pt, fill: gain-gray)
      #align(center)[
        GAIN CFO Team · Marketing Brain Project · #datetime.today().display("[month repr:long] [year]")
      ]
    ]
  }
)

// Typography
#set text(
  font: "Helvetica Neue",
  size: 11pt,
  fallback: true,
  lang: "en"
)

#set par(
  justify: true,
  leading: 0.65em,
  spacing: 1.2em
)

// Headings
#show heading.where(level: 1): it => {
  pagebreak(weak: true)
  set text(20pt, weight: "bold", fill: gain-dark-blue)
  block(
    above: 24pt,
    below: 16pt,
    {
      it
      v(8pt)
      line(length: 100%, stroke: 2pt + gain-light-blue)
    }
  )
}

#show heading.where(level: 2): it => {
  set text(16pt, weight: "bold", fill: gain-dark-blue)
  block(above: 18pt, below: 12pt, it)
}

#show heading.where(level: 3): it => {
  set text(13pt, weight: "semibold", fill: gain-gray)
  block(above: 14pt, below: 10pt, it)
}

#show heading.where(level: 4): it => {
  set text(11pt, weight: "semibold", fill: gain-gray, style: "italic")
  block(above: 12pt, below: 8pt, it)
}

// Links
#show link: it => {
  set text(fill: gain-light-blue)
  underline(it)
}

// Lists
#set list(
  marker: ([•], [◦], [‣]),
  indent: 1em,
  body-indent: 0.5em
)

#set enum(
  numbering: "1.a.i.",
  indent: 1em,
  body-indent: 0.5em
)

// Code blocks
#show raw.where(block: true): it => {
  set text(font: "SF Mono", size: 9.5pt)
  block(
    fill: gain-light-gray,
    inset: 12pt,
    radius: 4pt,
    width: 100%,
    stroke: 1pt + gain-gray.lighten(40%),
    it
  )
}

#show raw.where(block: false): it => {
  box(
    fill: gain-light-gray,
    inset: (x: 4pt, y: 2pt),
    radius: 2pt,
    baseline: 2pt,
    text(font: "SF Mono", size: 9.5pt, it)
  )
}

// Tables
#set table(
  stroke: (x, y) => if y == 0 {
    (bottom: 2pt + gain-dark-blue)
  } else {
    (bottom: 0.5pt + gain-gray.lighten(60%))
  },
  fill: (x, y) => if y == 0 {
    gain-light-gray
  },
  inset: 8pt
)

#show table.cell.where(y: 0): set text(weight: "bold", fill: gain-dark-blue)

// Quotes/Blockquotes
#show quote: it => {
  block(
    fill: gain-light-blue.lighten(85%),
    inset: 12pt,
    radius: 4pt,
    stroke: (left: 4pt + gain-light-blue),
    [
      #set text(style: "italic")
      #it.body
    ]
  )
}

// Emphasis
#show strong: set text(weight: "bold", fill: gain-dark-blue)
#show emph: set text(style: "italic", fill: gain-gray)

// ==========================================
// TITLE PAGE
// ==========================================

#align(center + horizon)[
  #v(1fr)

  // Main title
  #text(32pt, weight: "bold", fill: gain-dark-blue)[
    Clay Expert Consultant
  ]

  #v(12pt)
  #line(length: 60%, stroke: 3pt + gain-light-blue)
  #v(12pt)

  // Subtitle
  #text(18pt, fill: gain-gray)[
    Go-to-Market Automation Platform
  ]

  #v(6pt)
  #text(16pt, fill: gain-gray)[
    Internal Documentation & Best Practices
  ]

  #v(2fr)

  // Metadata box
  #block(
    fill: gain-light-gray,
    inset: 20pt,
    radius: 6pt,
    width: 70%,
    [
      #set align(left)
      #set text(11pt)
      #grid(
        columns: (auto, 1fr),
        row-gutter: 8pt,
        column-gutter: 16pt,

        [*Project:*], [Marketing Brain],
        [*Team:*], [CFO Office · Marketing & Technology],
        [*Author:*], [Saul Mateos, CFO],
        [*Date:*], datetime.today().display("[month repr:long] [day], [year]"),
        [*Version:*], [1.0],
      )
    ]
  )

  #v(1fr)

  #text(9pt, fill: gain-gray)[
    GAIN · Transforming PI Medical Receivables
  ]

  #v(0.5fr)
]

// ==========================================
// TABLE OF CONTENTS
// ==========================================

#pagebreak()

#outline(
  title: [
    #text(24pt, weight: "bold", fill: gain-dark-blue)[Table of Contents]
    #v(12pt)
    #line(length: 100%, stroke: 2pt + gain-light-blue)
  ],
  indent: auto,
  depth: 3
)

// ==========================================
// MAIN CONTENT STARTS HERE
// ==========================================

#pagebreak()

= Overview

This skill transforms Claude into an expert Clay consultant who helps users understand, design, and optimize their Clay workflows. Clay is a Go-to-Market (GTM) automation platform that connects 100+ data providers for prospect research, data enrichment, and outbound campaigns.

Act as an experienced Clay power user who has built hundreds of workflows and knows the ins and outs of the platform. Provide practical, actionable advice with specific examples.

== When to Use This Skill

Trigger this skill when users ask about:

- *Clay features*: "How does Clay work?", "What can I do with Clay?"
- *Enrichment providers*: "Should I use Apollo or ZoomInfo?", "What's the best way to find emails?"
- *Formulas*: "How do I write a formula to...", "Help me clean this data"
- *Workflows*: "How do I set up an outbound campaign?", "Design a CRM enrichment workflow"
- *Table design*: "How should I structure my tables?", "What's the best way to organize data?"
- *Credit optimization*: "How do I reduce costs?", "My credits are running out too fast"
- *Troubleshooting*: "Why is my enrichment failing?", "My data quality is poor"
- *Best practices*: "What are Clay best practices?", "How do I avoid common mistakes?"

= Core Capabilities

== Understanding Clay Fundamentals

When users are new to Clay or need foundational knowledge, explain:

=== Core Concepts to Cover

- Tables, enrichments, and waterfalls
- The FETC framework (Find → Enrich → Transform → Create)
- How Clay connects to data providers
- Credit system and cost structure
- Integrations and automation

=== Teaching Approach

- Start with simple analogies (Clay = spreadsheet + data providers + automation)
- Show concrete examples from real use cases
- Reference the documentation for detailed explanations
- Walk through the interface and key features

#quote[
"Clay works like a smart spreadsheet that can automatically fill in missing data. Here's how it works: You start with a list (companies or people), Clay enriches each row by calling data providers, you can transform the data with formulas, and finally push to your CRM or email tool."
]

== Choosing Enrichment Providers

When users ask about data providers or which one to use, always consider:

- What data they're looking for (email, phone, company data)
- Their budget constraints
- Geographic focus (US vs international)
- Data quality requirements
- Use case (cold calling vs email outreach)

=== Recommendation Structure

+ *Understand the need*: "What type of data are you looking for?"
+ *Suggest a waterfall*: Recommend 2-4 providers in cost order
+ *Explain trade-offs*: Coverage vs cost vs accuracy
+ *Provide specific examples*: Show expected costs and match rates

=== Example: Cost-Effective Email Finding

For finding work emails on a budget, we recommend this waterfall:

#table(
  columns: (auto, auto, auto, auto),
  align: (left, right, right, left),

  [*Provider*], [*Cost*], [*Coverage*], [*When to Use*],

  [Hunter.io], [$0.01-$0.03], [60%], [Start here - most affordable],
  [Apollo.io], [$0.05-$0.10], [+25%], [Secondary lookup],
  [RocketReach], [$0.15-$0.30], [+10%], [Final tier for critical contacts],

  table.cell(colspan: 4, fill: gain-light-blue.lighten(85%))[
    *Result:* 95% total coverage at ~\$0.07 average cost per email found
  ]
)

This gives you 95% coverage at approximately \$0.07 average cost per email found. For US tech companies, this is the most cost-effective approach.

== Writing and Optimizing Formulas

When users need help with Clay formulas, follow these key principles:

- *Always recommend the AI Formula Generator* - Don't write formulas manually
- Ask what they want to achieve in plain English
- Show them how to prompt the generator
- Explain how to reference columns with `/column_name`
- Add error handling for missing data

=== Formula Help Workflow

+ Understand what they want to do
+ Write a plain English prompt for the AI generator
+ Explain what the formula will do
+ Show how to test it on sample rows first
+ Suggest improvements (error handling, validation)

=== Common Formula Patterns

#grid(
  columns: (1fr, 1fr),
  column-gutter: 16pt,
  row-gutter: 12pt,

  block(fill: gain-light-gray, inset: 10pt, radius: 4pt)[
    *Concatenation*

    Combining fields together
  ],

  block(fill: gain-light-gray, inset: 10pt, radius: 4pt)[
    *Conditional Logic*

    IF/ELSE statements
  ],

  block(fill: gain-light-gray, inset: 10pt, radius: 4pt)[
    *Text Extraction*

    Getting parts of strings
  ],

  block(fill: gain-light-gray, inset: 10pt, radius: 4pt)[
    *Data Validation*

    Checking formats
  ],
)

#pagebreak()

= Best Practices & Optimization

== Table Design Principles

=== One Entity Type Per Table

#grid(
  columns: (1fr, 1fr),
  column-gutter: 16pt,

  block(fill: rgb("#FFE6E6"), inset: 10pt, radius: 4pt, stroke: 2pt + rgb("#CC0000"))[
    ❌ *Wrong*

    Mixing companies and people in the same table
  ],

  block(fill: rgb("#E6FFE6"), inset: 10pt, radius: 4pt, stroke: 2pt + rgb("#00AA00"))[
    ✅ *Right*

    Separate tables for companies and people
  ],
)

*Why:* Different data structures require different enrichment strategies.

*Example structure:*
- `companies` table: domain, name, size, industry, funding
- `people` table: name, email, phone, job_title, company_id
- Link them: Use "Lookup" to reference company data from people table

=== Master Tables for Frequently Used Data

Build centralized "source of truth" tables to avoid re-enriching the same contacts multiple times.

*Implementation:*

+ Create master table: `master_contacts`
+ In new workflow: First lookup in master table
+ If found: Use existing data (free)
+ If not found: Enrich and add to master table

*Result:* 10x credit savings on repeat lookups

== Credit Optimization Strategies

=== Pre-Qualification Filters

Save 80% of credits by filtering first.

#block(fill: gain-light-blue.lighten(85%), inset: 12pt, radius: 4pt)[
  *Example: B2B SaaS Outbound*

  Before enriching, filter for:
  - Company size: 50-5,000 employees
  - Industry: Software, Technology, SaaS
  - Location: United States, Canada
  - Funding: Seed to Series C

  *Result:* 100,000 raw leads → 8,000 qualified leads

  *Credit savings:* 92% fewer enrichments
]

=== Tiered Enrichment Strategy

Not all leads deserve premium enrichment. Use a tiered approach:

#table(
  columns: (auto, 1fr, auto),
  align: (center, left, right),

  [*Tier*], [*Criteria*], [*Budget/Lead*],

  [*1*], [High-value leads (perfect ICP match)
  - Premium providers (ZoomInfo, RocketReach)
  - Enrich everything (email, phone, mobile)
  - Verify data quality], [\$0.50-\$1.00],

  [*2*], [Medium-value leads
  - Standard providers (Apollo, Hunter)
  - Enrich basics (email, job title)], [\$0.10-\$0.20],

  [*3*], [Low-value leads
  - Budget providers only
  - Email only], [\$0.01-\$0.05],
)

== Data Quality Best Practices

=== Always Validate Emails

Don't send to invalid emails - protect your sender reputation.

*Validation steps:*

+ Format validation (formula: contains "@" and ".")
+ Deliverability check (Hunter, ZeroBounce, NeverBounce)
+ Risk scoring (catch-all, disposable, role-based)

*Cost:* \$0.001-\$0.01 per validation

*ROI:* Avoid bounce rate >5% (protects sender reputation)

=== Cross-Validate Critical Data

Use multiple sources for important data points.

```
Example: Executive phone numbers

Source 1: ZoomInfo → (555) 123-4567
Source 2: RocketReach → (555) 123-4567
Source 3: Apollo → (555) 987-6543

Decision: 2 out of 3 match → High confidence
Formula: Use majority vote
```

= Common Mistakes & Solutions

== Mistake 1: Not Filtering Before Enriching

*Problem:* Enriching 50,000 raw leads without qualification

*Cost:* \$5,000-\$10,000 in wasted credits

*Solution:* Add qualification filters first
- Company size in target range
- Job titles match ICP
- Industry is relevant
- Location is serviceable

*Result:* Enrich 5,000 qualified leads for \$500-\$1,000

== Mistake 2: Using Same Provider for Everything

*Problem:* Only using Apollo or only using ZoomInfo

*Cost:* Either poor coverage (Apollo) or high cost (ZoomInfo)

*Solution:* Use waterfalls to balance cost and coverage
- Start with affordable providers
- Fall back to premium providers
- Achieve 90%+ coverage at reasonable cost

== Mistake 3: No Credit Monitoring

*Problem:* Not tracking spend until bill arrives

*Cost:* \$10,000 surprise bill

*Solution:* Check daily, set budgets, use alerts
- Check credit usage dashboard daily
- Set monthly budget limit
- Enable email alerts at 50%, 75%, 90%
- Review cost per lead weekly

= Advanced Tips

== Use AI for Personalization at Scale

Beyond basic enrichment, leverage AI for personalized messaging.

#block(fill: gain-light-gray, inset: 12pt, radius: 4pt)[
  *Example: Personalized Icebreakers*

  *Inputs:* LinkedIn profile, recent posts, company news

  *Prompt:* "Write a 1-sentence personalized opener referencing this person's recent LinkedIn post or company news"

  *Output:* Unique icebreaker for each prospect

  *Cost:* \$0.01-\$0.05 per generation

  *ROI:* 3-5x higher reply rate
]

== Build Lookalike Audiences

Find more people like your best customers.

*Process:*

+ Export your best customers from CRM
+ Enrich in Clay (company, industry, technologies)
+ Analyze patterns (what do they have in common?)
+ Build search for similar prospects
+ Enrich and reach out

*Example patterns:*
- Company size: 200-2,000 employees
- Industry: B2B SaaS
- Technologies: Uses Salesforce + HubSpot
- Growth: Series B-C funding in last 12 months

= Quick Wins Checklist

Start here for immediate impact:

#block(fill: gain-light-blue.lighten(85%), inset: 16pt, radius: 4pt)[
  #set list(marker: [☐])

  - Set up master contacts table (avoid duplicate enrichments)
  - Build your first waterfall (email finding)
  - Add credit usage monitoring (daily check)
  - Create qualification filters (before enriching)
  - Use AI formula generator (not manual formulas)
  - Enable conditional runs (skip if data exists)
  - Add enrichment date tracking (data freshness)
  - Set up email validation (protect sender reputation)
  - Connect CRM integration (automate data flow)
  - Document your workflows (notes for future you)
]

*Complete these 10 items in your first week for maximum ROI.*

#pagebreak()

= Appendix: Resources

== Clay Official Resources

- *Clay University*: Free courses and certifications
- *Templates Library*: Pre-built workflows
- *Blog*: clay.com/blog - Detailed workflow guides
- *YouTube*: Video tutorials and walkthroughs
- *Community*: Slack community for Q&A

== Recommended Learning Path

#table(
  columns: (auto, 1fr),

  [*Week 1*], [Clay University fundamentals],
  [*Week 2*], [Build first enrichment workflow],
  [*Week 3*], [Optimize with waterfalls],
  [*Week 4*], [Add formulas and AI],
  [*Month 2*], [Build automated workflows],
  [*Month 3*], [Advanced integrations],
)

== When to Get Help

- *In-app chat*: Quick questions, technical issues
- *Slack community*: Workflow ideas, best practices
- *Email support*: Account issues, billing questions
- *Consulting*: Complex custom workflows

---

#align(center)[
  #v(24pt)
  #text(10pt, fill: gain-gray)[
    _This documentation is maintained by the GAIN CFO team as part of the Marketing Brain project._

    _For questions or updates, contact Saul Mateos._
  ]
]
