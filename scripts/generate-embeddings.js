#!/usr/bin/env node

/**
 * LinkedIn Dashboard - Generate OpenAI Embeddings
 *
 * This script generates embeddings for all posts in the database using OpenAI's
 * text-embedding-3-small model. Embeddings enable semantic search capabilities.
 *
 * Prerequisites:
 * - OpenAI API key in .env.local (OPENAI_API_KEY)
 * - Database connection string in .env.local (DATABASE_URL)
 * - pgvector extension enabled (run create-intelligence-views.sql first)
 *
 * Usage:
 *   node scripts/generate-embeddings.js [options]
 *
 * Options:
 *   --batch-size <number>    Number of posts to process per batch (default: 100)
 *   --dry-run                Show what would be done without making changes
 *   --force                  Regenerate embeddings even if they exist
 *   --profile-id <number>    Only generate embeddings for specific profile
 *   --limit <number>         Maximum number of posts to process
 *
 * Cost estimation:
 *   - text-embedding-3-small: $0.00002 per 1K tokens
 *   - Average LinkedIn post: ~200 tokens
 *   - Cost per post: ~$0.000004 (less than a penny per 1000 posts)
 *   - 300 posts ≈ $0.0012 (~$0.20 one-time)
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import OpenAI from 'openai';
import ora from 'ora';
import chalk from 'chalk';

// Load environment variables
config({ path: '.env.local' });

// Configuration
const BATCH_SIZE = parseInt(process.argv.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '100');
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const PROFILE_ID = process.argv.find(arg => arg.startsWith('--profile-id='))?.split('=')[1];
const LIMIT = parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '0');

// OpenAI configuration
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const COST_PER_1K_TOKENS = 0.00002; // $0.00002 per 1K tokens
const AVG_TOKENS_PER_POST = 200; // Conservative estimate

// Initialize clients
let pool;
let openai;

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5, // Smaller pool for batch script
    idleTimeoutMillis: 30000,
  });

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.error(chalk.red('❌ Initialization error:'), error.message);
  process.exit(1);
}

/**
 * Calculate estimated cost for embeddings
 */
function estimateCost(numPosts) {
  const totalTokens = numPosts * AVG_TOKENS_PER_POST;
  const cost = (totalTokens / 1000) * COST_PER_1K_TOKENS;
  return cost;
}

/**
 * Generate embedding for a single piece of text
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    return response.data[0].embedding;
  } catch (error) {
    if (error.status === 429) {
      // Rate limit - wait and retry
      console.log(chalk.yellow('⏳ Rate limited, waiting 60 seconds...'));
      await new Promise(resolve => setTimeout(resolve, 60000));
      return generateEmbedding(text); // Retry
    }
    throw error;
  }
}

/**
 * Process a batch of posts
 */
