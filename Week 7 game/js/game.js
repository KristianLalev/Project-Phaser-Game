// Initialize a game instance
let game;

// Define game options
const gameOptions = {
    dudeGravity: 800,
    dudeSpeed: 300
};

// Create the game when the window loads
window.onload = function () {
    const gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: "#112211",
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 800,
            height: 1000,
        },
        physics: {
            default: "arcade",
            arcade: {
                gravity: {
                    y: 0
                }
            }
        },
        scene: PlayGame
    };

    game = new Phaser.Game(gameConfig);
    window.focus();
};

// Game class
class PlayGame extends Phaser.Scene {
    // Constructor for game information (back-end information)
    constructor() 
    {
        super("PlayGame");
        this.playerData = {}; // Initialize an object to store player data
        this.score = 0;
        this.nameInputRequested = false;
        this.playerName = "";
        this.defaultBackgroundColor = "#112211"; // Default background color
        this.backgroundColor = this.defaultBackgroundColor; // Initialize with the default color
        this.isMouseControl = false; // Controlling the game with mouse
    }

    // Method to preload game elements
    preload() 
    {
        this.load.image("ground", "assets/platform.png");
        this.load.image("star", "assets/star.png");
        this.load.image("redcoin", "assets/red-coin.png");
        this.load.spritesheet("dude", "assets/dude.png", { frameWidth: 32, frameHeight: 48 });
        this.load.image("obstacle", "assets/obstacle.png");
        this.load.audio('gameplaySound', 'assets/gameplaySound.wav');
        this.load.audio('movementSound', 'assets/movement.wav');
        this.load.audio('jumpSound', 'assets/jump.wav');
    }

