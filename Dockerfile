FROM node:20-alpine

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