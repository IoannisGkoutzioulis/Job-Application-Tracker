import React, { useState, useEffect } from 'react';
import api from '../../services/api';

import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
import './AnalyticsDashboard.css';



const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, timelineRes] = await Promise.all([
          api.get('/analytics/dashboard_metrics/'),
          api.get('/analytics/trend_analysis/'),
        ]);

        setMetrics(metricsRes.data);
        setTimeline(Array.isArray(timelineRes.data) ? timelineRes.data : []);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const MetricCard = ({ title, value }) => (
    <Card sx={{ height: '100%', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', boxShadow: 'var(--shadow)' }}>
      <CardContent>
        <Typography color="textSecondary" gutterBottom sx={{ color: 'var(--text-secondary)' }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ color: 'var(--text-primary)' }}>{value}</Typography>
      </CardContent>
    </Card>
  );

  const timelineData = {
    labels: timeline?.map(item => new Date(item.event_date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Applications',
        data: timeline?.map(item => item.count) || [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Application Analytics
      </Typography>
      
      <Grid container columns={12} columnSpacing={3}>
        <Grid gridColumn="span 3">
          <MetricCard title="Total Applications" value={metrics?.total_applications || 0} />
        </Grid>
        <Grid gridColumn="span 3">
          <MetricCard title="Applications in Progress" value={metrics?.applications_in_progress || 0} />
        </Grid>
        <Grid gridColumn="span 3">
          <MetricCard title="Interviews Scheduled" value={metrics?.interviews_scheduled || 0} />
        </Grid>
        <Grid gridColumn="span 3">
          <MetricCard title="Offers Received" value={metrics?.offers_received || 0} />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Card sx={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', boxShadow: 'var(--shadow)' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'var(--text-primary)' }}>
              Application Trend
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line data={timelineData} options={{ maintainAspectRatio: false }} />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AnalyticsDashboard; 