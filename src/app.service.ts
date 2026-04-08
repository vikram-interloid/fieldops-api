import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly themeColor = process.env.THEME_COLOR ?? '#2563EB';

  getHello(): string {
    return `Hello World! Theme color: ${this.themeColor}`;
  }

  getThemeColor(): string {
    return this.themeColor;
  }
}
