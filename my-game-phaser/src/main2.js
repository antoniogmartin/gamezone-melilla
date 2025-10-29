// Configuración del juego
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },  // Sin gravedad para control total del movimiento
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var bullets;
var cursors;
var enemies;
var enemyTimer;  // Temporizador para los enemigos
var enemyDirection = 1;  // Dirección del zigzag (1 para derecha, -1 para izquierda)
var enemySpeed = 50;  // Velocidad de los enemigos en el zigzag
var score = 0;  // Puntuación inicial
var lives = 3;  // Vidas iniciales
var gameOver = false;  // Flag para verificar si el juego ha terminado

var scoreText;  // Para mostrar la puntuación en pantalla
var livesText;  // Para mostrar las vidas en pantalla
var gameOverText;  // Para mostrar el mensaje de Game Over

var game = new Phaser.Game(config);

function preload() {
    // Cargar imágenes necesarias
    this.load.image('player', '../images/black_spaceship.png'); // ← imagen externa del jugador
    this.load.image('bullet', 'assets/bullet.png');  // Asegúrate de tener una imagen para la bala
    this.load.image('enemy', 'assets/enemy.png');    // Asegúrate de tener una imagen para el enemigo
}

function create() {
    // Crear jugador con la imagen cargada
    player = this.physics.add.image(400, 500, 'player');
    player.setCollideWorldBounds(true);  // Evitar que se salga de la pantalla

    // Reescalar la imagen del jugador si es más grande que el tamaño deseado
    const playerScale = 0.1;  // Cambia este valor para ajustar el tamaño de la figura del jugador
    player.setScale(playerScale);

    // Crear grupo de balas
    bullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: 10  // Número máximo de balas en pantalla
    });

    // Crear grupo de enemigos
    enemies = this.physics.add.group({
        defaultKey: 'enemy',
        maxSize: 10  // Número máximo de enemigos
    });

    // Crear texto de puntuación
    scoreText = this.add.text(16, 16, 'Puntaje: 0', {
        fontSize: '32px',
        fill: '#FFF'
    });

    // Crear texto de vidas
    livesText = this.add.text(16, 50, 'Vidas: 3', {
        fontSize: '32px',
        fill: '#FFF'
    });

    // Crear texto de Game Over
    gameOverText = this.add.text(300, 250, '', {
        fontSize: '64px',
        fill: '#FF0000',
        fontStyle: 'bold'
    });

    // Configurar las teclas
    cursors = this.input.keyboard.createCursorKeys();

    // Tecla de disparo (barra espaciadora)
    this.input.keyboard.on('keydown-SPACE', shootBullet, this);

    // Temporizador para enemigos
    enemyTimer = this.time.addEvent({
        delay: 2000,  // Cada 2 segundos
        callback: spawnEnemy,
        callbackScope: this,
        loop: true
    });

    // Detectar colisión entre balas y enemigos
    this.physics.add.collider(bullets, enemies, hitEnemy, null, this);

    // Detectar colisión entre el jugador y los enemigos
    this.physics.add.collider(player, enemies, hitPlayer, null, this);
}

function update() {
    if (gameOver) return;  // Si el juego terminó, no actualizamos nada

    // Movimiento del jugador
    if (cursors.left.isDown) {
        player.setVelocityX(-160);  // Movimiento hacia la izquierda
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);  // Movimiento hacia la derecha
    } else {
        player.setVelocityX(0);  // No movimiento
    }

    // Movimiento de enemigos en zigzag
    enemies.getChildren().forEach(function(enemy) {
        // Movimiento de zigzag en el eje X
        enemy.x += enemyDirection * enemySpeed;
        
        // Si el enemigo llega a los límites de la pantalla, cambiamos la dirección
        if (enemy.x <= 0 || enemy.x >= 800) {
            enemyDirection *= -1;  // Cambiar dirección
        }

        // Mover hacia abajo (descenso)
        enemy.y += 2;  // Ajusta la velocidad de caída según lo desees

        // Destruir enemigos fuera de la pantalla
        if (enemy.y > 600) {
            enemy.setActive(false);
            enemy.setVisible(false);
        }
    });
}

function shootBullet() {
    if (gameOver) return;  // Si el juego terminó, no podemos disparar

    // Encontrar una bala inactiva en el grupo
    var bullet = bullets.get();

    if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setPosition(player.x, player.y - 20);  // Ajustar la posición inicial de la bala

        // Hacer que la bala se mueva hacia arriba
        bullet.setVelocityY(-300);  // Velocidad de la bala hacia arriba
    }
}

function spawnEnemy() {
    if (gameOver) return;  // Si el juego terminó, no aparecen más enemigos

    // Crear un enemigo en una posición aleatoria en la parte superior
    var enemy = enemies.get();

    if (enemy) {
        enemy.setActive(true);
        enemy.setVisible(true);
        enemy.setPosition(Phaser.Math.Between(100, 700), -50);  // Aparecen aleatoriamente en el borde superior

        // Añadir física al enemigo
        this.physics.world.enable(enemy);
    }
}

// Función para manejar la colisión entre balas y enemigos
function hitEnemy(bullet, enemy) {
    // Desactivar la bala y el enemigo
    bullet.setActive(false);
    bullet.setVisible(false);

    enemy.setActive(false);
    enemy.setVisible(false);

    // Aumentar la puntuación
    score += 1;
    scoreText.setText('Puntaje: ' + score);  // Actualizar el texto de la puntuación
}

// Función para manejar la colisión entre el jugador y los enemigos
function hitPlayer(player, enemy) {
    // Reducir las vidas del jugador
    lives -= 1;
    livesText.setText('Vidas: ' + lives);  // Actualizar el texto de las vidas

    // Desactivar el enemigo que colisionó
    enemy.setActive(false);
    enemy.setVisible(false);

    // Si las vidas llegan a 0, termina el juego
    if (lives <= 0) {
        gameOver = true;
        gameOverText.setText('GAME OVER');  // Mostrar el mensaje de Game Over
        player.setAlpha(0);  // Hacer que el jugador desaparezca
    }
}
