import { Document, Page } from 'react-pdf';
import { Typography, CircularProgress } from '@mui/material';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

function PDFViewer({ file, pageNumber, scale, onLoadSuccess }) {
  return (
    <Document
      file={file}
      onLoadSuccess={onLoadSuccess}
      loading={<CircularProgress />}
      error={
        <Typography color="error" align="center">
          Failed to load PDF. Please try again.
        </Typography>
      }
    >
      <Page
        pageNumber={pageNumber}
        scale={scale}
        renderTextLayer={true}
        renderAnnotationLayer={true}
      />
    </Document>
  );
}

export default PDFViewer; 