export interface SendEmailOptions {
  to: string;

  subject: string;

  html: string;

  text?: string;

  cc?: string[];

  bcc?: string[];

  replyTo?: string[];
}
