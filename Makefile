.PHONY: up down logs test restart build ps clean dev help

SERVICE ?= api-gateway

## Start all services in background
up:
	docker compose up -d

## Stop all services
down:
	docker compose down

## Stream logs (usage: make logs SERVICE=ocr-service)
logs:
	docker compose logs -f $(SERVICE)

## Run all tests
test:
	@echo "=== NestJS tests ==="
	docker compose exec api-gateway npm test || true
	docker compose exec upload-service npm test || true
	docker compose exec validation-service npm test || true
	@echo "=== Python tests ==="
	docker compose exec ocr-service pytest || true
	docker compose exec classification-service pytest || true
	docker compose exec extraction-service pytest || true

## Restart a single service (usage: make restart SERVICE=ocr-service)
restart:
	docker compose restart $(SERVICE)

## Build all images
build:
	docker compose build

## Show running containers
ps:
	docker compose ps

## Remove containers, networks, and volumes
clean:
	docker compose down -v --remove-orphans

## Start in dev mode with hot reload
dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

## Show this help
help:
	@echo "DocFlow Makefile commands:"
	@grep -E '^##' Makefile | sed 's/## /  /'
