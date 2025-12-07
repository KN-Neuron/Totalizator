import Card from './Card.js';

export default class CardPack {
    constructor(cardsValues, cardsColors, numJokers, initialCardsNumber = 5) {
        this.numCards = cardsColors.length * cardsValues.length + numJokers;
        this.numJokers = numJokers;
        this.current = 0;
        this.initialSideCards = [];
        this.initialCardsNumber = initialCardsNumber;
        this.deck = this.#buildDeck(cardsValues, cardsColors, true);
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

        let shuffled = this.#shuffleDeck(deck);

        for (let i = 0; i < this.initialCardsNumber; i++) {
            this.initialSideCards.push(shuffled.pop());
        }

        for (let i = 0; i < this.numJokers; i++) {
            const newJoker = new Card(id++, 'JOKER', 'JOKER');
            deck.push(newJoker);
        }

        shuffled = this.#shuffleDeck(deck);

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

        // ALWAYS JACKPOT FOR DEBUGGING
        newDeck[0] = new Card(0, 'hearts', 'Ace');
        newDeck[1] = new Card(0, 'hearts', 'Ace');
        newDeck[2] = new Card(0, 'hearts', 'Ace');
        newDeck[3] = new Card(0, 'hearts', 'Ace');
        newDeck[4] = new Card(0, 'hearts', 'Ace');
        newDeck[5] = new Card(0, 'hearts', 'Ace');

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
