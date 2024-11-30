export class DiscountStartDate {
    protected readonly value: Date;

    constructor(value: Date | string) {
        if(value){
            const dateValue = new Date(value);
            if (!this.isValidDate(dateValue)) {
                throw new Error('Invalid discount end date.');
            }
            this.value = dateValue;
        }
        return null;
    }

    private isValidDate(value: Date): boolean {
        return value instanceof Date && !isNaN(value.getTime());
    }

    public getValue(): Date {
        return this.value;
    }
}
