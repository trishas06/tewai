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
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import userService from '../../services/userService';
import { useUser } from '../../contexts/UserContext';
import { authService } from '../../services/authService';
import { validateEmail } from '../../utils/validation';

function getToken() {
  // Replace with your actual token retrieval logic
  return localStorage.getItem('token');
}

function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, updateUser } = useUser();
  const isEditMode = Boolean(id);
  const token = getToken();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError('');

    // Real-time email validation
    if (value) {
      const validation = validateEmail(value);
      if (!validation.isValid) {
        setEmailError(validation.error);
      }
    }
  };

  useEffect(() => {
    if (isEditMode) {
      let user = location.state?.user;
      if (user) {
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        setUsername(user.username || '');
        setEmail(user.email || '');
        setRole(user.role || '');
      }
    }
  }, [id, isEditMode, location.state]);

  const handleBack = () => {
    navigate('/user-management');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email before submission
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error);
      return;
    }
    
    setLoading(true);
    try {
      if (isEditMode) {
        const updateData = {
          user_id: id,
          first_name: firstName,
          last_name: lastName,
          username,
          email,
          role,
        };
        
        // Include password if it's provided
        if (password.trim()) {
          updateData.password = password;
        }
        
        await userService.updateUser(updateData, token);

        // If the user edited their own profile, refresh user info in global state
        if (currentUser && currentUser.user_id === id) {
          try {
            const userInfoResponse = await authService.getUserInfo(token);
            if (
              userInfoResponse.status === 'success' &&
              userInfoResponse.user
            ) {
              updateUser(userInfoResponse.user);
            }
          } catch (error) {
            console.error(
              'Failed to refresh user info after profile update:',
              error
            );
          }
        }
      } else {
        await userService.createUser(
          {
            first_name: firstName,
            last_name: lastName,
            username,
            email,
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
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={email}
                onChange={handleEmailChange}
                error={!!emailError}
                helperText={emailError}
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
            {(!isEditMode || 
              (isEditMode && (currentUser?.role === 'Admin' || currentUser?.user_id === id))) && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isEditMode}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
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
