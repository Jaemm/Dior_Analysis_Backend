import { Injectable } from '@nestjs/common';
import * as Mail from 'nodemailer/lib/mailer';
import { createTransport } from 'nodemailer';
import * as fs from 'fs/promises';
import * as handlebars from 'handlebars';

@Injectable()
export class EmailService {
    private nodemailerTransport: Mail;

    constructor() {
        this.nodemailerTransport = createTransport({
            // pool: true,
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
            console.log(e);
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
            console.error('Error sending email:', error);
            throw error;
        }
    }
}

