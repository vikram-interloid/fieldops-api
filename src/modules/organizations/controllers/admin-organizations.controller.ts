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
} from "@nestjs/common";

import { JwtAuthGuard } from "src/modules/auth/guards/jwt-auth.guard";
import { RolesGaurd } from "src/modules/auth/guards/roles.guard";
import { Roles } from "src/modules/auth/decorators/roles.decorator";
import { RoleEnum } from "src/modules/auth/enums/role.enum";
import { OrganizationsService } from "../services/organizations.service";
import { CreateOrganizationDto } from "../dto/create-organization.dto";
import { UpdateOrganizationDto } from "../dto/update-organization.dto";

@Controller('admin/organizations')
@UseGuards(
    JwtAuthGuard,
    RolesGaurd,
)
@Roles(RoleEnum.ADMIN)
export class AdminOrganizationsController {
    constructor(
        private readonly organizationsService: OrganizationsService,
    ) { }

    @Get()
    findAll() {
        return this.organizationsService.findAll();
    }

    @Get(':id')
    findById(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.organizationsService.findById(id);
    }

    @Post()
    create(
        @Body() dto: CreateOrganizationDto,
    ) {
        return this.organizationsService.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateOrganizationDto,
    ) {
        return this.organizationsService.update(id, dto);
    }

    @Delete(':id')
    remove(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.organizationsService.delete(id);
    }
}
