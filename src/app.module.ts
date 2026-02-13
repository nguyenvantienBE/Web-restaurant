import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MenuItemsModule } from './modules/menu/menu-items/menu-items.module';
import { CategoriesModule } from './modules/menu/categories/categories.module';
import { TablesModule } from './modules/tables/tables.module';
import { OrdersModule } from './modules/orders/orders.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { RealtimeModule } from './realtime/realtime.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [configuration],
            isGlobal: true,
        }),
        AuthModule,
        UsersModule,
        MenuItemsModule,
        CategoriesModule,
        TablesModule,
        OrdersModule,
        KitchenModule,
        RealtimeModule,
    ],
    providers: [
        PrismaService,
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor,
        },
    ],
})
export class AppModule { }
