import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './infraestructure/controller/order.controller';
import { OrderService } from './application/order.service';
import { OrderEntity } from './infraestructure/typeorm/order-entity';
import { OrderRepository } from './infraestructure/typeorm/order-repository';
import { PaymentMethodModule } from 'src/payment-method/payment-method.module';
import { RabbitmqModule } from './infraestructure/rabbitmq/rabbitmq.module';
import { MailModule } from './infraestructure/mail/mail.module';
import { UserModule } from 'src/user/user.module';
import { ProductModule } from 'src/product/product.module';
import { OrderProduct } from './infraestructure/typeorm/order-product';

@Module({
  imports: [ TypeOrmModule.forFeature([OrderEntity, OrderProduct]), PaymentMethodModule, UserModule, RabbitmqModule, MailModule, ProductModule ],
  controllers: [ OrderController ],
  providers: [ OrderService, OrderRepository ],
  exports: [ OrderRepository ]

})
export class OrderModule {}
