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
        // Create a deck of cards in the corner to create the illusion of dealing from it
        this.deckX = 50;  // Position in top-left corner
        this.deckY = 50;
        this.deckCards = [];  // Array to hold multiple deck card sprites for depth effect

        // Create multiple overlapping deck cards to create a 3D stack effect
        for (let i = 0; i < 5; i++) {
            const deckCard = this.add.sprite(
                this.deckX + i * 2,  // Offset each card slightly
                this.deckY + i * 2,
                'cards',
                'back'
            ).setScale(0.75).setOrigin(0.5, 0.5).setDepth(100 - i);  // Lower depth values are behind

            // Make the deck cards slightly transparent to show the stack depth
            deckCard.setAlpha(1.0 - (i * 0.15));
            this.deckCards.push(deckCard);
        }

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

        this.dealInitialCards();
    }

    dealCardFromDeck(row, col, cardData) {
        return new Promise((resolve) => {
            // Create a temporary card at deck position
            const dealingCard = this.add.sprite(
                this.deckX,
                this.deckY,
                'cards',
                'back'
            ).setScale(0.75).setOrigin(0.5, 0.5).setDepth(200); // Higher depth to appear on top

            // First, flip the card to show its actual type while it's still at the deck position
            this.tweens.add({
                targets: dealingCard,
                scaleX: 0,
                duration: 100, // Faster animation
                ease: 'Power2',
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    // Change the texture to the actual card after the flip
                    dealingCard.setTexture('cards', cardData.type);
                    // Set the rotation to 90 degrees initially
                    dealingCard.setRotation(Phaser.Math.DegToRad(90));
                },
                onYoyo: () => {
                    // This runs at the halfway point when scale is 0
                    dealingCard.setTexture('cards', cardData.type);
                    // Set the rotation to 90 degrees initially
                    dealingCard.setRotation(Phaser.Math.DegToRad(90));
                }
            });

            // Add a short delay after the flip animation before starting the move
            this.time.delayedCall(100, () => {
                // Play dealing sound
                this.sound.play("card-flip", { volume: 0.5 });

                // Move the card from deck to its final position with a more realistic dealing curve
                const { x, y } = this.cardGrid.gridPositions[row][col];

                // Create a realistic dealing arc using two sequential tweens for a natural motion
                this.tweens.add({
                    targets: dealingCard,
                    x: x,
                    y: y - 80,  // Go above the target position first (reduced height)
                    duration: 123, // Faster animation
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        // Second tween to complete the arc down to the final position
                        this.tweens.add({
                            targets: dealingCard,
                            y: y,  // Move down to final position
                            duration: 200, // Faster animation
                            ease: 'Cubic.easeIn',
                            onComplete: () => {
                                // Transform the animated card into a grid card
                                dealingCard.setInteractive();
                                dealingCard.cardData = {
                                    ...cardData,
                                    row,
                                    col,
                                    gridManager: this.cardGrid,
                                    scaleFactor: this.cardGrid.scaleFactor
                                };

                                if (cardData.onClick) {
                                    dealingCard.off('pointerdown'); // Remove any previous listeners
                                    dealingCard.on('pointerdown', () => {
                                        cardData.onClick(dealingCard);
                                    });
                                }

                                // Add the card to the grid
                                this.cardGrid.cardGrid[row][col] = dealingCard;
                                this.cardGrid.cardColumnPositions[row] = col; // Set initial column position for this row

                                resolve(dealingCard);
                            }
                        });
                    }
                });
            });
        });
    }

    async dealInitialCards() {
        const suits = ['diamondsAce', 'clubsAce', 'heartsAce', 'spadesAce'];

        // Deal the initial row cards first
        for (let row = 0; row < 4; row++) {
            const cardData = {
                type: suits[row],
                onClick: (card) => {
                    this.cardGrid.moveCard(row, true);
                }
            };

            await this.dealCardFromDeck(row, 0, cardData);
            // Add a small delay between dealing each card for more realistic effect
            await new Promise(resolve => {
                this.time.delayedCall(100, () => resolve());
            });
        }

        // Then deal the column cards
        for (let col = 1; col < 7; col++) {
            const cardData = {
                type: 'back',
                onClick: (card) => {
                    // Row 4 cards - could add different behavior if needed
                }
            };

            await this.dealCardFromDeck(4, col, cardData);
            // Add a small delay between dealing each card for more realistic effect
            await new Promise(resolve => {
                this.time.delayedCall(100, () => resolve());
            });
        }

        // After all cards are dealt, apply the animations to the final cards
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
                const delay = index * 30; // Faster animation
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

                // Smooth rotation wobble - from 90 to 94 degrees (only 4 degrees change)
                this.tweens.add({
                    targets: card,
                    angle: 92, // Rotate from 90 to 94 degrees (4 degree change)
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