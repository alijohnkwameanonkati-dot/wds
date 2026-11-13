export const OLAG_CLASSES = [
  'Science 1',
  'Science 2',
  'Science 3',
  'Science 4',
  'General Arts 1',
  'General Arts 2',
  'General Arts 3',
  'Visual Art',
  'Home Economics',
  'Business',
] as const;

// Synchronized verbatim with firebase-blueprint.json and firestore.rules
export const FIELD_LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 180,
  SUBMISSION_TITLE_MIN: 2,
  SUBMISSION_TITLE_MAX: 200,
  EXCERPT_MIN: 10,
  EXCERPT_MAX: 400,
  NEWS_CONTENT_MIN: 20,
  NEWS_CONTENT_MAX: 20000,
  WRITING_CONTENT_MIN: 20,
  WRITING_CONTENT_MAX: 30000,
  DEBATE_ARG_MIN: 15,
  DEBATE_ARG_MAX: 6000,
  COMMENT_MIN: 2,
  COMMENT_MAX: 1500,
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 100,
  CLASS_MAX: 60,
  URL_MAX: 1000,
  MAX_IMAGE_BYTES: 3 * 1024 * 1024,
  MAX_DOC_BYTES: 5 * 1024 * 1024,
} as const;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function generateInitialsAvatar(name: string): string {
  const clean = (name || 'OLAG').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : clean.slice(0, 2).toUpperCase() || 'OL';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="#0f172a"/><rect x="4" y="4" width="120" height="120" rx="24" fill="none" stroke="#d97706" stroke-opacity="0.45" stroke-width="2"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#fbbf24" font-family="Georgia, serif" font-weight="bold" font-size="46">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Strips HTML tags, script payloads, and dangerous control characters from visitor text.
 */
export function sanitizePlainText(input: string): string {
  return input
    .replace(/\u0000/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

export function isValidHttpUrl(url: string): boolean {
  if (!url.trim()) return true;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function validateUploadFile(file: File, kind: 'image' | 'document'): string | null {
  if (kind === 'image') {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, WebP, or GIF images are permitted.';
    }
    if (file.size > FIELD_LIMITS.MAX_IMAGE_BYTES) {
      return 'Image exceeds the 3 MB maximum upload limit.';
    }
    return null;
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const allowedExt = ['pdf', 'txt', 'doc', 'docx'];
  if (!ALLOWED_DOC_TYPES.includes(file.type) && !allowedExt.includes(ext)) {
    return 'Only PDF, DOCX, DOC, or TXT documents are permitted.';
  }
  if (file.size > FIELD_LIMITS.MAX_DOC_BYTES) {
    return 'Document exceeds the 5 MB maximum upload limit.';
  }
  return null;
}

export function generateFirestoreId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_\-]/g, '');
}

export function emailToHex(email: string): string {
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getIsoWeekKey(date = new Date()): string {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Client-side session rate limiter to curb automated flooding alongside server timestamp enforcement.
 */
const RATE_KEY_PREFIX = 'wds_rate_';
export function checkRateLimit(action: string, cooldownMs = 20000, maxPerTenMin = 8): string | null {
  try {
    const raw = sessionStorage.getItem(`${RATE_KEY_PREFIX}${action}`);
    const now = Date.now();
    const history: number[] = raw ? (JSON.parse(raw) as number[]) : [];
    const recent = history.filter((ts) => now - ts < 10 * 60 * 1000);

    if (recent.length > 0 && now - recent[recent.length - 1] < cooldownMs) {
      const waitSec = Math.ceil((cooldownMs - (now - recent[recent.length - 1])) / 1000);
      return `Please wait ${waitSec} seconds before submitting again.`;
    }
    if (recent.length >= maxPerTenMin) {
      return 'Submission rate limit reached for this session. Please try again in a few minutes.';
    }
    return null;
  } catch {
    return null;
  }
}

export function recordRateLimitHit(action: string): void {
  try {
    const raw = sessionStorage.getItem(`${RATE_KEY_PREFIX}${action}`);
    const now = Date.now();
    const history: number[] = raw ? (JSON.parse(raw) as number[]) : [];
    const recent = history.filter((ts) => now - ts < 10 * 60 * 1000);
    recent.push(now);
    sessionStorage.setItem(`${RATE_KEY_PREFIX}${action}`, JSON.stringify(recent));
  } catch {
    // ignore storage limits
  }
}

export function formatFirebaseAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  const msg = error instanceof Error ? error.message : String(error);

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid administrator email or password. Please verify your credentials.';
    case 'auth/invalid-email':
      return 'Please enter a valid school administrator email address.';
    case 'auth/user-disabled':
      return 'This administrator account has been disabled in Firebase Authentication.';
    case 'auth/too-many-requests':
      return 'Too many failed sign-in attempts. Please wait a few minutes or reset your password.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing authentication.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not yet enabled in Firebase Authentication Console. Use Google Sign-In or enable Email/Password in Firebase Console.';
    case 'auth/network-request-failed':
      return 'Network error while contacting authentication servers. Please check your connection.';
    default:
      return msg || 'Authentication failed. Please try again.';
  }
}
