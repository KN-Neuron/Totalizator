import Phaser from 'phaser';

export class BettingUI {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = {
            uiWidth: 450,               // Szerokość panelu UI
            uiHeight: 600,              // Wysokość panelu UI
            margin: 20,                 // Margines od krawędzi
            cardGridWidth: 0,           // Szerokość siatki kart (jeśli znana)
            cardGridHeight: 0,          // Wysokość siatki kart (jeśli znana)
            ...config
        };
        
        this.currentBets = null;
        this.elements = {};
        this.screenWidth = 0;
        this.screenHeight = 0;
    }

    create() {
        this.screenWidth = this.scene.sys.game.scale.width;
        this.screenHeight = this.scene.sys.game.scale.height;
        
        this.initializeBets();
        this.calculateOptimalPosition();
        this.createContainer();
        this.createTitle();
        this.createTotalBetDisplay();
        this.createSuitBets();
        this.createActionButtons();
        
        // Listen for resize events
        this.scene.scale.on('resize', this.handleResize.bind(this));
    }

    calculateOptimalPosition() {
        const { uiWidth, uiHeight, margin, cardGridWidth } = this.config;
        
        // Jeśli znamy szerokość siatki kart, obliczamy optymalną pozycję
        if (cardGridWidth > 0) {
            const totalNeededWidth = cardGridWidth + uiWidth + margin * 3;
            
            if (totalNeededWidth <= this.screenWidth) {
                // Mieścimy się - UI po prawej stronie
                this.uiPosition = {
                    x: this.screenWidth - uiWidth / 2 - margin,
                    y: this.screenHeight / 2
                };
            } else {
                // Nie mieścimy się - UI na dole
                this.uiPosition = {
                    x: this.screenWidth / 2,
                    y: this.screenHeight - uiHeight / 2 - margin
                };
            }
        } else {
            // Domyślna pozycja - na dole ekranu
            this.uiPosition = {
                x: this.screenWidth / 2,
                y: this.screenHeight / 2
            };
        }
    }

    initializeBets() {
        this.currentBets = {
            diamonds: 0,
            hearts: 0,
            clubs: 0,
            spades: 0
        };
    }

    createContainer() {
        const { uiWidth, uiHeight } = this.config;
        
        // Main container
        this.elements.container = this.scene.add.container(this.uiPosition.x, this.uiPosition.y);
        
        // Background with rounded corners
        const background = this.scene.add.graphics();
        background.fillStyle(0x1a1a2e, 0.95);
        background.fillRoundedRect(-uiWidth/2, -uiHeight/2, uiWidth, uiHeight, 15);
        background.lineStyle(3, 0x8c7ae6, 1);
        background.strokeRoundedRect(-uiWidth/2, -uiHeight/2, uiWidth, uiHeight, 15);
        this.elements.container.add(background);
        this.elements.background = background;
    }

    createTitle() {
        const { uiHeight } = this.config;
        
        const title = this.scene.add.text(
            0,
            -uiHeight/2 + 40,
            "OBSTAWIANIE",
            { 
                fontSize: '22px', 
                fontFamily: 'Arial',
                fontStyle: "bold", 
                color: "#ffffff", 
                align: "center",
                stroke: "#000000",
                strokeThickness: 3
            }
        ).setOrigin(0.5);
        
        this.elements.container.add(title);
        this.elements.title = title;
    }

    createTotalBetDisplay() {
        const { uiHeight } = this.config;
        
        const totalBetText = this.scene.add.text(
            0,
            -uiHeight/2 + 80,
            "Łączny zakład: 0 zł",
            { 
                fontSize: '18px', 
                fontFamily: 'Arial',
                color: "#ffffff", 
                align: "center",
                stroke: "#000000",
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        this.elements.container.add(totalBetText);
        this.elements.totalBetText = totalBetText;
    }

    createSuitBets() {
        const suits = [
            { name: 'diamonds', color: '#e74c3c', text: 'KARO', yOffset: -140 },
            { name: 'hearts', color: '#e74c3c', text: 'KIER', yOffset: -60 },
            { name: 'clubs', color: '#1f8813ff', text: 'TREFL', yOffset: 20 },
            { name: 'spades', color: '#1f8813ff', text: 'PIK', yOffset: 100 }
        ];

        suits.forEach((suit) => {
            this.createSuitBetDisplay(suit);
        });
    }

    createSuitBetDisplay(suit) {
        const { uiWidth } = this.config;
        const buttonSpacing = 80;
        
        const suitIcon = this.getSuitIcon(suit.name);
        const suitName = this.scene.add.text(
            -uiWidth/2 + 30,
            suit.yOffset,
            `${suitIcon} ${suit.text}`,
            { 
                fontSize: '18px', 
                fontFamily: 'Arial',
                color: suit.color, 
                fontStyle: "bold",
                stroke: "#000000",
                strokeThickness: 2
            }
        ).setOrigin(0, 0.5);
        this.elements.container.add(suitName);

        const betDisplay = this.scene.add.text(
            0,
            suit.yOffset,
            "0 zł",
            { 
                fontSize: '18px', 
                fontFamily: 'Arial',
                color: "#ffffff", 
                fontStyle: "bold",
                stroke: "#000000",
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        this.elements.container.add(betDisplay);
        this.elements[`${suit.name}_display`] = betDisplay;

        // Minus button
        const minusButton = this.createBetButton(
            -buttonSpacing,
            suit.yOffset,
            "-",
            0xe74c3c,
            30,
            () => this.adjustBet(suit.name, -10)
        );
        this.elements.container.add(minusButton.container);
        this.elements[`${suit.name}_minus`] = minusButton;

        // Plus button
        const plusButton = this.createBetButton(
            buttonSpacing,
            suit.yOffset,
            "+",
            0x2ecc71,
            30,
            () => this.adjustBet(suit.name, 10)
        );
        this.elements.container.add(plusButton.container);
        this.elements[`${suit.name}_plus`] = plusButton;
    }

    getSuitIcon(suitName) {
        const icons = {
            'diamonds': '♦',
            'hearts': '♥',
            'clubs': '♣',
            'spades': '♠'
        };
        return icons[suitName] || '';
    }

    createBetButton(x, y, text, color, radius, onClick) {
        const container = this.scene.add.container(x, y);
        
        // Button background with glow effect
        const button = this.scene.add.circle(0, 0, radius, color, 1);
        
        // Add glow effect
        const glow = this.scene.add.graphics();
        glow.lineStyle(4, 0xffffff, 0.5);
        glow.strokeCircle(0, 0, radius + 2);
        container.add(glow);
        
        button.setStrokeStyle(2, 0xffffff);
        container.add(button);
        
        // Button text
        const buttonText = this.scene.add.text(0, 0, text, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);
        container.add(buttonText);
        
        // Make interactive
        container.setInteractive(
            new Phaser.Geom.Circle(0, 0, radius),
            Phaser.Geom.Circle.Contains
        );
        
        // Hover effects with animations
        container.on(Phaser.Input.Events.POINTER_OVER, () => {
            this.scene.tweens.add({
                targets: button,
                scale: 1.1,
                duration: 100,
                ease: 'Power2'
            });
            this.scene.input.setDefaultCursor("pointer");
        });
        
        container.on(Phaser.Input.Events.POINTER_OUT, () => {
            this.scene.tweens.add({
                targets: button,
                scale: 1,
                duration: 100,
                ease: 'Power2'
            });
            this.scene.input.setDefaultCursor("default");
        });
        
        container.on(Phaser.Input.Events.POINTER_DOWN, () => {
            button.setFillStyle(color, 0.6);
            this.playSound("click", 0.3);
        });
        
        container.on(Phaser.Input.Events.POINTER_UP, () => {
            button.setFillStyle(color, 1);
            onClick();
        });
        
        return {
            container,
            button,
            text: buttonText
        };
    }

    createActionButtons() {
        const { uiHeight, uiWidth } = this.config;
        
        // Reset all bets button
        const resetButton = this.createButton(
            0,
            uiHeight/2 - 50,
            "ZRESETUJ ZAKŁADY",
            0x8c7ae6,
            180,
            35,
            () => this.resetAllBets()
        );
        this.elements.container.add(resetButton.container);
        this.elements.resetButton = resetButton;

        // Bet confirmation button
        const confirmButton = this.createButton(
            0,
            uiHeight/2 - 100,
            "POTWIERDŹ ZAKŁAD",
            0x27ae60,
            180,
            35,
            () => this.confirmBet()
        );
        this.elements.container.add(confirmButton.container);
        this.elements.confirmButton = confirmButton;
    }

    createButton(x, y, label, color, width, height, onClick) {
        const container = this.scene.add.container(x, y);
        
        // Button background with rounded corners
        const button = this.scene.add.graphics();
        button.fillStyle(color, 1);
        button.fillRoundedRect(-width/2, -height/2, width, height, 8);
        button.lineStyle(2, 0xffffff, 1);
        button.strokeRoundedRect(-width/2, -height/2, width, height, 8);
        container.add(button);
        
        // Button text
        const buttonText = this.scene.add.text(0, 0, label, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 2
        }).setOrigin(0.5);
        container.add(buttonText);
        
        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-width/2, -height/2, width, height);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        // Hover effects with animations
        container.on(Phaser.Input.Events.POINTER_OVER, () => {
            this.scene.tweens.add({
                targets: container,
                scale: 1.05,
                duration: 100,
                ease: 'Power2'
            });
            this.scene.input.setDefaultCursor("pointer");
        });
        
        container.on(Phaser.Input.Events.POINTER_OUT, () => {
            this.scene.tweens.add({
                targets: container,
                scale: 1,
                duration: 100,
                ease: 'Power2'
            });
            this.scene.input.setDefaultCursor("default");
        });
        
        container.on(Phaser.Input.Events.POINTER_DOWN, () => {
            button.clear();
            button.fillStyle(color, 0.6);
            button.fillRoundedRect(-width/2, -height/2, width, height, 8);
            button.lineStyle(2, 0xffffff, 1);
            button.strokeRoundedRect(-width/2, -height/2, width, height, 8);
            this.playSound("click", 0.3);
        });
        
        container.on(Phaser.Input.Events.POINTER_UP, () => {
            button.clear();
            button.fillStyle(color, 1);
            button.fillRoundedRect(-width/2, -height/2, width, height, 8);
            button.lineStyle(2, 0xffffff, 1);
            button.strokeRoundedRect(-width/2, -height/2, width, height, 8);
            onClick();
        });
        
        return {
            container,
            button,
            text: buttonText
        };
    }

    adjustBet(suit, amount) {
        // Ensure bet doesn't go below 0
        this.currentBets[suit] = Math.max(0, this.currentBets[suit] + amount);
        
        // Update bet display with animation
        const display = this.elements[`${suit}_display`];
        display.setText(`${this.currentBets[suit]} zł`);
        
        // Add bounce effect
        this.scene.tweens.add({
            targets: display,
            scale: 1.2,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
        
        // Update total bet
        this.updateTotalBet();
    }

    updateTotalBet() {
        const total = Object.values(this.currentBets).reduce((sum, bet) => sum + bet, 0);
        this.elements.totalBetText.setText(`Łączny zakład: ${total} zł`);
        
        // Color coding based on total bet
        if (total > 100) {
            this.elements.totalBetText.setColor('#ff9f43');
        } else if (total > 0) {
            this.elements.totalBetText.setColor('#ffffff');
        } else {
            this.elements.totalBetText.setColor('#95a5a6');
        }
    }

    resetAllBets() {
        // Animate reset
        Object.keys(this.currentBets).forEach(suit => {
            this.currentBets[suit] = 0;
            const display = this.elements[`${suit}_display`];
            display.setText("0 zł");
            
            // Add fade out effect
            this.scene.tweens.add({
                targets: display,
                alpha: 0.5,
                duration: 100,
                yoyo: true,
                ease: 'Power2'
            });
        });
        
        // Update total bet
        this.updateTotalBet();
        
        // Play sound
        this.playSound("reset", 0.3);
        
        // Show message
        this.showMessage("Wszystkie zakłady zresetowane!", 0x8c7ae6);
    }

    confirmBet() {
        const total = Object.values(this.currentBets).reduce((sum, bet) => sum + bet, 0);
        
        if (total === 0) {
            // Show warning if no bets placed
            this.showMessage("Postaw zakład przed rozpoczęciem gry!", 0xe74c3c);
            
            // Shake effect
            this.scene.tweens.add({
                targets: this.elements.totalBetText,
                x: this.elements.totalBetText.x + 5,
                duration: 50,
                yoyo: true,
                repeat: 3,
                ease: 'Power2'
            });
            return;
        }
        
        // Show confirmation message
        this.showMessage(`Zakład na kwotę ${total} zł został przyjęty!`, 0x27ae60);
        
        // Emit event that bet was confirmed
        this.scene.events.emit('betConfirmed', this.currentBets);
        
        // Return bets data
        return this.currentBets;
    }

    showMessage(text, color) {
        const { uiHeight } = this.config;
        
        // Remove previous message if exists
        if (this.messageBox) {
            this.messageBox.destroy();
        }
        
        // Create message box inside the container
        const messageBox = this.scene.add.container(0, uiHeight/2 - 10);
        
        // Background
        const background = this.scene.add.graphics();
        background.fillStyle(color, 0.9);
        background.fillRoundedRect(-150, -20, 300, 40, 10);
        background.lineStyle(2, 0xffffff, 1);
        background.strokeRoundedRect(-150, -20, 300, 40, 10);
        messageBox.add(background);
        
        // Message text
        const messageText = this.scene.add.text(0, 0, text, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 2
        }).setOrigin(0.5);
        messageBox.add(messageText);
        
        // Add to UI container
        this.elements.container.add(messageBox);
        
        // Store reference
        this.messageBox = messageBox;
        
        // Auto-hide after 3 seconds with fade out
        this.scene.time.delayedCall(3000, () => {
            if (this.messageBox) {
                this.scene.tweens.add({
                    targets: this.messageBox,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        if (this.messageBox) {
                            this.messageBox.destroy();
                            this.messageBox = null;
                        }
                    }
                });
            }
        });
    }

    handleResize(gameSize) {
        this.screenWidth = gameSize.width;
        this.screenHeight = gameSize.height;
        
        // Recalculate position
        this.calculateOptimalPosition();
        
        // Update container position
        if (this.elements.container) {
            this.elements.container.setPosition(this.uiPosition.x, this.uiPosition.y);
        }
    }

    playSound(key, volume = 1.0) {
        if (this.scene.sound.get(key)) {
            this.scene.sound.play(key, { volume });
        }
    }

    getBets() {
        return { ...this.currentBets };
    }

    setBet(suit, amount) {
        if (this.currentBets.hasOwnProperty(suit)) {
            this.currentBets[suit] = Math.max(0, amount);
            this.elements[`${suit}_display`].setText(`${this.currentBets[suit]} zł`);
            this.updateTotalBet();
            return true;
        }
        return false;
    }

    hide() {
        this.elements.container.setVisible(false);
    }

    show() {
        this.elements.container.setVisible(true);
    }

    destroy() {
        if (this.elements.container) {
            this.elements.container.destroy();
        }
        this.currentBets = null;
        this.elements = {};
    }
}