    create() 
    {
        // The "create()" method starts with getting your name
        if (!this.nameInputRequested) 
        {
            this.nameInputRequested = true;
            this.playerName = prompt("Enter your name:");

            // Check if the player provided a name
            if (!this.playerName) {
                this.add.text(100, 100, 'Please enter your name to play!', {
                    fontSize: '32px',
                    fill: '#ff0000'
                }).setDepth(2);
                return;
            }
        }

        // Set the background color to the default one
        this.cameras.main.setBackgroundColor(this.defaultBackgroundColor);
        this.groundGroup = this.physics.add.group({ immovable: true, allowGravity: false });
        this.obstaclesGroup = this.physics.add.group({ immovable: true, allowGravity: false });

        // Ground generation and character physics (platforms/air time/collecting collectibles)
        for (let i = 0; i < 20; i++) {
            this.groundGroup.create(Phaser.Math.Between(0, game.config.width), Phaser.Math.Between(0, game.config.height), "ground");
        }

        this.dude = this.physics.add.sprite(game.config.width / 2, game.config.height / 2, "dude");
        this.dude.body.gravity.y = gameOptions.dudeGravity;
        this.physics.add.collider(this.dude, this.groundGroup);

        this.starsGroup = this.physics.add.group({});
        this.physics.add.collider(this.starsGroup, this.groundGroup);
        this.physics.add.collider(this.obstaclesGroup, this.groundGroup);

        this.physics.add.overlap(this.dude, this.starsGroup, this.collectCollectibles, null, this);
        this.physics.add.overlap(this.dude, this.obstaclesGroup, this.gameOver, null, this);

        // Initialize player data with the current player name
        if (!this.playerData[this.playerName]) 
        {
            this.playerData[this.playerName] = {
                name: this.playerName,
                highestScore: 0
            };
        }

        this.score = 0;
        this.scoreText = this.add.text(16, 16, "Score: 0", { fontSize: "30px", fill: "#ffffff" }).setDepth(1);

        this.cursors = this.input.keyboard.createCursorKeys();

        // Character movement
        this.anims.create({
            key: "left",
            frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: "turn",
            frames: [{ key: "dude", frame: 4 }],
            frameRate: 10,
        });

        this.anims.create({
            key: "right",
            frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 9 }),
            frameRate: 10,
            repeat: -1
        });

        this.triggerTimer = this.time.addEvent({
            callback: this.addGround,
            callbackScope: this,
            delay: 500,
            loop: true
        });

        // Create the mobile environment buttons

        const leftButton = this.add.rectangle(100, game.config.height - 90, 100, 100, 0x000000);
        leftButton.setInteractive();
        const leftText = this.add.text(70, game.config.height - 100, 'LEFT', {
            fontSize: '24px',
            fill: '#ffffff'
        });

        const rightButton = this.add.rectangle(400, game.config.height - 90, 100, 100, 0x000000);
        rightButton.setInteractive();
        const rightText = this.add.text(385, game.config.height - 100, 'UP', {
            fontSize: '24px',
            fill: '#ffffff'
        });

        const upButton = this.add.rectangle(game.config.width - 100, game.config.height - 100, 100, 100, 0x000000);
        upButton.setInteractive();
        const upText = this.add.text(game.config.width - 130, game.config.height - 110, 'RIGHT', {
            fontSize: '24px',
            fill: '#ffffff'
        });

        // Set up mobile buttons interaction

        leftButton.on('pointerdown', () => {
            this.dude.body.velocity.x = -gameOptions.dudeSpeed;
        });

        leftButton.on('pointerup', () => {
            this.dude.body.velocity.x = 0;
        });

        rightButton.on('pointerdown', () => {
            this.dude.body.velocity.x = gameOptions.dudeSpeed;
        });

        rightButton.on('pointerup', () => {
            this.dude.body.velocity.x = 0;
        });

        upButton.on('pointerdown', () => {
            if (this.dude.body.touching.down) {
                this.jump();
            }
        });

        // Set up movmenet sound and velocity

        this.input.on('pointermove', (pointer) => {
            if (pointer.x < this.sys.game.config.width / 3) {
                this.dude.body.velocity.x = -gameOptions.dudeSpeed * 2;
                this.sound.play('movementSound');
            } else if (pointer.x > (2 * this.sys.game.config.width) / 3) {
                this.dude.body.velocity.x = gameOptions.dudeSpeed * 2;
                this.sound.play('movementSound');
            } else {
                this.dude.body.velocity.x = 0;
            }
        });

        this.input.on('pointerup', () => {
            this.dude.body.velocity.x = 0;
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                if (pointer.x < this.sys.game.config.width / 3 || pointer.x > (2 * this.sys.game.config.width) / 3) {
                    this.dude.body.velocity.y = 0;
                } else {
                    if (this.dude.body.touching.down) {
                        this.jump();
                    }
                }
            }
        });

        this.gameplaySound = this.sound.add('gameplaySound', {
            loop: true,
            volume: 0.5,
        });
        this.gameplaySound.play();
    }

    // Character jump modification
    jump() 
    {
        this.dude.body.velocity.y = -gameOptions.dudeGravity / 1.6;
        this.sound.play('jumpSound');
    }

    // Platforms modification (manage collectibles and platform movements left + right)
    addGround() 
    {
        this.groundGroup.create(Phaser.Math.Between(0, game.config.width), 0, "ground");
        this.groundGroup.setVelocityY(gameOptions.dudeSpeed / 6);

        if (Phaser.Math.Between(0, 1)) 
        {
            this.starsGroup.create(Phaser.Math.Between(0, game.config.width), 0, "star");
            this.starsGroup.create(Phaser.Math.Between(0, game.config.width), 0, "redcoin");

            const obstacle = this.obstaclesGroup.create(Phaser.Math.Between(0, game.config.width), 0, "obstacle");
            this.starsGroup.setVelocityY(gameOptions.dudeSpeed);
            this.obstaclesGroup.setVelocityY(gameOptions.dudeSpeed);
            const initialDirection = Phaser.Math.Between(0, 1) === 0 ? -50 : 50;
            obstacle.setVelocityX(initialDirection);

            const platformDirection = Phaser.Math.Between(0, 1) === 0 ? -50 : 50;
            this.groundGroup.getChildren().forEach(platform => {
                platform.setVelocityX(platformDirection);
            });
        }
    }

    // Collect collectibles for points
    collectCollectibles(dude, star) 
    {
        star.disableBody(true, true);
        if (star.texture.key === 'star') 
        {
            this.score += 1;
        } 
        else if (star.texture.key === 'redcoin') 
        {
            this.score += 2;
        }
        this.scoreText.setText(`Score: ${this.score}`);

        if (this.score >= 50) 
        {
            this.showCongratulations();
        }
    }

    // Method to show the winning screen
    showCongratulations() 
    {
        // Stopping the movement
        if (this.gameplaySound) 
        {
            this.game.sound.stopAll();
        }
        this.dude.setVelocity(0, 0);
        const background = this.add.graphics();
        background.fillStyle(0x000000);
        background.fillRect(0, 0, game.config.width, game.config.height).setDepth(1);

        const highScore = this.playerData[this.playerName].highestScore;

        // Information such as score, high-score, and play again
        this.add.text(100, 100, 'Congratulations!', {
            fontSize: '64px',
            fill: '#00ff00'
        }).setDepth(2);

        this.add.text(100, 200, `Score of "${this.playerName}": ${this.score}`, {
            fontSize: '32px',
            fill: '#ffffff'
        }).setDepth(2);

        this.add.text(100, 250, `Highest Score of "${this.playerName}": ${this.playerData[this.playerName].highestScore}`, {
            fontSize: '32px',
            fill: '#ffffff'
        }).setDepth(2);

        const playAgainButton = this.add.text(100, 300, 'Play Again', {
            fontSize: '32px',
            fill: '#00ff00'
        }).setDepth(2);
        playAgainButton.setInteractive();

        playAgainButton.on('pointerdown', () => {
            this.scene.restart();
        });
    }

    // Method for game over, when you are dead in the game it is shown
    gameOver() 
    {
        if (this.gameplaySound) 
        {
            this.game.sound.stopAll();
        }

        this.dude.setVelocity(0, 0);

        // Ask for the name if it hasn't been requested yet

        if (!this.nameInputRequested) 
        {
            this.nameInputRequested = true;
            this.playerName = prompt("Enter your name:");
            if (!this.playerName) 
            {
                this.add.text(100, 100, 'Please enter your name to play!', {
                    fontSize: '32px',
                    fill: '#ff0000'
                }).setDepth(2);
                return;
            }
        }

        if (this.playerName) 
        {
            // Compare the current score with the highest score in the game
            if (this.score > this.playerData[this.playerName].highestScore) 
            {
                this.playerData[this.playerName].highestScore = this.score;
            }

            const background = this.add.graphics();
            background.fillStyle(0x000000);
            background.fillRect(0, 0, game.config.width, game.config.height).setDepth(1);

            // Information such as score, high-score, and play again when you die in the game
            this.add.text(100, 100, 'Game Over', {
                fontSize: '64px',
                fill: '#ff0000'
            }).setDepth(2);

            this.add.text(100, 200, `Score of "${this.playerName}": ${this.score}`, {
                fontSize: '32px',
                fill: '#ffffff'
            }).setDepth(2);

            this.add.text(100, 250, `Highest Score of "${this.playerName}": ${this.playerData[this.playerName].highestScore}`, {
                fontSize: '32px',
                fill: '#ffffff'
            }).setDepth(2);

            const playAgainButton = this.add.text(100, 300, 'Play Again', {
                fontSize: '32px',
                fill: '#00ff00'
            }).setDepth(2);
            playAgainButton.setInteractive();

            playAgainButton.on('pointerdown', () => {
                this.scene.restart();
            });
        }
    }

    // Method for showing the changes in the game (scores/collectibles/movements)
    update() 
    {
        // Check if the player is still alive
        if (this.dude.active) 
        {
            // Changing the colors (in that case it is the map requirement)
            if (this.score >= 15 && this.score <= 29) 
            {
                this.backgroundColor = "#324ca8";
            } 
            else if (this.score <= 50 && this.score >= 30) 
            {
                this.backgroundColor = "#eb03fc";
            } 
            else if (this.nameInputRequested) 
            {
                this.backgroundColor = this.defaultBackgroundColor;
            }
            this.cameras.main.setBackgroundColor(this.backgroundColor);
    
            this.starsGroup.getChildren().forEach(collectible => {
                if (!collectible.body.touching.down) {
                    collectible.setGravityY(gameOptions.dudeGravity);
                }
            });
    
            // Set up velocity with the obstacles

            this.obstaclesGroup.getChildren().forEach(obstacle => {
                if (obstacle.y + obstacle.displayHeight / 2 >= game.config.height) 
                {
                    if (obstacle.body.velocity.x > 0 && obstacle.x >= game.config.width) 
                    {
                        obstacle.setVelocityX(-50);
                    } 
                    else if (obstacle.body.velocity.x < 0 && obstacle.x <= 0)
                    {
                        obstacle.setVelocityX(50);
                    }
                }
            });
    
            // Menus for scores shown + movements arrows  

            if (this.dude.x < 0 || this.dude.x > game.config.width || this.dude.y < 0 || this.dude.y > game.config.height) 
            {
                if (this.score < 50) 
                {
                    this.gameOver();
                } 
                else 
                {
                    this.showCongratulations();
                    return;
                }
            }
    
            if (this.cursors.left.isDown) 
            {
                this.dude.body.velocity.x = -gameOptions.dudeSpeed;
                this.dude.anims.play("left", true);
                if (this.playerName) 
                {
                    this.sound.play('movementSound');
                }
            } 
            else if (this.cursors.right.isDown) 
            {
                this.dude.body.velocity.x = gameOptions.dudeSpeed;
                this.dude.anims.play("right", true);
                if (this.playerName) 
                {
                    this.sound.play('movementSound');
                }
            } 
            else 
            {
                this.dude.body.velocity.x = 0;
                this.dude.anims.play("turn", true);
            }
    
            if (this.cursors.up.isDown && this.dude.body.touching.down) 
            {
                this.dude.body.velocity.y = -gameOptions.dudeGravity / 1.6;
                if (this.playerName) 
                {
                    this.sound.play('jumpSound');
                }
            }
        }

        // When the player is dead

        else 
        {
            this.starsGroup.getChildren().forEach(collectible => {
                collectible.setGravityY(0);
            });
        }
    }
}