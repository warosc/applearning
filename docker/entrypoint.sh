#!/bin/sh
# NOTE: This file is kept for reference only.
# Dockerfile.backend generates /app/start.sh inline at build time
# to avoid CRLF line-ending issues on Windows hosts.
set -e

echo ">> Ejecutando migraciones..."
npx prisma migrate deploy

echo ">> Verificando datos iniciales..."
# Compila y ejecuta el check de seed solo si la DB está vacía
node -e "
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const p = new PrismaClient();
p.exam.count()
  .then(count => {
    if (count === 0) {
      console.log('>> Base de datos vacía. Ejecutando seed...');
      execSync('npx ts-node --compiler-options \"{\\\\\"module\\\\\":\\\\\"CommonJS\\\\\"}\" prisma/seed.ts', { stdio: 'inherit' });
      console.log('>> Seed completado.');
    } else {
      console.log('>> Base de datos ya tiene datos. Omitiendo seed.');
    }
  })
  .catch(e => { console.warn('>> Seed check falló:', e.message); })
  .finally(() => p.\$disconnect());
"

echo ">> Iniciando servidor..."
exec node dist/src/main.js
