import Phaser from 'phaser';
import { cardGridManager } from './cards/cardGridManager.js';
import CardPack from './CardsController/CardPack.js';

import { BettingUI } from './BettingUI.js';
import confetti from 'canvas-confetti';
import { Session } from './SessionController/Session.js';

export class Play extends Phaser.Scene {
    cardGrid = null;
    cardPack = null;
    cards = null;
    bettingUI = null;
    session = null;
    wallet = 5000;
    walletStart = 5000;
    walletDisplay = null;
    walletContainer = null;
    walletText = null;
    walletIcon = null;

    // Jackpot tracking variables
    consecutiveMovesCount = 0;
    lastMovedRow = -1;  // Track which row had the last move

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
            "Gra Card Racing\nNacisnij aby zaczac",
            { align: "center", strokeThickness: 4, fontSize: 40, fontStyle: "bold", color: "#8c7ae6" }
        )
            .setOrigin(.5)
            .setDepth(3)
            .setInteractive();

        // Add registration text at the bottom with button-like background
        const registrationY = this.sys.game.scale.height - 250; // Move it higher up to bottom
        const registrationText = this.add.text(this.sys.game.scale.width / 2, registrationY,
            "Kliknij aby się zarejestrować i zyskać darmowe 50 zł na start",
            { align: "center", fontSize: 20, fontStyle: "normal", color: "#ffffff" } // White text
        )
            .setOrigin(.5)
            .setDepth(4); // Higher depth to be above background

        // Create rounded button background with dark color
        const textWidth = registrationText.width + 30; // Add some padding
        const textHeight = registrationText.height + 15; // Add some padding

        const buttonBg = this.add.graphics()
            .setDepth(3); // Behind the text

        // Draw rounded rectangle
        const x = this.sys.game.scale.width / 2 - textWidth / 2;
        const y = registrationY - textHeight / 2;
        const radius = 10; // Corner radius

        buttonBg.fillStyle(0x2c3e50) // Dark blue-gray color
            .fillRoundedRect(x, y, textWidth, textHeight, radius);

        // Make button interactive
        buttonBg.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(x, y, textWidth, textHeight),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        })
            .on('pointerover', () => {
                buttonBg.clear()
                    .fillStyle(0x34495e) // Slightly lighter dark on hover
                    .fillRoundedRect(x, y, textWidth, textHeight, radius);
            })
            .on('pointerout', () => {
                buttonBg.clear()
                    .fillStyle(0x2c3e50) // Original dark color
                    .fillRoundedRect(x, y, textWidth, textHeight, radius);
            });

        // Help / Guide button (Phaser-rendered) - opens public/guide.html in new tab
        const helpX = this.sys.game.scale.width - 140; // position near top-right
        const helpY = 60;
        const helpWidth = 120;
        const helpHeight = 36;
        const helpRadius = 10;

        const helpContainer = this.add.container(helpX, helpY).setDepth(5);

        const helpBg = this.add.graphics();
        helpBg.fillStyle(0x8c7ae6, 1);
        helpBg.fillRoundedRect(-helpWidth/2, -helpHeight/2, helpWidth, helpHeight, helpRadius);
        helpBg.lineStyle(2, 0xffffff, 0.15);
        helpBg.strokeRoundedRect(-helpWidth/2, -helpHeight/2, helpWidth, helpHeight, helpRadius);
        helpContainer.add(helpBg);

        const helpText = this.add.text(0, 0, "INSTRUKCJA", {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 2
        }).setOrigin(0.5);
        helpContainer.add(helpText);

        const helpHitArea = new Phaser.Geom.Rectangle(-helpWidth/2, -helpHeight/2, helpWidth, helpHeight);
        helpContainer.setInteractive(helpHitArea, Phaser.Geom.Rectangle.Contains);

        helpContainer.on(Phaser.Input.Events.POINTER_OVER, () => {
            helpBg.clear();
            helpBg.fillStyle(0x9c88ff, 1);
            helpBg.fillRoundedRect(-helpWidth/2, -helpHeight/2, helpWidth, helpHeight, helpRadius);
            helpBg.lineStyle(2, 0xffffff, 0.18);
            helpBg.strokeRoundedRect(-helpWidth/2, -helpHeight/2, helpWidth, helpHeight, helpRadius);
            this.input.setDefaultCursor("pointer");
        });

        helpContainer.on(Phaser.Input.Events.POINTER_OUT, () => {
            helpBg.clear();
            helpBg.fillStyle(0x8c7ae6, 1);
            helpBg.fillRoundedRect(-helpWidth/2, -helpHeight/2, helpWidth, helpHeight, helpRadius);
            helpBg.lineStyle(2, 0xffffff, 0.15);
            helpBg.strokeRoundedRect(-helpWidth/2, -helpHeight/2, helpWidth, helpHeight, helpRadius);
            this.input.setDefaultCursor("default");
        });

        helpContainer.on(Phaser.Input.Events.POINTER_UP, () => {
            window.open('/guide.html', '_blank', 'noopener');
        });

        // title tween like retro arcade
        // this.add.tween({
        //
        //     targets: titleText,
        //     duration: 800,
        //     ease: (value) => (value > .8),
        //     alpha: 0,
        //
        //     repeat: -1,
        //     yoyo: true,
        // });

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

                    if (typeof helpContainer !== 'undefined' && helpContainer) {
                        try { helpContainer.destroy(); } catch (e) {}
                    }

                    this.input.setDefaultCursor('default');

                    this.startGame();
                }
            })
        });

    }

    restartGame() {
        this.cameras.main.fadeOut(200 * this.cards.length);
        this.startGame();
    }

    createInitialCards() {
        const suits = ['diamondsAce', 'heartsAce', 'clubsAce', 'spadesAce'];

        for (let row = 0; row < 4; row++) {
            const cardData = {
                type: suits[row]
            }

            this.cardGrid.createCard(row, 0, cardData);
        }

        for (let col = 1; col < 6; col++) {
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


        this.cardPack = new CardPack(
            ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"],
            ["diamonds", "hearts", "clubs", "spades"],
            4 // DEBUG
            //1
        );

        this.cards = this.cardGrid.createGrid();

        // Show pulled card
        const card = this.add.sprite(this.cameras.main.width-100, this.cameras.main.height/2, 'cards', "back").setScale(0.75);
        card.setOrigin(0.5, 0.5);
        card.setInteractive();
        this.session = new Session(this.wallet);
        this.createWalletDisplay();

        this.bettingUI = new BettingUI(this);
        this.bettingUI.create();

        this.events.on('betConfirmed', this.handleBetConfirmed, this);
    }

    createBetStatusOverlay() {
        this.betStatusTexts = [];
        this.betStatusContainer = this.add.container(0, 0);

        const suitColors = ['#e74c3c', '#2ecc71', '#e74c3c', '#2ecc71'];

        for (let row = 0; row < 4; row++) {
            if(this.session.getPredictedWinnings(row).toFixed(2) < 0.01) continue;

            const gridPos = this.cardGrid.gridPositions;
            if (!gridPos || !gridPos[row] || !gridPos[row][0]) continue;

            const { x, y } = gridPos[row][0];

            const statusText = this.add.text(
                x - 160,
                y -40,
                `${this.session.getPredictedWinnings(row).toFixed(2)} zł\n×${this.session.trackMultipliers[row].toFixed(2)}`,
                {
                    fontSize: '14px',
                    fontFamily: 'Arial',
                    color: suitColors[row],
                    align: 'center',
                    stroke: '#000000',
                    strokeThickness: 2,
                    backgroundColor: '#1a1a2e',
                    padding: { x: 8, y: 4 }
                }
            ).setOrigin(0, 0);

            this.betStatusContainer.add(statusText);
            this.betStatusTexts[row] = statusText;
        }
    }

    updateBetStatusOverlay() {
        for (let row = 0; row < 4; row++) {
            const track = row;

            if (!this.betStatusTexts[row]) continue;

            const multiplier = this.session.trackMultipliers[track].toFixed(2);
            const betAmount = this.session.currentUserBets[track];

            if (betAmount > 0) {
                const predictedWin = this.session.getPredictedWinnings(row).toFixed(2);

                this.betStatusTexts[row].setText(
                    `${predictedWin} zł\n×${multiplier}`
                );
            }
        }
    }

    startGameTimer() {
        let last_column = 0;
        let last_to_move = -1;
        let leader = -1;
        let leader_position = -1;

        // Create a container for highlight lines
        this.highlightLinesContainer = this.add.container(0, 0);

        let timer = this.time.addEvent({
            delay: 1500,
            callback: async function () {
                for(let i = 0; i < 4; i++) {
                    if (this.cardGrid.getCardAt(i, 6) != null) {
                        timer.remove();
                        this.endGame(leader);
                        return;
                    }
                }

                let suits = ["diamonds", "clubs", "hearts", "spades"];

                let counter = 0;
                for (let j = 0; j <= last_column; j++) {
                    for(let i = 0; i < 4; i++) {
                        if (this.cardGrid.getCardAt(i, j) == null) {
                            counter++;
                        }
                    }
                }

                if (counter == (1+last_column)*4) {
                    let sideCard = this.cardPack.initialSideCards[last_column];
                    const cardData = {
                        type: sideCard.color + sideCard.value
                    }

                    // Create highlight line for the column where the side card will be revealed
                    this.createHighlightLine(last_column + 1);

                    this.cardGrid.changeCardAt(4, last_column+1, sideCard.color + sideCard.value);
                    const suitIndex = suits.indexOf(sideCard.color);
                    this.cardGrid.moveCard(suitIndex, false, (card, row, newColumn) => {
                        // Add jackpot logic for side cards: track consecutive moves
                        if (this.lastMovedRow === suitIndex) {
                            // Same row moved again - increment counter
                            this.consecutiveMovesCount++;
                        } else {
                            // Different row - reset counter and start from 1
                            this.consecutiveMovesCount = 1;
                        }

                        // Update the last moved row
                        this.lastMovedRow = suitIndex;

                        // Check if we've reached 6 consecutive moves AND there's a bet on this row
                        if (this.consecutiveMovesCount >= 6 && this.session && this.session.currentUserBets && this.session.currentUserBets[suitIndex] > 0) {
                            this.triggerJackpot();
                            // Reset the counter after triggering the jackpot
                            this.consecutiveMovesCount = 0;
                            this.lastMovedRow = -1;
                        }

                        last_to_move = -1;

                        const old_leader = leader;
                        const old_leader_position = leader_position;

                        // UŻYJ NOWEJ METODY
                        const moved_row = suitIndex;
                        const new_leader_info = this.handleLeaderChange(
                            old_leader,
                            old_leader_position,
                            moved_row
                        );

                        // Zaktualizuj zmienne
                        leader = new_leader_info.leader;
                        leader_position = new_leader_info.position;
                    });

                    last_column++;
                    last_to_move = -1;

                    // The callback should have handled the jackpot logic, so we just continue with leader logic
                    const old_leader = leader;
                    const old_leader_position = leader_position;

                    // UŻYJ NOWEJ METODY
                    const moved_row = suits.indexOf(sideCard.color);
                    const new_leader_info = this.handleLeaderChange(
                        old_leader,
                        old_leader_position,
                        moved_row
                    );

                    // Zaktualizuj zmienne
                    leader = new_leader_info.leader;
                    leader_position = new_leader_info.position;

                    return;
                }

                // losowanie karty z decku
                let pulled_card = this.cardPack.getNext();

                if (pulled_card.color != "JOKER") {
                    const card = this.add.sprite(this.cameras.main.width-100, this.cameras.main.height/2, 'cards', "back").setScale(0.75);

                    this.tweens.add({
                        targets: card,
                        scaleX: 0,
                        duration: 200,
                        ease: 'Power2',
                        onComplete: () => {
                            card.setTexture('cards', pulled_card.color + pulled_card.value);
                            this.tweens.add({
                                targets: card,
                                scaleX: 0.75,
                                duration: 200,
                                ease: 'Power2'
                            });
                        }
                    });

                    // Store the suit index for use in the callback
                    const suitIndex = suits.indexOf(pulled_card.color);
                    this.cardGrid.moveCard(suitIndex, true, (card, row, newColumn) => {
                        if(last_to_move == suitIndex) {
                            this.session.updateMultiplier(
                                suitIndex,
                                this.session.trackMultipliers[suitIndex] + 0.5
                            );
                            if(this.session.currentUserBets[suitIndex] > 0) {
                                this.showComboBonus(suitIndex);
                            }
                        }

                        // Add jackpot logic: track consecutive moves
                        if (this.lastMovedRow === suitIndex) {
                            // Same row moved again - increment counter
                            this.consecutiveMovesCount++;
                        } else {
                            // Different row - reset counter and start from 1
                            this.consecutiveMovesCount = 1;
                        }

                        // Update the last moved row
                        this.lastMovedRow = suitIndex;

                        // Check if we've reached 6 consecutive moves AND there's a bet on this row
                        if (this.consecutiveMovesCount >= 6 && this.session && this.session.currentUserBets && this.session.currentUserBets[suitIndex] > 0) {
                            this.triggerJackpot();
                            // Reset the counter after triggering the jackpot
                            this.consecutiveMovesCount = 0;
                            this.lastMovedRow = -1;
                        }

                        last_to_move = suitIndex;
                        const old_leader = leader;
                        const old_leader_position = leader_position;

                        const moved_row = suitIndex;
                        const new_leader_info = this.handleLeaderChange(
                            old_leader,
                            old_leader_position,
                            moved_row
                        );

                        leader = new_leader_info.leader;
                        leader_position = new_leader_info.position;
                    });

                    const old_leader = leader;
                    const old_leader_position = leader_position;

                    const moved_row = suits.indexOf(pulled_card.color);
                    const new_leader_info = this.handleLeaderChange(
                        old_leader,
                        old_leader_position,
                        moved_row
                    );

                    leader = new_leader_info.leader;
                    leader_position = new_leader_info.position;

                } else {
                    // TODO: Jokery
                    // check game state
                    let jokerGameState = 1;
                    let betOnCards = []
                    console.log(this.session.currentUserBets);
                    for (let i = 0; i < 4; i++) {
                        if (this.session.currentUserBets[i] > 0) {
                            betOnCards.push(suits[i]);
                        }
                    }
                    //console.log(betOnCards); // DEBUG
                    let getOut = false;
                    let leaderSuit = null;
                    for (let i = 6; i >= 0; i--) {
                        for (let j = 0; j < 4; j++) {
                            let thisCard = this.cardGrid.getCardAt(j, i);
                            if (thisCard == null) {
                                continue;
                            }
                            let maybeSuit = thisCard.cardData.type;
                            let sureSuit = null;
                            for (let possibleSuit of suits) {
                                if (maybeSuit.includes(possibleSuit)) {
                                    sureSuit = possibleSuit;
                                }
                            }
                            console.log(sureSuit);
                            console.log(betOnCards);
                            getOut = true;
                            if (!betOnCards.includes(sureSuit)) {
                                leaderSuit = sureSuit;
                                jokerGameState = 2;
                            }
                        }
                        if (getOut) {
                            break;
                        }
                    }
                    //console.log(betOnCards);

                    let jokerFunction = Math.floor(Math.random() * jokerGameState);

                    //console.log("jokerGameState: ", jokerGameState);
                    //jokerFunction = 0; // DEBUG
                    switch (jokerFunction) {
                        case 0: // MULTIPLIER BOOST
                            for (let betOnSuit of betOnCards) {
                                let indexOfBet = suits.indexOf(betOnSuit);
                                const current_multiplier = this.session.trackMultipliers[indexOfBet];
                                this.session.updateMultiplier(indexOfBet, current_multiplier * 1.5);
                                this.showLeaderBonus(indexOfBet);
                                //TODO: jakis efekt wow animacja mega bonusu prosto od smoka
                            }
                            break;
                        case 1:
                            const suitIndex = suits.indexOf(leaderSuit);
                            this.cardGrid.moveCard(suitIndex, false)
                            break;
                    }



                    // Joker - TUTAJ TEŻ MOŻESZ UŻYĆ TEJ METODY
                    const card = this.add.sprite(this.cameras.main.width-100, this.cameras.main.height/2, 'cards', "back").setScale(0.75);

                    this.tweens.add({
                        targets: card,
                        scaleX: 0,
                        duration: 200,
                        ease: 'Power2',
                        onComplete: () => {
                            card.setTexture('cards', "joker");
                            this.tweens.add({
                                targets: card,
                                scaleX: 0.75,
                                duration: 200,
                                ease: 'Power2'
                            });
                        }
                    });

                    // Joker breaks the consecutive move sequence
                    this.lastMovedRow = -1;
                    this.consecutiveMovesCount = 0;

                    last_to_move = -1;

                    // Dla jokera też możesz sprawdzić lidera (bez przesuwania karty)
                    const old_leader = leader;
                    const old_leader_position = leader_position;

                    const new_leader_info = this.handleLeaderChange(
                        old_leader,
                        old_leader_position
                    );

                    leader = new_leader_info.leader;
                    leader_position = new_leader_info.position;
                }

                this.updateBetStatusOverlay();

                for(let i = 0; i < 4; i++) {
                    if (this.cardGrid.getCardAt(i, 6) != null) {
                        timer.remove();
                        this.endGame(leader);
                        return;
                    }
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    endGame(winningTrack) {
        console.log("Game ended");

        this.session.finishRound(winningTrack);
        this.wallet = this.session.walletStatus;

        this.clearScreenWithAnimation().then(() => {
            if(this.session.prevWonAmount > 0) {
                this.triggerEndWin(this.session.prevWonAmount);
            } else {
                this.triggerLostEnd();
            }
        });
    }

    async clearScreenWithAnimation() {
        return new Promise((resolve) => {
            // 1. Fade out całego ekranu
            this.cameras.main.fadeOut(500);
            
            // 2. Po zakończeniu fade out, wyczyść wszystko
            this.cameras.main.once('camerafadeoutcomplete', () => {
                // Zatrzymaj wszystkie animacje
                this.tweens.killAll();
                this.time.removeAllEvents();
                
                // Usuń wszystkie obiekty (oprócz kamery)
                this.children.removeAll();
                
                // Zresetuj komponenty
                if (this.bettingUI) {
                    this.bettingUI.destroy();
                    this.bettingUI = null;
                }
                
                if (this.cardGrid) {
                    this.cardGrid.destroy();
                    this.cardGrid = null;
                }
                
                // Reset zmiennych
                this.cardPack = null;
                this.cards = null;
                this.deckCards = [];
                this.betStatusTexts = [];
                this.betStatusContainer = null;
                
                // Fade in
                this.cameras.main.fadeIn(300);
                
                resolve();
            });
        });
    }
    // Method to create a highlight line behind the column where side card is revealed
    createHighlightLine(column) {
        // Clean up any existing highlight lines
        if (this.highlightLinesContainer) {
            this.highlightLinesContainer.removeAll(true); // Remove all children and destroy them
        }

        // Get the position of the column where the side card is revealed
        const { x, y } = this.cardGrid.gridPositions[0][column];

        // Calculate the vertical bounds for the line
        const startY = this.cardGrid.gridPositions[0][column].y - 50; // Start above the first card
        const endY = this.cardGrid.gridPositions[3][column].y + 50; // Extend below the last card

        // Calculate the position to the left of the column
        const cardWidth = this.cardGrid.actualCardWidth || 150; // Default to 150 if not available
        const lineX = x - (cardWidth / 2) - 20; // Position to the left of the card, with 20px offset

        // Create a line graphics object
        const lineGraphics = this.add.graphics();
        lineGraphics.lineStyle(5, 0x80ffff, 0.50); // Thin white line with even lower opacity
        lineGraphics.beginPath();
        lineGraphics.moveTo(lineX, startY); // Start to the left of the column
        lineGraphics.lineTo(lineX, endY); // Draw vertical line
        lineGraphics.strokePath();

        // Set the depth to be behind the cards
        lineGraphics.setDepth(-1);

        // Add the line to the container
        this.highlightLinesContainer.add(lineGraphics);

        // Add fade in animation
        lineGraphics.setAlpha(0);
        this.tweens.add({
            targets: lineGraphics,
            alpha: 0.25,
            duration: 300,
            ease: 'Power2'
        });

        // Schedule fade out after a delay
        this.time.delayedCall(1500, () => {
            this.tweens.add({
                targets: lineGraphics,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    lineGraphics.destroy();
                }
            });
        });
    }

    handleBetConfirmed(bets) {
        if(bets['diamonds'] > 0) {
            this.session.placeBet(0, bets['diamonds']);
        }
        if(bets['hearts'] > 0) {
            this.session.placeBet(2, bets['hearts']);
            console.log(bets['hearts']);
        }
        if(bets['clubs'] > 0) {
            this.session.placeBet(1, bets['clubs']);
        }
        if(bets['spades'] > 0) {
            this.session.placeBet(3, bets['spades']);
        }
        this.bettingUI.hide();
        this.session.startRound();
        this.updateWalletDisplay();
        this.dealInitialCards().then(() => {
            this.createBetStatusOverlay();
            this.startGameTimer();
        });
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
                type: suits[row]
            };

            await this.dealCardFromDeck(row, 0, cardData);
            // Add a small delay between dealing each card for more realistic effect
            await new Promise(resolve => {
                this.time.delayedCall(100, () => resolve());
            });
        }

        // Then deal the column cards
        for (let col = 1; col < 6; col++) {
            const cardData = {
                type: 'back'
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
        //this.triggerJackpot();
    }

    triggerJackpot()
    {
        // Hide deck cards in top-left during jackpot
        if (this.deckCards && Array.isArray(this.deckCards)) {
            this.deckCards.forEach(card => {
                if (card) {
                    card.setVisible(false);
                }
            });
        }

        // Hide main card grid during jackpot
        this.hideMainCardGrid();

        // Create video but make it invisible initially
        this.video = this.add.video(window.innerWidth / 2, window.innerHeight / 2, 'smok').setScale(1.3);
        this.video.setAlpha(0); // Initially invisible
        this.video.play();
        this.video.setDepth(90); // Set depth above normal game elements but below deck cards and UI effects

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

    hideMainCardGrid() {
        if (this.cardGrid && this.cardGrid.cardGrid) {
            for (let row = 0; row < this.cardGrid.config.rows; row++) {
                for (let col = 0; col < this.cardGrid.config.columns; col++) {
                    const card = this.cardGrid.cardGrid[row][col];
                    if (card) {
                        card.setVisible(false);
                    }
                }
            }
        }
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

    handleLeaderChange(old_leader, old_leader_position, moved_row) {
        // Sprawdź aktualnego lidera
        const new_leader_info = this.getCurrentLeader();
        const new_leader = new_leader_info.leader;
        const new_leader_position = new_leader_info.position;

        let bonusTriggered = false;

        // Sprawdź czy doszło do zmiany lidera
        if (new_leader !== -1) {
            if (new_leader !== old_leader) {
                // Nowy lider - nadaj bonus jeśli jest na nim zakład
                if (this.session.currentUserBets[new_leader] > 0) {
                    const current_multiplier = this.session.trackMultipliers[new_leader];
                    this.session.updateMultiplier(new_leader, current_multiplier + 0.25);
                    this.showLeaderBonus(new_leader);
                    bonusTriggered = true;
                }
            } else if (new_leader === old_leader && new_leader_position > old_leader_position) {
                // Ten sam lider, ale awansował do lepszej pozycji - nadaj bonus
                if (this.session.currentUserBets[new_leader] > 0) {
                    const current_multiplier = this.session.trackMultipliers[new_leader];
                    this.session.updateMultiplier(new_leader, current_multiplier + 0.25);
                    this.showLeaderBonus(new_leader);
                    bonusTriggered = true;
                }
            }
        }

        // Zwróć nowe wartości lidera
        return { leader: new_leader, position: new_leader_position };
    }

    getCurrentLeader() {
        let leader = -1;
        let max_position = -1;
        let is_tie = false;

        for (let row = 0; row < 4; row++) {
            // Znajdź najdalszą kartę w rzędzie
            let current_position = -1;
            for (let col = 0; col < 7; col++) {
                if (this.cardGrid.getCardAt(row, col) !== null) {
                    current_position = col;
                }
            }

            if (current_position > max_position) {
                // Nowy lider
                max_position = current_position;
                leader = row;
                is_tie = false;
            } else if (current_position === max_position && current_position > -1) {
                // Remis na prowadzeniu
                is_tie = true;
            }
        }

        // Jeśli jest remis, nikt nie jest liderem
        if (is_tie) {
            return { leader: -1, position: max_position };
        }

        return { leader: leader, position: max_position };
    }

    // Sprawdza czy pojawił się nowy lider (dla side cards)
    checkForNewLeader(old_leader, old_leader_position) {
        const new_leader_info = this.getCurrentLeader();
        const new_leader = new_leader_info.leader;
        const new_leader_position = new_leader_info.position;

        if (new_leader !== -1) {
            if (new_leader !== old_leader) {
                // Nowy lider - nadaj bonus jeśli jest na nim zakład
                if (this.session.currentUserBets[new_leader] > 0) {
                    const current_multiplier = this.session.trackMultipliers[new_leader];
                    this.session.updateMultiplier(new_leader, current_multiplier + 0.25);
                    this.showLeaderBonus(new_leader);
                }
            } else if (new_leader === old_leader && new_leader_position > old_leader_position) {
                // Ten sam lider, ale awansował do lepszej pozycji - nadaj bonus
                if (this.session.currentUserBets[new_leader] > 0) {
                    const current_multiplier = this.session.trackMultipliers[new_leader];
                    this.session.updateMultiplier(new_leader, current_multiplier + 0.25);
                    this.showLeaderBonus(new_leader);
                }
            }
        }

        // Zwróć nowe wartości lidera
        return { leader: new_leader, position: new_leader_position };
    }

    // Pokazuje animację bonusu dla lidera
    showLeaderBonus(row) {
        // Znajdź pozycję karty lidera
        let card_x = 0;
        let card_y = 0;

        for (let col = 6; col >= 0; col--) {
            const card = this.cardGrid.getCardAt(row, col);
            if (card) {
                card_x = card.x;
                card_y = card.y;
                break;
            }
        }

        if (card_x === 0 && card_y === 0) return;

        // Stwórz tekst bonusu
        const bonusText = this.add.text(
            card_x,
            card_y - 50,
            `LIDER! +0.25`,
            {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#f1c40f',
                stroke: '#000000',
                strokeThickness: 3,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Animacja
        this.tweens.add({
            targets: bonusText,
            y: bonusText.y - 30,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => bonusText.destroy()
        });

        // Dodaj efekt iskier
        this.createSparkleEffect(card_x, card_y - 30);

        // Dźwięk
        //this.sound.play('bonus', { volume: 0.3 });
    }

    // Pokazuje animację bonusu dla combo (dwa z rzędu)
    showComboBonus(row) {
        let card_x = 0;
        let card_y = 0;

        for (let col = 6; col >= 0; col--) {
            const card = this.cardGrid.getCardAt(row, col);
            if (card) {
                card_x = card.x;
                card_y = card.y;
                break;
            }
        }

        if (card_x === 0 && card_y === 0) return;

        // Stwórz tekst bonusu
        const bonusText = this.add.text(
            card_x,
            card_y - 50,
            `COMBO! +0.25`,
            {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#f1c40f',
                stroke: '#000000',
                strokeThickness: 3,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Animacja
        this.tweens.add({
            targets: bonusText,
            y: bonusText.y - 30,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => bonusText.destroy()
        });

        // Dodaj efekt iskier
        this.createSparkleEffect(card_x, card_y - 30);

        // Dźwięk
        //this.sound.play('bonus', { volume: 0.3 });
    }

    // Efekt iskier
    createSparkleEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            const sparkle = this.add.circle(x, y, 3, 0xf1c40f);

            const angle = (i / 8) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;

            this.tweens.add({
                targets: sparkle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => sparkle.destroy()
            });
        }
    }

    createWalletDisplay() {
        const { width, height } = this.sys.game.scale;

        // Kontener
        this.walletContainer = this.add.container(width - 20, 20);

        // Tło z zaokrąglonymi rogami i cieniem
        const background = this.add.graphics();
        background.fillStyle(0x1a1a2e, 0.95);
        background.fillRoundedRect(-160, -25, 160, 50, 15);

        // Obramowanie z gradientem
        background.lineStyle(3, 0x8c7ae6, 1);
        background.strokeRoundedRect(-160, -25, 160, 50, 15);

        // Cień
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.3);
        shadow.fillRoundedRect(-158, -23, 156, 46, 13);
        shadow.setDepth(-1);

        this.walletContainer.add(shadow);
        this.walletContainer.add(background);

        // Ikona portfela/żetona
        this.walletIcon = this.add.sprite(-130, 0, 'coin')
            .setScale(0.08)
            .setOrigin(0.5);

        // Animacja obracania się ikony
        this.tweens.add({
            targets: this.walletIcon,
            angle: 360,
            duration: 8000,
            repeat: -1,
            ease: 'Linear'
        });

        // Tekst portfela
        this.walletText = this.add.text(-80, 0, `${this.session.walletStatus} zł`, {
            fontSize: '22px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 3,
                stroke: true,
                fill: true
            }
        }).setOrigin(0, 0.5);

        // Dodaj wszystkie elementy do kontenera
        this.walletContainer.add(this.walletIcon);
        this.walletContainer.add(this.walletText);
    }

    updateWalletDisplay() {
        if (this.walletText && this.session) {
            const currentAmount = this.session.walletStatus;
            const oldAmount = parseInt(this.walletText.text.replace(' zł', '')) || currentAmount;

            // Animacja zmiany wartości
            if (oldAmount !== currentAmount) {
                // Zmiana koloru w zależności od zmiany
                const color = currentAmount > oldAmount ? '#2ecc71' :
                            currentAmount < oldAmount ? '#e74c3c' : '#ffffff';

                this.walletText.setColor(color);

                // Animacja tekstu
                this.tweens.add({
                    targets: this.walletText,
                    scale: 1.2,
                    duration: 200,
                    yoyo: true,
                    ease: 'Power2'
                });

                // Efekt monet przy wygranej
                if (currentAmount > oldAmount) {
                    this.createCoinEffect();
                }
            }

            // Aktualizuj tekst
            this.walletText.setText(`${currentAmount} zł`);

            // Przywróć kolor po chwili
            this.time.delayedCall(1000, () => {
                if (this.walletText) {
                    this.walletText.setColor('#ffffff');
                }
            });
        }
    }

    createCoinEffect() {
        const { x, y } = this.walletContainer;

        // Efekt wylatujących monet
        for (let i = 0; i < 5; i++) {
            const coin = this.add.sprite(x, y, 'coin')
                .setScale(0.04)
                .setDepth(100);

            const angle = Phaser.Math.Between(-30, 30);
            const distance = Phaser.Math.Between(50, 100);

            this.tweens.add({
                targets: coin,
                x: x + Math.cos(Phaser.Math.DegToRad(angle)) * distance,
                y: y - Math.sin(Phaser.Math.DegToRad(angle)) * distance,
                angle: 720,
                alpha: 0,
                scale: 0.01,
                duration: 800,
                ease: 'Power2',
                onComplete: () => coin.destroy()
            });
        }

        // Dźwięk monet
        this.sound.play('coins', { volume: 0.3 });
    }

    triggerEndWin(winAmount)
    {
        this.add.image(0, 0, "background").setOrigin(0);

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

        const jackpotText = this.add.text(
            this.sys.game.scale.width / 2,
            -200, // Start above the screen
            "WYGRANA!",
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

        const formattedAmount = winAmount.toLocaleString('en-US');

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
                "WYGRANA!",
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

        // Add glow effect for win amount text
        for (let i = 1; i <= 2; i++) {
            const amountGlowText = this.add.text(
                this.sys.game.scale.width / 2,
                -300,
                `${formattedAmount}zł`,
                {
                    fontSize: '96px',
                    fontFamily: 'Arial Black, Arial, sans-serif',
                    color: '#fff700ff',
                    stroke: '#ff9900ff',
                    strokeThickness: 4,
                    fontStyle: 'bold'
                }
            )
            .setOrigin(0.5, 0.5)
            .setDepth(100)
            .setAlpha(0);

            // Fade in and move down the amount glow text
            this.tweens.add({
                targets: amountGlowText,
                y: this.sys.game.scale.height / 2 + 160,
                alpha: 0.5 - (i * 0.15),
                duration: 800 + (i * 150),
                ease: 'Bounce.easeOut',
                delay: 300, // Slight delay after "YOU WON!"
                onComplete: () => {
                    this.tweens.add({
                        targets: amountGlowText,
                        scaleX: 1.3,
                        scaleY: 1.3,
                        alpha: 0.2,
                        duration: 600,
                        ease: 'Sine.easeInOut',
                        yoyo: true,
                        repeat: -1
                    });
                }
            });

            const buttonY = this.sys.game.scale.height / 2 + 260;
            const nextGameButton = this.createEndScreenButton(
                this.sys.game.scale.width / 2, buttonY, 220, 50, 0x27ae60, '▶ NASTĘPNA GRA',
                () => {
                    this.clearScreenWithAnimation().then(() => {
                        this.add.image(0, 0, "background").setOrigin(0);
                        this.startGame();
                    });
                }
            );
            this.add(nextGameButton.container);
        }
    }

    triggerLostEnd() {
        this.add.image(0, 0, "background").setOrigin(0);

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

        const loseText = this.add.text(
            this.sys.game.scale.width / 2,
            -200, // Start above the screen
            "SPRÓBUJ JESZCZE RAZ!",
            {
                fontSize: '80px',
                fontFamily: 'Arial Black, Arial, sans-serif',
                color: '#ff0000ff',
                stroke: '#ffffffff',
                strokeThickness: 8,
                fontStyle: 'bold'
            }
        )
        .setOrigin(0.5, 0.5)
        .setDepth(101)
        .setAlpha(0);

        this.tweens.add({
            targets: [loseText],
            y: this.sys.game.scale.height / 2,
            alpha: 1,
            duration: 800,
            ease: 'Bounce.easeOut',
            onComplete: () => {
            //Start the pulsing animation after fade in
                this.tweens.add({
                    targets: loseText,
                    scaleX: 1.15,
                    scaleY: 1.15,
                    duration: 800,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
            }
        });

        const buttonY = this.sys.game.scale.height / 2 + 260;
        const nextGameButton = this.createEndScreenButton(
            this.sys.game.scale.width / 2, buttonY, 220, 50, 0x27ae60, '▶ NASTĘPNA GRA',
            () => {
                this.clearScreenWithAnimation().then(() => {
                    this.add.image(0, 0, "background").setOrigin(0);
                    this.startGame();
                });
            }
        );
        this.add(nextGameButton.container);
    }

    // Tworzenie przycisku dla ekranu końcowego
    createEndScreenButton(x, y, width, height, color, text, onClick) {
        const container = this.add.container(x, y);
        
        // Tło przycisku
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(color, 1);
        buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 10);
        
        // Obramowanie
        buttonBg.lineStyle(2, 0xffffff, 1);
        buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 10);
        
        container.add(buttonBg);
        
        // Tekst przycisku
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        container.add(buttonText);
        
        // Interaktywność
        const hitArea = new Phaser.Geom.Rectangle(-width/2, -height/2, width, height);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        // Efekty hover
        container.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(color, 0.8);
            buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 10);
            buttonBg.lineStyle(2, 0xffffff, 1);
            buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 10);
            
            this.tweens.add({
                targets: container,
                scale: 1.05,
                duration: 100,
                ease: 'Power2'
            });
            
            this.input.setDefaultCursor('pointer');
        });
        
        container.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(color, 1);
            buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 10);
            buttonBg.lineStyle(2, 0xffffff, 1);
            buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 10);
            
            this.tweens.add({
                targets: container,
                scale: 1,
                duration: 100,
                ease: 'Power2'
            });
            
            this.input.setDefaultCursor('default');
        });
        
        container.on('pointerdown', () => {
            buttonBg.clear();
            buttonBg.fillStyle(color, 0.6);
            buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 10);
            buttonBg.lineStyle(2, 0xffffff, 1);
            buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 10);
            
            this.sound.play('click', { volume: 0.3 });
        });
        
        container.on('pointerup', () => {
            buttonBg.clear();
            buttonBg.fillStyle(color, 0.8);
            buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 10);
            buttonBg.lineStyle(2, 0xffffff, 1);
            buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 10);
            
            onClick();
        });
        
        return {
            container: container,
            background: buttonBg,
            text: buttonText
        };
    }

    createFallingCoinsEffect(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            const coin = this.add.sprite(x + Phaser.Math.Between(-200, 200), y - 100, 'coin')
                .setScale(0.05)
                .setDepth(1000);
            
            const angle = Phaser.Math.Between(-30, 30);
            const distance = Phaser.Math.Between(100, 200);
            const duration = Phaser.Math.Between(800, 1200);
            
            this.tweens.add({
                targets: coin,
                x: coin.x + Math.cos(Phaser.Math.DegToRad(angle)) * distance,
                y: coin.y + Math.sin(Phaser.Math.DegToRad(angle)) * distance + 200,
                angle: 720,
                alpha: 0,
                scale: 0.02,
                duration: duration,
                ease: 'Power2',
                delay: i * 50,
                onComplete: () => coin.destroy()
            });
        }
    }
}
