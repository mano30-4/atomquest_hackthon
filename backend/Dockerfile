FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install runtime dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const port = process.env.PORT || 5000; require('http').get(`http://localhost:${port}/health`, (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Prepare the schema and demo data before starting the API
CMD ["sh", "-c", "node scripts/bootstrap-runtime-db.js && npm start"]
