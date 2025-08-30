import { type ClassValue, clsx } from 'clsx';

/**
 * Utility function to merge class names
 * Combines clsx for conditional classes with proper handling
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export default cn;
