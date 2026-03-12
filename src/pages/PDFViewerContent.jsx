import { memo } from 'react';
import { Box } from '@mui/material';
import PDFViewer from './PDFViewer';

// memo prevents re-render (and re-load of PDF) unless pdfUrl actually changes
const PDFViewerContent = memo(function PDFViewerContent({ data }) {
  return (
    <Box
      sx={{
        height: '70vh',
        border: '1px solid rgba(0, 0, 0, 0.12)',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <PDFViewer file={data.pdfUrl} />
    </Box>
  );
});



export default PDFViewerContent;