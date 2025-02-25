/**
 * Game Class
 * Controlador principal del juego
 */
class Game {
  constructor() {
    // Referencias a elementos del DOM
    this.gameArea = document.getElementById("game-area");
    this.gameMenu = document.getElementById("game-menu");
    this.gameOverScreen = document.getElementById("game-over");
    this.startButton = document.getElementById("start-game");
    this.restartButton = document.getElementById("restart-game");
    this.scoreElement = document.getElementById("final-score");

    //Botones de pausa y menu principal
    this.pauseButton = document.getElementById("pause-button");
    this.menuButton = document.getElementById("menu-button");

    // Marcadores
    this.homeScore = document.getElementById("home-score");
    this.awayScore = document.getElementById("away-score");
    this.homeTeam = document.getElementById("home-team");
    this.awayTeam = document.getElementById("away-team");
    this.roundElement = document.getElementById("round");
    this.currentShotElement = document.getElementById("current-shot");
    this.totalShotsElement = document.getElementById("total-shots");

    // Inicializar componentes del juego
    this.goalkeeper = new Goalkeeper();
    this.ball = new Ball(this.gameArea);
    this.collisionManager = new CollisionManager();

    // Configuración del juego
    this.config = {
      shotsPerRound: 4,
      maxRounds: 3,
      timeBetweenShots: 3000, // 3 segundos
      initialDifficulty: 0.5,
      difficultyIncrement: 0.2,
    };

    // Estado del juego
    this.state = {
      isPlaying: false,
      currentRound: 1,
      currentShot: 0,
      totalShots: this.config.shotsPerRound,
      scores: {
        home: 0,
        away: 0,
      },
      saves: 0,
      difficulty: this.config.initialDifficulty,
    };

    // Timers
    this.gameLoop = null;
    this.shootTimer = null;

    // Inicializar eventos
    this.initEvents();

    // Mostrar menú inicial
    this.showMenu();
  }

