# PostgreSQL Setup for Game Master Support

This guide will help you set up PostgreSQL for both local development and AWS RDS deployment.

## Local Development Setup

### Option 1: Using PostgreSQL Installer (Recommended for Windows)

1. Download and install PostgreSQL from the [official website](https://www.postgresql.org/download/windows/)
   - During installation, make note of the password you set for the 'postgres' user
   - Make sure to include PostgreSQL in your PATH when prompted

2. After installation, open Command Prompt or PowerShell and verify installation:
   ```
   psql --version
   ```

3. Create a database for the application:
   ```
   psql -U postgres -c "CREATE DATABASE game_master_db;"
   ```
   You'll be prompted for the password you set during installation.

4. Update your `.env` file to use the correct connection string:
   ```
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/game_master_db"
   ```

### Option 2: Using Docker

If you prefer using Docker:

1. Make sure Docker Desktop is installed and running

2. Run PostgreSQL in a container:
   ```
   docker run --name postgres-game-master -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=game_master_db -p 5432:5432 -d postgres:15
   ```

3. Verify the container is running:
   ```
   docker ps
   ```

## Using Prisma with PostgreSQL

1. Verify your `schema.prisma` file has the correct provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Generate Prisma client:
   ```
   npx prisma generate
   ```

3. Push schema to database:
   ```
   npx prisma db push
   ```

## AWS RDS Setup for Production

1. Create an RDS PostgreSQL instance in AWS
   - Use PostgreSQL 15 or later
   - Set master username and password
   - Note the endpoint URL

2. Update your environment variables in AWS:
   ```
   DATABASE_URL="postgresql://username:password@your-endpoint.rds.amazonaws.com:5432/game_master_db"
   ```

3. Ensure security groups allow connections from your Elastic Beanstalk or Lambda environment

## Running the Script

For convenience, we've included a setup script that automates the local setup process:

```
# From the backend directory
./setup-postgres.ps1
```

This will check for PostgreSQL, create the database, and set up Prisma. 