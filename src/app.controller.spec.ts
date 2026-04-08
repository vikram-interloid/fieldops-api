import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the greeting with theme color', () => {
      expect(appController.getHello()).toBe('Hello World! Theme color: #2563EB');
    });
  });

  describe('theme-color', () => {
    it('should return the theme color', () => {
      expect(appController.getThemeColor()).toBe('#2563EB');
    });
  });
});
