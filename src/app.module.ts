import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './product/product.module';
import { ComboModule } from './combo/combo.module';
import { CommonModule } from './common/common.module';
import { RabbitmqModule } from './common/infraestructure/rabbitmq/rabbitmq.module';
import { MailModule } from './common/infraestructure/mail/mail.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthModule } from './auth/auth.module';
import { DiscountModule } from './discount/discount.module';
import { OrderModule } from './order/order.module';
import { CategoryModule } from './category/category.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true

    }),

    ProductModule,

    CommonModule,

    ComboModule,

    DiscountModule,

    CategoryModule,

    PaymentMethodModule,

    RabbitmqModule,
    
    MailModule,

    AuthModule,

    OrderModule,
    
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    
  ],
})
export class AppModule {}
