const required = ['NEON_AUTH_JWKS_URL', 'ADMIN_JWT_SECRET', 'DATABASE_URL'] as const;

export function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.ADMIN_JWT_SECRET!.length < 32) {
    throw new Error('ADMIN_JWT_SECRET must be at least 32 characters');
  }
}