import {
    SendEmailCommand,
    SESClient,
} from '@aws-sdk/client-ses';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendEmailOptions } from '../interfaces/send-email-options.interface';
import { EmailProvider } from '../interfaces/email-provider.interface';

@Injectable()
export class SesProvider implements EmailProvider {
    private readonly logger = new Logger(
        SesProvider.name,
    );

    private readonly client: SESClient;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.client = new SESClient({
            region: this.configService.getOrThrow<string>(
                'AWS_REGION',
            ),

            credentials: {
                accessKeyId:
                    this.configService.getOrThrow<string>(
                        'AWS_ACCESS_KEY_ID',
                    ),

                secretAccessKey:
                    this.configService.getOrThrow<string>(
                        'AWS_SECRET_ACCESS_KEY',
                    ),
            },
        })
    }

    async send(
        options: SendEmailOptions,
    ): Promise<void> {
        const command = new SendEmailCommand({
            Source:
                this.configService.getOrThrow<string>(
                    'SES_FROM_EMAIL',
                ),
            Destination: {
                ToAddresses: [options.to],
                CcAddresses: options.cc,
                BccAddresses: options.bcc,
            },
            ReplyToAddresses: options.replyTo,
            Message: {
                Subject: {
                    Data: options.subject,
                },

                Body: {
                    Html: {
                        Data: options.html,
                    },

                    Text: options.text
                        ? {
                            Data: options.text,
                        }
                        : undefined,
                },
            },
        });

        await this.client.send(command);

        this.logger.log(
            `Email sent to ${options.to}`,
        );
    }
}
