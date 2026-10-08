/**
 * Todo Time Validation Helper
 * Simple and maintainable time validation for todo creation/editing
 * 
 * Rules:
 * - Create: Can be done anytime before 08:15 (currentTime < 08:15)
 * - Edit: Can be done anytime until 17:17 (currentTime <= 17:17)
 * 
 * To disable time validation for testing:
 * Set window.DISABLE_TODO_TIME_VALIDATION = true in browser console
 * or set NEXT_PUBLIC_DISABLE_TODO_TIME_VALIDATION=true in .env.local
 */

const DISABLE_TIME_VALIDATION = 
  typeof window !== 'undefined' 
    ? window.DISABLE_TODO_TIME_VALIDATION || process.env.NEXT_PUBLIC_DISABLE_TODO_TIME_VALIDATION === 'true'
    : process.env.NEXT_PUBLIC_DISABLE_TODO_TIME_VALIDATION === 'true';

/**
 * Get current time in minutes (hours * 60 + minutes)
 * @returns {number} Current time in minutes
 */
const getCurrentTimeInMinutes = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  return currentHour * 60 + currentMinute;
};

/**
 * Check if current time allows todo creation (before 08:15)
 * @returns {boolean} true if creation is allowed, false otherwise
 */
export const canCreateTodo = () => {
  // Disable validation if flag is set (for testing)
  if (DISABLE_TIME_VALIDATION) {
    return true;
  }

  const currentTime = getCurrentTimeInMinutes();
  const createDeadline = 8 * 60 + 15; // 08:15

  return currentTime < createDeadline;
};

/**
 * Check if current time allows todo editing (until 17:17)
 * @returns {boolean} true if editing is allowed, false otherwise
 */
export const canEditTodo = () => {
  // Disable validation if flag is set (for testing)
  if (DISABLE_TIME_VALIDATION) {
    return true;
  }

  const currentTime = getCurrentTimeInMinutes();
  const editDeadline = 17 * 60 + 17; // 17:17

  return currentTime <= editDeadline;
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use canCreateTodo() or canEditTodo() instead
 * @returns {boolean} true if within allowed time, false otherwise
 */
export const isWithinAllowedTime = () => {
  return canCreateTodo();
};

/**
 * Get human-readable error message for create validation
 * @returns {string} Error message
 */
export const getCreateTimeValidationMessage = () => {
  return 'Todo hanya dapat dibuat sebelum jam 08:15';
};

/**
 * Get human-readable error message for edit validation
 * @returns {string} Error message
 */
export const getEditTimeValidationMessage = () => {
  return 'Todo hanya dapat diupdate sampai jam 17:17';
};

/**
 * Get human-readable error message for time validation (generic)
 * @deprecated Use getCreateTimeValidationMessage() or getEditTimeValidationMessage() instead
 * @returns {string} Error message
 */
export const getTimeValidationMessage = () => {
  return getCreateTimeValidationMessage();
};

/**
 * Check if time validation is disabled (for testing purposes)
 * @returns {boolean} true if validation is disabled
 */
export const isTimeValidationDisabled = () => {
  return DISABLE_TIME_VALIDATION;
};
