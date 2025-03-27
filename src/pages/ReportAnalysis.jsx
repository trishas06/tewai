
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

function ReportAnalysis() {
  // Dummy data for question-answer sections
  const questionAnswers = [
    {
      category: 'Policy Information',
      items: [
        { question: 'What is the policy type?', answer: 'Commercial Property Insurance' },
        { question: 'What is the policy period?', answer: '01/01/2024 - 12/31/2024' },
        { question: 'What are the coverage limits?', answer: '$1,000,000 per occurrence' }
      ]
    },
    {
      category: 'Loss Details',
      items: [
        { question: 'What was the cause of loss?', answer: 'Water damage from burst pipe' },
        { question: 'When did the incident occur?', answer: 'March 15, 2024' },
        { question: 'What is the estimated damage value?', answer: '$75,000' }
      ]
    },
    {
      category: 'Investigation Findings',
      items: [
        { question: 'Was proper maintenance performed?', answer: 'Regular maintenance records show compliance with requirements' },
        { question: 'Are there any contributing factors?', answer: 'Extreme cold weather conditions' },
        { question: 'Is there any evidence of negligence?', answer: 'No evidence of negligence found' }
      ]
    }
  ];

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Report Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Detailed analysis of the loss report based on key questions and findings
        </Typography>
        
        {questionAnswers.map((section, index) => (
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
                <Box key={itemIndex} sx={{ mb: itemIndex !== section.items.length - 1 ? 2 : 0 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    {item.question}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.answer}
                  </Typography>
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