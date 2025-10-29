# Weaviate GraphQL Query Patterns

Complete reference for querying the LinkedIn Weaviate database.

## API Endpoint

```
POST https://n1rin6rerjmgj4snwaxz8g.c0.us-west3.gcp.weaviate.cloud/v1/graphql
```

**Required Headers**:
```
Authorization: Bearer ${WEAVIATE_API_KEY}
X-OpenAI-Api-Key: ${OPENAI_API_KEY}
Content-Type: application/json
```

---

## 1. Basic Semantic Search

Find posts by meaning, not keywords.

### Simple Query

```graphql
{
  Get {
    Post(
      nearText: { concepts: ["AI automation"] }
      limit: 10
    ) {
      postId
      content
      authorName
      likes
      engagementTotal
      _additional { certainty }
    }
  }
}
```

### With Multiple Concepts

```graphql
{
  Get {
    Post(
      nearText: {
        concepts: ["CFO challenges", "revenue cycle management", "healthcare"]
      }
      limit: 10
    ) {
      content
      authorName
      workspaceIds
      _additional { certainty }
    }
  }
}
```

---

## 2. Workspace Filtering

Filter posts by workspace membership.

### Single Workspace

```graphql
{
  Get {
    Post(
      nearText: { concepts: ["AI automation"] }
      where: {
        path: ["workspaceIds"]
        operator: ContainsAny
        valueInt: [3]
      }
      limit: 10
    ) {
      content
      authorName
      workspaceIds
      engagementTotal
    }
  }
}
```

### Multiple Workspaces (OR logic)

```graphql
{
  Get {
    Post(
      nearText: { concepts: ["healthcare trends"] }
      where: {
        path: ["workspaceIds"]
        operator: ContainsAny
        valueInt: [1, 3, 5]
      }
      limit: 10
    ) {
      content
      workspaceIds
      authorName
    }
  }
}
```

---

## 3. Engagement Filtering

Filter by engagement metrics.

### Minimum Engagement Threshold

```graphql
{
  Get {
    Post(
      nearText: { concepts: ["finance automation"] }
      where: {
        path: ["engagementTotal"]
        operator: GreaterThanEqual
        valueInt: 50
      }
      limit: 10
    ) {
      content
      authorName
      likes
      comments
      shares
      engagementTotal
    }
  }
}
```

### High-Performing Posts

```graphql
{
  Get {
    Post(
      nearText: { concepts: ["thought leadership"] }
      where: {
        operator: And
        operands: [
          { path: ["likes"], operator: GreaterThanEqual, valueInt: 100 }
          { path: ["comments"], operator: GreaterThanEqual, valueInt: 20 }
        ]
      }
      limit: 5
    ) {
      content
      authorName
      likes
      comments
      engagementTotal
      postUrl
    }
  }
}
```

---

## 4. Date Filtering

Filter by publication date.

### Recent Posts (Last 30 Days)

```graphql
{
  Get {
    Post(
      nearText: { concepts: ["AI trends"] }
      where: {
        path: ["publishedAt"]
        operator: GreaterThanEqual
        valueDate: "2025-09-01T00:00:00Z"
      }
      limit: 10
    ) {
      content
      publishedAt
      authorName
      engagementTotal
    }
  }
}
```

### Date Range

```graphql
{
  Get {
    Post(
      nearText: { concepts: ["quarterly results"] }
      where: {
        operator: And
        operands: [
          { path: ["publishedAt"], operator: GreaterThanEqual, valueDate: "2025-07-01T00:00:00Z" }
          { path: ["publishedAt"], operator: LessThanEqual, valueDate: "2025-09-30T23:59:59Z" }
        ]
      }
      limit: 20
    ) {
      content
      publishedAt
      engagementTotal
    }
  }
}
```

---

## 5. Combined Filters

Complex queries with multiple conditions.

### Workspace + Engagement + Date

```graphql
{
  Get {
    Post(
      nearText: { concepts: ["healthcare innovation"] }
      where: {
        operator: And
        operands: [
          { path: ["workspaceIds"], operator: ContainsAny, valueInt: [3] }
          { path: ["engagementTotal"], operator: GreaterThanEqual, valueInt: 30 }
          { path: ["publishedAt"], operator: GreaterThanEqual, valueDate: "2025-08-01T00:00:00Z" }
        ]
      }
      limit: 15
    ) {
      content
      authorName
      workspaceIds
      publishedAt
      engagementTotal
      postUrl
    }
  }
}
```

### Profile + Hashtag Filter

