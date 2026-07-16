import { Module } from '@nestjs/common';

import { EMAIL_PROVIDER } from './constants/email.constants';
import { SesProvider } from './providers/ses.provider';
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
            useClass: SesProvider,
        },
        EmailService,
        TemplateService,
    ],

    exports: [
        EmailService,
    ],
})

export class EmailModule { }