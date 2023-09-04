import Phaser from './lib/phaser.js'
import Game from './scenes/game.js'
import GameOver from './scenes/gameover.js'


export default new Phaser.Game(
    {
        type: Phaser.AUTO,
        width: 480,
        height: 640,
        scene: [Game, GameOver],
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {
                    y: 700
                },
                debug: false
            }
        }
    });