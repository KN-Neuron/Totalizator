import Phaser from 'phaser';
import { cardGridManager } from './cards/cardGridManager.js';
import confetti from 'canvas-confetti';

export class Play extends Phaser.Scene
{
    cardGrid = null;

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
                type: suits[row],
                onClick: (card) => {
                    this.cardGrid.moveCardForward(row);
                }
            }

            this.cardGrid.createCard(row, 0, cardData);
        }

        for(let col = 1; col < 7; col++) {
            const cardData = {
                type: 'back',
                onClick: (card) => {
                    this.cardGrid.moveCardForward(row);
                }
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

        this.cards = this.cardGrid.createGrid();
        this.createInitialCards();

        this.time.addEvent({
            delay: 500,
            callback: function ()
            {
                this.cardGrid.moveCard(Math.floor(Math.random() * 4));
            },
            callbackScope: this,
            repeat: 10
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