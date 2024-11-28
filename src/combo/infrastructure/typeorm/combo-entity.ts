import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Product } from "src/product/infrastructure/typeorm/product-entity";
import { ComboName } from "src/combo/domain/value-objects/combo-name.vo";
import { ComboDescription } from "src/combo/domain/value-objects/combo-description.vo";
import { ComboPrice } from "src/combo/domain/value-objects/combo-price.vo";
import { ComboCurrency } from "src/combo/domain/value-objects/combo-currency.vo";
import { ComboStock } from "src/combo/domain/value-objects/combo-stock.vo";

@Entity()
export class Combo {

    @PrimaryGeneratedColumn('uuid')
    combo_id: string;

    @Column({
        type: 'varchar',
        transformer: {
        to: (value: ComboName) => value.getValue(),
        from: (value: string) => new ComboName(value),
        },
    })
    combo_name: ComboName;

    @Column({
        type: 'varchar',
        transformer: {
        to: (value: ComboDescription) => value.getValue(),
        from: (value: string) => new ComboDescription(value),
        },
    })
    combo_description: ComboDescription;

    @Column({
        type: 'decimal',
        transformer: {
        to: (value: ComboPrice) => value.getValue(),
        from: (value: number) => new ComboPrice(value),
        },
    })
    combo_price: ComboPrice;

    @Column({
        type: 'varchar',
        transformer: {
        to: (value: ComboCurrency) => value.getValue(),
        from: (value: string) => new ComboCurrency(value),
        },
    })
    combo_currency: ComboCurrency;

    @Column('text')
    combo_category: string;

    @Column({
        type: 'int',
        default: 0,
        transformer: {
            to: (value: ComboStock) => value.getValue(),
            from: (value: number) => new ComboStock(value),
        },
    })
    combo_stock: ComboStock;

    @Column()
    combo_image: string;

    @ManyToMany(() => Product, (product) => product.combos)
    products: Product[];
}
