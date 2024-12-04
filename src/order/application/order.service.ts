import { Injectable } from '@nestjs/common';
import { PaymentMethodRepository } from 'src/payment-method/infrastructure/typeorm/payment-method.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderRepository } from '../infraestructure/typeorm/order-repository';
import { Order } from '../domain/order-aggregate';
import { OrderMapper } from '../infraestructure/mappers/order.mapper';
import { ResponseOrderDTO } from './dto/response-order.dto';
import { UserRepository } from 'src/user/infrastructure/typeorm/user.repository';

@Injectable()
export class OrderService {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly paymentMethodRepository: PaymentMethodRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async createOrder(dto: CreateOrderDto): Promise<ResponseOrderDTO> {
        const paymentMethod = await this.paymentMethodRepository.findById(dto.paymentMethodId);
        if (!paymentMethod) {
            throw new Error(`Payment method with ID ${dto.paymentMethodId} not found`);
        }

        const order = Order.create(
            dto.address,
            dto.currency,
            dto.total,
            dto.paymentMethodId,
            dto.user_id,
        );
        
        await this.orderRepository.save(order);

        return OrderMapper.toDTO(order);
    }

    async findAll(): Promise<ResponseOrderDTO[]> {
        const orders = await this.orderRepository.findAll();

        return orders.map(order => OrderMapper.toDTO(order));
    }

    async getOrderById(orderId: string): Promise<ResponseOrderDTO | null> {
        const order = await this.orderRepository.findById(orderId);

        return order ? OrderMapper.toDTO(order) : null;
    }

    async updateOrder(orderId: string, dto: UpdateOrderDto): Promise<void> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new Error(`Order with ID ${orderId} not found`);
        }

        if (dto.address) {
            order.updateAddress(dto.address);
        }

        if (dto.total !== undefined) {
            order.updateTotal(dto.total);
        }

        await this.orderRepository.save(order);
    }

    async remove(orderId: string): Promise<void> {
        await this.orderRepository.remove(orderId);
    }
}
