import { Preloader } from './Preloader';
import { Play } from './Play';
import Phaser from 'phaser';

const config = {
    title: 'Gra totalizatora sportowego',
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#192a56',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Preloader,
        Play
    ]
};

new Phaser.Game(config);
