import { Module } from "@nestjs/common";
import { UsersController } from "./controllers/users.controller";
import { UsersService } from "./services/users.service";
import { UsersRepository } from "./repositories/users.repository";
import { AdminUsersController } from "./controllers/admin-users.controller";

@Module({
    controllers: [
        UsersController,
        AdminUsersController,
    ],
    providers: [
        UsersRepository,
        UsersService,
    ],
})
export class UserModule{}