import { SendEmailOptions } from './send-email-options.interface';

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<void>;
}
