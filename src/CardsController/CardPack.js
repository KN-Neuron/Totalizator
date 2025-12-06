import Card from './Card.js';

export class CardPack {
    constructor(cardsValues, cardsColors, numJokers) {
        this.numCards = cardsColors.length * cardsValues.length + numJokers;
        this.numJokers = numJokers;
        this.deck = this.#buildDeck(cardsValues, cardsColors);
        this.current = 0;
    }

    #buildDeck(cardsValues, cardsColors) {
        const deck = [];
        
        let id = 0;

        for (let color of cardsColors) {
            for (let value of cardsValues) {
                const cardId = id++;
                const newCard = new Card(cardId, color, value);
                deck.push(newCard);
            }
        }

        for (let i = 0; i < this.numJokers; i++) {
            const newJoker = new Card(id++, 'JOKER', 'JOKER');
            deck.push(newJoker);
        }

        const shuffled = this.#shuffleDeck(deck);
        
        return shuffled;
    }

    #shuffleDeck(deck) {
        const newDeck = [...deck]; 

        for (let i = newDeck.length - 1; i > 0; i--) {
            const randomBuffer = new Uint32Array(1);
            window.crypto.getRandomValues(randomBuffer);

            const j = Math.floor((randomBuffer[0] / (0xFFFFFFFF + 1)) * (i + 1));
    
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        return newDeck;
    }

    getNext() {
        if (this.current < this.numCards) {
            return this.deck[this.current++];
        } else {
            this.#shuffleDeck(this.deck);
            this.current = 0;
            return this.deck[this.current++];
        }
    }
}