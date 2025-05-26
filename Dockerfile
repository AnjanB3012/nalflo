FROM node:18-bullseye

# Install Python, pip, supervisor
RUN apt update && apt install -y python3 python3-pip supervisor

# Set working directory
WORKDIR /app

# Copy all files to container
COPY . .

# Install Python requirements
RUN pip3 install -r requirements.txt

# Install React dependencies
RUN cd frontend && npm install

# Expose Flask and React ports
EXPOSE 8080 3000

# Start both servers using supervisord
CMD ["supervisord", "-c", "supervisord.conf"]
