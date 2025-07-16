import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { CustomInfoCard } from 'common-components';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const mockData = [
  { name: 'Covered', value: 78, color: '#4caf50' },
  { name: 'Uncovered', value: 22, color: '#f44336' }
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const CodeCoverageCard = () => {
  return (
    <CustomInfoCard
      title="Code Coverage"
      dataSources={['Jest', 'Coverage Reports']}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Overall Coverage: 78%
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={mockData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
            >
              {mockData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <Box sx={{ mt: 3, width: '100%' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Coverage Breakdown
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Statements
              </Typography>
              <Typography variant="h6">82.3%</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Branches
              </Typography>
              <Typography variant="h6">75.5%</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Functions
              </Typography>
              <Typography variant="h6">79.1%</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Lines
              </Typography>
              <Typography variant="h6">78.0%</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </CustomInfoCard>
  );
};