# Beautiful Documents Skill

**Version**: 1.0.0
**Created**: October 25, 2025
**Author**: Saul Mateos, CFO @ GAIN

Generate investment-grade GAIN-branded documents with zero manual formatting fixes.

## Quick Start

```bash
# 1. Copy template
cp templates/lender-update.qmd My_Document.qmd

# 2. Edit content
# [Add your content to My_Document.qmd]

# 3. Render to PDF
quarto render My_Document.qmd --to typst

# 4. Validate (optional)
python3 scripts/validate-document.py My_Document.pdf

# 5. Open
open My_Document.pdf
```

**Result**: Professional PDF ready to send (0 manual fixes needed).

## What's Included

```
beautiful-documents/
├── SKILL.md                        # Complete skill documentation
├── README.md                       # This file
├── templates/
│   ├── lender-update.qmd          # Quarterly lender updates
│   ├── executive-summary.qmd      # One-page KPI dashboards
│   └── financial-report.qmd       # P&L/BS/CF analysis
├── scripts/
│   └── validate-document.py       # Quality validation
└── examples/
    ├── README.md                  # Usage examples
    └── sample-input.md            # Example markdown content
```

## Features

- **Automatic page break optimization** - No orphaned headings or signatures
- **GAIN brand colors** - #003366 (dark blue), #00C8FF (light blue)
- **Professional typography** - Helvetica Neue with proper kerning
- **Intelligent tables** - Stay intact, no mid-table breaks
- **Callout boxes** - Blue/green/yellow for highlights and warnings
- **Fast compilation** - 2-3 seconds for 15-page documents
- **Small file sizes** - ~100 KB for typical lender updates

## Usage

### Create Lender Update

```bash
cp templates/lender-update.qmd Q4_2025_Lender_Update.qmd
# Edit content, then:
quarto render Q4_2025_Lender_Update.qmd --to typst
```

### Create Executive Summary

```bash
cp templates/executive-summary.qmd Q4_2025_Executive_Summary.qmd
# Edit content, then:
quarto render Q4_2025_Executive_Summary.qmd --to typst
```

### Create Financial Report

```bash
cp templates/financial-report.qmd October_2025_Financial_Report.qmd
# Edit content, then:
quarto render October_2025_Financial_Report.qmd --to typst
```

## Key Concepts

### Callout Boxes

```markdown
::: {.callout-note}
## Blue Info Box
For key milestones, important dates, strategic highlights
:::

::: {.callout-tip}
## Green Success Box
For positive metrics, achievements, wins
:::

::: {.callout-warning}
## Yellow Caution Box
For risks, challenges, items requiring attention
:::
```

### Tables

```markdown
| Metric | Q3 Forecast | Q3 Actual | Variance |
|--------|-------------|-----------|----------|
| Collections | $5.2M | $5.8M | +12% |
| Net Cash Flow | $1.1M | $1.3M | +18% |

: Q3 Financial Performance {#tbl-performance}
```

### Page Breaks

```markdown
{{< pagebreak >}}
```

Use sparingly - Quarto optimizes automatically.

## Requirements

- **Quarto**: v1.6+ (`brew install quarto`)
- **Typst**: v0.14+ (`brew install typst`)
- **Python**: 3.8+ (for validation script)

Check installation:
```bash
quarto --version && typst --version
```

## Validation

Test document quality:

```bash
python3 scripts/validate-document.py document.pdf
```

Checks:
- File exists and is readable
- Page count reasonable
- File size optimized (< 2 MB)
- PDF created successfully

## Examples

### Test Sample (Included)

```bash
cd /Users/saulmateos/Documents/GitHub/linkedin-dashboard/.claude/skills/beautiful-documents
quarto render test-sample.qmd --to typst
open test-sample.pdf
```

**Output**: 6-page lender update, 84 KB, professional quality.

### Real Q3 2025 Lender Update

**Source**: `/Users/saulmateos/Documents/Marketing Brain/Projects/Lender Update/`
**Pages**: 14 pages
**Size**: 143 KB
**Sections**: Executive summary, sales update, finance update, metrics, summary

## Quality Standards

Documents meet:
- ✓ Investment-grade typography
- ✓ GAIN brand colors throughout
- ✓ No orphaned content
- ✓ Tables intact (no breaks)
- ✓ Optimized file size
- ✓ Professional spacing
- ✓ Consistent formatting

## Troubleshooting

**Font warnings?**
Non-critical. Quarto uses fallback fonts automatically.

**Table too wide?**
Reduce columns or use landscape orientation in YAML:
```yaml
format:
  typst:
    orientation: landscape
```

**Callouts not colored?**
Verify syntax: `:::` fences with `{.callout-note}`.

**Wrong page breaks?**
Remove manual `{{< pagebreak >}}` and let Quarto optimize.

## Support

1. Check `SKILL.md` for complete documentation
2. Review `examples/README.md` for usage patterns
3. Test with minimal example (one section)
4. Verify installation: `quarto --version && typst --version`

## Skill Integration

This skill activates automatically when user asks to:
- "Create a lender update"
- "Generate board deck"
- "Make financial report"
- "Create executive summary"
- "Draft investor update"

See `SKILL.md` for complete behavior specification.

---

**Created**: October 25, 2025
**Last Updated**: October 25, 2025
**Version**: 1.0.0
**Location**: `/Users/saulmateos/Documents/GitHub/linkedin-dashboard/.claude/skills/beautiful-documents/`
