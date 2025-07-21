import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import userService from '../../services/userService';

function getToken() {
  // Replace with your actual token retrieval logic
  return localStorage.getItem('token');
}

function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(id);
  const token = getToken();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      let user = location.state?.user;
      if (user) {
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        setUsername(user.username || '');
        setRole(user.role || '');
      }
    }
  }, [id, isEditMode, location.state]);

  const handleBack = () => {
    navigate('/user-management');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode) {
        await userService.updateUser(
          {
            user_id: id,
            first_name: firstName,
            last_name: lastName,
            username,
            role,
          },
          token
        );
      } else {
        await userService.createUser(
          {
            first_name: firstName,
            last_name: lastName,
            username,
            role,
            password,
          },
          token
        );
      }
      navigate('/user-management');
    } catch (err) {
      err;
      alert('Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {isEditMode ? 'Edit User' : 'Add New User'}
        </Typography>
      </Box>
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit} autoComplete="off">
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                fullWidth
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                fullWidth
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Username"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  value={role}
                  label="Role"
                  onChange={(e) => setRole(e.target.value)}
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Developer">Developer</MenuItem>
                  <MenuItem value="Adjuster">Adjuster</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {!isEditMode && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  mt: 2,
                }}
              >
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loading}
                >
                  {isEditMode ? 'Save Changes' : 'Create User'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}

export default UserForm;
