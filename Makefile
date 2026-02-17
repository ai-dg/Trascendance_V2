.PHONY: up d dev build no-cache re watch fclean down downv clean find-logs kill-logs logs logs-all logs-recent npm-install debug npm-install debug restart fix-rabbit-permissions fix-rabbit-cookie

# ■ Path Configuration
COMPOSE = srcs/docker-compose.yml

# ■ Cleanup Targets
LOGS = srcs/logs
PIDS = $(LOGS)/pids.txt

# ■ Terminal Colors
GREEN = "\033[32m"
RESET = "\033[0m"

DATABASE_DIRECTORIES := \
	$(HOME)/data/rabbit \
	$(HOME)/data/language \
	$(HOME)/data/prometheus \
	$(HOME)/data/grafana \
	$(HOME)/data/logstash \
	$(HOME)/data/alertmanager \
	./srcs/logs



# ■ Cleanup Targets

VAULT_DIRECTORIES= srcs/services/vault/data srcs/services/vault/logs

######################################################################
#********************** ▌ START & DEPLOYMENT ▌***********************#
######################################################################

d: vault build
	mkdir -p $(DATABASE_DIRECTORIES)
	@bash -lc 'source ./srcs/.env && \
		if [ "$$NODE_ENV" = "PROD" ]; then \
			docker compose --profile prod -f $(COMPOSE) up --remove-orphans -d; \
			$(MAKE) find-logs; \
			$(MAKE) patience-kibana; \
			$(MAKE) import-dashboard-kibana; \
		else \
			docker compose -f $(COMPOSE) up --remove-orphans -d; \
			$(MAKE) find-logs; \
		fi'

		
up: build
	docker compose -f $(COMPOSE) up --remove-orphans


start:
	docker compose -f $(COMPOSE) up --remove-orphans -d
	@$(MAKE) find-logs

restart:
	@if [ -n "$(word 2,$(MAKECMDGOALS))" ]; then \
		docker compose -f $(COMPOSE) restart $(word 2,$(MAKECMDGOALS)); \
		echo $(GREEN)Service $(word 2,$(MAKECMDGOALS)) restarted.$(RESET); \
	else \
		docker compose -f $(COMPOSE) restart; \
		echo $(GREEN)Stack restarted.$(RESET); \
	fi

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
	mkdir -p $(DATABASE_DIRECTORIES)
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
	docker compose -f $(COMPOSE) down --remove-orphans

downv:
	@$(MAKE) kill-logs
	docker compose -f $(COMPOSE) down -v --remove-orphans
	@for net in srcs_internal srcs_transcendence; do \
		for c in $$(docker network inspect -f '{{range .Containers}}{{.Name}} {{end}}' $$net 2>/dev/null); do \
			[ -z "$$c" ] || docker network disconnect -f $$net $$c 2>/dev/null || true; \
		done; \
		docker network rm $$net 2>/dev/null || true; \
	done
	docker stop elasticsearch || true
	docker rm elasticsearch || true
	docker volume rm srcs_logsdata srcs_grafana_data srcs_prometheus_data srcs_rabbitmq_data srcs_language-manager-node-modules 2>/dev/null || true
	sudo rm -rf $(DATABASE_DIRECTORIES)
	sudo rm -rf $(VAULT_DIRECTORIES)
	@mkdir -p $(DATABASE_DIRECTORIES)
	@echo $(GREEN)Volumes removed.$(RESET)

