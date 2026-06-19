# ==========================================
# Stage 1: Build the Next.js Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Install package dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8000/api}
RUN npm run build

# ==========================================
# Stage 2: Final runner image (Python & Node)
# ==========================================
FROM python:3.11-slim
WORKDIR /app

# Install Curl & Node.js 20.x runtime environment
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy FastAPI backend source
COPY backend/ ./backend

# Copy package dependencies and client code for production Next.js runner
COPY package*.json ./
RUN npm ci --only=production
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/next.config.ts ./next.config.ts

# Copy environment template / musclecheck.db initial database
COPY .env* ./
COPY musclecheck.db ./musclecheck.db

# Create startup orchestrator script
RUN echo '#!/bin/sh\n\
echo "Starting FastAPI backend on port 8000..."\n\
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &\n\
\n\
echo "Starting Next.js production frontend on port 3000..."\n\
exec npm run start -- -p 3000\n\
' > start.sh && chmod +x start.sh

# Expose ports for Next.js (3000) and FastAPI (8000)
EXPOSE 3000
EXPOSE 8000

CMD ["./start.sh"]