  /**
   * Inicializa los eventos del juego
   */
  initEvents() {
    // Botón de inicio
    this.startButton.addEventListener("click", () => {
      this.startGame();
    });

    // Botón de reinicio
    this.restartButton.addEventListener("click", () => {
      this.resetGame();
      this.startGame();
    });

    // Tecla ESC para pausar
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (this.state.isPlaying) {
          this.pauseGame();
        } else {
          this.resumeGame();
        }
      }
    });

    this.pauseButton.addEventListener("click", () => {
      if (this.state.isPlaying) {
        this.pauseGame();
      } else {
        this.resumeGame();
      }
    });

    this.menuButton.addEventListener("click", () => {
      this.backToMainMenu();
    });
  }

  /**
   * Inicia el juego
   */
  startGame() {
    // Ocultar menú
    this.gameMenu.classList.add("hidden");
    this.gameOverScreen.classList.add("hidden");

    // Establecer nombres de equipos (equipos reales para mayor inmersión)
    this.homeTeam.textContent = "Bayern";
    this.awayTeam.textContent = "Barcelona";

    // Actualizar UI
    this.updateUI();

    // Iniciar estado de juego
    this.state.isPlaying = true;

    // Iniciar bucle de juego
    this.startGameLoop();

    // Programar primer tiro
    this.scheduleNextShot();
  }

  /**
   * Pausa el juego
   */
  pauseGame() {
    if (!this.state.isPlaying) return;

    this.state.isPlaying = false;

    // Detener timers
    clearInterval(this.gameLoop);
    clearTimeout(this.shootTimer);

    // Mostrar menú de pausa (podríamos añadir uno específico)
    this.gameMenu.classList.remove("hidden");
  }

  /**
   * Reanuda el juego
   */
  resumeGame() {
    if (this.state.isPlaying) return;

    this.state.isPlaying = true;

    // Ocultar menú
    this.gameMenu.classList.add("hidden");

    // Reiniciar bucle
    this.startGameLoop();

    // Programar siguiente tiro si no hay uno activo
    if (!this.ball.isActive) {
      this.scheduleNextShot();
    }
  }

  /**
   * Finaliza el juego
   */
  endGame() {
    this.state.isPlaying = false;

    // Detener timers
    clearInterval(this.gameLoop);
    clearTimeout(this.shootTimer);

    // Mostrar pantalla de fin de juego
    this.scoreElement.textContent = `Final Score: ${this.state.scores.home} - ${this.state.scores.away}`;
    this.gameOverScreen.classList.remove("hidden");
  }

  /**
   * Reinicia el juego a su estado inicial
   */
  resetGame() {
    // Reiniciar estado
    this.state = {
      isPlaying: false,
      currentRound: 1,
      currentShot: 0,
      totalShots: this.config.shotsPerRound,
      scores: {
        home: 0,
        away: 0,
      },
      saves: 0,
      difficulty: this.config.initialDifficulty,
    };

    // Reiniciar balón
    this.ball.reset();

    // Actualizar UI
    this.updateUI();
  }

  /**
   * Inicia el bucle principal del juego
   */
  startGameLoop() {
    // Detener bucle anterior si existe
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }

    // Crear nuevo bucle
    this.gameLoop = setInterval(() => {
      // Actualizar balón
      const ballActive = this.ball.update();

      // Comprobar colisiones si el balón está activo
      if (ballActive) {
        this.collisionManager.checkCollisions(this.ball, this.goalkeeper);
      } else if (
        this.ball.isActive === false &&
        !this.ball.isStopped() &&
        !this.ball.isScored()
      ) {
        // El balón salió sin ser atajado ni entrar en la portería
        this.processShotResult(false, false);
      }

      // Verificar si el balón fue atajado o fue gol
      if (this.ball.isStopped()) {
        // Atajada
        this.processShotResult(true, false);
      } else if (this.ball.isScored()) {
        // Gol
        this.processShotResult(false, true);
      }
    }, 16); // ~60 FPS
  }

  /**
   * Programa el siguiente tiro
   */
  scheduleNextShot() {
    // Detener timer anterior si existe
    if (this.shootTimer) {
      clearTimeout(this.shootTimer);
    }

    // Verificar si hemos alcanzado el límite de tiros para la ronda
    if (this.state.currentShot >= this.state.totalShots) {
      this.advanceRound();
      return;
    }

    // Incrementar contador de tiros
    this.state.currentShot++;

    // Actualizar UI
    this.updateUI();

    // Programar siguiente tiro
    this.shootTimer = setTimeout(() => {
      this.shoot();
    }, this.config.timeBetweenShots);
  }

  /**
   * Avanza a la siguiente ronda
   */
  advanceRound() {
    // Verificar si hemos alcanzado el límite de rondas
    if (this.state.currentRound >= this.config.maxRounds) {
      this.endGame();
      return;
    }

    // Incrementar ronda y dificultad
    this.state.currentRound++;
    this.state.currentShot = 0;
    this.state.difficulty += this.config.difficultyIncrement;

    // Ralentizar más los guantes según aumenta la dificultad
    // 0.15 en ronda 1, 0.1 en ronda 2, 0.05 en ronda 3
    this.goalkeeper.movementSpeed = 0.2 - this.state.difficulty * 0.1;

    // Actualizar UI
    this.updateUI();

    // Programar primer tiro de la nueva ronda
    this.scheduleNextShot();
  }

  /**
   * Ejecuta un tiro
   */
  shoot() {
    // Reiniciar balón
    this.ball.reset();

    // Calcular parámetros del tiro según dificultad
    const speed = 20 + this.state.difficulty * 10; // Velocidad base entre 20 y 30

    // Tipo de tiro (para añadir variedad)
    const shotTypes = [
      // Tiro recto (poca curva)
      {
        curveIntensity: 0.1,
        wobbleIntensity: 0.1,
        speedVariation: 1,
      },
      // Tiro con efecto (mucha curva, menos predecible)
      {
        curveIntensity: 0.8,
        wobbleIntensity: 0.3,
        speedVariation: 1.1,
      },
      // Tiro bombeado (más lento con mucho bamboleo)
      {
        curveIntensity: 0.3,
        wobbleIntensity: 0.6,
        speedVariation: 0.9,
      },
      // Tiro potente (rápido con algo de efecto)
      {
        curveIntensity: 0.4,
        wobbleIntensity: 0.2,
        speedVariation: 1.3,
      },
    ];

    // Elegir tipo de tiro aleatorio (con preferencia por tiros más difíciles según nivel)
    const typeIndex = Math.min(
      Math.floor(Math.random() * shotTypes.length + this.state.difficulty),
      shotTypes.length - 1
    );
    const shotType = shotTypes[typeIndex];

    // Dimensiones del área de juego
    const gameWidth = this.gameArea.clientWidth;
    const gameHeight = this.gameArea.clientHeight;

    // Calcular posición inicial del balón (lejos)
    const randomOffsetX = (Math.random() - 0.5) * 300; // Desviación horizontal
    const randomOffsetY = (Math.random() - 0.5) * 200; // Desviación vertical

    const startX = gameWidth / 2 + randomOffsetX;
    const startY = gameHeight / 2 + randomOffsetY;
    const startZ = -2000; // Lejos (hacia fuera de la pantalla)

    // Calcular punto destino (ligeramente aleatorio dentro del marco del arco)
    // Para la nueva perspectiva, el destino es más cerca de la cámara
    const targetX = gameWidth / 2 + (Math.random() - 0.5) * 300;
    const targetY = gameHeight / 2 + (Math.random() - 0.5) * 200;
    const targetZ = 200; // Punto detrás de la cámara

    // Vector dirección
    const dirX = targetX - startX;
    const dirY = targetY - startY;
    const dirZ = targetZ - startZ;

    // Calcular efectos según tipo de tiro
    const curveX = (Math.random() - 0.5) * shotType.curveIntensity;
    const curveY = (Math.random() - 0.5) * shotType.curveIntensity;
    const wobbleX = Math.random() * shotType.wobbleIntensity;
    const wobbleY = Math.random() * shotType.wobbleIntensity;
    const finalSpeed = speed * shotType.speedVariation;

    // Ejecutar tiro
    this.ball.shoot({
      speed: finalSpeed,
      direction: {
        x: dirX,
        y: dirY,
        z: dirZ,
      },
      curve: {
        x: curveX,
        y: curveY,
      },
      wobble: {
        x: wobbleX,
        y: wobbleY,
      },
      startPosition: {
        x: startX,
        y: startY,
        z: startZ,
      },
    });
  }

  /**
   * Procesa el resultado de un tiro
   * @param {boolean} saved - true si fue atajado
   * @param {boolean} goal - true si fue gol
   */
  processShotResult(saved, goal) {
    // Evitar procesar múltiples veces
    if (
      !this.ball.isActive &&
      (this.ball.isStopped() || this.ball.isScored())
    ) {
      // Actualizar contadores
      if (saved) {
        this.state.saves++;
        this.state.scores.home++;
        this.homeScore.textContent = this.state.scores.home;
      } else if (goal) {
        this.state.scores.away++;
        this.awayScore.textContent = this.state.scores.away;
      }

      // Reiniciar balón
      this.ball.reset();

      // Programar siguiente tiro
      this.scheduleNextShot();
    }
  }

  /**
   * Actualiza la interfaz de usuario
   */
  updateUI() {
    // Actualizar marcador
    this.homeScore.textContent = this.state.scores.home;
    this.awayScore.textContent = this.state.scores.away;

    // Actualizar información de ronda
    this.roundElement.textContent = `Round ${this.state.currentRound}`;
    this.currentShotElement.textContent = this.state.currentShot;
    this.totalShotsElement.textContent = this.state.totalShots;

    // Añadir clases para destacar el equipo con ventaja
    if (this.state.scores.home > this.state.scores.away) {
      this.homeScore.classList.add("winning");
      this.awayScore.classList.remove("winning");
    } else if (this.state.scores.away > this.state.scores.home) {
      this.awayScore.classList.add("winning");
      this.homeScore.classList.remove("winning");
    } else {
      this.homeScore.classList.remove("winning");
      this.awayScore.classList.remove("winning");
    }
  }

  /**
   * Muestra el menú principal
   */
  showMenu() {
    this.gameMenu.classList.remove("hidden");
    this.gameOverScreen.classList.add("hidden");
  }

  backToMainMenu() {
    // Detener timers
    clearInterval(this.gameLoop);
    clearTimeout(this.shootTimer);

    // Reiniciar estado
    this.resetGame();

    // Mostrar menú principal
    this.showMenu();
  }
}
// Iniciar el juego cuando el DOM esté completamente cargado
// document.addEventListener('DOMContentLoaded', () => {
//     const game = new Game();
// });
