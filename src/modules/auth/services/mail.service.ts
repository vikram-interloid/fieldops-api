import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Outbound email. Currently logs the message (and returns the link so the
 * dev flow can surface it) because the npm registry is unreachable to install
 * nodemailer. To go live: `pnpm add nodemailer`, create an SMTP transport from
 * the MAIL_* env vars in the constructor, and send inside `deliver()`. No
 * caller changes required.
 */
@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly config: ConfigService) {}

    private get isProduction() {
        return this.config.get<string>('NODE_ENV') === 'production';
    }

    async sendOtp(
        to: string,
        code: string,
        purpose: 'register' | 'reset',
    ): Promise<void> {
        const intro =
            purpose === 'register'
                ? 'Use the code below to verify your email and finish creating your FieldOps account.'
                : 'Use the code below to reset your FieldOps password.';
        await this.deliver({
            to,
            subject: `Your FieldOps verification code: ${code}`,
            text: `${intro}\n\nYour code is: ${code}\n\nIt expires in 10 minutes. If you didn't request this, you can ignore this email.`,
        });
    }

    async sendPasswordReset(to: string, resetLink: string): Promise<void> {
        await this.deliver({
            to,
            subject: 'Reset your FieldOps password',
            text: `We received a request to reset your password.\n\nReset it here: ${resetLink}\n\nThis link expires in 1 hour. If you didn't request it, you can ignore this email.`,
        });
    }

    private async deliver(msg: {
        to: string;
        subject: string;
        text: string;
    }): Promise<void> {
        // TODO: replace with a real nodemailer transport once installable.
        this.logger.log(
            `[MAIL] to=${msg.to} subject="${msg.subject}"\n${msg.text}`,
        );
        return Promise.resolve();
    }
}
