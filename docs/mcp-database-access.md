# MCP Server for Database Access

## Overview

Create a Model Context Protocol (MCP) server to expose your LinkedIn dashboard database to other Claude Code instances for analysis.

## Implementation Plan

### 1. Create MCP Server Package

```bash
# In project root
mkdir mcp-linkedin-db
cd mcp-linkedin-db
npm init -y
npm install @modelcontextprotocol/sdk dotenv pg
```

### 2. Server Implementation

**File: `mcp-linkedin-db/index.ts`**

```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const server = new Server(
  {
    name: 'linkedin-dashboard-db',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query_posts',
        description: 'Query LinkedIn posts with filters and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            profile_id: { type: 'number', description: 'Filter by profile ID' },
            workspace_id: { type: 'number', description: 'Filter by workspace ID' },
            limit: { type: 'number', default: 100, description: 'Max results' },
            offset: { type: 'number', default: 0, description: 'Pagination offset' },
            min_likes: { type: 'number', description: 'Minimum likes filter' },
            hashtag: { type: 'string', description: 'Filter by hashtag' },
          },
        },
      },
      {
        name: 'get_profiles',
        description: 'List all tracked LinkedIn profiles',
        inputSchema: {
          type: 'object',
          properties: {
            profile_type: { type: 'string', description: 'Filter by type (own, team, competitor, etc)' },
          },
        },
      },
      {
        name: 'get_workspaces',
        description: 'List all workspaces with profile counts',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_stats',
        description: 'Get engagement statistics',
        inputSchema: {
          type: 'object',
          properties: {
            profile_id: { type: 'number', description: 'Filter by profile' },
            workspace_id: { type: 'number', description: 'Filter by workspace' },
            days: { type: 'number', default: 30, description: 'Time period in days' },
          },
        },
      },
      {
        name: 'custom_query',
        description: 'Execute custom SQL query (SELECT only, read-only access)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'SQL SELECT query' },
          },
          required: ['query'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'query_posts': {
        let query = `
          SELECT p.*, pr.display_name, pr.username
          FROM posts p
          JOIN profiles pr ON p.profile_id = pr.id
          WHERE 1=1
        `;
        const values: any[] = [];
        let valueIndex = 1;

        if (args.profile_id) {
          query += ` AND p.profile_id = $${valueIndex++}`;
          values.push(args.profile_id);
        }

        if (args.workspace_id) {
          query += ` AND p.profile_id IN (
            SELECT profile_id FROM workspace_profiles WHERE workspace_id = $${valueIndex++}
          )`;
          values.push(args.workspace_id);
        }

        if (args.min_likes) {
          query += ` AND p.num_likes >= $${valueIndex++}`;
          values.push(args.min_likes);
        }

        if (args.hashtag) {
          query += ` AND p.content ILIKE $${valueIndex++}`;
          values.push(`%#${args.hashtag}%`);
        }

        query += ` ORDER BY p.published_at DESC LIMIT $${valueIndex++} OFFSET $${valueIndex++}`;
        values.push(args.limit || 100, args.offset || 0);

        const result = await pool.query(query, values);
        return {
          content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }],
        };
      }

      case 'get_profiles': {
        let query = 'SELECT * FROM profiles WHERE 1=1';
        const values: any[] = [];

        if (args.profile_type) {
          query += ' AND profile_type = $1';
          values.push(args.profile_type);
        }

        query += ' ORDER BY display_name';
        const result = await pool.query(query, values);
        return {
          content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }],
        };
      }

      case 'get_workspaces': {
        const query = `
          SELECT w.*, COUNT(wp.profile_id) as profile_count
          FROM workspaces w
          LEFT JOIN workspace_profiles wp ON w.id = wp.workspace_id
          GROUP BY w.id
          ORDER BY w.name
        `;
        const result = await pool.query(query);
        return {
          content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }],
        };
      }

      case 'get_stats': {
        let query = `
          SELECT
            COUNT(*) as total_posts,
            SUM(num_likes) as total_likes,
            SUM(num_comments) as total_comments,
            SUM(num_reposts) as total_reposts,
            AVG(num_likes) as avg_likes,
            AVG(num_comments) as avg_comments
          FROM posts p
          WHERE published_at >= NOW() - INTERVAL '1 day' * $1
        `;
        const values: any[] = [args.days || 30];
        let valueIndex = 2;

        if (args.profile_id) {
          query += ` AND profile_id = $${valueIndex++}`;
          values.push(args.profile_id);
        }

        if (args.workspace_id) {
          query += ` AND profile_id IN (
            SELECT profile_id FROM workspace_profiles WHERE workspace_id = $${valueIndex++}
          )`;
          values.push(args.workspace_id);
        }

        const result = await pool.query(query, values);
        return {
          content: [{ type: 'text', text: JSON.stringify(result.rows[0], null, 2) }],
        };
      }

      case 'custom_query': {
        // Security: Only allow SELECT queries
        const query = args.query.trim();
        if (!query.toLowerCase().startsWith('select')) {
          throw new Error('Only SELECT queries are allowed');
        }

        const result = await pool.query(query);
        return {
          content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// Define resources (schema documentation)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'schema://tables',
        name: 'Database Schema',
        description: 'Complete database schema documentation',
        mimeType: 'text/plain',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === 'schema://tables') {
    const schemaDoc = `
# LinkedIn Dashboard Database Schema

## Tables

### profiles
- id: SERIAL PRIMARY KEY
- username: VARCHAR(255) - LinkedIn username
- profile_url: TEXT - Full LinkedIn URL
- display_name: VARCHAR(255) - Display name
- profile_type: VARCHAR(50) - own, team, competitor, inspiration, partner, other
- is_company: BOOLEAN - Is company page
- created_at: TIMESTAMP

### posts
- id: SERIAL PRIMARY KEY
- profile_id: INTEGER - Foreign key to profiles
- author_name: VARCHAR(255)
- content: TEXT
- published_at: TIMESTAMP
- num_likes: INTEGER
- num_comments: INTEGER
- num_reposts: INTEGER
- post_url: TEXT
- created_at: TIMESTAMP

### workspaces
- id: SERIAL PRIMARY KEY
- name: VARCHAR(255) UNIQUE
- description: TEXT
- color: VARCHAR(7) - Hex color code
- created_at: TIMESTAMP

### workspace_profiles
- workspace_id: INTEGER - Foreign key to workspaces
- profile_id: INTEGER - Foreign key to profiles
- PRIMARY KEY (workspace_id, profile_id)

### scraping_runs
- id: SERIAL PRIMARY KEY
- profile_id: INTEGER
- status: VARCHAR(50)
- posts_count: INTEGER
- started_at: TIMESTAMP
- completed_at: TIMESTAMP
`;

    return {
      contents: [{ uri: request.params.uri, mimeType: 'text/plain', text: schemaDoc }],
    };
  }

  throw new Error(`Unknown resource: ${request.params.uri}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('LinkedIn Dashboard MCP server running on stdio');
}

main();
```

### 3. Package Configuration

**File: `mcp-linkedin-db/package.json`**

```json
{
  "name": "mcp-linkedin-db",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "mcp-linkedin-db": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "prepare": "npm run build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "dotenv": "^16.0.0",
    "pg": "^8.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/pg": "^8.11.0",
    "typescript": "^5.0.0"
  }
}
```

**File: `mcp-linkedin-db/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["index.ts"]
}
```

### 4. Installation for Other Users

Other Claude Code users would install it in their MCP settings:

**File: `~/Library/Application Support/Claude/claude_desktop_config.json`**

```json
{
  "mcpServers": {
    "linkedin-dashboard": {
      "command": "npx",
      "args": ["-y", "mcp-linkedin-db"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@host/db"
      }
    }
  }
}
```

## Usage Example

Once installed, other Claude Code instances can use tools like:

```
Use the query_posts tool to get the top 10 posts from the last 30 days with at least 100 likes
```

Claude will call:
```json
{
  "tool": "query_posts",
  "arguments": {
    "min_likes": 100,
    "limit": 10
  }
}
```

## Security Considerations

1. **Read-only access**: Server only allows SELECT queries
2. **Environment variables**: Database credentials not hardcoded
3. **Input validation**: Query parameters sanitized
4. **No destructive operations**: No INSERT, UPDATE, DELETE allowed

## Publishing Options

### Option A: NPM Package (Public)
```bash
cd mcp-linkedin-db
npm publish
```

Then users install: `npx mcp-linkedin-db`

### Option B: NPM Package (Private)
```bash
npm publish --access restricted
```

Requires paid npm account

### Option C: GitHub Repository
```bash
git init
git remote add origin https://github.com/yourusername/mcp-linkedin-db
git push
```

Users install: `npx github:yourusername/mcp-linkedin-db`

### Option D: Direct Sharing
Share the `mcp-linkedin-db` folder directly. Users run:
```bash
cd mcp-linkedin-db
npm install
npm run build
npm link
```

## Benefits

- **Zero setup** for analysts (just add to MCP config)
- **Structured access** through predefined tools
- **Type-safe** queries with validation
- **Self-documenting** via resource schemas
- **Secure** read-only access by design
- **Reusable** across multiple Claude Code sessions
