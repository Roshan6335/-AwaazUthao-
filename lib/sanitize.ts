// Basic, dependency-free sanitization for public-facing user input.
// Goal: strip anything that could break rendering or inject scripts,
// and block obvious abusive content before it reaches the approval queue.

const BAD_WORDS = [
  // A short starter list — extend this over time based on what you see
  // coming through the admin approval queue.
  'randi', 'chutiya', 'madarchod', 'bhenchod', 'gandu'
];

export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')      // strip any HTML tags
    .replace(/https?:\/\/\S+/gi, '[link removed]') // strip raw links (spam vector)
    .trim()
    .slice(0, 280);
}

export function containsBadWords(input: string): boolean {
  const lower = input.toLowerCase();
  return BAD_WORDS.some((word) => lower.includes(word));
}

export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode);
}

export function isValidName(name: string): boolean {
  return /^[a-zA-Z\s.'-]{2,60}$/.test(name.trim());
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
