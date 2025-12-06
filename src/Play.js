import Phaser from 'phaser';
import { cardGridManager } from './cards/cardGridManager.js';
import { BettingUI } from './BettingUI.js';
import confetti from 'canvas-confetti';

export class Play extends Phaser.Scene {
    cardGrid = null;
    bettingUI = null;

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
                type: suits[row]
            }

            this.cardGrid.createCard(row, 0, cardData);
        }

        for (let col = 1; col < 7; col++) {
            const cardData = {
                type: 'back'
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

        this.bettingUI = new BettingUI(this);
        this.bettingUI.create();
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

        // Trigger the jackpot sequence
        this.triggerJackpot();
    }

    triggerJackpot()
    {
        // Create video but make it invisible initially
        this.video = this.add.video(window.innerWidth / 2, window.innerHeight / 2, 'smok').setScale(1.3);
        this.video.setAlpha(0); // Initially invisible
        this.video.play();

        // Show JACKPOT popup first
        this.showJackpotPopup();

        // Fade in the video after a short delay
        this.time.delayedCall(500, () => {
            this.tweens.add({
                targets: this.video,
                alpha: 1,
                duration: 1000,
                ease: 'Power2'
            });
        });
    }

    showJackpotPopup()
    {
        // Create a semi-transparent black overlay that fades in
        const overlay = this.add.rectangle(
            this.sys.game.scale.width / 2,
            this.sys.game.scale.height / 2,
            this.sys.game.scale.width,
            this.sys.game.scale.height,
            0x000000
        ).setDepth(100).setAlpha(50);

        // Fade in the overlay
        this.tweens.add({
            targets: overlay,
            alpha: 0.3,
            duration: 999,
            ease: 'Power2'
        });

        // Create the JACKPOT text with large, bold styling (initially invisible)
        const jackpotText = this.add.text(
            this.sys.game.scale.width / 2,
            -200, // Start above the screen
            "JACKPOT",
            {
                fontSize: '120px',
                fontFamily: 'Arial Black, Arial, sans-serif',
                color: '#ffffff',
                stroke: '#FFD700',
                strokeThickness: 8,
                fontStyle: 'bold'
            }
        )
        .setOrigin(0.5, 0.5)
        .setDepth(101)
        .setAlpha(0);

        // Fade in and move down the JACKPOT text
        this.tweens.add({
            targets: [jackpotText],
            y: this.sys.game.scale.height / 2,
            alpha: 1,
            duration: 800,
            ease: 'Bounce.easeOut',
            onComplete: () => {
                // Start confetti effect after the text appears
                this.startConfettiEffect();

                // Start the pulsing animation after fade in
                this.tweens.add({
                    targets: jackpotText,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 800,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });

                // Add color changing effect
                this.tweens.add({
                    targets: jackpotText,
                    tint: 0xFFFF00, // Yellow
                    duration: 1000,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1,
                    hold: 500,
                    props: {
                        tint: {
                            value: 0xFFD700, // Gold
                            duration: 500,
                            ease: 'Sine.easeInOut'
                        }
                    }
                });
            }
        });

        // Add a glowing effect with particles or by creating multiple text layers
        for (let i = 1; i <= 3; i++) {
            const glowText = this.add.text(
                this.sys.game.scale.width / 2,
                -200, // Start above the screen
                "JACKPOT",
                {
                    fontSize: '120px',
                    fontFamily: 'Arial Black, Arial, sans-serif',
                    color: '#FFD700',
                    stroke: '#FFA500',
                    strokeThickness: 4,
                    fontStyle: 'bold'
                }
            )
            .setOrigin(0.5, 0.5)
            .setDepth(100)
            .setAlpha(0);

            // Fade in and move down the glow text
            this.tweens.add({
                targets: glowText,
                y: this.sys.game.scale.height / 2,
                alpha: 0.7 - (i * 0.2),
                duration: 800 + (i * 100), // Stagger the timing
                ease: 'Bounce.easeOut',
                onComplete: () => {
                    this.tweens.add({
                        targets: glowText,
                        scaleX: 1.4,
                        scaleY: 1.4,
                        alpha: 0.3,
                        duration: 800,
                        ease: 'Sine.easeInOut',
                        yoyo: true,
                        repeat: -1
                    });
                }
            });
        }
    }

    startConfettiEffect()
    {
        // Configure confetti options - make them more prominent
        const confettiSettings = {
            particleCount: 1000, // Increased particle count
            spread: 250,
            origin: { y: 0 }, // Start from the top
            colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffff00'],
            shapes: ['circle', 'square'],
            gravity: 0.8,
            ticks: 2000,
            scalar: 1.2,
            zIndex: 12 // Higher than our other elements
        };

        // Create the main confetti burst
        confetti(confettiSettings);

        // Additional bursts in different positions
        setTimeout(() => {
            confetti({
                ...confettiSettings,
                particleCount: 80,
                angle: 60,
                spread: 55,
                origin: { x: 0 } // Left side
            });
        }, 150);

        setTimeout(() => {
            confetti({
                ...confettiSettings,
                particleCount: 80,
                angle: 120,
                spread: 55,
                origin: { x: 1 } // Right side
            });
        }, 300);

        // Create coin falling effects - MANY MORE and much smaller
        this.createCoinFalling();

        // Create rapid explosion effects - 3 in quick succession
        this.createRapidExplosions();

        // Play jackpot sound effect
        this.sound.play('victory', { volume: 0.7 });
    }

    createCoinFalling()
    {
        // Create MANY MORE smaller coins - starting from above the screen area
        for (let i = 0; i < 500; i++) {  // Increased from 20 to 50
            const x = Phaser.Math.Between(20, this.sys.game.config.width - 20);
            const startY = Phaser.Math.Between(-200, -50); // Start coins from different high positions

            // Create a coin at a random position above the screen
            const coin = this.add.sprite(x, startY, 'coin')
                .setDepth(98)
                .setScale(0.1); // MUCH smaller scale

            // Add rotation animation to simulate spinning
            this.tweens.add({
                targets: coin,
                angle: 720, // Rotate twice as much for more spinning effect
                duration: Phaser.Math.Between(2000, 4000),
                repeat: -1,
                ease: 'Linear'
            });

            // Make the coin fall with acceleration
            this.tweens.add({
                targets: coin,
                y: this.sys.game.config.height + 20,
                duration: Phaser.Math.Between(3000, 7000),
                ease: 'Cubic.easeIn',
                onComplete: () => {
                    coin.destroy();
                }
            });

            // Add slight horizontal movement for more natural falling
            this.tweens.add({
                targets: coin,
                x: x + Phaser.Math.Between(-50, 50),
                duration: Phaser.Math.Between(3000, 7000),
                ease: 'Cubic.easeIn',
                repeat: 0
            });
        }
    }

    createRapidExplosions()
    {
        // Create 3 explosions happening in quick interval as requested
        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 300, () => { // Every 300ms
                const x = Phaser.Math.Between(150, this.sys.game.config.width - 150);
                const y = Phaser.Math.Between(150, this.sys.game.config.height - 150);

                this.createExplosion(x, y);

                // Play explosion sound
                this.sound.play('explosion', { volume: 0.6 });
            });
        }

        // Additional random explosions
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(100, this.sys.game.config.width - 100);
            const y = Phaser.Math.Between(100, this.sys.game.config.height - 100);

            this.time.delayedCall(Phaser.Math.Between(500, 2000), () => {
                this.createExplosion(x, y);
                // Play explosion sound
                this.sound.play('explosion', { volume: 0.6 });
            });
        }
    }

    createExplosion(x, y)
    {
        // Create an explosion sprite with bigger scale
        const explosionSprite = this.add.sprite(x, y, 'explosion')
            .setDepth(102)  // Higher depth to be on top
            .setScale(1.0)  // Much bigger explosion
            .setAlpha(0.9);

        // Add animation to the explosion
        this.tweens.add({
            targets: explosionSprite,
            scale: 1.5,
            alpha: 0,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                explosionSprite.destroy();
            }
        });
    }
}