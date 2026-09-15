import {
    createTransport,
    type Transporter,
} from 'nodemailer';

import {
    Injectable,
    Logger,
    OnModuleInit,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { SendEmailOptions } from '../interfaces/send-email-options.interface';
import { EmailProvider } from '../interfaces/email-provider.interface';

@Injectable()
export class SmtpProvider
    implements EmailProvider, OnModuleInit
{
    private readonly logger = new Logger(
        SmtpProvider.name,
    );

    private readonly transporter: Transporter;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.transporter = createTransport({
            host: this.configService.getOrThrow<string>(
                'SMTP_HOST',
            ),

            port: this.configService.getOrThrow<number>(
                'SMTP_PORT',
            ),

            secure: false,
            requireTLS: true,

            auth: {
                user: this.configService.getOrThrow<string>(
                    'SMTP_USER',
                ),

                pass: this.configService.getOrThrow<string>(
                    'SMTP_PASSWORD',
                ),
            },
        });
    }

    async onModuleInit(): Promise<void> {
        try {
            await this.transporter.verify();

            this.logger.log(
                'Brevo SMTP connection verified successfully',
            );
        } catch (error) {
            this.logger.error(
                'Brevo SMTP connection verification failed',
                error instanceof Error
                    ? error.stack
                    : String(error),
            );

            throw error;
        }
    }

    async send(
        options: SendEmailOptions,
    ): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.configService.getOrThrow<string>(
                    'SMTP_FROM',
                ),

                to: options.to,
                cc: options.cc,
                bcc: options.bcc,

                replyTo: options.replyTo,

                subject: options.subject,

                html: options.html,
                text: options.text,
            });

            this.logger.log(
                `Email sent successfully to ${options.to}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to send email to ${options.to}`,
                error instanceof Error
                    ? error.stack
                    : String(error),
            );

            throw error;
        }
    }
}
