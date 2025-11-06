# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8 --activate
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml* ./
COPY frontend/package.json frontend/pnpm-lock.yaml* ./frontend/
RUN pnpm -w install --frozen-lockfile || pnpm -w install
COPY frontend ./frontend
WORKDIR /app/frontend
RUN pnpm run build && pnpm run export || pnpm run build
# Next.js static export should go to out/

# ---- serve ----
FROM nginx:alpine
COPY --from=build /app/frontend/out /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD wget -qO- http://localhost/ || exit 1