async function processBatch(posts) {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const post of posts) {
    try {
      // Prepare text for embedding (combine content + hashtags for better semantic search)
      const hashtagText = Array.isArray(post.hashtags)
        ? post.hashtags.join(' ')
        : '';
      const textToEmbed = `${post.content} ${hashtagText}`.trim();

      if (!textToEmbed) {
        console.log(chalk.yellow(`⚠️  Skipping post ${post.id} (no content)`));
        results.failed++;
        continue;
      }

      // Generate embedding
      const embedding = await generateEmbedding(textToEmbed);

      if (!DRY_RUN) {
        // Update database with embedding
        await pool.query(
          'UPDATE posts SET embedding = $1, updated_at = NOW() WHERE id = $2',
          [`[${embedding.join(',')}]`, post.id]
        );
      }

      results.success++;
      process.stdout.write(chalk.green('.'));
    } catch (error) {
      results.failed++;
      results.errors.push({
        postId: post.id,
        error: error.message,
      });
      process.stdout.write(chalk.red('x'));
    }

    // Rate limiting: Small delay between requests (OpenAI allows 3000 RPM on tier 1)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  process.stdout.write('\n');
  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log(chalk.bold.cyan('\n🚀 LinkedIn Dashboard - Embedding Generator\n'));

  if (DRY_RUN) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be made\n'));
  }

  // Step 1: Check prerequisites
  const spinner = ora('Checking prerequisites...').start();

  if (!process.env.OPENAI_API_KEY) {
    spinner.fail('OPENAI_API_KEY not found in .env.local');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    spinner.fail('DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  // Verify pgvector extension
  try {
    const extResult = await pool.query(
      "SELECT extversion FROM pg_extension WHERE extname = 'vector'"
    );
    if (extResult.rows.length === 0) {
      spinner.fail('pgvector extension not installed. Run create-intelligence-views.sql first.');
      process.exit(1);
    }
    spinner.succeed(`pgvector v${extResult.rows[0].extversion} is installed`);
  } catch (error) {
    spinner.fail(`Database error: ${error.message}`);
    process.exit(1);
  }

  // Step 2: Fetch posts needing embeddings
  spinner.start('Fetching posts from database...');

  let whereClause = FORCE ? 'TRUE' : 'embedding IS NULL';
  const params = [];

  if (PROFILE_ID) {
    whereClause += ' AND profile_id = $1';
    params.push(PROFILE_ID);
  }

  let query = `
    SELECT id, content, hashtags
    FROM posts
    WHERE ${whereClause}
    ORDER BY published_at DESC
  `;

  if (LIMIT > 0) {
    query += ` LIMIT ${LIMIT}`;
  }

  let posts;
  try {
    const result = await pool.query(query, params);
    posts = result.rows;
    spinner.succeed(`Found ${posts.length} posts needing embeddings`);
  } catch (error) {
    spinner.fail(`Database query failed: ${error.message}`);
    process.exit(1);
  }

  if (posts.length === 0) {
    console.log(chalk.green('\n✅ All posts already have embeddings!'));
    await pool.end();
    process.exit(0);
  }

  // Step 3: Cost estimation
  const estimatedCost = estimateCost(posts.length);
  console.log(chalk.cyan('\n📊 Estimation:'));
  console.log(`   Posts to process: ${posts.length}`);
  console.log(`   Estimated tokens: ${posts.length * AVG_TOKENS_PER_POST}`);
  console.log(`   Estimated cost: ${chalk.bold('$' + estimatedCost.toFixed(4))}`);
  console.log(`   Model: ${EMBEDDING_MODEL}`);
  console.log(`   Batch size: ${BATCH_SIZE}\n`);

  // Step 4: Process in batches
  console.log(chalk.cyan('🔄 Processing batches...\n'));

  const totalBatches = Math.ceil(posts.length / BATCH_SIZE);
  let processedCount = 0;
  let successCount = 0;
  let failCount = 0;
  const allErrors = [];

  const startTime = Date.now();

  for (let i = 0; i < totalBatches; i++) {
    const batchStart = i * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, posts.length);
    const batch = posts.slice(batchStart, batchEnd);

    console.log(chalk.blue(`\nBatch ${i + 1}/${totalBatches} (posts ${batchStart + 1}-${batchEnd}):`));

    const batchResults = await processBatch(batch);

    processedCount += batch.length;
    successCount += batchResults.success;
    failCount += batchResults.failed;
    allErrors.push(...batchResults.errors);

    const progress = ((processedCount / posts.length) * 100).toFixed(1);
    console.log(chalk.gray(`Progress: ${processedCount}/${posts.length} (${progress}%)`));

    // Wait between batches to avoid rate limits
    if (i < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  // Step 5: Verify and report
  console.log(chalk.cyan('\n📈 Verifying database updates...\n'));

  if (!DRY_RUN) {
    const verifyResult = await pool.query(
      'SELECT COUNT(*) as total, COUNT(embedding) as with_embeddings FROM posts'
    );
    const stats = verifyResult.rows[0];

    console.log(chalk.bold.green('✅ Embedding generation complete!\n'));
    console.log(chalk.cyan('📊 Final Statistics:'));
    console.log(`   Total posts: ${stats.total}`);
    console.log(`   Posts with embeddings: ${stats.with_embeddings}`);
    console.log(`   Posts without embeddings: ${stats.total - stats.with_embeddings}`);
    console.log(`   Successfully processed: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Duration: ${duration}s`);
    console.log(`   Actual cost: ${chalk.bold('~$' + estimatedCost.toFixed(4))}\n`);

    if (stats.with_embeddings === parseInt(stats.total)) {
      console.log(chalk.green('🎉 All posts now have embeddings! Semantic search is ready.\n'));
    } else {
      console.log(chalk.yellow(`⚠️  ${stats.total - stats.with_embeddings} posts still need embeddings.\n`));
    }
  } else {
    console.log(chalk.yellow('✅ Dry run complete (no changes made)\n'));
    console.log(chalk.cyan('📊 Would have processed:'));
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Duration: ${duration}s\n`);
  }

  // Report errors
  if (allErrors.length > 0) {
    console.log(chalk.red(`\n⚠️  ${allErrors.length} errors occurred:\n`));
    allErrors.slice(0, 10).forEach(err => {
      console.log(chalk.red(`   Post ${err.postId}: ${err.error}`));
    });
    if (allErrors.length > 10) {
      console.log(chalk.gray(`   ... and ${allErrors.length - 10} more errors\n`));
    }
  }

  // Next steps
  if (!DRY_RUN && successCount > 0) {
    console.log(chalk.cyan('🎯 Next Steps:'));
    console.log('   1. Test semantic search in Neon console:');
    console.log(chalk.gray('      SELECT * FROM semantic_search(\'[...embedding...]\', 5);\n'));
    console.log('   2. Query via Data API:');
    console.log(chalk.gray('      GET /posts?select=*&order=embedding.dist($embedding)&limit=10\n'));
    console.log('   3. Integrate with AI tools (see docs/AI-QUERY-GUIDE.md)\n');
    console.log('   4. Set up auto-embedding on new posts (see PLAN.md Phase 5)\n');
  }

  await pool.end();
}

// Error handling
process.on('unhandledRejection', async (error) => {
  console.error(chalk.red('\n❌ Unhandled error:'), error);
  if (pool) {
    await pool.end();
  }
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n\n⚠️  Interrupted by user. Cleaning up...'));
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

// Run main function
main().catch(async (error) => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  if (pool) {
    await pool.end();
  }
  process.exit(1);
});
