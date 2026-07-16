import * as fs from 'node:fs/promises';
import * as Handlebars from 'handlebars';
import * as path from 'node:path';

import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplateService {
    async render(
        template: string,
        data: Record<string, unknown>,
    ): Promise<string> {
        const templatePath = path.join(
            process.cwd(),
            'src',
            'core',
            'email',
            'templates',
            `${template}.hbs`,
        );

        const source = await fs.readFile(
            templatePath,
            'utf-8',
        );

        const compiled = Handlebars.compile(source);

        return compiled(data);
    }
}