clean:
	@echo $(GREEN)Stopping and killing log processes...$(RESET)
	@$(MAKE) kill-logs
	@echo $(GREEN)Cleaning project Docker images...$(RESET)
	@docker images --filter=reference='*trascendance*' -q | xargs -r docker rmi -f 2>/dev/null || true
	@docker images --filter=reference='*transcendance*' -q | xargs -r docker rmi -f 2>/dev/null || true
	@echo ${GREEN}Project images deleted${RESET}
	@docker builder prune --all --force
	@echo ${GREEN}Cache cleaned${RESET}
	@echo $(GREEN)Removing log files...$(RESET)
	@rm -f srcs/logs/*.log
	@rm -f srcs/logs/pids.txt
	@echo $(GREEN)Removing SQLite databases...$(RESET)
	@rm -f srcs/services/auth/app/auth.sqlite
	@rm -f srcs/services/live-chat/app/live-chat.sqlite
	@echo $(GREEN)Removing Redis data...$(RESET)
	@if [ -e srcs/volumes/redis_data/dump.rdb ]; then \
	  rm -f srcs/volumes/redis_data/dump.rdb 2>/dev/null || sudo rm -f srcs/volumes/redis_data/dump.rdb; \
	fi
	@echo $(GREEN)Removing compiled JavaScript files...$(RESET)
	@find srcs/services/frontend/srcs/public/scripts/js -type f -name "*.js" -delete 2>/dev/null || true
	@find srcs/services/frontend/srcs/public/scripts/js -type f -name "*.d.ts" -delete 2>/dev/null || true
	@find srcs/services/frontend/srcs/public/scripts/js -type f -name "*.js.map" -delete 2>/dev/null || true
	@docker system df
	@echo ${GREEN}Cleanup complete!${RESET}

######################################################################
#************************ ▌ STOP & CLEAN ▌***************************#
######################################################################

# Fixes permissions for RabbitMQ .erlang.cookie file if it exists.
# On a fresh clone, this file won't exist until RabbitMQ runs for the first time.
# The || true ensures no error if the file is missing (first run).
fix-rabbit-cookie:
	@if [ -f $(HOME)/data/rabbit/.erlang.cookie ]; then \
		sudo chown 999:999 $(HOME)/data/rabbit/.erlang.cookie; \
		sudo chmod 400 $(HOME)/data/rabbit/.erlang.cookie; \
	fi

fix-rabbit-permissions: fix-rabbit-cookie
	sudo chown -R 999:999 $(HOME)/data/rabbit

find-logs: fix-rabbit-permissions
	@echo $(GREEN)Generating logs...$(RESET)
	@sudo chown -R $(USER):$(USER) $(HOME)/data
	@chmod -R 777 $(DATABASE_DIRECTORIES)
	@srcs/scripts/logs/log-finder.sh

kill-logs:
	@srcs/scripts/logs/kill-finder.sh

import-dashboard-kibana:
	@srcs/scripts/elk/import_dashboard.sh

patience-kibana:
	@srcs/scripts/elk/patience_kibana.sh

######################################################################
#*********************** ▌ MONITORING ▌ *****************************#
######################################################################

# View all service logs in one file (real-time)
logs-all:
	@echo $(GREEN)Following all service logs...$(RESET)
	@tail -f srcs/logs/all_services.log

# View specific service logs
logs:
	docker compose -f $(COMPOSE) logs nginx

# Show last 100 lines from all services
logs-recent:
	@tail -n 100 srcs/logs/all_services.log

######################################################################
#*********************** ▌ DEBUG MODE ▌ *****************************#
######################################################################

# Launch with browser console logging enabled (add ?debug to URL)
debug:
	@echo $(GREEN)Starting in DEBUG mode...$(RESET)
	@echo $(GREEN)Add ?debug to URL to enable console logs$(RESET)
	@$(MAKE) up


######################################################################
#***************************** ▌ VAULT ▌ ****************************#
######################################################################


vault:
	mkdir -p srcs/services/vault/data
	mkdir -p srcs/services/vault/logs
	docker compose -f $(COMPOSE) up -d vault
	sleep 2
	docker cp srcs/services/vault/init/vaultInit.sh vault:/vault/config
	docker cp srcs/.env vault:/vault/config/.env
	docker exec vault sh ./vault/config/vaultInit.sh
	docker cp vault:/vault/config/.env srcs/.env
	docker exec vault rm /vault/config/vaultInit.sh
	docker exec vault rm /vault/config/.env

reset-vault:
	@sudo rm -rf $(VAULT_DIRECTORIES)


######################################################################
#*********************** ▌ UPDATE DATA ▌ ****************************#
######################################################################

npm-check:
	       @echo $(GREEN)Checking Node.js, npm, TypeScript, pnpm, and nodemon...$(RESET)
	       @if ! command -v node >/dev/null; then \
		       echo "Node.js not found. Installing..."; \
		       sudo apt-get install -y nodejs; \
	       fi
	       @if ! command -v npm >/dev/null; then \
		       echo "npm not found. Installing..."; \
		       sudo apt-get install -y npm; \
	       fi
	       @if ! command -v tsc >/dev/null; then \
		       echo "TypeScript not found. Installing..."; \
		       npm install -g typescript; \
	       fi
	       @if ! command -v pnpm >/dev/null; then \
		       echo "pnpm not found. Installing..."; \
		       npm install -g pnpm; \
	       fi
	       @if ! command -v nodemon >/dev/null; then \
		       echo "nodemon not found. Installing..."; \
		       npm install -g nodemon; \
	       fi

npm-install: npm-check
	@echo $(GREEN)Installing npm dependencies in all services...$(RESET)
	@cd srcs/services/frontend && npm install
	@cd srcs/services/auth/app && npm install
	@cd srcs/services/backend-ai/app && npm install
	@cd srcs/services/game-engine/app && npm install
	@cd srcs/services/language-manager && npm install
	@cd srcs/services/live-chat/app && npm install
	@cd srcs/services/mail/app && npm install
	@cd srcs/services/realtime-sockets/app && npm install
	@cd srcs/services/server-rendering/app && npm install
	@echo $(GREEN)All npm dependencies installed!$(RESET)

%:
	@:
