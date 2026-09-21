import { Body, Controller, Post } from '@nestjs/common';

import { EmailService } from '../services/email.service';
import { SendOtpEmailDto } from '../dto/send-otp-email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  async sendTestEmail(@Body() dto: SendOtpEmailDto) {
    await this.emailService.sendOtpEmail(dto);

    return {
      message: 'Email sent successfully',
    };
  }
}
