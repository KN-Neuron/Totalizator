import Phaser from 'phaser';
import { cardGridManager } from './cards/cardGridManager.js';
import { CardPack } from './CardsController/CardPack.js';


export class Play extends Phaser.Scene
{
    cardGrid = null;
    cardPack = null;
    cards = null;

    constructor ()
    {
        super({
            key: 'Play'
        });
    }

    init ()
    {
        // Fadein camera
        this.cameras.main.fadeIn(500);
        // this.lives = 10;
        // this.volumeButton();
    }

    create ()
    {
        // Background image
        this.add.image(0, 0, "background").setOrigin(0);

        const titleText = this.add.text(this.sys.game.scale.width / 2, this.sys.game.scale.height / 2,
            "Gra totalizatora sportowego\nNacisnij aby zaczac",
            { align: "center", strokeThickness: 4, fontSize: 40, fontStyle: "bold", color: "#8c7ae6" }
        )
            .setOrigin(.5)
            .setDepth(3)
            .setInteractive();

        // title tween like retro arcade
        this.add.tween({
            targets: titleText,
            duration: 800,
            ease: (value) => (value > .8),
            alpha: 0,
            repeat: -1,
            yoyo: true,
        });

        // Text Events
        titleText.on(Phaser.Input.Events.POINTER_OVER, () => {
            titleText.setColor("#9c88ff");
            this.input.setDefaultCursor("pointer");
        });
        titleText.on(Phaser.Input.Events.POINTER_OUT, () => {
            titleText.setColor("#8c7ae6");
            this.input.setDefaultCursor("default");
        });
        titleText.on(Phaser.Input.Events.POINTER_DOWN, () => {
            this.sound.play("whoosh", { volume: 1.3 });
            this.add.tween({
                targets: titleText,
                ease: Phaser.Math.Easing.Bounce.InOut,
                y: -1000,
                onComplete: () => {
                    if (!this.sound.get("theme-song")) {
                        this.sound.play("theme-song", { loop: true, volume: .5 });
                    }
                    this.startGame();
                }
            })
        });

    }

    restartGame ()
    {
        this.cameras.main.fadeOut(200 * this.cards.length);
    }

    createInitialCards() {
        const suits = ['diamondsAce', 'heartsAce', 'clubsAce', 'spadesAce'];

        for(let row = 0; row < 4; row++) {
            const cardData = {
                type: suits[row]
            }

            this.cardGrid.createCard(row, 0, cardData);
        }

        for(let col = 1; col < 6; col++) {
            const cardData = {
                type: 'back'
            }

            this.cardGrid.createCard(4, col, cardData);
        }
    }

    startGame ()
    {
        this.cardGrid = new cardGridManager(this, {
            rows: 5,
            columns: 7,
            cardWidth: 150,
            cardHeight: 100,
            marginX: 20,
            marginY: 30,
            visibleColumns: 7
        });

        this.cardPack = new CardPack(
            ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"],
            ["diamonds", "hearts", "clubs", "spades"],
            4
        );

        this.cards = this.cardGrid.createGrid();
        this.createInitialCards();

        // Show pulled card
        const card = this.add.sprite(this.cameras.main.width-100, this.cameras.main.height/2, 'cards', "back").setScale(0.75);
        card.setOrigin(0.5, 0.5);
        card.setInteractive();

        let last_column = 0;

        let timer = this.time.addEvent({
            delay: 1000,
            callback: function ()
            {
                // sprawdzanie konca gry bo musi byc na poczatku
                for(let i = 0; i < 4; i++) {
                    console.log(this.cardGrid.getCardAt(i, 6));
                    if (this.cardGrid.getCardAt(i, 6) != null) {
                        timer.remove();
                        return;
                    }
                }

                let pulled_card = this.cardPack.getNext();
                let suits = ["diamonds", "hearts", "clubs", "spades"];

                // sprawdzanie czy jest jakis row zwolniony
                let counter = 0;
                for(let i = 0; i < 4; i++) {
                    if (this.cardGrid.getCardAt(i, last_column) == null) {
                        counter++;
                    }
                }
                if (counter == 4) {
                    const cardData = {
                        type: pulled_card.color + pulled_card.value
                    }
                    this.cardGrid.createCard(4, last_column+1, cardData);
                    last_column++;
                    this.cardGrid.moveCard(suits.indexOf(pulled_card.color), false);
                    return;
                }
                
                // losowanie karty z decku
                if (pulled_card.color != "JOKER") {
                    const card = this.add.sprite(this.cameras.main.width-100, this.cameras.main.height/2, 'cards', pulled_card.color + pulled_card.value).setScale(0.75);
                    this.cardGrid.moveCard(suits.indexOf(pulled_card.color));
                } else {
                    const card = this.add.sprite(this.cameras.main.width-100, this.cameras.main.height/2, 'cards', "joker").setScale(0.75);
                    // TODO: mechanika jokerow
                }
                
                // sprawdzanie konca gry drugi raz bo nie bedzie timer delaya
                for(let i = 0; i < 4; i++) {
                    if (this.cardGrid.getCardAt(i, 6) != null) {
                        timer.remove();
                        return;
                    }
                }
            },
            callbackScope: this,
            loop: true
        });
    }
}
