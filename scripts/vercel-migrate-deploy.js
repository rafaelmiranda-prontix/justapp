#!/usr/bin/env node
/**
 * Roda `prisma migrate deploy` apenas durante o build na Vercel.
 * No build local (npm run build) não executa, para não exigir banco.
 * Na Vercel, aplica as migrations pendentes antes do next build.
 */

const { execSync } = require('child_process');

if (process.env.VERCEL !== '1') {
  console.log('[vercel-migrate-deploy] Fora da Vercel, pulando migrations.');
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.warn('[vercel-migrate-deploy] DATABASE_URL não definida, pulando migrations.');
  process.exit(0);
}

console.log('[vercel-migrate-deploy] Aplicando migrations no banco...');
try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env },
  });
  console.log('[vercel-migrate-deploy] Migrations aplicadas.');
} catch (err) {
  console.error('[vercel-migrate-deploy] Erro ao aplicar migrations:', err.message);
  process.exit(1);
}
