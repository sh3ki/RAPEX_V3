FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json package-lock.json* ./
RUN npm install

# Source is volume-mounted in dev; node_modules stays in image
EXPOSE 3001
CMD ["npm", "run", "dev"]
