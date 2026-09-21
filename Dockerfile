FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma.config.ts ./
COPY src/prisma ./src/prisma
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma contract emit

FROM deps AS typecheck
WORKDIR /app
COPY . .
RUN npx tsc --noEmit

FROM node:22-alpine AS dev
WORKDIR /app
COPY --from=typecheck /app/node_modules ./node_modules
COPY --from=typecheck /app/src/prisma ./src/prisma
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=typecheck /app/node_modules ./node_modules
COPY --from=typecheck /app/src/prisma ./src/prisma
COPY . .
RUN npm run build

FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY prisma.config.ts ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/prisma ./src/prisma
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma contract emit
EXPOSE 3000
CMD ["node", "dist/main.js"]