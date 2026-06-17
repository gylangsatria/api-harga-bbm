FROM node:20-alpine

# Install Chromium dan dependensinya untuk Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy package files and install dependencies
COPY --chown=node:node package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY --chown=node:node src/ ./src/
COPY --chown=node:node data/ ./data/
COPY --chown=node:node public/ ./public/

USER node

EXPOSE 5010

CMD ["node", "src/server.js"]