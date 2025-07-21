import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Menu,
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
  Checkbox,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import userService from '../../services/userService';

function getToken() {
  // Replace with your actual token retrieval logic
  return localStorage.getItem('token');
}

function getCurrentUsername() {
  // Replace with your actual username retrieval logic
  return localStorage.getItem('username');
}

// Table header cells
const headCells = [
  { id: 'name', label: 'Name' },
  { id: 'username', label: 'Username' },
  { id: 'role', label: 'Role' },
  { id: 'actions', label: 'Actions' },
];

function UserManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, user: null });
  const [confirmMultiDelete, setConfirmMultiDelete] = useState(false);

  const token = getToken();
  const currentUsername = getCurrentUsername();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await userService.getUsers(token);
        setRows(data.users || []);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleAddNewUser = () => {
    navigate('/user-form');
  };

  const handleEditUser = (user_id) => {
    const userToEdit = rows.find(user => user.user_id === user_id);
    navigate(`/user-form/${user_id}`, { state: { user: userToEdit } });
  };

  const handleDeleteUsers = async () => {
    // Prevent self-deletion
    const usersToDelete = rows.filter(u => selected.includes(u.user_id));
    if (usersToDelete.some(u => u.username === currentUsername)) {
      alert("You cannot delete yourself.");
      return;
    }
    setConfirmMultiDelete(true);
  };

  const confirmMultiDeleteUsers = async () => {
    setLoading(true);
    try {
      await userService.deleteUser(selected, token);
      setRows(rows.filter(u => !selected.includes(u.user_id)));
      setSelected([]);
    } finally {
      setLoading(false);
      setConfirmMultiDelete(false);
    }
  };

  const cancelMultiDeleteUsers = () => {
    setConfirmMultiDelete(false);
  };

  const handleDeleteSingleUser = async (user_id, username) => {
    if (username === currentUsername) {
      alert("You cannot delete yourself.");
      return;
    }
    setConfirmDelete({ open: true, user: { user_id, username } });
  };

  const confirmDeleteUser = async () => {
    const { user_id } = confirmDelete.user;
    setLoading(true);
    try {
      await userService.deleteUser([user_id], token);
      setRows(rows.filter(u => u.user_id !== user_id));
      setSelected(selected.filter(id => id !== user_id));
    } finally {
      setLoading(false);
      setConfirmDelete({ open: false, user: null });
    }
  };

  const cancelDeleteUser = () => {
    setConfirmDelete({ open: false, user: null });
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = rows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((n) => n.user_id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, user_id) => {
    const selectedIndex = selected.indexOf(user_id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, user_id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const isSelected = (user_id) => selected.indexOf(user_id) !== -1;

  const filteredUsers = rows.filter((user) =>
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
        User Management
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{
            width: 300,
            bgcolor: 'white',
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#757575' }} />
              </InputAdornment>
            ),
          }}
        />
        <Box>
          {selected.length > 0 && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteUsers}
              sx={{ mr: 2 }}
            >
              Delete Selected ({selected.length})
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddNewUser}
          >
            Add New User
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length}
                  checked={filteredUsers.length > 0 && selected.length === filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length && selected.length > 0}
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              {headCells.map((cell) => (
                <TableCell key={cell.id}>{cell.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                const isItemSelected = isSelected(row.user_id);
                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, row.user_id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.user_id}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={isItemSelected} />
                    </TableCell>
                    <TableCell>{`${row.first_name} ${row.last_name}`}</TableCell>
                    <TableCell>{row.username}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditUser(row.user_id)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteSingleUser(row.user_id, row.username)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
      {/* Confirmation Dialog for multi delete */}
      <Dialog open={confirmMultiDelete} onClose={cancelMultiDeleteUsers}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the selected users?
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelMultiDeleteUsers}>Cancel</Button>
          <Button onClick={confirmMultiDeleteUsers} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      {/* Confirmation Dialog for single delete */}
      <Dialog open={confirmDelete.open} onClose={cancelDeleteUser}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete user <b>{confirmDelete.user?.username}</b>?
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteUser}>Cancel</Button>
          <Button onClick={confirmDeleteUser} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagement; 