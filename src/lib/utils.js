import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

/**
 * Security: Sanitize input to prevent XSS attacks
 * Removes potentially dangerous HTML/script tags
 */
export function sanitizeInput(input) {
	if (typeof input !== 'string') return input;
	
	// Remove HTML tags and script content
	return input
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
		.replace(/<[^>]+>/g, '')
		.replace(/javascript:/gi, '')
		.replace(/on\w+\s*=/gi, '')
		.trim();
}

/**
 * Security: Validate email format
 */
export function validateEmail(email) {
	if (!email || typeof email !== 'string') return false;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim()) && email.length <= 254;
}

/**
 * Security: Validate phone number (international format)
 */
export function validatePhone(phone) {
	if (!phone || typeof phone !== 'string') return false;
	// Allow international format: +91 98765 43210 or 9876543210
	const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
	const cleaned = phone.replace(/[\s\-\(\)]/g, '');
	return phoneRegex.test(phone) && cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Security: Validate name (alphanumeric, spaces, and common name characters)
 */
export function validateName(name) {
	if (!name || typeof name !== 'string') return false;
	const nameRegex = /^[a-zA-Z\s\-'\.]{2,100}$/;
	return nameRegex.test(name.trim());
}

/**
 * Security: Validate number input (positive numbers only)
 */
export function validateNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
	if (!value) return false;
	const num = parseFloat(value);
	return !isNaN(num) && num >= min && num <= max;
}

/**
 * Security: Rate limiting helper (debounce)
 */
export function createRateLimiter(delay = 2000) {
	let lastCall = 0;
	return () => {
		const now = Date.now();
		if (now - lastCall < delay) {
			return false; // Too soon, rate limited
		}
		lastCall = now;
		return true; // OK to proceed
	};
}