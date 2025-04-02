import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';
import ReportSummary from './ReportSummary';
import ReportAnalysis from './ReportAnalysis';
import ChatBot from '../components/ChatBot';
import GenerateGuidanceReport from '../components/GenerateGuidanceReport';

// Lazy load just the PDF viewer content
const PDFViewerContent = lazy(() => import('./PDFViewerContent'));

// Tab Panel component
function TabPanel({ children, value, index }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`loss-report-tabpanel-${index}`}
      aria-labelledby={`loss-report-tab-${index}`}
      sx={{ py: 3 }}
    >
      {value === index && children}
    </Box>
  );
}

function LossReport() {
  const { claimNo } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const rowData = location.state || {};
  const [data, setData] = useState({
    reportName: rowData.loss_report_name || `Loss Report - ${claimNo}`,
    report_id: rowData.report_id,
    ...rowData,
  });
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!rowData.report_id || !rowData.loss_report_name) {
          throw new Error('Missing required report parameters');
        }

        const response = await axiosInstance.post(
          import.meta.env.VITE_GET_PDF_ENDPOINT,
          {
            report_id: rowData.report_id,
            report_name: rowData.loss_report_name,
            chunk_id: 1,
          }
        );

        // Convert base64 to blob
        const base64Response = response.data.base64_pdf;
        if (!base64Response) {
          throw new Error('Invalid PDF data received');
        }

        // Convert base64 to binary
        const binaryString = window.atob(base64Response);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Create blob from binary data
        const pdfBlob = new Blob([bytes], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);

        setData((prevData) => ({
          ...prevData,
          pdfUrl,
        }));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching report data:', error);
        if (error.message === 'Missing required report parameters') {
          setError('Missing required report parameters.');
        } else if (error.message === 'Invalid PDF data received') {
          setError('Invalid PDF data received from server.');
        } else {
          setError('Failed to load the PDF file. Please try again later.');
        }
        setLoading(false);
      }
    };

    fetchReportData();

    // Cleanup function to revoke blob URL
    return () => {
      if (data?.pdfUrl) {
        URL.revokeObjectURL(data.pdfUrl);
      }
    };
  }, [rowData.loss_report_name, rowData.report_id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderPDFViewer = () => {
    if (error) {
      return (
        <Typography color="error" align="center">
          {error}
        </Typography>
      );
    }

    if (!data?.pdfUrl) {
      return (
        <Typography color="text.secondary" align="center">
          No PDF file available
        </Typography>
      );
    }

    return (
      <Suspense
        fallback={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '50vh',
            }}
          >
            <CircularProgress />
          </Box>
        }
      >
        <PDFViewerContent data={data} />
      </Suspense>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 3,
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h5" component="h1">
          Loss Report Details
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Report Name:{' '}
            <span>{data?.reportName || `Loss Report - ${claimNo}`}</span>
          </Typography>

          <Typography sx={{ mt: 2 }} gutterBottom>
            <Button onClick={handleBack}>Loss Report Extracted / </Button>
            <span>
              Claim No. <span>{claimNo}</span>
            </span>
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="loss report tabs"
          >
            <Tab label="Loss Report" />
            <Tab label="Report Summary" />
            <Tab label="Report Analysis" />
            <Tab label="ChatBot" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderPDFViewer()
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ReportSummary reportId={data?.report_id} />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <ReportAnalysis reportId={data?.report_id} />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          
          <ChatBot reportId={data?.report_id} userId />
        </TabPanel>
      </Paper>
    </Box>
  );
}

export default LossReport;
