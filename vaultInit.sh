#!/bin/bash

export VAULT_ADDR='http://localhost:8200'

# Charge les variables depuis .env
if [ ! -f .env ]; then
    echo "❌ Fichier .env manquant"
    echo "Copiez .env.vault.example vers .env.vault et remplissez les valeurs"
    exit 1
fi

chown 100:1000 vault/data


# Init et unseal
vault operator init -key-shares=1 -key-threshold=1 > vault-keys.txt
UNSEAL_KEY=$(grep 'Unseal Key' vault-keys.txt | awk '{print $4}')
ROOT_TOKEN=$(grep 'Root Token' vault-keys.txt | awk '{print $4}')

vault operator unseal $UNSEAL_KEY
vault login $ROOT_TOKEN

# Enable secrets engine
vault secrets enable -path=kv kv-v2


vault kv put kv/auth \
  cookie=$COOKIE_SECRET \
  jwt=$JWT_SECRET \
  csrf=$CSRF_SECRET

vault kv put kv/redis \
  password=$REDIS_PASSWORD \
  host=redis \
  port=6379

vault kv put kv/rabbitmq \
  password=$RABBITMQ_DEFAULT_USER \
  user=gt_rabbit_admin \

vault kv put kv/fortytwo \
  clientSecret=$FORTYTWO_CLIENT_SECRET \
  clientId=$FORTYTWO_CLIENT_ID \
  redirectUri=$FORTYTWO_REDIRECT_URI

echo "✅ Secrets Vault initialisés"
echo add vault root token to .env file :
echo $ROOT_TOKEN