import Phaser from 'phaser';
import { cardGridManager } from './cards/cardGridManager.js';

export class Play extends Phaser.Scene {
    cardGrid = null;

    constructor() {
        super({
            key: 'Play'
        });
    }

    init() {
        // Fadein camera
        this.cameras.main.fadeIn(500);
        // this.lives = 10;
        // this.volumeButton();
    }

    create() {
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

    restartGame() {
        this.cameras.main.fadeOut(200 * this.cards.length);
    }

    createInitialCards() {
        const suits = ['diamondsAce', 'heartsAce', 'clubsAce', 'spadesAce'];

        for (let row = 0; row < 4; row++) {
            const cardData = {
                type: suits[row],
                onClick: (card) => {
                    this.cardGrid.moveCard(row, true);
                }
            }

            this.cardGrid.createCard(row, 0, cardData);
        }

        for (let col = 1; col < 7; col++) {
            const cardData = {
                type: 'back',
                onClick: (card) => {
                    // Row 4 cards - could add different behavior if needed
                }
            }

            this.cardGrid.createCard(4, col, cardData);
        }
    }

    startGame() {

        this.cardGrid = new cardGridManager(this, {
            rows: 5,
            columns: 7,
            cardWidth: 150,
            cardHeight: 100,
            marginX: 20,
            marginY: 30,
            visibleColumns: 7
        });

        this.cardGrid.createGrid();

        this.createInitialCards();

        // Get all created cards from the grid
        const cards = [];
        for (let row = 0; row < this.cardGrid.config.rows; row++) {
            for (let col = 0; col < this.cardGrid.config.columns; col++) {
                const card = this.cardGrid.getCardAt(row, col);
                if (card) {
                    cards.push(card);
                }
            }
        }

        cards.forEach((card, index) => {
            if (card.texture && card.texture.key === 'cards') {
                const delay = index * 50;
                const rotationVariation = Phaser.Math.Between(3500, 4500);

                // Scale breathing
                this.tweens.add({
                    targets: card,
                    scaleX: 0.70,
                    scaleY: 0.70,
                    duration: 1400,
                    delay: delay,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                // Subtle float
                this.tweens.add({
                    targets: card,
                    y: card.y - 8,
                    duration: 2000,
                    delay: delay,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                // Smooth rotation wobble - much longer duration for fluid motion
                this.tweens.add({
                    targets: card,
                    angle: 94,
                    duration: rotationVariation,
                    delay: delay + 100,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }
}