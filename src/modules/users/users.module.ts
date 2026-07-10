import { Module } from "@nestjs/common";
import { UsersController } from "./controllers/users.controller";
import { UsersService } from "./services/users.service";
import { UsersRepository } from "./repositories/users.repository";
import { AdminUsersController } from "./controllers/admin-users.controller";
import { PasswordService } from "src/modules/auth/services/password.service";

@Module({
    controllers: [
        UsersController,
        AdminUsersController,
    ],
    providers: [
        UsersRepository,
        UsersService,
        PasswordService,
    ],
})
export class UserModule{}