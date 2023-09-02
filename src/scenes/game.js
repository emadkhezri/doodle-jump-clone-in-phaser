import Phaser from '../lib/phaser.js';

export default class Game extends Phaser.Scene
{
    /** @type {Phaser.Physics.Arcade.Sprite} */
    player


    /** @type {Phaser.Physics.Arcade.staticGroup} */
    platforms


    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursors

    constructor()
    {
        super({ key: 'Game' });
    }

    preload()
    {
        this.load.setBaseURL('assets/')
        this.load.image('background', 'Background/bg_layer1.png')
        // load the platform image
        this.load.image('platform', 'Environment/ground_grass.png')
        // add this new line
        this.load.image('bunny-stand', 'Players/bunny1_stand.png')

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    create()
    {
        var image = this.add.image(240, 320, 'background').setScrollFactor(1, 0)

        this.platforms = this.physics.add.staticGroup()

        for (let i = 0; i < 5; i++)
        {
            const x = Phaser.Math.Between(80, 400)
            const y = 150 * i;

            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = this.platforms.create(x, y, 'platform')
            platform.setScale(0.5)

            /** @type {Phaser.Physics.Arcade.StaticBody} */
            const body = platform.body
            body.updateFromGameObject()

        }

        // create a bunny sprite
        this.player = this.physics.add.sprite(240, 320, 'bunny-stand').setScale(0.5)
        this.player.body.checkCollision.up = false
        this.player.body.checkCollision.left = false
        this.player.body.checkCollision.right = false

        this.physics.add.collider(this.platforms, this.player)

        this.cameras.main.startFollow(this.player)
        // set the horizontal dead zone to 1.5x game width
        this.cameras.main.setDeadzone(this.scale.width * 1.5)
    }

    update()
    {
        this.platforms.children.iterate(child =>
        {
            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = child

            const scrollY = this.cameras.main.scrollY
            if (platform.y >= scrollY + 700)
            {
                platform.y = scrollY - Phaser.Math.Between(50, 100)
                platform.body.updateFromGameObject()
            }
        })

        const touchingDown = this.player.body.touching.down;

        if (touchingDown)
        {
            this.player.setVelocityY(-600)
        }

        if (this.cursors.left.isDown && !touchingDown)
        {
            this.player.setVelocityX(-200)
        }
        else if (this.cursors.right.isDown && !touchingDown)
        {
            this.player.setVelocityX(200)
        }
        else
        {
            this.player.setVelocityX(0)
        }

        this.horizontalWrap(this.player)
    }

    /**
     * @param {Phaser.GameObjects.Sprite} sprit 
     */
    horizontalWrap(sprit)
    {
        const halfWidth = sprit.displayWidth * 0.5
        const gameWidth = this.scale.width
        if (sprit.x < -halfWidth)
        {
            sprit.x = gameWidth + halfWidth
        }
        else if (sprit.x > gameWidth + halfWidth)
        {
            sprit.x = -halfWidth
        }
    }
}