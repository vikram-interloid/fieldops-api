import { Injectable } from '@nestjs/common';

import { SkillsRepository } from '../repositories/skills.repository';
import { CreateSkillDto } from '../dto/create-skill.dto';
import { SkillResponse } from '../responses/skill.response';

@Injectable()
export class SkillsService {
  constructor(private readonly skillsRepository: SkillsRepository) {}

  findAll(userId: string): Promise<SkillResponse[]> {
    return this.skillsRepository.findAll(userId);
  }

  create(userId: string, dto: CreateSkillDto): Promise<SkillResponse> {
    return this.skillsRepository.create(userId, dto.name);
  }

  delete(userId: string, identifier: string): Promise<void> {
    return this.skillsRepository.delete(userId, identifier);
  }
}
