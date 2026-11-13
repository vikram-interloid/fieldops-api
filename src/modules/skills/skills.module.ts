import { Module } from '@nestjs/common';

import { SkillsController } from './controllers/skills.controller';
import { SkillsService } from './services/skills.service';
import { SkillsRepository } from './repositories/skills.repository';

@Module({
  controllers: [SkillsController],
  providers: [SkillsService, SkillsRepository],
  exports: [SkillsService, SkillsRepository],
})
export class SkillsModule {}
