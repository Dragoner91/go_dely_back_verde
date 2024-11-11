import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm";
import { Image } from "./image.entity";

@Entity()
export class Product {

    @PrimaryGeneratedColumn('uuid')
    product_id: string;

    @Column()
    product_name: string;

    @Column({
        type: 'text',
        nullable: true
    })
    product_description: string;

    @Column('decimal', {default: 0.00})
    product_price: number;

    @Column()
    product_currency: string;

    @Column()
    product_weight: string;

    @Column('int', {default: 0})
    product_stock: number;

    @OneToMany(
        () => Image,
        (image) => image.product,
        { cascade: true }
    )
    images: Image[];

}
