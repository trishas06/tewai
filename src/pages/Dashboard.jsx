import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  InputAdornment,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  Notifications as NotificationsIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

import authService from '../services/authService';
import dashboardService from '../services/dashboardService';

// Table header cells
const headCells = [
  { id: 'claimNo', label: 'Claim No.' },
  { id: 'carrier', label: 'Carrier' },
  { id: 'policyNo', label: 'Policy No.' },
  { id: 'policyForm', label: 'Policy Form' },
  { id: 'adjusterName', label: 'Adjuster Name' },
  { id: 'createdOn', label: 'Created On' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Action' },
];

// Status chip colors
const getStatusColor = (status) => {
  switch (status) {
    case 'Failed':
      return { color: '#f44336', bgcolor: '#ffebee' };
    case 'Generated':
      return { color: '#1976d2', bgcolor: '#e3f2fd' };
    case 'Validated':
      return { color: '#4caf50', bgcolor: '#e8f5e9' };
    default:
      return { color: '#757575', bgcolor: '#f5f5f5' };
  }
};

// Custom pagination actions
function TablePaginationActions(props) {
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        <KeyboardArrowLeft />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        <KeyboardArrowRight />
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        <LastPageIcon />
      </IconButton>
    </Box>
  );
}

// Multi-select component for filter dialog
function MultiSelect({ label, options, value, onChange }) {
  return (
    <FormControl fullWidth margin="normal">
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={onChange}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => (
              <Chip key={value} label={value} />
            ))}
          </Box>
        )}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    carriers: [],
    policyForms: [],
    adjusters: [],
    statuses: [],
    startDate: null,
    endDate: null,
  });

  // For filter dialog
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    carriers: [],
    policyForms: [],
    adjusters: [],
    statuses: [],
  });
  const [tempFilters, setTempFilters] = useState({ ...filters });

  // Fetch initial data and filter options
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate('/login');
          return;
        }

        // Fetch filter options
        const options = await dashboardService.getFilterOptions();
        setFilterOptions(options);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  // Fetch data when page, rowsPerPage, filters, or search term changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await dashboardService.getClaimsData(
          page,
          rowsPerPage,
          filters,
          searchTerm
        );
        setRows(result.data);
        setTotalCount(result.totalCount);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [page, rowsPerPage, filters, searchTerm]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Handle filter dialog open
  const handleOpenFilterDialog = () => {
    setTempFilters({ ...filters });
    setOpenFilterDialog(true);
  };

  // Handle filter dialog close
  const handleCloseFilterDialog = () => {
    setOpenFilterDialog(false);
  };

  // Handle filter apply
  const handleApplyFilters = () => {
    setFilters({ ...tempFilters });
    setOpenFilterDialog(false);
    setPage(0);
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setTempFilters({
      carriers: [],
      policyForms: [],
      adjusters: [],
      statuses: [],
      startDate: null,
      endDate: null,
    });
  };

  // Handle multi-select change
  const handleMultiSelectChange = (field) => (event) => {
    setTempFilters({
      ...tempFilters,
      [field]: event.target.value,
    });
  };

  // Handle date picker change
  const handleDateChange = (field) => (newValue) => {
    setTempFilters({
      ...tempFilters,
      [field]: newValue,
    });
  };

  // Add handler for navigating to Loss Report Screen
  const handleNavigateToLossReport = (row) => {
    navigate(`/loss-report/${row.claimNo}`, {
      state: row.originalData,
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
        Loss Report Extracted
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{
            width: 300,
            bgcolor: 'white',
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#e0e0e0',
              },
              '&:hover fieldset': {
                borderColor: '#bdbdbd',
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#757575' }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleOpenFilterDialog}
          sx={{ borderColor: '#e0e0e0', color: '#757575' }}
        >
          Filter
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }}
      >
        <Table>
          <TableHead>
            <TableRow>
              {headCells.map((cell) => (
                <TableCell key={cell.id}>{cell.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.claimNo} hover>
                  <TableCell>{row.claimNo}</TableCell>
                  <TableCell>{row.carrier}</TableCell>
                  <TableCell>{row.policyNo}</TableCell>
                  <TableCell>{row.policyForm}</TableCell>
                  <TableCell>{row.adjusterName}</TableCell>
                  <TableCell>{row.createdOn}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      size="small"
                      sx={{
                        color: getStatusColor(row.status).color,
                        bgcolor: getStatusColor(row.status).bgcolor,
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {row.status !== 'Failed' && (
                      <IconButton
                        size="small"
                        title="View Loss Report"
                        onClick={() => handleNavigateToLossReport(row)}
                      >
                        <DescriptionIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          ActionsComponent={TablePaginationActions}
        />
      </TableContainer>

      {/* Filter Dialog */}
      <Dialog
        open={openFilterDialog}
        onClose={handleCloseFilterDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Filter Claims</DialogTitle>
        <DialogContent>
          <MultiSelect
            label="Carrier"
            options={filterOptions.carriers}
            value={tempFilters.carriers}
            onChange={handleMultiSelectChange('carriers')}
          />
          <MultiSelect
            label="Policy Form"
            options={filterOptions.policyForms}
            value={tempFilters.policyForms}
            onChange={handleMultiSelectChange('policyForms')}
          />
          <MultiSelect
            label="Adjuster"
            options={filterOptions.adjusters}
            value={tempFilters.adjusters}
            onChange={handleMultiSelectChange('adjusters')}
          />
          <MultiSelect
            label="Status"
            options={filterOptions.statuses}
            value={tempFilters.statuses}
            onChange={handleMultiSelectChange('statuses')}
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <DatePicker
                label="Start Date"
                value={tempFilters.startDate}
                onChange={handleDateChange('startDate')}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              <DatePicker
                label="End Date"
                value={tempFilters.endDate}
                onChange={handleDateChange('endDate')}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetFilters}>Reset</Button>
          <Button onClick={handleCloseFilterDialog}>Cancel</Button>
          <Button onClick={handleApplyFilters} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard;
