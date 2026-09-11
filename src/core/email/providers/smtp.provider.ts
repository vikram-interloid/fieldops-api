import { createTransport, type Transporter } from 'nodemailer';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendEmailOptions } from '../interfaces/send-email-options.interface';
import { EmailProvider } from '../interfaces/email-provider.interface';

@Injectable()
export class SmtpProvider implements EmailProvider {
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

            port: Number(
                this.configService.getOrThrow<string>(
                    'SMTP_PORT',
                ),
            ),

            secure:
                this.configService.get<string>(
                    'SMTP_SECURE',
                ) === 'true',

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

    async send(
        options: SendEmailOptions,
    ): Promise<void> {
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
            `Email sent to ${options.to}`,
        );
    }
}
