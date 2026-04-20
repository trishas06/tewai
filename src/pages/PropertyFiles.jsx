import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
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
  MenuItem,
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
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Description as DescriptionIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";

import { useUser } from "../contexts/UserContext";
import dashboardService from "../services/dashboardService";
import { ALLOWED_STATUSES } from "../utils/allowedStatuses";
import { UserRoleContext } from "../components/layout/AuthLayout";
import { useTheme } from "@mui/material/styles";

// Table header cells
const headCells = [
  { id: "propertyType", label: "Property Type" },
  { id: "reportName", label: "Report Name" }, // Changed from fileName to match mapping
  { id: "claimNo", label: "Claim No." },
  { id: "carrier", label: "Carrier" },
  { id: "policyNo", label: "Policy No." },
  // { id: "policyForm", label: "Policy Form" },
  { id: "adjusterName", label: "Adjuster Name" },
  { id: "createdOn", label: "Created On" },
  { id: "status", label: "Status" },
];

// Status chip colors - consistent solid backgrounds with white text for all modes
const getStatusColor = (status, theme) => {
  switch (status) {
    case "Failed":
      return {
        color: "#ffffff",
        bgcolor: theme.palette.error.main,
      };
    case "Generated":
      return {
        color: "#ffffff",
        bgcolor: theme.palette.primary.main,
      };
    case "Validated":
      return {
        color: "#ffffff",
        bgcolor: theme.palette.success.main,
      };
    case "Missing Prelim Document":
    case "Unsearchable PDF":
      return {
        color: "#ffffff",
        bgcolor: theme.palette.warning.main,
      };
    default:
      return {
        color: theme.palette.text.secondary,
        bgcolor:
          theme.palette.mode === "dark"
            ? theme.palette.grey[800]
            : theme.palette.grey[100],
      };
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
  // Handle removing a specific chip
  const handleDelete = (chipValue) => (event) => {
    event.preventDefault();
    event.stopPropagation();
    const newValue = value.filter((item) => item !== chipValue);
    onChange({ target: { value: newValue } });
  };

  return (
    <FormControl fullWidth margin="normal">
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={onChange}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => (
          <Box
            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
            onClick={(e) => e.stopPropagation()} // Prevent clicks on the container from opening select
          >
            {selected.map((value) => (
              <Chip
                key={value}
                label={value}
                onDelete={handleDelete(value)}
                deleteIcon={
                  <CloseIcon
                    sx={{
                      color: "#ffffff !important",
                      fontSize: "18px !important",
                      "&:hover": {
                        color: "rgba(255, 255, 255, 0.8) !important",
                      },
                    }}
                    onMouseDown={(e) => e.stopPropagation()} // Additional prevention
                  />
                }
                sx={{
                  bgcolor: "primary.main",
                  color: "#ffffff",
                  fontWeight: 500,
                  "& .MuiChip-deleteIcon": {
                    color: "#ffffff",
                    fontSize: "18px",
                    "&:hover": {
                      color: "rgba(255, 255, 255, 0.8)",
                    },
                  },
                }}
                onClick={(e) => e.stopPropagation()} // Prevent chip clicks from opening select
              />
            ))}
          </Box>
        )}
      >
        {(options || []).map((option) => (
          <MenuItem
            key={option}
            value={option}
            sx={{
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "white",
              },
              "&.Mui-selected:hover": {
                bgcolor: "primary.dark",
                color: "white",
              },
              "&:hover": {
                bgcolor: "primary.light",
                color: "primary.main",
              },
            }}
          >
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
function StatusChip({ status, onClick, theme }) {
  const { color, bgcolor } = getStatusColor(status, theme);
  const isGenerated = status === "Generated" || status === "Validated";
  const isMultiWord = status?.includes(" ");

  return (
    <Tooltip title={isMultiWord ? status : ""} arrow>
      <Chip
        label={status}
        size="small"
        // Only trigger the click handler if status is Generated
        onClick={isGenerated ? onClick : undefined}
        sx={{
          color,
          bgcolor,
          fontWeight: 600,
          maxWidth: 110,
          // Cursor logic
          cursor: isGenerated ? "pointer" : "not-allowed",
          ...(!isGenerated && {
            opacity: 0.4, // Makes it look faded
            filter: "grayscale(0.7)", // Pulls some color out
            pointerEvents: "none", // Optional: strictly prevents clicks
          }),
          "& .MuiChip-label": {
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
          // Ensure hover effect only applies to clickable Generated chip
          ...(isGenerated
            ? {
                "&:hover": {
                  bgcolor: theme.palette.primary.dark,
                  boxShadow: "0px 2px 4px rgba(0,0,0,0.2)",
                },
              }
            : {
                "&:hover": { bgcolor }, // Disable hover for others
              }),
        }}
      />
    </Tooltip>
  );
}

function PropertyFiles() {
  const navigate = useNavigate();
  const { loading: userLoading, isAuthenticated } = useUser();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    carriers: [],
    policyForms: [],
    adjusters: [],
    statuses: [],
    reportTypes: [],
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
    reportTypes: [],
  });
  const [tempFilters, setTempFilters] = useState({ ...filters });

  // Check authentication first - handled by UserContext
  useEffect(() => {
    if (userLoading) {
      return; // Wait for UserContext to finish loading
    }

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [userLoading, isAuthenticated, navigate]);

  // Fetch initial data and filter options only after authentication
  useEffect(() => {
    if (userLoading || !isAuthenticated) {
      return;
    }

    const fetchInitialData = async () => {
      try {
        // Fetch filter options
        const options = await dashboardService.getPropertyFilterOptions();
        setFilterOptions((prevOptions) => ({ ...prevOptions, ...options }));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [userLoading, isAuthenticated]);

  // Fetch data when page, rowsPerPage, filters, or search term changes (only if authenticated)
  useEffect(() => {
    if (userLoading || !isAuthenticated) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const normalizedFilters = {
          ...filters,
          reportTypes: filters.reportTypes.map((t) => t.toUpperCase()),
        };
        const result = await dashboardService.getPropertyFilesData(
          page,
          rowsPerPage,
          normalizedFilters,
          searchTerm,
        );
        setRows(result.data);
        setTotalCount(result.totalCount);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [userLoading, isAuthenticated, page, rowsPerPage, filters, searchTerm]);

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
      reportTypes: [],
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
    navigate(`/property-files/loss-report/${row.claimNo}`, {
      state: { ...row.originalData, source: "propertyFiles" },
    });
  };

  // Add this function at the top of the component
  const generateUniqueKey = (row) => {
    return `${row.claimNo}-${row.createdOn}-${row.policyNo}`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
        Loss Reports
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <TextField
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{
            width: 300,
            bgcolor: "background.paper",
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "divider",
              },
              "&:hover fieldset": {
                borderColor: "text.secondary",
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleOpenFilterDialog}
          sx={{ borderColor: "divider", color: "text.secondary" }}
        >
          Filter
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{ boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" }}
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
                <TableCell colSpan={headCells.length} align="center">
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headCells.length} align="center">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} hover>
                  {/* 1. Property Type */}
                  <TableCell
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: "#5B9B98", // Teal color matching your image
                      fontWeight: 500,
                    }}
                  >
                    {row.propertyType}
                  </TableCell>

                  {/* 2. Report Name */}
                  <TableCell>
                    <Tooltip title={row.reportName} arrow>
                      <span
                        style={{
                          display: "inline-block",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          verticalAlign: "middle",
                          textTransform: "uppercase", // Matching the uppercase style in image
                          fontSize: "0.875rem",
                        }}
                      >
                        {row.reportName}
                      </span>
                    </Tooltip>
                  </TableCell>

                  {/* 3. Claim No. */}
                  <TableCell>{row.claimNo}</TableCell>

                  {/* 4. Carrier */}
                  <TableCell>
                    <Tooltip
                      title={
                        row.carrier.split(" ").length > 2 ? row.carrier : ""
                      }
                      arrow
                    >
                      <span style={{ color: "#5B9B98" }}>
                        {row.carrier.split(" ").length > 2
                          ? row.carrier.split(" ").slice(0, 2).join(" ") + "..."
                          : row.carrier}
                      </span>
                    </Tooltip>
                  </TableCell>

                  {/* 5. Policy No. */}
                  <TableCell>{row.policyNo}</TableCell>

                  {/* 6. Policy Form */}
                  {/* <TableCell>{row.policyForm}</TableCell> */}

                  {/* 7. Adjuster Name */}
                  <TableCell>{row.adjusterName}</TableCell>

                  {/* 8. Created On */}
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {row.createdOn}
                  </TableCell>

                  {/* 9. Status */}
                  <TableCell>
                    <StatusChip
                      status={row.status}
                      onClick={() => handleNavigateToLossReport(row)}
                      theme={theme}
                    />
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
            label="Property Type"
            options={filterOptions.reportTypes}
            value={tempFilters.reportTypes}
            onChange={handleMultiSelectChange("reportTypes")}
          />
          <MultiSelect
            label="Carrier"
            options={filterOptions.carriers}
            value={tempFilters.carriers}
            onChange={handleMultiSelectChange("carriers")}
          />
          <MultiSelect
            label="Adjuster"
            options={filterOptions.adjusters}
            value={tempFilters.adjusters}
            onChange={handleMultiSelectChange("adjusters")}
          />
          <MultiSelect
            label="Status"
            options={filterOptions.statuses}
            value={tempFilters.statuses}
            onChange={handleMultiSelectChange("statuses")}
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
              <DatePicker
                label="Start Date"
                value={tempFilters.startDate}
                onChange={handleDateChange("startDate")}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              <DatePicker
                label="End Date"
                value={tempFilters.endDate}
                onChange={handleDateChange("endDate")}
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

export default PropertyFiles;
