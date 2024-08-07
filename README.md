## CodeC Getting Started Guide

CodeC currently uses multiple Node.js versions, so having `nvm` installed is essential. You'll need Node version 16.20.2 for the backend API and Node version 21.7.1 for the client-side which utilizes Next.js as the framework.

For a more in-depth guide and information, refer to our CodeC Wiki: [https://github.com/mosnamarco/CodeC/wiki](https://github.com/mosnamarco/CodeC/wiki).

## Development Prerequisites

* `docker` must be installed on your machine.
* `nvm` should be used to manage Node.js versions.
* `mongodb` to manage database instances
* `mongodb compass` database insteraction GUI

## Quick Start: How to Run the development server

This quick start guide assumes that you already have the prerequisites installed on your machine. If not. Refer to these installation guides
* [Docker](https://docs.docker.com/engine/install/)
* [NVM](https://github.com/nvm-sh/nvm)
* [MongoDB](https://www.mongodb.com/docs/manual/installation/)
* [MongoDB Compass](https://www.mongodb.com/docs/compass/current/install/)

1. Clone the repository:

   ```bash
   git clone https://github.com/mosnamarco/CodeC.git
   ```

2. Navigate into the cloned directory:

   ```bash
   cd CodeC
   ```

### Server

1. Change directory to the server folder:

   ```bash
   cd server
   ```

2. Switch to Node version 16.20.2 using nvm:

   ```bash
   nvm use 16.20.2
   ```

3. Install dependencies and start the development server:

   ```bash
   npm install && npm run devt
   ```

### Client

1. Change directory to the client folder:

   ```bash
   cd client
   ```

2. Switch to Node version 21.7.1 using nvm:

   ```bash
   nvm use 21.7.1
   ```

3. Install dependencies and start the development server:

   ```bash
   npm install && npm run dev
   ```

### Judge0

1. Navigate to the `judge0` folder inside the `server` directory.

2. Start Judge0 using Docker Compose:

   ```bash
   docker-compose up
   ```
   or
   ```bash
   docker compose up
   ```

   Note: If you are using a GNU/Linux system, make sure to [set cgroups to v1](https://docs.docker.com/config/containers/runmetrics/#:~:text=Changing%20cgroup%20version,-Changing%20cgroup%20version&text=On%20systemd%2Dbased%20systems%2C%20cgroup,unified_cgroup_hierarchy%3D0%20instead.) to make Judge0 work properly. 
