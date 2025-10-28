'use client';

import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MuiEngagementChartProps {
  data: Array<{
    date: string;
    likes: number;
    comments: number;
    shares: number;
  }>;
  title?: string;
}

export default function MuiEngagementChart({ data, title = "Engagement Over Time" }: MuiEngagementChartProps) {
  const theme = useTheme();

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600} fontSize="1.125rem">
            {title}
          </Typography>
        </Box>
        <Box sx={{ width: '100%', height: 320, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.palette.divider}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 13, fill: theme.palette.text.secondary }}
                stroke={theme.palette.divider}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 13, fill: theme.palette.text.secondary }}
                stroke={theme.palette.divider}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 6,
                  color: theme.palette.text.primary,
                  boxShadow: '0px 2px 10px rgba(76, 78, 100, 0.22)',
                }}
                labelStyle={{
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
                cursor={{ stroke: theme.palette.divider, strokeWidth: 1 }}
              />
              <Legend
                wrapperStyle={{
                  color: theme.palette.text.primary,
                  paddingTop: 16,
                }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="likes"
                stroke={theme.palette.success.main}
                strokeWidth={3}
                dot={{ fill: theme.palette.success.main, r: 5, strokeWidth: 2, stroke: theme.palette.background.paper }}
                activeDot={{ r: 7 }}
                name="Likes"
              />
              <Line
                type="monotone"
                dataKey="comments"
                stroke={theme.palette.info.main}
                strokeWidth={3}
                dot={{ fill: theme.palette.info.main, r: 5, strokeWidth: 2, stroke: theme.palette.background.paper }}
                activeDot={{ r: 7 }}
                name="Comments"
              />
              <Line
                type="monotone"
                dataKey="shares"
                stroke={theme.palette.warning.main}
                strokeWidth={3}
                dot={{ fill: theme.palette.warning.main, r: 5, strokeWidth: 2, stroke: theme.palette.background.paper }}
                activeDot={{ r: 7 }}
                name="Shares"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
