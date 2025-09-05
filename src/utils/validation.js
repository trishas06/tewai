// Validation utilities for the application

/**
 * Validates email format using RFC-compliant regex
 * @param {string} email - Email to validate
 * @returns {object} - {isValid: boolean, error: string}
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  // RFC-compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true, error: null };
};

/**
 * Validates username format
 * @param {string} username - Username to validate
 * @returns {object} - {isValid: boolean, error: string}
 */
export const validateUsername = (username) => {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 50) {
    return { isValid: false, error: 'Username cannot exceed 50 characters' };
  }

  // Allow letters, numbers, underscores, and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  return { isValid: true, error: null };
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} - {isValid: boolean, error: string, strength: string}
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Password is required', strength: 'none' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long', strength: 'weak' };
  }

  let strength = 'weak';
  let strengthScore = 0;

  // Check for various criteria
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (hasLowercase) strengthScore++;
  if (hasUppercase) strengthScore++;
  if (hasNumbers) strengthScore++;
  if (hasSpecialChar) strengthScore++;

  // Determine strength
  if (strengthScore >= 4 && password.length >= 12) {
    strength = 'very-strong';
  } else if (strengthScore >= 3 && password.length >= 10) {
    strength = 'strong';
  } else if (strengthScore >= 2 && password.length >= 8) {
    strength = 'medium';
  }

  // Validation rules
  if (strengthScore < 3) {
    return {
      isValid: false,
      error: 'Password must contain at least 3 of the following: uppercase letter, lowercase letter, number, special character',
      strength
    };
  }

  return { isValid: true, error: null, strength };
};

/**
 * Validates that two passwords match
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {object} - {isValid: boolean, error: string}
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true, error: null };
};

/**
 * Validates username or email format (for forgot password)
 * @param {string} input - Input to validate
 * @returns {object} - {isValid: boolean, error: string, type: string}
 */
export const validateUsernameOrEmail = (input) => {
  if (!input) {
    return { isValid: false, error: 'Username or email is required', type: null };
  }

  // Check if it looks like an email
  if (input.includes('@')) {
    const emailValidation = validateEmail(input);
    return {
      ...emailValidation,
      type: 'email'
    };
  } else {
    const usernameValidation = validateUsername(input);
    return {
      ...usernameValidation,
      type: 'username'
    };
  }
};

/**
 * Sanitizes user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};
