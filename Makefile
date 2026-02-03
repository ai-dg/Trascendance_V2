# ■ Path Configuration
COMPOSE = srcs/docker-compose.yml

# ■ Cleanup Targets
MIGRATIONS_DIRECTORIES= srcs/app/accounts/migrations srcs/app/livechat/migrations srcs/app/pong/migrations
DATABASE_DIRECTORIES = ${HOME}/data/database ${HOME}/data/logsdata

# ■ Terminal Colors
GREEN = "\033[32m"
RESET = "\033[0m"

######################################################################
#********************** ▌ START & DEPLOYMENT ▌***********************#
######################################################################

up: build
	docker compose -f $(COMPOSE) create
	docker compose -f $(COMPOSE) up --remove-orphans

d: build
	docker compose -f $(COMPOSE) create
	docker compose -f $(COMPOSE) up --remove-orphans -d
	@$(MAKE) find-logs

watch:
	( \
		cd srcs/services/frontend && \
		npm install && \
		npm install ts && \
		npm install typescript \
		npm run watch:ts & \
		npm run watch:css & \
		wait \
	)

dev:
	docker compose -f $(COMPOSE) up --force-recreate --build

build:
	docker compose -f $(COMPOSE) build

no-cache:
	docker compose -f $(COMPOSE) build --no-cache

re:
	@$(MAKE) down
	@docker images -q > IMAGES
	@cat IMAGES | while IFS= read -r line; do \
		docker rmi "$$line"; \
	done
	@rm IMAGES
	@echo ${GREEN}Images deleted${RESET}
	@$(MAKE) up

######################################################################
#************************ ▌ STOP & CLEAN ▌***************************#
######################################################################

down:
	@$(MAKE) kill-logs
	docker compose -f $(COMPOSE) down

downv:
	@$(MAKE) kill-logs
	docker compose -f $(COMPOSE) down -v
	@echo $(GREEN)Removing database volume folder...$(RESET)
	@sudo rm -rf ${DATABASE_DIRECTORIES}
	@sudo rm -rf srcs/app/venv
	@echo $(GREEN)Done.$(RESET)
	@echo $(GREEN)Removing migrations directories...$(RESET)
	@sudo rm -rf $(MIGRATIONS_DIRECTORIES)
	@echo $(GREEN)Done.$(RESET)

clean:
	@echo $(GREEN)Stopping and killing log processes...$(RESET)
	@$(MAKE) kill-logs
	@echo $(GREEN)Cleaning Docker images...$(RESET)
	@docker images -q > IMAGES
	@cat IMAGES | while IFS= read -r line; do \
		docker rmi -f "$$line"; \
	done
	@rm IMAGES
	@echo ${GREEN}Images deleted${RESET}
	@docker builder prune --all --force
	@echo ${GREEN}Cache cleaned${RESET}
	@echo $(GREEN)Removing log files...$(RESET)
	@rm -f srcs/logs/*.log
	@rm -f srcs/logs/pids.txt
	@echo $(GREEN)Removing SQLite databases...$(RESET)
	@rm -f srcs/services/auth/app/auth.sqlite
	@rm -f srcs/services/live-chat/app/live-chat.sqlite
	@echo $(GREEN)Removing Redis data...$(RESET)
	@rm -rf srcs/volumes/redis_data/dump.rdb
	@echo $(GREEN)Removing compiled JavaScript files...$(RESET)
	@find srcs/services/frontend/srcs/public/scripts/js -type f -name "*.js" -delete 2>/dev/null || true
	@find srcs/services/frontend/srcs/public/scripts/js -type f -name "*.d.ts" -delete 2>/dev/null || true
	@find srcs/services/frontend/srcs/public/scripts/js -type f -name "*.js.map" -delete 2>/dev/null || true
	@docker system df
	@echo ${GREEN}Cleanup complete!${RESET}

######################################################################
#************************ ▌ STOP & CLEAN ▌***************************#
######################################################################

find-logs:
	@echo $(GREEN)Generating logs...$(RESET)
	@srcs/scripts/logs/log-finder.sh

kill-logs:
	@srcs/scripts/logs/kill-finder.sh

######################################################################
#*********************** ▌ MONITORING ▌ *****************************#
######################################################################

logs:
	docker compose -f $(COMPOSE) logs nginx

######################################################################
#*********************** ▌ UPDATE DATA ▌ ****************************#
######################################################################

npm-install:
	@echo $(GREEN)Installing npm dependencies in all services...$(RESET)
	@cd srcs/services/frontend && npm install
	@cd srcs/services/auth/app && npm install
	@cd srcs/services/backend-ai/app && npm install
	@cd srcs/services/blockchain/app && npm install
	@cd srcs/services/game-engine/app && npm install
	@cd srcs/services/language-manager && npm install
	@cd srcs/services/live-chat/app && npm install
	@cd srcs/services/mail/app && npm install
	@cd srcs/services/realtime-sockets/app && npm install
	@cd srcs/services/server-rendering/app && npm install
	@echo $(GREEN)All npm dependencies installed!$(RESET)

update-static:
	docker compose -f $(COMPOSE) exec gunicorn bash -c "\
		cd /app/data/static/ts && \
		npm install && \
		npm run build && \
		cd /app/data && \
		rm -rf /app/data/staticfiles/* && \
		python manage.py collectstatic --noinput"
