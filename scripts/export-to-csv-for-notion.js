/**
 * Export posts to CSV for Notion import
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function exportToCSV() {
  try {
    console.log('📊 Exporting posts to CSV for Notion...\n');

    const result = await pool.query(`
      SELECT
        p.id,
        p.author_name as "Author",
        p.author_username as "Username",
        TO_CHAR(p.published_at, 'YYYY-MM-DD') as "Date",
        p.content as "Content",
        p.likes as "Likes",
        p.comments as "Comments",
        p.shares as "Shares",
        p.engagement_total as "Total Engagement",
        COALESCE(p.hashtags::text, '[]') as "Hashtags",
        p.post_url as "URL",
        STRING_AGG(DISTINCT w.name, ', ') as "Workspaces"
      FROM posts p
      JOIN profiles pr ON p.profile_id = pr.id
      LEFT JOIN workspace_profiles wp ON pr.id = wp.profile_id
      LEFT JOIN workspaces w ON wp.workspace_id = w.id
      GROUP BY p.id, p.author_name, p.author_username, p.published_at, p.content,
               p.likes, p.comments, p.shares, p.engagement_total, p.hashtags, p.post_url
      ORDER BY p.published_at DESC
    `);

    // Create CSV
    const headers = Object.keys(result.rows[0]).filter(k => k !== 'id');
    const csvRows = [headers.join(',')];

    result.rows.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma or newline
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')
          ? `"${escaped}"`
          : escaped;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const outputPath = path.join(process.cwd(), 'exports', 'linkedin-posts-for-notion.csv');

    // Create exports directory if it doesn't exist
    if (!fs.existsSync(path.join(process.cwd(), 'exports'))) {
      fs.mkdirSync(path.join(process.cwd(), 'exports'));
    }

    fs.writeFileSync(outputPath, csvContent);

    console.log(`✅ Exported ${result.rows.length} posts to:`);
    console.log(`   ${outputPath}\n`);

    console.log('📋 Next steps:');
    console.log('   1. Go to Notion');
    console.log('   2. Create a new database');
    console.log('   3. Click "..." → Import → CSV');
    console.log(`   4. Upload: ${outputPath}`);
    console.log('   5. Done! All 746 posts will be imported\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

exportToCSV();
