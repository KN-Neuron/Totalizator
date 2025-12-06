import Card from './Card.js';

class CardPack {
    constructor(cardsValues, cardsColors, numJokers) {
        this.numCards = cardsColors.length * cardsValues.length;
        this.numJokers = numJokers;
        this.deck = this.buildDeck(cardsValues, cardsColors);
        this.current = 0;
    }

    buildDeck(cardsValues, cardsColors) {
        const deck = [];
        
        let id = 0;

        for (let color of cardsColors) {
            for (let value of cardsValues) {
                const cardId = id++;
                const newCard = Card(cardId, color, value);
                deck.push(newCard);
            }
        }

        for (let i = 0; i < this.numJokers; i++) {
            const newJoker = Card(id++, 'JOKER', 'JOKER');
            deck.push(newJoker);
        }

        const shuffled = this.#shuffleDeck(deck);
        
        return shuffled;
    }

    #shuffleDeck(deck) {
        const deck = [...deck]; 

        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
    
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    getNext() {
        if (this.current < this.numCards) {
            return this.deck[this.current++];
        } else {
            throw new RangeError('Brak kart w talii!');
        }
    }
}