-- CloudStream Database Initialization Script

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE cloudstream'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cloudstream');

-- Connect to the cloudstream database
\c cloudstream;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types (these will be managed by Prisma migrations)
-- This file is mainly for initial setup and extensions

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE cloudstream TO cloudstream;

-- Create indexes for performance (will be created by Prisma as well)
-- These are just examples of what might be useful

-- Log successful initialization
INSERT INTO pg_stat_statements_info (dealloc) VALUES (0) ON CONFLICT DO NOTHING; 