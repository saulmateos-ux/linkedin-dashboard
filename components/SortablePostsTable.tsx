'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Post } from '@/lib/db';
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Link as MuiLink,
} from '@mui/material';
import { ArrowUpward, ArrowDownward, UnfoldMore } from '@mui/icons-material';

interface SortablePostsTableProps {
  posts: (Post & { company_name?: string | null; company_id?: number | null })[];
  title?: string;
  showAll?: boolean;
}

type SortColumn = 'published_at' | 'likes' | 'comments' | 'shares' | 'engagement_total';

export default function SortablePostsTable({ posts, title = "Top Posts", showAll = false }: SortablePostsTableProps) {
  const searchParams = useSearchParams();
  const currentSort = (searchParams.get('sortBy') as SortColumn) || 'published_at';
  const currentOrder = searchParams.get('order') || 'desc';
  const search = searchParams.get('search') || '';
  const workspace = searchParams.get('workspace');
  const profile = searchParams.get('profile');

  // Build sort URL
  const buildSortUrl = (column: SortColumn) => {
    const newOrder = currentSort === column && currentOrder === 'desc' ? 'asc' : 'desc';
    const params = new URLSearchParams();
    params.set('sortBy', column);
    params.set('order', newOrder);
    if (search) params.set('search', search);
    if (workspace) params.set('workspace', workspace);
    if (profile) params.set('profile', profile);
    params.set('page', '1'); // Reset to page 1 when sorting
    return `/posts?${params.toString()}`;
  };

  // Sort indicator component
  const getSortIcon = (column: SortColumn) => {
    if (currentSort !== column) {
      return <UnfoldMore sx={{ fontSize: 16, color: 'text.disabled' }} />;
    }
    return currentOrder === 'asc' ? (
      <ArrowUpward sx={{ fontSize: 16, color: 'primary.main' }} />
    ) : (
      <ArrowDownward sx={{ fontSize: 16, color: 'primary.main' }} />
    );
  };

  // Sortable header component
  const SortableHeader = ({ column, children, align = 'center' }: { column: SortColumn; children: React.ReactNode; align?: 'left' | 'center' | 'right' }) => {
    return (
      <TableCell align={align} sx={{ py: 2 }}>
        <MuiLink
          component={Link}
          href={buildSortUrl(column)}
          underline="none"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: '0.8125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            transition: 'color 200ms',
            cursor: 'pointer',
            userSelect: 'none',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          {children}
          {getSortIcon(column)}
        </MuiLink>
      </TableCell>
    );
  };

  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" px={3} pt={3} pb={2}>
          <Typography variant="h6" fontWeight={600} fontSize="1.125rem">
            {title}
          </Typography>
          {!showAll && (
            <MuiLink
              component={Link}
              href="/posts"
              underline="hover"
              fontWeight={600}
              sx={{
                color: 'primary.main',
                fontSize: '0.875rem',
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
                <TableCell sx={{ pl: 3, fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Content</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Author</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company</TableCell>
                <SortableHeader column="published_at" align="left">Published</SortableHeader>
                <SortableHeader column="likes">👍 Likes</SortableHeader>
                <SortableHeader column="comments">💬 Comments</SortableHeader>
                <SortableHeader column="shares">🔄 Shares</SortableHeader>
                <SortableHeader column="engagement_total" align="right">Total</SortableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map((post) => (
                <TableRow
                  key={post.id}
                  hover
                  sx={{
                    '&:last-child td': { border: 0 },
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
                        fontSize: '0.875rem',
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
                    {post.profile_id ? (
                      <MuiLink
                        component={Link}
                        href={`/profiles/${post.profile_id}/background`}
                        underline="hover"
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'text.primary',
                          whiteSpace: 'nowrap',
                          transition: 'color 200ms',
                          '&:hover': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        {post.author_name || post.author_username || 'Unknown'}
                      </MuiLink>
                    ) : (
                      <Typography variant="body2" fontWeight={600} fontSize="0.875rem" sx={{ whiteSpace: 'nowrap' }}>
                        {post.author_name || post.author_username || 'Unknown'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {post.company_name && post.company_id ? (
                      <MuiLink
                        component={Link}
                        href={`/companies/${post.company_id}`}
                        underline="hover"
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: 'text.primary',
                          whiteSpace: 'nowrap',
                          transition: 'color 200ms',
                          '&:hover': {
                            color: 'primary.main',
                          },
                        }}
                      >
                        {post.company_name}
                      </MuiLink>
                    ) : post.company_name ? (
                      <Typography variant="body2" color="text.secondary" fontSize="0.875rem" sx={{ whiteSpace: 'nowrap' }}>
                        {post.company_name}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.disabled" fontSize="0.875rem" fontStyle="italic">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontSize="0.875rem" sx={{ whiteSpace: 'nowrap' }}>
                      {new Date(post.published_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      fontSize="0.875rem"
                      color="success.main"
                      sx={{ fontFeatureSettings: '"tnum" 1' }}
                    >
                      {post.likes.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      fontSize="0.875rem"
                      color="info.main"
                      sx={{ fontFeatureSettings: '"tnum" 1' }}
                    >
                      {post.comments.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      fontSize="0.875rem"
                      color="warning.main"
                      sx={{ fontFeatureSettings: '"tnum" 1' }}
                    >
                      {post.shares.toLocaleString()}
                    </Typography>
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
