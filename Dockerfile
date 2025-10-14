FROM oven/bun:1.1-alpine

WORKDIR /app

COPY package.json ./
RUN bun install

COPY seed.ts ./

CMD ["tail", "-f", "/dev/null"]
