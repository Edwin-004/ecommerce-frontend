/**
 * Password Complexity Validation Policy
 * Must be at least 8 characters, contain at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special symbol.
 * Returns null if valid, or a descriptive error string if invalid.
 */
export const validatePasswordStrength = (password: string): string | null => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter (A-Z).';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter (a-z).';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number (0-9).';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character (e.g. !@#$%^&*).';
  }
  return null;
};

export default validatePasswordStrength;
