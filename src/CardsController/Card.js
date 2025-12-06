export class Card {
    constructor(id, color, value) {
        this.id = id;
        this.color = color;
        this.value = value;
    }

    toString() {
        return `Card(ID: ${this.id}, Color: ${this.color}, Value: ${this.value})`;
    }

    toSimpleString() {
        return `${this.color} ${this.value}`;
    }
}