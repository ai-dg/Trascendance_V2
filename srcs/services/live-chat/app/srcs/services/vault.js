import vault from 'node-vault';

class VaultClient {
  constructor() {
    this.client = vault({
      endpoint: process.env.VAULT_ADDR || 'http://vault:8200',
      token: process.env.VAULT_TOKEN
    });
    this.secrets = {};
  }

  async loadSecrets() {
    try {
      const redisData = await this.client.read('kv/data/redis');
      this.secrets.redis = redisData.data.data;
	const authData = await this.client.read('kv/data/auth');
	this.secrets.auth = authData.data.data
		const rabbitmqAuth = await this.client.read('kv/data/rabbitmq');
	this.secrets.rabbitmq = rabbitmqAuth.data.data

	const fortytwo = await this.client.read('kv/data/fortytwo');
	this.secrets.fortytwo = fortytwo.data.data
      console.log('✅ Secrets Vault chargés');
      return this.secrets;
    } catch (error) {
      console.error('❌ Erreur Vault:', error);
      throw error;
    }
  }

  get(path) {
    return this.secrets[path];
  }
}

export const vaultClient = new VaultClient();