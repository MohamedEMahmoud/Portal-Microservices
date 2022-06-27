import { Stan } from 'node-nats-streaming';
import { Subjects } from './subjects';

interface Event {
  subject: { [key: string]: Subjects; };
  data: any;
}

export abstract class Publisher<T extends Event> {

  constructor(protected client: Stan) { }

  publish(data: T['data'], subject: T['subject']['key']): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.publish(subject, JSON.stringify(data), (err) => {
        if (err) {
          reject(err);
        }

        console.log(`Even Published to subject ${subject}`);
        resolve();
      });
    });
  }
}
