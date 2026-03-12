/**
 * ReportAnalysisPage.jsx
 *
 * Standalone page rendered when "Open in new tab" is clicked on the
 * Report Analysis panel. Reads report_id and prelim_folder directly
 * from URL query parameters and passes them to ReportAnalysis.
 *
 * Route (add to your router):
 *   <Route path="/report-analysis" element={<ReportAnalysisPage />} />
 *
 * Example URL opened:
 *   /report-analysis?report_id=123&prelim_folder=abc
 */
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import ReportAnalysis from './ReportAnalysis';

function ReportAnalysisPage() {
  const [searchParams] = useSearchParams();

  const reportId = searchParams.get('report_id');
  const prelimFolder = searchParams.get('prelim_folder') || undefined;

  if (!reportId) {
    return (
      <Box sx={{ p: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography color="error" align="center">
            Missing report ID. Please close this tab and use "Open in new tab"
            again from the Loss Report Analysis page.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
        Report Analysis
      </Typography>
      {/*
        pdfUrl is intentionally omitted here — page-number links inside
        ReportAnalysis will simply be non-clickable in the standalone view,
        since the blob URL is only valid in the originating tab.
      */}
      <ReportAnalysis
        reportId={reportId}
        prelim_folder={prelimFolder}
        pdfUrl={null}
      />
    </Box>
  );
}

export default ReportAnalysisPage;