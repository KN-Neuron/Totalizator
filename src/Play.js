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
        ).setDepth(100).setAlpha(0);

        // Fade in the overlay
        this.tweens.add({
            targets: overlay,
            alpha: 0.8,
            duration: 500,
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
        // Configure confetti options
        const confettiSettings = {
            particleCount: 150,
            spread: 180,
            origin: { y: 0 }, // Start from the top
            colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],
            shapes: ['circle', 'square'],
            gravity: 0.8,
            ticks: 200,
            scalar: 1.2
        };

        // Create the main confetti burst
        confetti(confettiSettings);

        // Additional bursts in different positions
        setTimeout(() => {
            confetti({
                ...confettiSettings,
                particleCount: 100,
                angle: 60,
                spread: 55,
                origin: { x: 0 } // Left side
            });
        }, 150);

        setTimeout(() => {
            confetti({
                ...confettiSettings,
                particleCount: 100,
                angle: 120,
                spread: 55,
                origin: { x: 1 } // Right side
            });
        }, 300);
    }
}
