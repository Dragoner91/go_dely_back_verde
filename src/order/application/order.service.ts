import { Inject, Injectable } from '@nestjs/common';
import { PaymentMethodRepository } from 'src/payment-method/infrastructure/typeorm/payment-method.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderRepository } from '../infraestructure/typeorm/order-repository';
import { Order } from '../domain/order-aggregate';
import { OrderMapper } from '../infraestructure/mappers/order.mapper';
import { ResponseOrderDTO } from './dto/response-order.dto';
import { OrderStatus } from '../domain/enums/order-status.enum';
import { ClientProxy } from '@nestjs/microservices';
import { ProductRepository } from 'src/product/infrastructure/typeorm/product-repositoy';
import { OrderProduct } from '../infraestructure/typeorm/order-product';
import { OrderEntity } from '../infraestructure/typeorm/order-entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OrderService {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly paymentMethodRepository: PaymentMethodRepository,
        @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
        private readonly productRepository: ProductRepository,
        @InjectRepository(OrderProduct) private readonly orderProductRepository: Repository<OrderProduct>
    ) {}

    async createOrder(dto: CreateOrderDto, user_id: string): Promise<ResponseOrderDTO> {
        try{
            const paymentMethod = await this.paymentMethodRepository.findById(dto.paymentMethodId);
            if (!paymentMethod) {
                throw new Error(`Payment method with ID ${dto.paymentMethodId} not found`);
            }
        
            const order = Order.create(dto.address, dto.currency, 0, dto.paymentMethodId, user_id);
        
            const products = await Promise.all(dto.order_products.map(p => this.productRepository.findOne(p.product_id)));
            if (products.includes(null)) {
                throw new Error('Some products not found');
            }
        
            let total = 0;
            const orderProducts = dto.order_products.map(productData => {
            const product = products.find(p => p?.product_id === productData.product_id);
            if (!product) {
                throw new Error(`Product with ID ${productData.product_id} not found`);
            }

            const orderProduct = new OrderProduct();
            const orderEntity = new OrderEntity();
            orderEntity.order_id = order.getId().toString();
            orderProduct.order = orderEntity;
            orderProduct.product = product;
            orderProduct.order_id = order.getId().toString();
            orderProduct.product_id = product.product_id;
            orderProduct.quantity = productData.quantity;
            orderProduct.product_price = productData.product_price;
            orderProduct.total_price = productData.quantity * productData.product_price;

            total += orderProduct.total_price;

            return orderProduct;
            });

            orderProducts.forEach(op => order.addOrderProduct(op));
            console.log(order.getOrderProducts());
            order.updateTotal(total);

            await this.orderRepository.save(order);
            await this.orderProductRepository.save(orderProducts);
        
            // Enviar la notificación de la orden
            this.client.send('order_notification', {
                orderAddress: dto.address,
                orderTotal: total,
                orderCurrency: dto.currency,
                message: 'Your order is ready to be served',
            }).subscribe();
        
            return OrderMapper.toDTO(order);
        } catch (error) {
            console.error('Error creating order:', error);
            throw new Error('Failed to create order');
        }
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

        if (dto.currency) {
            order.updateCurrency(dto.currency);
        }

        if (dto.paymentMethodId) {
            order.updatePaymentMethodId(dto.paymentMethodId);
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

    async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<void> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        order.setStatus(newStatus);
        await this.orderRepository.save(order);
    }
}