```graphql
{
  Get {
    Post(
      nearText: { concepts: ["AI"] }
      where: {
        operator: And
        operands: [
          { path: ["profileId"], operator: Equal, valueInt: 4 }
          { path: ["hashtags"], operator: ContainsAny, valueText: ["AI", "ChatGPT"] }
        ]
      }
      limit: 10
    ) {
      content
      hashtags
      authorName
      engagementTotal
    }
  }
}
```

---

## 6. Find Similar Posts

Find posts similar to a specific post.

### By Post ID

```graphql
{
  Get {
    Post(
      nearObject: { id: "weaviate-uuid-here" }
      limit: 5
    ) {
      content
      authorName
      engagementTotal
      _additional { certainty }
    }
  }
}
```

**Note**: First query the post to get its Weaviate UUID, then use it in `nearObject`.

---

## 7. Aggregations

Get statistics and counts.

### Total Post Count

```graphql
{
  Aggregate {
    Post {
      meta {
        count
      }
    }
  }
}
```

### Average Engagement

```graphql
{
  Aggregate {
    Post {
      engagementTotal {
        mean
        median
        maximum
        minimum
      }
    }
  }
}
```

### Count by Workspace

```graphql
{
  Aggregate {
    Post(
      where: {
        path: ["workspaceIds"]
        operator: ContainsAny
        valueInt: [3]
      }
    ) {
      meta {
        count
      }
      engagementTotal {
        mean
      }
    }
  }
}
```

---

## 8. Hashtag Analysis

Query posts by hashtags.

### Posts with Specific Hashtag

```graphql
{
  Get {
    Post(
      where: {
        path: ["hashtags"]
        operator: ContainsAny
        valueText: ["AI"]
      }
      limit: 20
    ) {
      content
      hashtags
      authorName
      engagementTotal
    }
  }
}
```

### Trending Hashtags

```graphql
{
  Aggregate {
    Post(
      where: {
        path: ["publishedAt"]
        operator: GreaterThanEqual
        valueDate: "2025-09-01T00:00:00Z"
      }
    ) {
      hashtags {
        count
        topOccurrences(limit: 20) {
          value
          occurs
        }
      }
    }
  }
}
```

---

## 9. Profile Filtering

Query posts from specific profiles.

### Single Profile

```graphql
{
  Get {
    Post(
      nearText: { concepts: ["content strategy"] }
      where: {
        path: ["profileId"]
        operator: Equal
        valueInt: 4
      }
      limit: 10
    ) {
      content
      authorName
      engagementTotal
    }
  }
}
```

### Multiple Profiles (OR logic)

```graphql
{
  Get {
    Post(
      nearText: { concepts: ["marketing"] }
      where: {
        path: ["profileId"]
        operator: Or
        valueInt: [4, 8, 11]
      }
      limit: 10
    ) {
      content
      authorName
      profileId
    }
  }
}
```

---

## 10. Advanced: OR Logic

Combine filters with OR logic.

### Multiple Workspaces OR High Engagement

```graphql
{
  Get {
    Post(
      nearText: { concepts: ["innovation"] }
      where: {
        operator: Or
        operands: [
          { path: ["workspaceIds"], operator: ContainsAny, valueInt: [1, 3] }
          { path: ["engagementTotal"], operator: GreaterThanEqual, valueInt: 100 }
        ]
      }
      limit: 15
    ) {
      content
      workspaceIds
      engagementTotal
    }
  }
}
```

---

## Common Operators

### Comparison Operators

- `Equal` - Exact match
- `NotEqual` - Not equal
- `GreaterThan` - Greater than
- `GreaterThanEqual` - Greater than or equal
- `LessThan` - Less than
- `LessThanEqual` - Less than or equal

### Array Operators

- `ContainsAny` - Array contains any of the values
- `ContainsAll` - Array contains all of the values

### Logic Operators

- `And` - All operands must be true
- `Or` - At least one operand must be true

---

## Best Practices

1. **Always include `_additional { certainty }`** - Helps understand match quality
2. **Use `limit`** - Prevent overwhelming results (default: 100, max: 10000)
3. **Combine semantic + filters** - Semantic search THEN filter for precision
4. **Date format** - Always use ISO 8601: `YYYY-MM-DDTHH:MM:SSZ`
5. **Workspace arrays** - Use `ContainsAny` for posts in ANY workspace
6. **OpenAI key required** - Semantic search needs X-OpenAI-Api-Key header

---

## Error Handling

### Common Errors

**"no api key found"**
- Missing X-OpenAI-Api-Key header
- Solution: Add header with OpenAI API key

**"class 'Post' does not exist"**
- Schema not initialized
- Solution: Run sync script

**"invalid operator"**
- Wrong operator for data type
- Solution: Check operators list above
