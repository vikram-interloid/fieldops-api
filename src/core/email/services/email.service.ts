import { Injectable, Inject } from '@nestjs/common';

import { EMAIL_PROVIDER } from '../constants/email.constants';
import type { EmailProvider } from '../interfaces/email-provider.interface';
import { SendEmailOptions } from '../interfaces/send-email-options.interface';
import { TemplateService } from './template.services';
import { SendOtpEmailDto } from '../dto/send-otp-email.dto';

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: EmailProvider,
    private readonly templateService: TemplateService,
  ) {}

  async send(options: SendEmailOptions): Promise<void> {
    await this.emailProvider.send(options);
  }

  async sendOtpEmail(dto: SendOtpEmailDto): Promise<void> {
    const html = await this.templateService.render('otp-verification', {
      name: dto.name,
      otp: dto.otp,
      expiryMinutes: dto.expiryMinutes,
      year: new Date().getFullYear(),
    });

    await this.emailProvider.send({
      to: dto.to,
      subject: 'Verify your email address',
      html,
      text: `Your verification code is ${dto.otp}. It expires in ${dto.expiryMinutes} minutes.`,
    });
  }
}
