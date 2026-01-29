'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import Link from 'next/link';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Article as ArticleIcon,
  People as PeopleIcon,
  Lightbulb as LightbulbIcon,
  Business as BusinessIcon,
  Folder as FolderIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Feed as FeedIcon,
  Topic as TopicIcon,
  OndemandVideo as YouTubeIcon,
} from '@mui/icons-material';
import WorkspaceSwitcher from '@/components/WorkspaceSwitcher';

const drawerWidth = 260;

interface NavItem {
  title: string;
  icon: React.ReactNode;
  path: string;
}

const navigationItems: NavItem[] = [
  { title: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { title: 'All Posts', icon: <ArticleIcon />, path: '/posts' },
  { title: 'Profiles', icon: <PeopleIcon />, path: '/profiles' },
  { title: 'Companies', icon: <BusinessIcon />, path: '/companies' },
  { title: 'YouTube', icon: <YouTubeIcon />, path: '/youtube' },
  { title: 'Workspaces', icon: <FolderIcon />, path: '/workspaces' },
  { title: 'AI Insights', icon: <LightbulbIcon />, path: '/insights' },
  { title: 'Intelligence', icon: <TrendingUpIcon />, path: '/intelligence' },
  { title: 'News', icon: <FeedIcon />, path: '/news' },
  { title: 'Topics', icon: <TopicIcon />, path: '/topics' },
  { title: 'Search', icon: <SearchIcon />, path: '/search' },
];

export default function VerticalLayout({ children }: { children: React.ReactNode }) {
  const theme = useMuiTheme();
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspace();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Build URL with workspace parameter if one is selected
  const buildNavUrl = (path: string) => {
    if (!currentWorkspace) return path;

    // Pages that support workspace filtering
    const supportsWorkspace = ['/', '/posts', '/profiles', '/companies', '/youtube', '/news', '/topics'].includes(path);

    if (supportsWorkspace) {
      return `${path}?workspace=${currentWorkspace.id}`;
    }

    return path;
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.25rem',
            color: 'white',
          }}
        >
          LA
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary' }}>
          LinkedIn Analytics
        </Typography>
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* Workspace Switcher */}
      <Box sx={{ px: 2, pt: 3, pb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
          Workspace
        </Typography>
        <WorkspaceSwitcher />
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* Navigation Items */}
      <List sx={{ px: 2, py: 3, flexGrow: 1 }}>
        {navigationItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={buildNavUrl(item.path)}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 1.5,
                  color: isActive ? 'primary.main' : 'text.secondary',
                  bgcolor: isActive ? 'action.selected' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? 'action.selected' : 'action.hover',
                  },
                  py: 1.25,
                  px: 2,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'primary.main' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: '0.9375rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ mx: 2 }} />

      {/* Footer */}
      <Box sx={{ p: 3 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Built with Next.js & MUI
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          © 2025 LinkedIn Analytics
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          boxShadow: '0px 2px 10px 0px rgba(76, 78, 100, 0.22)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
            {navigationItems.find(item => pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path)))?.title || 'Dashboard'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              component="a"
              href="https://www.linkedin.com/in/saulmateos/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'text.secondary' }}
            >
              <Typography variant="caption" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
                View Profile →
              </Typography>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer - Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Drawer - Desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          mt: '64px',
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
