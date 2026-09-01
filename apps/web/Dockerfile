FROM node:24.19.0-bookworm-slim AS build
WORKDIR /app
COPY package.json .npmrc ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install --workspace=@nhienin3d/web --include-workspace-root=false \
    && npm audit --workspace=@nhienin3d/web --audit-level=high
COPY apps/web ./apps/web
WORKDIR /app/apps/web
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:24.19.0-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
RUN test -f /app/apps/web/server.js
WORKDIR /app/apps/web
USER node
EXPOSE 3000
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 PORT=3000 exec node server.js"]
