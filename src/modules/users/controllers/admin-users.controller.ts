import {
    Controller,
    Get,
    Patch,
    ParseIntPipe,
    UseGuards,
    Param,
    Body,
    Put
} from "@nestjs/common";
import { JwtAuthGuard } from "src/modules/auth/guards/jwt-auth.guard";
import { RolesGaurd } from "src/modules/auth/guards/roles.guard";
import { UsersService } from "../services/users.service";
import { UpdateUserDto } from "../dto/update-user.dto";

@Controller('admin/users')
@UseGuards(
    JwtAuthGuard,
    RolesGaurd,
)
export class AdminUsersController {
    constructor(
        private readonly usersSerivce: UsersService
    ) { }

    @Get()
    findAll() {
        return this.usersSerivce.findAll();
    }

    @Get(':id')
    findById(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.usersSerivce.findById(
            id,
        );
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserDto,
    ) {
        return this.usersSerivce.update(
            id,
            dto,
        );
    }
}