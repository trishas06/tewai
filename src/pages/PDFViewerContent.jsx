import { Box, Typography, Stack, IconButton, Divider } from '@mui/material';
import { 
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon
} from '@mui/icons-material';
import PDFViewer from './PDFViewer';

function PDFViewerContent({ 
  data, 
  pageNumber, 
  numPages, 
  scale, 
  handlePreviousPage, 
  handleNextPage, 
  handleZoomOut, 
  handleZoomIn,
  onDocumentLoadSuccess 
}) {
  return (
    <Box sx={{ height: '70vh', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: 1, overflow: 'auto' }}>
      <Box sx={{ p: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.12)', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={handlePreviousPage} disabled={pageNumber <= 1}>
            <PrevIcon />
          </IconButton>
          <Typography>
            Page {pageNumber} of {numPages || '--'}
          </Typography>
          <IconButton onClick={handleNextPage} disabled={pageNumber >= (numPages || 1)}>
            <NextIcon />
          </IconButton>
        </Stack>
        <Divider orientation="vertical" flexItem />
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={handleZoomOut}>
            <ZoomOutIcon />
          </IconButton>
          <Typography>
            {Math.round(scale * 100)}%
          </Typography>
          <IconButton onClick={handleZoomIn}>
            <ZoomInIcon />
          </IconButton>
        </Stack>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <PDFViewer
          file={data.pdfUrl}
          pageNumber={pageNumber}
          scale={scale}
          onLoadSuccess={onDocumentLoadSuccess}
        />
      </Box>
    </Box>
  );
}

export default PDFViewerContent; 