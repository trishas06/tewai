import { Viewer } from '@react-pdf-viewer/core';
import { searchPlugin } from '@react-pdf-viewer/search';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import { Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';
import { Box, useTheme } from '@mui/material';

function PDFViewer({ file }) {
  const theme = useTheme();

  const toolbarPluginInstance = toolbarPlugin();
  const { renderDefaultToolbar, Toolbar } = toolbarPluginInstance;

  const transform = (slot) => ({
    ...slot,
    // These slots will be empty
    Open: () => <></>,
    EnterFullScreen: () => <></>,
    SwitchTheme: () => <></>,
  });

  // Initialize search plugin with optimized settings
  const searchPluginInstance = searchPlugin({
    enableShortcuts: true,
    debounceTime: 100,
    ignoreCase: true,
    wholeWords: false,
    limitResultsCount: 500,
    trigger: 'typing', // Enable search on typing
  });



  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        '& .rpv-core__viewer': {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        },
        '& .rpv-core__doc': {
          flex: 1,
        },
        '& .rpv-core__inner-pages': {
          overflow: 'auto',
        },
        '& .rpv-toolbar': {
          padding: '8px',
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
        },
        '& .rpv-toolbar__left': {
          gap: '8px',
        },
        '& .rpv-toolbar__center': {
          gap: '8px',
        },
        '& .rpv-toolbar__right': {
          gap: '8px',
        },
        '& .rpv-search__popover': {
          zIndex: 1,
        },
      }}
    >
      <Toolbar>{renderDefaultToolbar(transform)}</Toolbar>
      <Box sx={{ 
        flex: 1, 
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={file}
            plugins={[searchPluginInstance, toolbarPluginInstance]}
            theme={theme.palette.mode}
          />
        </Worker>
      </Box>
    </Box>
  );
}

export default PDFViewer;
