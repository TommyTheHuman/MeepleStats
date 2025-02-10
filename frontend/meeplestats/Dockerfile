# frontend/meeplestats/Dockerfile

# Use an official Node.js runtime as a parent image
FROM node:21

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install any needed packages
RUN npm install

# Copy the current directory contents into the container at /app
COPY . .

# Make port 5173 available to the world outside this container
EXPOSE 5173

# Run the application
CMD ["npm", "run", "dev", "--", "--host"]
