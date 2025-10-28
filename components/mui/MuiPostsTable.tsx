'use client';

import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link as MuiLink,
  Chip,
  Box,
} from '@mui/material';
import { ThumbUp, Comment, Share } from '@mui/icons-material';
import Link from 'next/link';
import { Post } from '@/lib/db';

interface MuiPostsTableProps {
  posts: Post[];
  title?: string;
  maxRows?: number;
}

export default function MuiPostsTable({ posts, title = "Top Posts", maxRows }: MuiPostsTableProps) {
  const displayedPosts = maxRows ? posts.slice(0, maxRows) : posts;

  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" px={3} pt={3} pb={2}>
          <Typography variant="h6" fontWeight={600} fontSize="1.125rem">
            {title}
          </Typography>
          {maxRows && posts.length > maxRows && (
            <MuiLink
              component={Link}
              href="/posts"
              underline="hover"
              fontWeight={600}
              sx={{
                color: 'primary.main',
                transition: 'color 200ms',
                '&:hover': {
                  color: 'primary.light',
                },
              }}
            >
              View All →
            </MuiLink>
          )}
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 3 }}>Content</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Published</TableCell>
                <TableCell align="center">
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    <ThumbUp sx={{ fontSize: 16 }} />
                    Likes
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    <Comment sx={{ fontSize: 16 }} />
                    Comments
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    <Share sx={{ fontSize: 16 }} />
                    Shares
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ pr: 3 }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedPosts.map((post) => (
                <TableRow
                  key={post.id}
                  hover
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                  }}
                >
                  <TableCell sx={{ pl: 3 }}>
                    <MuiLink
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: '0.9375rem',
                        fontWeight: 500,
                        color: 'text.primary',
                        transition: 'color 200ms',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      {post.content_preview || post.content?.substring(0, 100) || '(No content)'}
                    </MuiLink>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} fontSize="0.875rem">
                      {post.author_name || post.author_username || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                      {new Date(post.published_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={post.likes.toLocaleString()}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{
                        fontFeatureSettings: '"tnum" 1',
                        height: 22,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={post.comments.toLocaleString()}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{
                        fontFeatureSettings: '"tnum" 1',
                        height: 22,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={post.shares.toLocaleString()}
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{
                        fontFeatureSettings: '"tnum" 1',
                        height: 22,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      fontSize="0.9375rem"
                      sx={{ fontFeatureSettings: '"tnum" 1' }}
                    >
                      {post.engagement_total.toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
