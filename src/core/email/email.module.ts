import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EMAIL_PROVIDER } from './constants/email.constants';
import { SesProvider } from './providers/ses.provider';
import { SmtpProvider } from './providers/smtp.provider';
import { EmailService } from './services/email.service';
import { EmailController } from './controllers/email.controller';
import { TemplateService } from './services/template.services';

@Module({
    controllers: [
        EmailController,
    ],
    providers: [
        {
            provide: EMAIL_PROVIDER,
            inject: [ConfigService],
            useFactory: (
                configService: ConfigService,
            ) => {
                // Default is SMTP (used by /auth/send-otp). Set
                // EMAIL_PROVIDER=ses to switch the whole mail stack to SES.
                const name = (
                    configService.get<string>('EMAIL_PROVIDER') ?? 'smtp'
                ).toLowerCase();

                const provider =
                    name === 'ses'
                        ? new SesProvider(configService)
                        : new SmtpProvider(configService);

                new Logger('EmailModule').log(
                    `Using ${provider.constructor.name}`,
                );

                return provider;
            },
        },
        EmailService,
        TemplateService,
    ],

    exports: [
        EmailService,
    ],
})

export class EmailModule { }
