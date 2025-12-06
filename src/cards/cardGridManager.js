export class cardGridManager {
    constructor(scene, config = {}) {
        this.scene = scene;

        this.config = {
            columns: 7,
            rows: 4,
            cardWidth: 150,
            cardHeight: 100,
            marginX: 15,
            marginY: 10,
            maxScreenPercentage: 0.8,
            autoScale: true,
            visibleColumns: 7,
            ...config
        };

        this.resetGrid();
    }

    resetGrid() {
        this.cardGrid = Array(this.config.rows).fill().map(() => 
            Array(this.config.columns).fill(null)
        );

        this.cardColumnPositions = Array(this.config.rows).fill(0);
        this.gridPositions = [];
        this.scaleFactor = 1.0;
    }

    createGrid() {
        const { width, height } = this.scene.cameras.main;
        const { columns, rows, cardWidth, cardHeight, marginX, marginY, maxScreenPercentage, autoScale, visibleColumns } = this.config;
        
        const neededWidth = columns * cardWidth + (columns - 1) * marginX;
        const neededHeight = rows * cardHeight + (rows - 1) * marginY;
        
        const maxAllowedWidth = width * maxScreenPercentage;
        const maxAllowedHeight = height * maxScreenPercentage;
        
        this.scaleFactor = 1.0;
        
        if (autoScale) {
            const widthScale = maxAllowedWidth / neededWidth;
            const heightScale = maxAllowedHeight / neededHeight;
            this.scaleFactor = Math.min(widthScale, heightScale, 1.0);
        }
        
        const scaledCardWidth = cardWidth * this.scaleFactor;
        const scaledCardHeight = cardHeight * this.scaleFactor;
        const scaledMarginX = marginX * this.scaleFactor;
        const scaledMarginY = marginY * this.scaleFactor;
        
        const totalWidth = visibleColumns * scaledCardWidth + (visibleColumns - 1) * scaledMarginX;
        const totalHeight = rows * scaledCardHeight + (rows - 1) * scaledMarginY;
        
        const startX = (width - totalWidth) / 2 + scaledCardWidth / 2;
        const startY = (height - totalHeight) / 2 + scaledCardHeight / 2;

        this.actualCardWidth = scaledCardWidth;
        this.actualCardHeight = scaledCardHeight;

        this.gridPositions = [];
        for(let row = 0; row < rows; row++) {
            this.gridPositions[row] = [];
            for(let col = 0; col < columns; col++) {
                const x = startX + col * (scaledCardWidth + scaledMarginX);
                const y = startY + row * (scaledCardHeight + scaledMarginY);
                this.gridPositions[row][col] = { x, y };
            }
        }

        return this.gridPositions;
    }

    createCard(row, column, cardData) {
        if (!this.gridPositions[row] || !this.gridPositions[row][column]) {
            return null;
        }

        const { x, y } = this.gridPositions[row][column];
        
        console.log(this.scaleFactor)
        const card = this.scene.add.sprite(x, y, 'cards', cardData.type).setScale(0.75);
        card.setRotation(Phaser.Math.DegToRad(90));
        
        card.setOrigin(0.5, 0.5);

        card.setInteractive();

        card.cardData = {
            ...cardData,
            row,
            column,
            gridManager: this,
            scaleFactor: this.scaleFactor
        };

        if (cardData.onClick) {
            card.on('pointerdown', () => {
                cardData.onClick(card);
            });
        }
        
        this.cardGrid[row][column] = card;
        
        return card;
    }

    moveCard(row, forward = true) {
        if(row < 0 || row > this.config.rows) {
            return false;
        }

        const currentColumn = this.cardColumnPositions[row];

        let newColumn;
        
        if (forward) {
            if (currentColumn >= 6) {
                return false;
            }
            newColumn = currentColumn + 1;
        } else {
            if (currentColumn <= 0) {
                return false;
            }
            newColumn = currentColumn - 1;
        }

        const card = this.cardGrid[row][currentColumn];

        if (!card) {
            return false;
        }

        const { x, y } = this.gridPositions[row][newColumn];

        this.scene.tweens.add({
            targets: card,
            x: x,
            y: y,
            duration: 300,
            ease: "Power2",
            onComplete: () => {
                this.cardGrid[row][currentColumn] = null;
                this.cardGrid[row][newColumn] = card;
                this.cardColumnPositions[row] = newColumn;
                card.cardData.column = newColumn;

                if (card.cardData.onMove) {
                    card.cardData.onMove(card, newColumn, forward);
                }
            }
        });

        return true;
    }

    setVisibleColumns(visibleColumns) {
        this.config.visibleColumns = Math.min(visibleColumns, this.config.columns);
        this.createGrid();
    }

    getCardAt(row, column) {
        return this.cardGrid[row][column];
    }

    isEmpty(row, column) {
        return this.cardGrid[row][column] === null;
    }

    destroy() {
        this.cardGrid = null;
        this.gridPositions = null;
    }
}