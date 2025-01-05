import { ValueObject } from 'src/common/domain/value.object';
import { v4 as uuidv4 } from 'uuid';

export class ProductID extends ValueObject<string> {
    static create(): ProductID {
        return new ProductID(uuidv4());
    }

    constructor(value?: string) {
        super(value ?? uuidv4());
    }

    protected validate(value: string): void {
        if (!value || !this.isValidUUID(value)) {
            throw new Error('Invalid Product ID');
        }
    }

    private isValidUUID(value: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
    }

    getValue(): string {
        return this.value;
    }

    toString(): string {
        return this.value;
    }
}
