import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  CircularProgress,
  Chip
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import axios from 'axios';

function ReportAnalysis({ reportId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState([]);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        if (!reportId) {
          throw new Error('Report ID is required');
        }

        const response = await axios.get(
          `https://floodbot.cnc.claims:7001/get_question_answer`,
          {
            params: { report_id: reportId },
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.status === 'success' && response.data.question_answer) {
          // Group questions by headerKey
          const groupedData = response.data.question_answer.reduce((acc, item) => {
            const headerKey = item.headerKey || 'Other';
            if (!acc[headerKey]) {
              acc[headerKey] = [];
            }
            acc[headerKey].push(item);
            return acc;
          }, {});

          // Convert to array format
          const formattedData = Object.entries(groupedData).map(([header, items]) => ({
            category: header,
            items
          }));

          setAnalysisData(formattedData);
        } else {
          throw new Error('Invalid response format');
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching analysis data:', error);
        setError(error.message === 'Authentication token not found'
          ? 'Please log in to view the analysis.'
          : 'Failed to load analysis data. Please try again.');
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, [reportId]);

  if (error) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography color="error" align="center">{error}</Typography>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Report Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Detailed analysis of the loss report based on key questions and findings
        </Typography>
        
        {analysisData.map((section, index) => (
          <Accordion key={index} sx={{ mb: 1 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${index}-content`}
              id={`panel${index}-header`}
            >
              <Typography fontWeight="medium">{section.category}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {section.items.map((item, itemIndex) => (
                <Box 
                  key={itemIndex} 
                  sx={{ 
                    mb: itemIndex !== section.items.length - 1 ? 3 : 0,
                    p: 2,
                    bgcolor: 'background.default',
                    borderRadius: 1
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    color="primary" 
                    gutterBottom
                    sx={{ fontWeight: 'bold' }}
                  >
                    {item.question}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      mb: 1
                    }}
                  >
                    {item.descriptionKey}
                  </Typography>
                  <Chip
                    label={item.pageNumber}
                    size="small"
                    color="secondary"
                    sx={{ mt: 1 }}
                  />
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Box>
  );
}

export default ReportAnalysis; 