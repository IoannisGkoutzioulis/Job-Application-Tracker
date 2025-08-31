import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Grid,
} from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const DetailedStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [successRate, companyStats] = await Promise.all([
          api.get('/analytics/success_rate/'),
          api.get('/analytics/company_stats/'),
        ]);

        setStats({
          successRate: successRate.data,
          companies: companyStats.data,
        });
      } catch (error) {
        console.error('Error fetching detailed stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const pieData = {
    labels: ['Successful', 'In Progress', 'Rejected'],
    datasets: [
      {
        data: [
          stats?.successRate?.offers_received || 0,
          stats?.successRate?.total_applications - (stats?.successRate?.offers_received || 0),
          0, // You might want to add rejection data here
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Detailed Statistics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Success Rate
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie data={pieData} options={{ maintainAspectRatio: false }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Company Statistics
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Company</TableCell>
                      <TableCell align="right">Applications</TableCell>
                      <TableCell align="right">Success Rate</TableCell>
                      <TableCell align="right">Avg. Duration (days)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats?.companies?.map((company) => (
                      <TableRow key={company.company_name}>
                        <TableCell component="th" scope="row">
                          {company.company_name}
                        </TableCell>
                        <TableCell align="right">{company.total_applications}</TableCell>
                        <TableCell align="right">{company.success_rate.toFixed(1)}%</TableCell>
                        <TableCell align="right">{company.average_process_duration.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DetailedStats; 