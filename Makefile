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

build:
	docker compose -f $(COMPOSE) build

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
	docker compose -f $(COMPOSE) down

downv:
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