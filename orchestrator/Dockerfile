FROM node:20-alpine
WORKDIR /srv
RUN corepack enable && corepack prepare pnpm@8 --activate
COPY package.json pnpm-lock.yaml* ./
COPY orchestrator/package.json orchestrator/pnpm-lock.yaml* ./orchestrator/
RUN pnpm -w install --frozen-lockfile || pnpm -w install
COPY orchestrator ./orchestrator
WORKDIR /srv/orchestrator
RUN pnpm --filter orchestrator run build
ENV NODE_ENV=production
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD wget -qO- http://localhost:3001/healthz || exit 1
CMD ["node","dist/server.js"]
