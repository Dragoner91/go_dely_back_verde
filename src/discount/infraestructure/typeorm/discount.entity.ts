import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "src/product/infrastructure/typeorm/product-entity";
import { DiscountPercentage } from "src/discount/domain/value-objects/discount-percentage.vo";
import { DiscountStartDate } from "src/discount/domain/value-objects/discount-start-date.vo";
import { DiscountEndDate } from "src/discount/domain/value-objects/discount-end-date.vo";


@Entity()
export class Discount {
    
    @PrimaryGeneratedColumn('uuid')
    discount_id: string;

    @Column({
        type: 'decimal',
        default: 0.00,
        transformer: {
            to: (value: DiscountPercentage) => value.getValue(),
            from: (value: number) => new DiscountPercentage(value),
        },
    })
    discount_percentage: DiscountPercentage;

    @Column({
        type: 'date',
        transformer: {
            to: (value: DiscountStartDate) => value.getValue(),
            from: (value: Date) => new DiscountStartDate(value),
        },
    })
    discount_start_date: DiscountStartDate;
    
    @Column({
        type: 'date',
        transformer: {
            to: (value: DiscountEndDate) => value.getValue(),
            from: (value: Date) => new DiscountEndDate(value),
        },
    })
    discount_end_date: DiscountEndDate;

    @OneToMany(() => Product, (product) => product.discount)
    products: Product[];
}