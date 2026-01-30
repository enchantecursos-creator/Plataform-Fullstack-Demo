import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

/**
 * Validates if a string is a valid MongoDB ObjectId (24 hex characters)
 * @param {string} id 
 * @returns {boolean}
 */
export function validateMongoObjectId(id) {
  if (!id) return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
}