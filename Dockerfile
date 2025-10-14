FROM oven/bun:1.1-alpine

# Install mysql-client for debugging if needed
RUN apk add --no-cache mysql-client

WORKDIR /app

COPY package.json ./
RUN bun install

COPY seed.ts ./

CMD ["tail", "-f", "/dev/null"]
