FROM node:20.19-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm i -f

FROM deps AS build
COPY . .
RUN npm run build:web:docker

FROM node:20.19-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
