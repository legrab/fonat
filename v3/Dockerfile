FROM node:22.16.0-bookworm-slim AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM node:22.16.0-bookworm-slim AS runtime
ENV NODE_ENV=production RUNTIME_PROFILE=production PORT=3001
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist
EXPOSE 3001
CMD ["node", "apps/server/dist/dev.js"]
