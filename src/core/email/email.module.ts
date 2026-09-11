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
                const provider =
                    configService.get<string>(
                        'EMAIL_PROVIDER',
                    ) === 'smtp'
                        ? new SmtpProvider(configService)
                        : new SesProvider(configService);

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
