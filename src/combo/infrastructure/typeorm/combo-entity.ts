import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, OneToMany } from "typeorm";
import { Product } from "src/product/infrastructure/typeorm/product-entity";
import { ComboName } from "src/combo/domain/value-objects/combo-name.vo";
import { ComboDescription } from "src/combo/domain/value-objects/combo-description.vo";
import { ComboPrice } from "src/combo/domain/value-objects/combo-price.vo";
import { ComboCurrency } from "src/combo/domain/value-objects/combo-currency.vo";
import { ComboStock } from "src/combo/domain/value-objects/combo-stock.vo";
import { Discount } from "src/discount/infraestructure/typeorm/discount.entity";
import { CategoryEntity } from "src/category/infrastructure/typeorm/category-entity";
import { OrderCombo } from "src/order/infraestructure/typeorm/order-combo";
import { Currency } from "src/common/domain/enums/currency.enum";

@Entity()
export class Combo {

    @PrimaryGeneratedColumn('uuid')
    combo_id: string;

    @Column({
        type: 'varchar',
        transformer: {
        to: (value: ComboName) => value.getValue(),
        from: (value: string) => value ? new ComboName(value) : new ComboName('Combo'),
        },
    })
    combo_name: ComboName;

    @Column({
        type: 'varchar',
        transformer: {
        to: (value: ComboDescription) => value.getValue(),
        from: (value: string) => value ? new ComboDescription(value) : new ComboDescription('Descripcion'),
        },
    })
    combo_description: ComboDescription;

    @Column({
        type: 'decimal',
        transformer: {
        to: (value: ComboPrice) => value.getValue(),
        from: (value: number) => value ? new ComboPrice(value) : new ComboPrice(0),
        },
    })
    combo_price: ComboPrice;

    @Column({
        type: 'varchar',
        transformer: {
        to: (value: ComboCurrency) => value.getValue(),
        from: (value: string) => value ? new ComboCurrency(value as Currency) : new ComboCurrency('USD' as Currency),
        },
    })
    combo_currency: ComboCurrency;

    @ManyToOne(() => CategoryEntity, (category) => category.products)
    combo_category: CategoryEntity;

    @Column({
        type: 'int',
        default: 0,
        transformer: {
            to: (value: ComboStock) => value.getValue(),
            from: (value: number) => value? new ComboStock(value) : new ComboStock(0),
        },
    })
    combo_stock: ComboStock;

    @Column()
    combo_image: string;

    @ManyToMany(() => Product, product => product.combos)
    @JoinTable({
        name: 'combo_products',
        joinColumn: { name: 'combo_id', referencedColumnName: 'combo_id' },
        inverseJoinColumn: { name: 'product_id', referencedColumnName: 'product_id' },
    })
    products: Product[];

    // @ManyToOne(() => Discount, (discount) => discount.combos, { nullable: true })
    // discount: Discount;

    @OneToMany(() => OrderCombo, orderCombo => orderCombo.combo)
    orders: OrderCombo[];
}
