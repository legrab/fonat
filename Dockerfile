FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json* tsconfig.base.json tsconfig.backend.json eslint.config.mjs .prettierrc.json ./
COPY scripts ./scripts
COPY apps ./apps
COPY packages ./packages
COPY modules ./modules
RUN npm ci --ignore-scripts --no-audit --no-fund
RUN npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json* ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server/package.json ./apps/server/package.json
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/packages ./packages
COPY --from=build /app/modules ./modules
EXPOSE 3000
CMD ["node", "apps/server/dist/index.js"]
