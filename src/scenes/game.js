import Phaser from '../lib/phaser.js';
import Carrot from '../game/carrot.js'

export default class Game extends Phaser.Scene
{
    carrotCollected = 0

    /** @type {Phaser.Physics.Arcade.Sprite} */
    player


    /** @type {Phaser.Physics.Arcade.StaticGroup} */
    platforms


    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursors

    /** @type {Phaser.GameObjects.Group} */
    clouds

    /** @type {Phaser.Physics.Arcade.Group} */
    carrots

    /** @type {Phaser.GameObjects.Text} */
    carrotsCollectedText

    /** @type {Phaser.Sound.NoAudioSound} */
    gameMusic

    constructor()
    {
        super({ key: 'game' });
    }

    init()
    {
        this.carrotCollected = 0;
    }

    preload()
    {
        this.load.setBaseURL('assets/')
        this.load.image('background', 'Background/bg_layer1.png')

        this.load.image('cloud', 'Enemies/cloud.png')
        // load the platform image
        this.load.image('platform', 'Environment/ground_grass.png')
        // add this new line
        this.load.image('bunny-stand', 'Players/bunny1_stand.png')
        this.load.image('bunny-jump', 'Players/bunny1_jump.png')

        this.load.image('carrot', 'Items/carrot.png')

        this.load.audio('jump', 'Audio/phaseJump2.ogg')
        this.load.audio('collect', "Audio/powerUp5.ogg")
        this.load.audio('background-music', 'Audio/back-home.wav')

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    create()
    {
        var image = this.add.image(240, 320, 'background').setScrollFactor(1, 0)

        this.clouds = this.add.group();
        for (let index = 0; index < 3; index++)
        {
            const x = Phaser.Math.Between(0, 480)
            const y = 250 * index;
            this.clouds.add(this.add.image(x, y, 'cloud'))
        }
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

        this.carrots = this.physics.add.group({
            classType: Carrot
        })

        this.physics.add.collider(this.platforms, this.carrots)

        this.physics.add.overlap(this.player, this.carrots, this.handleCollectCarrot, undefined, this)

        const style = { color: '#000', fontSize: 24, fontStyle: 'bold', backgroundColor: '#f5a040', }
        this.carrotsCollectedText = this.add.text(240, 10, 'Carrot: 0', style).setScrollFactor(0).setOrigin(0.5, 0).setDepth(1)

        this.gameMusic = this.sound.add('background-music', { loop: true })
        this.gameMusic.play()
    }

    update()
    {
        this.platforms.children.iterate(child =>
        {
            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = child

            const scrollY = this.cameras.main.scrollY
            if (platform.y >= scrollY + 640)
            {
                platform.y = scrollY - Phaser.Math.Between(80, 120)
                platform.x = Phaser.Math.Between(40, 440)
                platform.body.updateFromGameObject()

                // create a carrot above the platform beign reused
                this.addCarrotAbove(platform)
            }
        })

        this.clouds.children.iterate(child =>
        {
            /** @type {Phaser.GameObjects.Image} */
            const cloud = child

            const scrollY = this.cameras.main.scrollY
            if (cloud.y >= scrollY + 800)
            {
                cloud.y = scrollY - Phaser.Math.Between(20, 60)
            }
        })

        const touchingDown = this.player.body.touching.down;

        if (touchingDown)
        {
            this.player.setVelocityY(-600)

            this.player.setTexture('bunny-jump')

            this.sound.play('jump')
        }

        const vy = this.player.body.velocity.y
        if (vy > 0 && this.player.texture.key !== 'bunny-stand')
        {
            // switch back to jump when falling
            this.player.setTexture('bunny-stand')
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

        const bottomPlatform = this.findBottomMostPlatform()
        if (this.player.y > bottomPlatform.y + 200)
        {
            // Register the final score
            this.registry.set('final-score', this.carrotsCollectedText.text)
            this.gameMusic.stop()

            this.scene.start('game-over')
        }
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

    /**
     * @param {Phaser.GameObjects.Sprite} sprite 
     */
    addCarrotAbove(sprite)
    {
        const y = sprite.y - sprite.displayHeight;

        /** @type {Phaser.Physics.Arcade.Sprite} */
        const carrot = this.carrots.get(sprite.x, y, 'carrot')

        carrot.setActive(true)
        carrot.setVisible(true)

        this.add.existing(carrot)

        // update the physics body size
        carrot.body.setSize(carrot.width, carrot.height)

        this.physics.world.enable(carrot)

        return carrot
    }

    /**
     * @param {Phaser.Physics.Arcade.Sprite} player 
     * @param {Carrot} carrot 
     */
    handleCollectCarrot(player, carrot)
    {
        //hide from display
        this.carrots.killAndHide(carrot)

        //disable from physics world
        this.physics.world.disableBody(carrot.body)

        this.carrotCollected++

        this.sound.play('collect')

        this.carrotsCollectedText.text = `Carrots: ${ this.carrotCollected }`
    }

    findBottomMostPlatform()
    {
        const platforms = this.platforms.getChildren()
        let bottomPlatform = platforms[0]

        for (let i = 1; i < platforms.length; i++)
        {
            const platform = platforms[i]

            if (platform.y < bottomPlatform.y)
            {
                continue;
            }

            bottomPlatform = platform;
        }

        return bottomPlatform;
    }
}
