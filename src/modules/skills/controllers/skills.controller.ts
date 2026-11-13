import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/interfaces/auth-user.interface';
import { SkillsService } from '../services/skills.service';
import { CreateSkillDto } from '../dto/create-skill.dto';

@Controller('skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.skillsService.findAll(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSkillDto) {
    return this.skillsService.create(user.userId, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.skillsService.delete(user.userId, id);
  }
}
