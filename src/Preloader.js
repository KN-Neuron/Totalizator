import Phaser from 'phaser';

export class Preloader extends Phaser.Scene
{
    constructor()
    {
        super({
            key: 'Preloader'
        });
    }

    preload ()
    {
        this.load.setPath("assets/");

        this.load.image("volume-icon", "ui/volume-icon.png");
        this.load.image("volume-icon_off", "ui/volume-icon_off.png");

        this.load.audio("theme-song", "audio/fat-caps-audionatix.mp3");
        this.load.audio("whoosh", "audio/whoosh.mp3");
        this.load.audio("card-flip", "audio/card-flip.mp3");
        this.load.audio("card-match", "audio/card-match.mp3");
        this.load.audio("card-mismatch", "audio/card-mismatch.mp3");
        this.load.audio("card-slide", "audio/card-slide.mp3");
        this.load.audio("victory", "audio/victory.mp3");
        this.load.audio("explosion", "explosion.mp3");
        this.load.image("background");
        this.load.image("grid");

        this.load.atlas('cards', 'cards/cards.png', 'cards/cards.json');

        this.load.video('smok', 'Smok_Srajacy_Pieniedzmi_Na_Sloty.mp4');

        this.load.image("heart", "ui/heart.png");
        this.load.image("coin", "coin.gif");
        this.load.image("explosion", "explosion.gif");

    }

    create ()
    {
        this.scene.start("Play");
    }
}
