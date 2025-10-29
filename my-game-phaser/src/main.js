
class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // 🖼️ Fondo e imagen del jugador
    this.load.image('fondo', '../images/texture.jpg');
    this.load.image('playerImg', '../images/black_spaceship.png'); // ← imagen externa del jugador

    // 🎨 Texturas para balas y enemigos
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Bala
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 6, 12);
    g.generateTexture('bulletTex', 6, 12);
    g.clear();

    // Enemigo
    g.fillStyle(0xff3333, 1);
    g.fillRect(0, 0, 32, 32);
    g.generateTexture('enemyTex', 32, 32);
    g.destroy();
  }

  create() {
    // Fondo
    const fondo = this.add.image(400, 300, 'fondo');
    fondo.setDisplaySize(800, 600);
    fondo.setDepth(-1);

    // Física
    this.physics.world.setBounds(0, 0, 800, 600);

    // 👾 Jugador con imagen externa
    this.player = this.physics.add.sprite(400, 520, 'playerImg');
    this.player.setCollideWorldBounds(true);
    this.player.body.setAllowGravity(false);

    // ⚙️ Reescalar si la imagen es mayor al tamaño base (32x48)
    const baseWidth = 64;
    const baseHeight = 96;

    const scaleX = baseWidth / this.player.width;
    const scaleY = baseHeight / this.player.height;
    const scale = Math.min(scaleX, scaleY); // mantiene proporción
    if (scale < 1) {
      this.player.setScale(scale);
    }

    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Grupos
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 30,
      runChildUpdate: false
    });
    this.enemies = this.physics.add.group();

    // Score y vidas
    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;

    this.scoreText = this.add.text(10, 30, 'Score: 0', { font: '18px Arial', fill: '#ffff00' });
    this.livesText = this.add.text(10, 55, 'Vidas: 3', { font: '18px Arial', fill: '#00ff00' });

    // Disparo
    this.fireRate = 200;
    this.nextFire = 0;

    // Spawning enemigos
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: this.spawnEnemy,
      callbackScope: this
    });

    // Colisiones
    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.playerHit, null, this);

    // Texto de ayuda
    this.add.text(10, 10, 'Mover: ← →   Disparar: Espacio', { font: '16px Arial', fill: '#ffffff' });
  }

  update(time, delta) {
    if (this.isGameOver) return;

    // Movimiento jugador
    const speed = 250;
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
    } else {
      this.player.setVelocityX(0);
    }

    // Disparo
    if (this.spaceKey.isDown && time > this.nextFire) {
      this.fireBullet();
      this.nextFire = time + this.fireRate;
    }

    // Reciclaje balas
    this.bullets.children.each(function(b) {
      if (b.active && b.y < -20) b.disableBody(true, true);
    }, this);

    // Zigzag enemigos
    this.enemies.children.each(enemy => {
      if (enemy.active) {
        enemy.x += Math.sin(time * enemy.zigzagSpeed) * enemy.zigzagAmplitude;
        if (enemy.y > 620) enemy.destroy();
      }
    });
  }

  fireBullet() {
    let bullet = this.bullets.get();

    if (!bullet) return;

    bullet.setTexture('bulletTex');
    bullet.body.setAllowGravity(false);

    const x = this.player.x;
    const y = this.player.y - (this.player.displayHeight / 2) - 6;
    bullet.enableBody(true, x, y, true, true);
    bullet.setVelocityY(-500);
  }

  spawnEnemy() {
    if (this.isGameOver) return;

    const x = Phaser.Math.Between(50, 750);
    const enemy = this.enemies.create(x, -30, 'enemyTex');
    enemy.body.setAllowGravity(false);
    enemy.setVelocityY(100 + Phaser.Math.Between(0, 50));

    enemy.zigzagAmplitude = Phaser.Math.Between(1, 3);
    enemy.zigzagSpeed = 0.005 + Math.random() * 0.002;
  }

  hitEnemy(bullet, enemy) {
    bullet.disableBody(true, true);
    enemy.disableBody(true, true);

    this.score += 1;
    this.scoreText.setText('Score: ' + this.score);
  }

  playerHit(player, enemy) {
    enemy.disableBody(true, true);

    this.lives--;
    this.livesText.setText('Vidas: ' + this.lives);

    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5
    });

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  gameOver() {
    this.isGameOver = true;

    this.player.setVelocity(0);
    this.enemies.clear(true, true);
    this.bullets.clear(true, true);

    this.add.text(400, 300, 'GAME OVER', {
      font: '48px Arial',
      fill: '#ff0000'
    }).setOrigin(0.5);

    this.add.text(400, 360, 'Presiona F5 para reiniciar', {
      font: '18px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);
  }
}

// Configuración Phaser
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#222222',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 300 }, debug: false }
  },
  scene: [MainScene]
};

const game = new Phaser.Game(config);

