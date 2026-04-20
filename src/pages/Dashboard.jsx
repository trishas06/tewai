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
  { id: "reportType", label: "Report Type" },
  { id: "fileName", label: "Report Name" },
  { id: "claimNo", label: "Claim No." },
  { id: "carrier", label: "Carrier" },
  { id: "policyNo", label: "Policy No." },
  { id: "policyForm", label: "Policy Form" },
  { id: "adjusterName", label: "Adjuster Name" },
  { id: "createdOn", label: "Created On" },
  { id: "status", label: "Status" },
  // { id: "actions", label: "Action" },
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
  const isClickable = status === "Generated" || status === "Validated";
  const isMultiWord = status?.includes(" ");

  return (
    <Tooltip title={isMultiWord ? status : ""} arrow>
      <Chip
        label={status}
        size="small"
        onClick={isClickable ? onClick : undefined}
        sx={{
          color,
          bgcolor,
          fontWeight: 500,
          maxWidth: 110,
          // Ellipse overflowing text
          "& .MuiChip-label": {
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
          // Only show pointer cursor for Generated
          cursor: isClickable ? "pointer" : "default",
          // Disable hover effect for non-clickable statuses
          ...(!isClickable && {
            "&:hover": { bgcolor },
          }),
        }}
      />
    </Tooltip>
  );
}

function Dashboard() {
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
    reportTypes: ["Prelim", "Final"],
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
        const options = await dashboardService.getFilterOptions();
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
        const result = await dashboardService.getClaimsData(
          page,
          rowsPerPage,
          filters,
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
    navigate(`/flood-files/loss-report/${row.claimNo}`, {
      state: row.originalData,
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
                <TableCell colSpan={9} align="center">
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={generateUniqueKey(row)} hover>
                  <TableCell
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      width: 110,
                    }}
                  >
                    {row.prelim_folder ? "Prelim" : "Final"} Report
                  </TableCell>
                  <TableCell>
                    <Tooltip
                      title={row.originalData.loss_report_name || ""}
                      arrow
                    >
                      <span
                        style={{
                          display: "inline-block",
                          maxWidth: 250,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          verticalAlign: "middle",
                        }}
                      >
                        {row.originalData.loss_report_name &&
                        row.originalData.loss_report_name.length > 15
                          ? row.originalData.loss_report_name.slice(0, 12) +
                            "..."
                          : row.originalData.loss_report_name || ""}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{row.claimNo}</TableCell>
                  <TableCell>
                    {(() => {
                      const words = (row.carrier || "").split(" ");
                      const truncated =
                        words.length > 2
                          ? words.slice(0, 2).join(" ") + "..."
                          : row.carrier || "";
                      return (
                        <Tooltip
                          title={words.length > 2 ? row.carrier : ""}
                          arrow
                        >
                          <span>{truncated}</span>
                        </Tooltip>
                      );
                    })()}
                  </TableCell>
                  <TableCell>{row.policyNo}</TableCell>
                  <TableCell>{row.policyForm}</TableCell>
                  <TableCell>{row.adjusterName}</TableCell>
                  <TableCell
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.createdOn}
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      status={row.status}
                      onClick={() => handleNavigateToLossReport(row)}
                      theme={theme}
                    />
                  </TableCell>
                  {/* <TableCell align="center">
                    {row.status !== "Failed" && (
                      <IconButton
                        size="small"
                        title="View Loss Report"
                        disabled={!ALLOWED_STATUSES.includes(row.status)}
                        onClick={() => handleNavigateToLossReport(row)}
                      >
                        <DescriptionIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    )}
                  </TableCell> */}
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
            label="Report Type"
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
            label="Policy Form"
            options={filterOptions.policyForms}
            value={tempFilters.policyForms}
            onChange={handleMultiSelectChange("policyForms")}
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

export default Dashboard;
