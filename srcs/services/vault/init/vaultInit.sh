#!/bin/bash

export VAULT_ADDR='http://localhost:8200'

# Charge les variables depuis .env
if [ ! -f /vault/config/.env ]; then
    echo "❌ Fichier .env manquant"
    echo "Copiez .env.vault.example vers .env.vault et remplissez les valeurs"
    exit 1
fi

source /vault/config/.env

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
  host=$REDIS_HOST \
  port=$REDIS_PORT

vault kv put kv/rabbitmq \
  password=$RABBITMQ_DEFAULT_PASS \
  user=$RABBITMQ_DEFAULT_USER \

vault kv put kv/fortytwo \
  clientSecret=$FORTYTWO_CLIENT_SECRET \
  clientId=$FORTYTWO_CLIENT_ID \
  redirectUri=$FORTYTWO_REDIRECT_URI

echo "✅ Secrets Vault initialisés"

# Met à jour le fichier .env dans le conteneur (qui sera copié de retour vers l'hôte par le Makefile)
ENV_FILE="/vault/config/.env"
if [ -f "$ENV_FILE" ]; then
    # Met à jour ou ajoute VAULT_ROOT_TOKEN
    if grep -q "^VAULT_ROOT_TOKEN=" "$ENV_FILE"; then
        sed -i "s|^VAULT_ROOT_TOKEN=.*|VAULT_ROOT_TOKEN=$ROOT_TOKEN|" "$ENV_FILE"
    else
        echo "VAULT_ROOT_TOKEN=$ROOT_TOKEN" >> "$ENV_FILE"
    fi
    
    # Met à jour ou ajoute UNSEAL
    if grep -q "^UNSEAL=" "$ENV_FILE"; then
        sed -i "s|^UNSEAL=.*|UNSEAL=$UNSEAL_KEY|" "$ENV_FILE"
    else
        echo "UNSEAL=$UNSEAL_KEY" >> "$ENV_FILE"
    fi
    
    echo "✅ Variables VAULT_ROOT_TOKEN et UNSEAL mises à jour dans .env"
else
    echo "⚠️  Fichier .env non trouvé à $ENV_FILE"
    echo "Veuillez ajouter manuellement dans ./srcs/.env :"
    echo "VAULT_ROOT_TOKEN=$ROOT_TOKEN"
    echo "UNSEAL=$UNSEAL_KEY"
fi

echo ""
echo "⚠️  Conservez la clé unseal ! Elle ne sera plus révélée :"
echo "$UNSEAL_KEY"