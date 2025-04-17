# PostgreSQL Setup Script for Game Master Support

# Installation instructions for PostgreSQL
Write-Host "==== PostgreSQL Setup for Game Master Support ====" -ForegroundColor Green
Write-Host ""
Write-Host "This script will guide you through setting up PostgreSQL for the Game Master Support application." -ForegroundColor Yellow
Write-Host ""

# Check if PostgreSQL is installed
$pgInstalled = $false
try {
    $pgVersion = & "psql" --version 2>$null
    if ($pgVersion) {
        Write-Host "PostgreSQL is already installed: $pgVersion" -ForegroundColor Green
        $pgInstalled = $true
    }
} catch {
    Write-Host "PostgreSQL is not installed or not in PATH." -ForegroundColor Red
}

if (-not $pgInstalled) {
    Write-Host "Please install PostgreSQL using one of these methods:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Install using Chocolatey (Recommended)" -ForegroundColor Cyan
    Write-Host "   Run as Administrator: choco install postgresql -y" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Download and install from official website" -ForegroundColor Cyan
    Write-Host "   https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host ""
    Write-Host "After installation, please restart your terminal and run this script again." -ForegroundColor Yellow
    exit
}

# Create database
Write-Host "Creating database 'game_master_db'..." -ForegroundColor Cyan
try {
    $result = & psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='game_master_db'" | Select-String -Pattern "1"
    if ($result) {
        Write-Host "Database 'game_master_db' already exists." -ForegroundColor Yellow
    } else {
        & psql -U postgres -c "CREATE DATABASE game_master_db;"
        Write-Host "Database 'game_master_db' created successfully." -ForegroundColor Green
    }
} catch {
    Write-Host "Error creating database: $_" -ForegroundColor Red
    Write-Host "Please make sure PostgreSQL service is running and your user has the right permissions." -ForegroundColor Yellow
    exit
}

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Cyan
try {
    & npx prisma generate
    Write-Host "Prisma client generated successfully." -ForegroundColor Green
} catch {
    Write-Host "Error generating Prisma client: $_" -ForegroundColor Red
    exit
}

# Push schema to database
Write-Host "Pushing schema to database..." -ForegroundColor Cyan
try {
    & npx prisma db push
    Write-Host "Schema pushed to database successfully." -ForegroundColor Green
} catch {
    Write-Host "Error pushing schema to database: $_" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "==== PostgreSQL setup complete! ====" -ForegroundColor Green
Write-Host "You can now run your application with: npm start" -ForegroundColor Cyan 