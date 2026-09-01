FROM node:26.8.1-bookworm-slim AS build
WORKDIR /app
ENV DATABASE_URL=postgresql://user:pass@localhost:5432/nhienin3d
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json .npmrc ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install --workspace=@nhienin3d/api --include-workspace-root=false \
    && npm audit --workspace=@nhienin3d/api --audit-level=high
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN npm run build

FROM node:26.8.1-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json .npmrc ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install --omit=dev --workspace=@nhienin3d/api --include-workspace-root=false \
    && npm audit --omit=dev --workspace=@nhienin3d/api --audit-level=high \
    && npm cache clean --force
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/src/generated ./apps/api/src/generated
WORKDIR /app/apps/api
EXPOSE 3001
USER node
CMD ["node", "dist/main.js"]
