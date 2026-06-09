# RAPEX_V3 Development Startup Script for PowerShell
# Usage: .\dev-startup.ps1 [dev|prod|stop|logs|clean]

param(
    [string]$Command = "dev",
    [string]$Service = ""
)

$ErrorActionPreference = "Stop"

# Color codes
$Colors = @{
    Green   = "`e[0;32m"
    Blue    = "`e[0;34m"
    Yellow  = "`e[1;33m"
    Red     = "`e[0;31m"
    Reset   = "`e[0m"
}

function Print-Header {
    param([string]$Message)
    Write-Host "$($Colors.Blue)════════════════════════════════════════$($Colors.Reset)"
    Write-Host "$($Colors.Green)$Message$($Colors.Reset)"
    Write-Host "$($Colors.Blue)════════════════════════════════════════$($Colors.Reset)"
}

function Print-Success {
    param([string]$Message)
    Write-Host "$($Colors.Green)✓ $Message$($Colors.Reset)"
}

function Print-Warning {
    param([string]$Message)
    Write-Host "$($Colors.Yellow)⚠ $Message$($Colors.Reset)"
}

function Print-Error {
    param([string]$Message)
    Write-Host "$($Colors.Red)✗ $Message$($Colors.Reset)"
}

function Check-Docker {
    try {
        docker info > $null 2>&1
        Print-Success "Docker is running"
    }
    catch {
        Print-Error "Docker is not running. Please start Docker first."
        exit 1
    }
}

function Check-Env {
    if (-not (Test-Path ".env")) {
        Print-Warning ".env file not found. Creating from defaults..."
        $EnvContent = @"
DB_USER=rapex_user
DB_PASSWORD=rapex_password
DB_NAME=rapex_db
REDIS_PASSWORD=rapex_redis_pass
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
AUTO_SEED=false
DEBUG=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
"@
        Set-Content -Path ".env" -Value $EnvContent
        Print-Success ".env created with defaults. Please update with your values."
    }
    else {
        Print-Success ".env file exists"
    }
}

function Start-Dev {
    Print-Header "Starting RAPEX_V3 Development Environment"
    Check-Docker
    Check-Env
    
    Print-Success "Building and starting services (this may take a few minutes)..."
    & docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
}

function Start-Prod {
    Print-Header "Starting RAPEX_V3 Production Environment"
    Check-Docker
    Check-Env
    
    Print-Warning "Starting production environment with resource limits"
    & docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
}

function Stop-Services {
    Print-Header "Stopping All Services"
    & docker compose -f docker-compose.yml -f docker-compose.dev.yml down
    Print-Success "All services stopped"
}

function View-Logs {
    param([string]$ServiceName = "")
    Print-Header "Viewing Logs"
    
    if ([string]::IsNullOrEmpty($ServiceName)) {
        Print-Warning "Showing logs for all services. Use 'logs backend' for specific service"
        & docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
    }
    else {
        & docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f $ServiceName
    }
}

function Clean-All {
    Print-Warning "This will delete all data including the database!"
    $Confirm = Read-Host "Are you sure? (type 'yes' to confirm)"
    
    if ($Confirm -eq "yes") {
        & docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
        Print-Success "All volumes removed"
    }
    else {
        Print-Error "Cleanup cancelled"
    }
}

function Rebuild-Service {
    param([string]$ServiceName)
    
    if ([string]::IsNullOrEmpty($ServiceName)) {
        Print-Error "Please specify a service to rebuild"
        Write-Host "Available services: backend, daphne, celery-worker, celery-beat, frontend-user, frontend-merchant, frontend-admin, frontend-superadmin, frontend-rider"
        exit 1
    }
    
    Print-Header "Rebuilding $ServiceName"
    & docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --no-deps $ServiceName
}

function Run-Migrations {
    Print-Header "Running Django Migrations"
    & docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py migrate
    Print-Success "Migrations complete"
}

function Run-Tests {
    Print-Header "Running Tests"
    & docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend pytest
}

function Shell-Access {
    param([string]$ServiceName = "backend")
    Print-Header "Opening Shell in $ServiceName"
    & docker compose -f docker-compose.yml -f docker-compose.dev.yml exec $ServiceName bash
}

function Show-Status {
    Print-Header "Container Status"
    & docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
}

function Show-Help {
    Write-Host @"
RAPEX_V3 Development Environment Manager

Usage: .\dev-startup.ps1 -Command [command] -Service [service]

Commands:
    dev              Start development environment (default)
    prod             Start production environment
    stop             Stop all services
    logs             View logs (optional: specify service with -Service)
    rebuild          Rebuild a specific service (use -Service)
    migrate          Run Django migrations
    test             Run pytest suite
    shell            Open PowerShell in a container (optional: -Service)
    status           Show container status
    clean            Remove all volumes (WARNING: deletes data)
    help             Show this help message

Examples:
    .\dev-startup.ps1                           # Start dev environment
    .\dev-startup.ps1 -Command prod             # Start production
    .\dev-startup.ps1 -Command logs -Service backend
    .\dev-startup.ps1 -Command rebuild -Service celery-worker
    .\dev-startup.ps1 -Command shell -Service backend
    .\dev-startup.ps1 -Command migrate

Services:
    - backend (Django/Gunicorn)
    - daphne (WebSocket)
    - celery-worker
    - celery-beat
    - frontend-user
    - frontend-merchant
    - frontend-admin
    - frontend-superadmin
    - frontend-rider
    - postgres
    - redis
    - minio
    - nginx

"@
}

# Main execution
try {
    switch ($Command.ToLower()) {
        "dev" {
            Start-Dev
        }
        "prod" {
            Start-Prod
        }
        "stop" {
            Stop-Services
        }
        "logs" {
            View-Logs -ServiceName $Service
        }
        "rebuild" {
            Rebuild-Service -ServiceName $Service
        }
        "migrate" {
            Run-Migrations
        }
        "test" {
            Run-Tests
        }
        "shell" {
            Shell-Access -ServiceName $(if ([string]::IsNullOrEmpty($Service)) { "backend" } else { $Service })
        }
        "status" {
            Show-Status
        }
        "clean" {
            Clean-All
        }
        "help" {
            Show-Help
        }
        default {
            Print-Error "Unknown command: $Command"
            Show-Help
            exit 1
        }
    }
}
catch {
    Print-Error "An error occurred: $_"
    exit 1
}
