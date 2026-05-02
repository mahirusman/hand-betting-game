FROM node:20.19-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm i -f

FROM deps AS build
COPY . .
RUN npm run build:api:docker

FROM node:20.19-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist/api-docker ./
EXPOSE 3001
CMD ["node", "apps/api/src/main.js"]
