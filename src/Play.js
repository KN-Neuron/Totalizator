import Phaser from 'phaser';

export class Play extends Phaser.Scene
{
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

    startGame ()
    {
        const frames = this.textures.get('cards').getFrameNames();

        const cards = [];

        // Random card
        // cards.push(this.add.sprite(0, 0, 'cards', Phaser.Math.RND.pick(frames)).setScale(0.5));

        cards.push(this.add.sprite(0, 0, 'cards', 'diamondsAce').setScale(0.7));
        for (var a = 0; a < 5; a++)
        {
            cards.push(this.add.sprite(0, 0))
        }

        cards.push(this.add.sprite(0, 0, 'cards', 'heartsAce').setScale(0.7));
        for (var a = 0; a < 5; a++)
        {
            cards.push(this.add.sprite(0, 0))
        }

        cards.push(this.add.sprite(0, 0, 'cards', 'clubsAce').setScale(0.7));
        for (var a = 0; a < 5; a++)
        {
            cards.push(this.add.sprite(0, 0))
        }

        cards.push(this.add.sprite(0, 0, 'cards', 'spadesAce').setScale(0.7));
        for (var a = 0; a < 5; a++)
        {
            cards.push(this.add.sprite(0, 0))
        }

        cards.push(this.add.sprite(0, 0))
        for (var a = 0; a < 5; a++)
        {
            cards.push(this.add.sprite(0, 0, 'cards', 'back').setScale(0.7));
        }

        Phaser.Actions.GridAlign(cards, {
            width: 6,
            height: 5,
            cellWidth: 180,
            cellHeight: 145,
            x: 100,
            y: 100
        });

    }
}
