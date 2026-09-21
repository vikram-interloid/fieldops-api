import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/interfaces/auth-user.interface';

import { TableViewsService } from '../services/table-views.service';
import { CreateTableViewDto } from '../dto/create-table-view.dto';
import { UpdateTableViewDto } from '../dto/update-table-view.dto';
import { QueryTableViewsDto } from '../dto/query-table-views.dto';

@Controller('table-views')
@UseGuards(JwtAuthGuard)
export class TableViewsController {
  constructor(private readonly tableViewsService: TableViewsService) {}

  /**
   * Get saved table views for a specific tableKey (or all).
   */
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: QueryTableViewsDto) {
    return this.tableViewsService.listViews(user.userId, query.tableKey);
  }

  /**
   * Create a new saved table view.
   */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTableViewDto) {
    return this.tableViewsService.createView(user.userId, dto);
  }

  /**
   * Update an existing saved table view.
   */
  @Put(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTableViewDto,
  ) {
    return this.tableViewsService.updateView(user.userId, id, dto);
  }

  /**
   * Delete an existing saved table view.
   */
  @Delete(':id')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tableViewsService.deleteView(user.userId, id);
  }
}
