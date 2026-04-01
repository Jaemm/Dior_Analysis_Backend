import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as Mail from 'nodemailer/lib/mailer';
import { createTransport } from 'nodemailer';
import * as fs from 'fs/promises';
import * as handlebars from 'handlebars';

handlebars.registerHelper('includes', function (array: any[], value: any) {
    if (!Array.isArray(array)) return false;
    return array.includes(value);
});

@Injectable()
export class EmailService {
    private readonly logger = new ConsoleLogger(EmailService.name);
    private nodemailerTransport: Mail;

    constructor() {
        this.nodemailerTransport = createTransport({
            host: process.env.EMAIL_HOST,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
            port: 587,
            debug: true,
        });
    }

    sendMail(options: Mail.Options) {
        return this.nodemailerTransport.sendMail(options).catch((e) => {
            this.logger.error(`[sendMail] ${e instanceof Error ? e.message : e}`);
            throw e;
        });
    }

    async sendEmailTemplate(
        recipientEmail: string,
        subject: string,
        templateName: string,
        context: Record<string, any>,
    ) {
        try {
            const templatePath = `${process.env.PublicFile}/email-template/${templateName}.hbs`;
            const template = await fs.readFile(templatePath, 'utf8');

            const compiledTemplate = handlebars.compile(template);
            const html = compiledTemplate(context);

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: recipientEmail,
                subject,
                html,
            };

            await this.nodemailerTransport.sendMail(mailOptions);
        } catch (error) {
            this.logger.error(`[sendEmailTemplate] ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
}
