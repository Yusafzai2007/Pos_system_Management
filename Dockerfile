# Use official Node.js LTS image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the project files
COPY . .

# Expose the port your Node.js app runs on
EXPOSE 4000

# Start the application
CMD ["node", "src/index.js"]


# ✅ Use Render's assigned port (e.g., 10000) dynamically
CMD ["sh", "-c", "node index.js --port ${PORT:-3000}"]
