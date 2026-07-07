import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/interfaces/auth-user.interface';
import { AssetsService } from '../services/assets.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
    constructor(private readonly assetsService: AssetsService) {}

    @Get()
    findAll(@CurrentUser() user: AuthUser) {
        return this.assetsService.findAll(user.userId);
    }

    @Get(':id')
    findById(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.assetsService.findById(user.userId, id);
    }

    @Post()
    create(
        @CurrentUser() user: AuthUser,
        @Body() dto: CreateAssetDto,
    ) {
        return this.assetsService.create(user.userId, dto);
    }

    @Patch(':id')
    update(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateAssetDto,
    ) {
        return this.assetsService.update(user.userId, id, dto);
    }

    @Delete(':id')
    remove(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.assetsService.delete(user.userId, id);
    }
}
