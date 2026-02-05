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
	@docker images -q > IMAGES
	@cat IMAGES | while IFS= read -r line; do \
		docker rmi -f "$$line"; \
	done
	@rm IMAGES
	@echo ${GREEN}Images deleted${RESET}
	@docker builder prune --all --force
	@echo ${GREEN}Cache cleaned${RESET}
	@docker system df

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

update-static:
	docker compose -f $(COMPOSE) exec gunicorn bash -c "\
		cd /app/data/static/ts && \
		npm install && \
		npm run build && \
		cd /app/data && \
		rm -rf /app/data/staticfiles/* && \
		python manage.py collectstatic --noinput"


vault:
	mkdir -p srcs/services/vault/data
	mkdir -p srcs/services/vault/logs
	docker compose -f $(COMPOSE) up -d vault
	sleep 2
	docker cp vaultInit.sh vault:/
	docker cp srcs/.env vault:/
	docker exec vault sh ./vaultInit.sh
	docker exec vault rm /vaultInit.sh
	docker exec vault rm /.env
