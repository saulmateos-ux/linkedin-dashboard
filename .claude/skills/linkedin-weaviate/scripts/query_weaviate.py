#!/usr/bin/env python3
"""
Reusable script for querying the LinkedIn Weaviate database.

Usage:
    python query_weaviate.py --query "AI automation" --limit 10
    python query_weaviate.py --query "CFO challenges" --workspace 3 --min-engagement 50
    python query_weaviate.py --count  # Get total post count
    python query_weaviate.py --hashtags --days 30  # Trending hashtags

Environment Variables Required:
    WEAVIATE_URL - Weaviate cluster URL
    WEAVIATE_API_KEY - Weaviate API key
    OPENAI_API_KEY - OpenAI API key (for vectorization)
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta
from typing import Optional, List
import urllib.request
import urllib.error


def get_credentials():
    """Get Weaviate credentials from environment."""
    url = os.environ.get('WEAVIATE_URL')
    api_key = os.environ.get('WEAVIATE_API_KEY')
    openai_key = os.environ.get('OPENAI_API_KEY')

    if not url or not api_key or not openai_key:
        print("Error: Missing required environment variables", file=sys.stderr)
        print("Required:", file=sys.stderr)
        print("  WEAVIATE_URL", file=sys.stderr)
        print("  WEAVIATE_API_KEY", file=sys.stderr)
        print("  OPENAI_API_KEY", file=sys.stderr)
        print("\nSet them in ~/.zshrc or source a credentials file", file=sys.stderr)
        sys.exit(1)

    return url, api_key, openai_key


def execute_query(url: str, api_key: str, openai_key: str, query: str) -> dict:
    """Execute a GraphQL query against Weaviate."""
    endpoint = f"{url}/v1/graphql"

    headers = {
        'Authorization': f'Bearer {api_key}',
        'X-OpenAI-Api-Key': openai_key,
        'Content-Type': 'application/json'
    }

    data = json.dumps({'query': query}).encode('utf-8')

    req = urllib.request.Request(endpoint, data=data, headers=headers)

    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}", file=sys.stderr)
        print(e.read().decode('utf-8'), file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}", file=sys.stderr)
        sys.exit(1)


def semantic_search(
    url: str,
    api_key: str,
    openai_key: str,
    query: str,
    limit: int = 10,
    workspace_ids: Optional[List[int]] = None,
    min_engagement: Optional[int] = None,
    start_date: Optional[str] = None,
    profile_ids: Optional[List[int]] = None
):
    """Perform semantic search with optional filters."""

    # Build where clause
    where_conditions = []

    if workspace_ids:
        where_conditions.append({
            'path': ['workspaceIds'],
            'operator': 'ContainsAny',
            'valueInt': workspace_ids
        })

    if min_engagement:
        where_conditions.append({
            'path': ['engagementTotal'],
            'operator': 'GreaterThanEqual',
            'valueInt': min_engagement
        })

    if start_date:
        where_conditions.append({
            'path': ['publishedAt'],
            'operator': 'GreaterThanEqual',
            'valueDate': start_date
        })

    if profile_ids:
        where_conditions.append({
            'path': ['profileId'],
            'operator': 'Equal',
            'valueInt': profile_ids[0] if len(profile_ids) == 1 else profile_ids
        })

    # Build where clause string
    where_clause = ""
    if where_conditions:
        if len(where_conditions) == 1:
            cond = where_conditions[0]
            where_clause = f'''
                where: {{
                    path: {json.dumps(cond['path'])}
                    operator: {cond['operator']}
                    {'valueInt: ' + str(cond.get('valueInt', '')) if 'valueInt' in cond else ''}
                    {'valueDate: "' + cond.get('valueDate', '') + '"' if 'valueDate' in cond else ''}
                }}
            '''
        else:
            operands_str = ',\n'.join([
                f'''{{
                    path: {json.dumps(cond['path'])}
                    operator: {cond['operator']}
                    {'valueInt: ' + str(cond.get('valueInt', '')) if 'valueInt' in cond else ''}
                    {'valueDate: "' + cond.get('valueDate', '') + '"' if 'valueDate' in cond else ''}
                }}'''
                for cond in where_conditions
            ])
            where_clause = f'''
                where: {{
                    operator: And
                    operands: [{operands_str}]
                }}
            '''

    graphql_query = f'''
    {{
      Get {{
        Post(
          nearText: {{ concepts: ["{query}"] }}
          limit: {limit}
          {where_clause}
        ) {{
          postId
          content
          authorName
          authorUsername
          publishedAt
          likes
          comments
          shares
          engagementTotal
          hashtags
          postUrl
          profileId
          workspaceIds
          _additional {{ certainty }}
        }}
      }}
    }}
    '''

    result = execute_query(url, api_key, openai_key, graphql_query)

    if 'errors' in result:
        print("Query errors:", file=sys.stderr)
        print(json.dumps(result['errors'], indent=2), file=sys.stderr)
        sys.exit(1)

    posts = result.get('data', {}).get('Get', {}).get('Post', [])
    return posts


def get_post_count(url: str, api_key: str, openai_key: str) -> int:
    """Get total post count."""
    query = '''
    {
      Aggregate {
        Post {
          meta {
            count
          }
        }
      }
    }
    '''

    result = execute_query(url, api_key, openai_key, query)
    count = result.get('data', {}).get('Aggregate', {}).get('Post', [{}])[0].get('meta', {}).get('count', 0)
    return count


def get_trending_hashtags(url: str, api_key: str, openai_key: str, days: int = 7) -> list:
    """Get trending hashtags from recent posts."""
    start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%dT00:00:00Z')

    query = f'''
    {{
      Aggregate {{
        Post(
          where: {{
            path: ["publishedAt"]
            operator: GreaterThanEqual
            valueDate: "{start_date}"
          }}
        ) {{
          hashtags {{
            count
            topOccurrences(limit: 20) {{
              value
              occurs
            }}
          }}
        }}
      }}
    }}
    '''

    result = execute_query(url, api_key, openai_key, query)
    aggregation = result.get('data', {}).get('Aggregate', {}).get('Post', [{}])[0]
    hashtags_data = aggregation.get('hashtags', {})

    return hashtags_data.get('topOccurrences', [])


def format_post(post: dict, index: int):
    """Format a post for display."""
    certainty = post.get('_additional', {}).get('certainty', 0)
    certainty_pct = int(certainty * 100)

    print(f"\n{'='*80}")
    print(f"Result {index + 1} | Match: {certainty_pct}% | ID: {post.get('postId')}")
    print(f"{'='*80}")
    print(f"Author: {post.get('authorName')} (@{post.get('authorUsername')})")
    print(f"Published: {post.get('publishedAt')}")
    print(f"Engagement: {post.get('engagementTotal')} (👍 {post.get('likes')} | 💬 {post.get('comments')} | 🔄 {post.get('shares')})")
    if post.get('hashtags'):
        print(f"Hashtags: {', '.join(['#' + tag for tag in post.get('hashtags', [])])}")
    print(f"Workspace IDs: {post.get('workspaceIds')}")
    print(f"Profile ID: {post.get('profileId')}")
    print(f"\nContent:\n{post.get('content')[:500]}{'...' if len(post.get('content', '')) > 500 else ''}")
    print(f"\nURL: {post.get('postUrl')}")


def main():
    parser = argparse.ArgumentParser(description='Query LinkedIn Weaviate database')

    # Main query
    parser.add_argument('--query', '-q', type=str, help='Semantic search query')
    parser.add_argument('--limit', '-l', type=int, default=10, help='Number of results (default: 10)')

    # Filters
    parser.add_argument('--workspace', '-w', type=int, action='append', help='Filter by workspace ID (can specify multiple)')
    parser.add_argument('--profile', '-p', type=int, action='append', help='Filter by profile ID (can specify multiple)')
    parser.add_argument('--min-engagement', '-e', type=int, help='Minimum engagement threshold')
    parser.add_argument('--days', '-d', type=int, help='Only posts from last N days')

    # Special queries
    parser.add_argument('--count', action='store_true', help='Get total post count')
    parser.add_argument('--hashtags', action='store_true', help='Get trending hashtags')

    # Output
    parser.add_argument('--json', action='store_true', help='Output raw JSON')

    args = parser.parse_args()

    # Get credentials
    url, api_key, openai_key = get_credentials()

    # Handle special queries
    if args.count:
        count = get_post_count(url, api_key, openai_key)
        print(f"Total posts in Weaviate: {count}")
        return

    if args.hashtags:
        days = args.days or 7
        hashtags = get_trending_hashtags(url, api_key, openai_key, days)
        print(f"\nTrending hashtags (last {days} days):")
        print("="*50)
        for i, tag_data in enumerate(hashtags, 1):
            print(f"{i}. #{tag_data['value']:20s} - {tag_data['occurs']} posts")
        return

    # Semantic search
    if not args.query:
        parser.error("--query is required (or use --count or --hashtags)")

    # Build date filter
    start_date = None
    if args.days:
        start_date = (datetime.now() - timedelta(days=args.days)).strftime('%Y-%m-%dT00:00:00Z')

    posts = semantic_search(
        url, api_key, openai_key,
        query=args.query,
        limit=args.limit,
        workspace_ids=args.workspace,
        profile_ids=args.profile,
        min_engagement=args.min_engagement,
        start_date=start_date
    )

    if args.json:
        print(json.dumps(posts, indent=2))
    else:
        print(f"\nFound {len(posts)} results for: \"{args.query}\"")
        for i, post in enumerate(posts):
            format_post(post, i)
        print(f"\n{'='*80}\n")


if __name__ == '__main__':
    main()
