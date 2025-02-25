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
      shotsPerRound: 9,
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
  }

  /**
   * Inicia el juego
   */
  startGame() {
    // Ocultar menú
    this.gameMenu.classList.add("hidden");
    this.gameOverScreen.classList.add("hidden");

    // Establecer nombres de equipos
    this.homeTeam.textContent = "Home";
    this.awayTeam.textContent = "Away";

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
    const speed = 20 + this.state.difficulty * 10; // Velocidad entre 20 y 30 (aumentada)

    // Dirección aleatoria dentro de la portería
    const gameWidth = this.gameArea.clientWidth;
    const gameHeight = this.gameArea.clientHeight;
    const goalPost = document.getElementById("goal-area");
    const goalRect = goalPost.getBoundingClientRect();
    const gameRect = this.gameArea.getBoundingClientRect();

    // Convertir coordenadas absolutas a relativas al juego
    const goalLeft = goalRect.left - gameRect.left;
    const goalRight = goalRect.right - gameRect.left;
    const goalTop = goalRect.top - gameRect.top;
    const goalBottom = goalRect.bottom - gameRect.top;

    // Punto aleatorio dentro de la portería (preferencia por el centro)
    const targetX = goalLeft + Math.random() * (goalRight - goalLeft);
    const targetY =
      goalTop + (0.3 + Math.random() * 0.4) * (goalBottom - goalTop); // Más hacia el centro

    // Punto de inicio (desde abajo de la pantalla, como en la imagen)
    const startX = gameWidth / 2 + (Math.random() - 0.5) * 100; // Menos variación horizontal
    const startY = gameHeight * 0.8; // Desde la parte inferior (como un tiro libre)

    // Calcular dirección hacia el punto objetivo
    const dirX = targetX - startX;
    const dirY = targetY - startY - 100; // Ajuste para compensar la gravedad
    const dirZ = -this.ball.initialZ; // Distancia desde inicio a portería

    // Ejecutar tiro
    this.ball.shoot({
      speed: speed,
      direction: {
        x: dirX,
        y: dirY,
        z: dirZ,
      },
      startPosition: {
        x: startX,
        y: startY,
        z: this.ball.initialZ,
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
  }

  /**
   * Muestra el menú principal
   */
  showMenu() {
    this.gameMenu.classList.remove("hidden");
    this.gameOverScreen.classList.add("hidden");
  }
}

// Iniciar el juego cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
  const game = new Game();
});
