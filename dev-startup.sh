#!/bin/bash

# RAPEX_V3 Development Startup Script
# Usage: ./dev-startup.sh [dev|prod|stop|logs|clean]

set -e

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Verify .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from defaults..."
        cat > .env << 'EOF'
DB_USER=rapex_user
DB_PASSWORD=rapex_password
DB_NAME=rapex_db
REDIS_PASSWORD=rapex_redis_pass
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
AUTO_SEED=false
DEBUG=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
EOF
        print_success ".env created with defaults. Please update with your values."
    else
        print_success ".env file exists"
    fi
}

# Start development environment
start_dev() {
    print_header "Starting RAPEX_V3 Development Environment"
    check_docker
    check_env
    
    print_success "Building and starting services (this may take a few minutes)..."
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
}

# Start production environment
start_prod() {
    print_header "Starting RAPEX_V3 Production Environment"
    check_docker
    check_env
    
    print_warning "Starting production environment with resource limits"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
}

# Stop all services
stop_services() {
    print_header "Stopping All Services"
    docker compose -f docker-compose.yml -f docker-compose.dev.yml down
    print_success "All services stopped"
}

# View logs
view_logs() {
    SERVICE=${1:-""}
    print_header "Viewing Logs"
    
    if [ -z "$SERVICE" ]; then
        print_warning "Showing logs for all services. Use 'logs backend' for specific service"
        docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
    else
        docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f "$SERVICE"
    fi
}

# Clean all volumes
clean_all() {
    print_warning "This will delete all data including the database!"
    read -p "Are you sure? (type 'yes' to confirm): " confirm
    
    if [ "$confirm" == "yes" ]; then
        docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
        print_success "All volumes removed"
    else
        print_error "Cleanup cancelled"
    fi
}

# Rebuild a service
rebuild_service() {
    SERVICE=$1
    if [ -z "$SERVICE" ]; then
        print_error "Please specify a service to rebuild"
        echo "Available services: backend, daphne, celery-worker, celery-beat, frontend-user, frontend-merchant, frontend-admin, frontend-superadmin, frontend-rider"
        exit 1
    fi
    
    print_header "Rebuilding $SERVICE"
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build --no-deps "$SERVICE"
}

# Run migrations
run_migrations() {
    print_header "Running Django Migrations"
    docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py migrate
    print_success "Migrations complete"
}

# Run tests
run_tests() {
    print_header "Running Tests"
    docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend pytest
}

# Shell access
shell_access() {
    SERVICE=${1:-"backend"}
    print_header "Opening Shell in $SERVICE"
    docker compose -f docker-compose.yml -f docker-compose.dev.yml exec "$SERVICE" bash
}

# Show status
show_status() {
    print_header "Container Status"
    docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
}

# Print help
show_help() {
    cat << 'EOF'
RAPEX_V3 Development Environment Manager

Usage: ./dev-startup.sh [command] [options]

Commands:
    dev              Start development environment (default)
    prod             Start production environment
    stop             Stop all services
    logs [service]   View logs (optional: specify service)
    rebuild [svc]    Rebuild a specific service
    migrate          Run Django migrations
    test             Run pytest suite
    shell [svc]      Open bash shell in a container
    status           Show container status
    clean            Remove all volumes (WARNING: deletes data)
    help             Show this help message

Examples:
    ./dev-startup.sh                    # Start dev environment
    ./dev-startup.sh prod               # Start production
    ./dev-startup.sh logs backend       # View backend logs
    ./dev-startup.sh rebuild celery-worker
    ./dev-startup.sh shell backend
    ./dev-startup.sh migrate

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

EOF
}

# Main script
main() {
    COMMAND=${1:-"dev"}
    
    case "$COMMAND" in
        dev)
            start_dev
            ;;
        prod)
            start_prod
            ;;
        stop)
            stop_services
            ;;
        logs)
            view_logs "${2:-}"
            ;;
        rebuild)
            rebuild_service "${2:-}"
            ;;
        migrate)
            run_migrations
            ;;
        test)
            run_tests
            ;;
        shell)
            shell_access "${2:-backend}"
            ;;
        status)
            show_status
            ;;
        clean)
            clean_all
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
