import nats, { Stan } from 'node-nats-streaming';
import { LoggerService } from '@portal-microservices/common';

const logger = new LoggerService(process.env.LOG_FILE_NAME!);

class NatsWrapper {
  private _client?: Stan;

  get client() {
    if (!this._client) {
      logger.error('Cannot access NATS client before connecting');
      throw new Error('Cannot access NATS client before connecting');
    }

    return this._client;
  }

  connect(clusterId: string, clientId: string, url: string): Promise<void> {
    this._client = nats.connect(clusterId, clientId, { url });

    return new Promise((resolve, reject) => {
      this.client.on('connect', () => {
        logger.info('Connected to Nats Successfully... From Cart Service');
        resolve();
      });

      this.client.on('error', (err) => {
        logger.error(`error from nats wrapper : ${err}`);
        reject(err);
      });
    });
  }
}

export const natsWrapper = new NatsWrapper();
