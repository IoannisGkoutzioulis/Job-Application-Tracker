import React from 'react';
import { Box, Container, Typography } from '@mui/material';
// import CompanyNews from '../components/CompanyNews';

const CompanyDashboard = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Company Dashboard
        </Typography>
        {/* CompanyNews removed */}
      </Box>
    </Container>
  );
};

export default CompanyDashboard; 