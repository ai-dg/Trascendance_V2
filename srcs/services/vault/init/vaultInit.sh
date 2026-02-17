#!/bin/bash

export VAULT_ADDR='http://localhost:8200'

# Load variables from .env
if [ ! -f /vault/config/.env ]; then
    echo "❌ .env file missing"
    echo "Copy .env.vault.example to .env.vault and fill in the values"
    exit 1
fi

source /vault/config/.env

chown 100:1000 vault/data


# Initialize and unseal
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

echo "✅ Vault secrets initialized"

# Update .env file in container (will be copied back to host by Makefile)
ENV_FILE="/vault/config/.env"
if [ -f "$ENV_FILE" ]; then
    # Update or add VAULT_ROOT_TOKEN
    if grep -q "^VAULT_ROOT_TOKEN=" "$ENV_FILE"; then
        sed -i "s|^VAULT_ROOT_TOKEN=.*|VAULT_ROOT_TOKEN=$ROOT_TOKEN|" "$ENV_FILE"
    else
        echo "VAULT_ROOT_TOKEN=$ROOT_TOKEN" >> "$ENV_FILE"
    fi
    
    # Update or add UNSEAL
    if grep -q "^UNSEAL=" "$ENV_FILE"; then
        sed -i "s|^UNSEAL=.*|UNSEAL=$UNSEAL_KEY|" "$ENV_FILE"
    else
        echo "UNSEAL=$UNSEAL_KEY" >> "$ENV_FILE"
    fi
    
    echo "✅ VAULT_ROOT_TOKEN and UNSEAL variables updated in .env"
else
    echo "⚠️  .env file not found at $ENV_FILE"
    echo "Please manually add to ./srcs/.env :"
    echo "VAULT_ROOT_TOKEN=$ROOT_TOKEN"
    echo "UNSEAL=$UNSEAL_KEY"
fi

echo ""
echo "  Keep the unseal key! It won't be revealed again :"
echo "Root token : $ROOT_TOKEN"
echo "Unseal key : $UNSEAL_KEY"