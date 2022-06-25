import winston from 'winston';
import path from 'path';

const dateFormat = () => {
  return new Date().toISOString();
};

class LoggerService {
  logger!: winston.Logger;

  constructor(public route: string) {
    // let logger = winston.createLogger({
    //   level: 'info',
    //   format: winston.format.printf((info) => {
    //     let message = `${dateFormat()} | ${info.level.toUpperCase()} | ${
    //       info.message
    //     }`;

    //     return (message = info.obj
    //       ? message + `data ${JSON.stringify(info.obj)} |`
    //       : message);
    //   }),
    //   transports: [
    //     new winston.transports.Console(),
    //     new winston.transports.File({
    //       filename: __dirname + `${process.env.LOG_FILE_PATH}/${route}.log`,
    //     }),
    //   ],
    // });

    let logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({
          filename: 'user.error.log.json',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
        new winston.transports.File({
          filename:
            __dirname + `${process.env.LOG_FILE_PATH}/${route}.log.json`,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ],
    });

    this.logger = logger;
  }

  async info(message: string): Promise<void> {
    this.logger.log('info', message);
  }

  async infoObj(message: string, obj: any): Promise<void> {
    this.logger.log('info', message, { obj });
  }

  async error(message: string): Promise<void> {
    this.logger.log('error', message);
  }

  async errorObj(message: string, obj: any): Promise<void> {
    this.logger.log('error', message, { obj });
  }

  async debug(message: string): Promise<void> {
    this.logger.log('debug', message);
  }

  async debugObj(message: string, obj: any): Promise<void> {
    this.logger.log('debug', message, { obj });
  }
}

export { LoggerService };
