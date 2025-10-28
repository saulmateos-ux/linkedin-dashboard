import { NewsArticle, createSignal, IntelligenceSignal } from '../intelligence';

interface AnalysisResult {
  relevance_score: number;
  sentiment_score: number;
  category: string;
  entities: {
    companies?: string[];
    people?: string[];
    products?: string[];
  };
  key_points?: string[];
}

export async function detectSignals(
  article: NewsArticle,
  analysis: AnalysisResult
): Promise<void> {
  const signals: Omit<IntelligenceSignal, 'id' | 'detected_at'>[] = [];

  // Only create signals for high-relevance articles
  if (!analysis.relevance_score || analysis.relevance_score < 0.6) {
    return;
  }

  const companyName = analysis.entities.companies?.[0] || 'Unknown Company';

  // 1. Funding detection
  if (analysis.category === 'funding') {
    const fundingAmount = extractFundingAmount(article.title, article.description);

    if (fundingAmount) {
      const priority = determineFundingPriority(fundingAmount);

      signals.push({
        signal_type: 'major_funding',
        title: `${companyName} raised $${formatAmount(fundingAmount)}`,
        description: article.description?.substring(0, 200),
        priority,
        article_id: article.id,
        profile_id: article.profile_id,
        workspace_id: article.workspace_id,
        metadata: { amount: fundingAmount },
        acknowledged: false,
      });
    }
  }

  // 2. Product launch detection
  if (analysis.category === 'product_launch') {
    const productName = analysis.entities.products?.[0];

    signals.push({
      signal_type: 'product_launch',
      title: productName
        ? `${companyName} launched ${productName}`
        : `${companyName} announced new product`,
      description: article.description?.substring(0, 200),
      priority: 'medium',
      article_id: article.id,
      profile_id: article.profile_id,
      workspace_id: article.workspace_id,
      metadata: { product: productName },
      acknowledged: false,
    });
  }

  // 3. Acquisition detection
  if (analysis.category === 'acquisition') {
    signals.push({
      signal_type: 'acquisition',
      title: `Acquisition: ${article.title.substring(0, 80)}`,
      description: article.description?.substring(0, 200),
      priority: 'high',
      article_id: article.id,
      profile_id: article.profile_id,
      workspace_id: article.workspace_id,
      acknowledged: false,
    });
  }

  // 4. Leadership change detection
  if (analysis.category === 'leadership_change') {
    const personName = analysis.entities.people?.[0];

    signals.push({
      signal_type: 'leadership_change',
      title: personName
        ? `Leadership change: ${personName} at ${companyName}`
        : `Leadership change at ${companyName}`,
      description: article.description?.substring(0, 200),
      priority: 'medium',
      article_id: article.id,
      profile_id: article.profile_id,
      workspace_id: article.workspace_id,
      metadata: { person: personName },
      acknowledged: false,
    });
  }

  // 5. Hiring spike detection (keyword-based)
  if (
    analysis.category === 'hiring' ||
    article.title.toLowerCase().includes('hiring') ||
    article.description?.toLowerCase().includes('hiring')
  ) {
    const hiringCount = extractHiringCount(article.title, article.description);

    if (hiringCount && hiringCount > 10) {
      signals.push({
        signal_type: 'hiring_spike',
        title: `${companyName} hiring ${hiringCount}+ employees`,
        description: article.description?.substring(0, 200),
        priority: hiringCount > 50 ? 'high' : 'medium',
        article_id: article.id,
        profile_id: article.profile_id,
        workspace_id: article.workspace_id,
        metadata: { count: hiringCount },
        acknowledged: false,
      });
    }
  }

  // 6. Regulatory/compliance events
  if (analysis.category === 'regulation') {
    signals.push({
      signal_type: 'regulatory_event',
      title: `Regulatory news: ${article.title.substring(0, 80)}`,
      description: article.description?.substring(0, 200),
      priority: Math.abs(analysis.sentiment_score) > 0.5 ? 'high' : 'medium',
      article_id: article.id,
      profile_id: article.profile_id,
      workspace_id: article.workspace_id,
      acknowledged: false,
    });
  }

  // Save all detected signals
  for (const signal of signals) {
    try {
      await createSignal(signal);
    } catch (error) {
      console.error('Failed to create signal:', error);
    }
  }
}

// Extract funding amount from text
function extractFundingAmount(title: string, description?: string): number | null {
  const text = `${title} ${description || ''}`.toLowerCase();

  // Patterns to match funding amounts
  const patterns = [
    /\$(\d+(?:\.\d+)?)\s*(?:billion|b\b)/i,
    /\$(\d+(?:\.\d+)?)\s*(?:million|m\b)/i,
    /raised\s+\$?(\d+(?:\.\d+)?)\s*(?:billion|b\b)/i,
    /raised\s+\$?(\d+(?:\.\d+)?)\s*(?:million|m\b)/i,
    /(\d+(?:\.\d+)?)\s*(?:billion|b\b)\s+(?:funding|investment)/i,
    /(\d+(?:\.\d+)?)\s*(?:million|m\b)\s+(?:funding|investment)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);

      // Convert to dollars
      if (text.substring(match.index || 0).includes('billion') ||
          text.substring(match.index || 0).includes(' b')) {
        return amount * 1_000_000_000;
      }
      return amount * 1_000_000;
    }
  }

  return null;
}

// Extract hiring count from text
function extractHiringCount(title: string, description?: string): number | null {
  const text = `${title} ${description || ''}`;

  const patterns = [
    /hiring\s+(\d+)/i,
    /(\d+)\s+(?:new\s+)?(?:employees|positions|roles|jobs)/i,
    /adding\s+(\d+)\s+(?:employees|positions)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }

  return null;
}

// Determine funding priority based on amount
function determineFundingPriority(amount: number): 'low' | 'medium' | 'high' | 'critical' {
  if (amount >= 100_000_000) return 'critical'; // $100M+
  if (amount >= 50_000_000) return 'high';       // $50M+
  if (amount >= 10_000_000) return 'medium';     // $10M+
  return 'low';
}

// Format amount for display
function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  return `${(amount / 1000).toFixed(0)}K`;
}
