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
      shotsPerRound: 3,
      maxRounds: 3,
      timeBetweenShots: 3000, // 3 segundos
      initialDifficulty: 0.7,
      difficultyIncrement: 0.5,
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

    this.sounds = {
      goalShout: new Audio("assets/sounds/goal-shout.mp3"),
      kick: new Audio("assets/sounds/kick.mp3"),
      whistle: new Audio("assets/sounds/referee-whistle.mp3"),
      ambient: new Audio("assets/sounds/stadium-ambient.mp3"),
      saved: new Audio("assets/sounds/saved.mp3"),
      onichan: new Audio("assets/sounds/onichan.mp3"),
    };

    // Configurar sonido ambiente para que se repita
    this.sounds.ambient.loop = true;
    this.sounds.ambient.volume = 0.4; // Volumen más bajo para el sonido de fondo

    setInterval(() => this.checkGameState(), 5000);

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
   * Reproduce un sonido
   * @param {string} soundName - Nombre del sonido a reproducir
   */
  playSound(soundName) {
    if (this.sounds[soundName]) {
      // Reiniciar el sonido si ya estaba reproduciéndose
      this.sounds[soundName].currentTime = 0;
      this.sounds[soundName].play().catch((e) => {
        console.log(`Error al reproducir sonido ${soundName}:`, e);
      });
    }
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

    // Iniciar sonido ambiental
    this.playSound("ambient");

    // Reproducir silbato de inicio
    this.playSound("whistle");

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

    this.sounds.ambient.pause();

    // Detener timers
    clearInterval(this.gameLoop);
    clearTimeout(this.shootTimer);

    // Detener actualización del portero (si lo has añadido)
    // if (this.goalkeeper.stopUpdateLoop) {
    //   this.goalkeeper.stopUpdateLoop();
    // }

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

    this.sounds.ambient
      .play()
      .catch((e) => console.log("Error al reanudar audio:", e));

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
    this.sounds.ambient.pause();
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
    console.log("Iniciando bucle de juego");

    // Detener bucle anterior si existe
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }

    // Crear nuevo bucle
    this.gameLoop = setInterval(() => {
      // Verificar estado del balón
      console.log(`Estado del balón: activo=${this.ball.isActive}`);

      if (this.ball.isActive) {
        // Actualizar balón
        const stillActive = this.ball.update();

        // Comprobar colisiones si el balón está activo
        if (stillActive) {
          this.collisionManager.checkCollisions(this.ball, this.goalkeeper);
        } else {
          // El balón ya no está activo, verificar resultado
          console.log("Balón ya no activo, verificando resultado");

          if (this.ball.isScored()) {
            console.log("¡GOL!");
            this.processShotResult(false, true);
          } else if (this.ball.isStopped()) {
            console.log("¡ATAJADA!");
            this.processShotResult(true, false);
          } else {
            console.log("FUERA");
            this.processShotResult(false, false);
          }
        }
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
      console.log("Fin de ronda, avanzando a siguiente ronda");
      this.advanceRound();
      return;
    }

    // Incrementar contador de tiros
    this.state.currentShot++;
    console.log(
      `Programando tiro ${this.state.currentShot}/${this.state.totalShots}`
    );
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

    this.playSound("whistle");

    // Actualizar UI
    this.updateUI();

    // Programar primer tiro de la nueva ronda
    this.scheduleNextShot();
  }

  /**
   * Ejecuta un tiro
   */
  /**
   * Ejecuta un tiro con variabilidad
   */
  shoot() {
    console.log("Game.shoot(): Iniciando disparo");

    // Reiniciar balón
    this.ball.reset();

    // Calcular parámetros del tiro según dificultad
    const speed = 15 + this.state.difficulty * 12; // Velocidad base entre 15 y 35

    // Dimensiones del área de juego
    const gameWidth = this.gameArea.clientWidth;
    const gameHeight = this.gameArea.clientHeight;

    // Calcular posición inicial del balón con variabilidad
    const randomOffsetX = (Math.random() - 0.5) * 200; // Desviación horizontal
    const randomOffsetY = (Math.random() - 0.5) * 150; // Desviación vertical

    const startX = gameWidth / 2 + randomOffsetX;
    const startY = gameHeight / 2 + randomOffsetY;
    const startZ = -2000; // Lejos (hacia fuera de la pantalla)

    // Calcular punto destino con variabilidad (dentro del arco)
    // La variabilidad aumenta con la dificultad
    const targetVariation = 100 + this.state.difficulty * 100;
    const targetX = gameWidth / 2 + (Math.random() - 0.5) * targetVariation;
    const targetY = gameHeight / 2 + (Math.random() - 0.5) * targetVariation;
    const targetZ = 200; // Punto detrás de la cámara

    // Vector dirección
    const dirX = targetX - startX;
    const dirY = targetY - startY;
    const dirZ = targetZ - startZ;

    // Efectos según dificultad
    const curveIntensity = 0.05 + this.state.difficulty * 0.15; // 0.05 a 0.20
    const wobbleIntensity = 0.05 + this.state.difficulty * 0.15; // 0.05 a 0.20

    // Crear objeto de opciones explícitamente para evitar recursión
    const shootOptions = {
      speed: speed,
      direction: {
        x: dirX,
        y: dirY,
        z: dirZ,
      },
      curve: {
        x: (Math.random() - 0.5) * curveIntensity,
        y: (Math.random() - 0.5) * curveIntensity,
      },
      wobble: {
        x: Math.random() * wobbleIntensity,
        y: Math.random() * wobbleIntensity,
      },
      spin: Math.random() * 2 * Math.PI,
      startPosition: {
        x: startX,
        y: startY,
        z: startZ,
      },
    };

    // Ejecutar tiro
    this.ball.shoot(shootOptions);

    console.log(
      `Disparo ejecutado hacia (${targetX.toFixed(0)}, ${targetY.toFixed(
        0
      )}) con velocidad ${speed.toFixed(1)}`
    );

    // Reproducir sonido de patada
    if (this.sounds && this.sounds.kick) {
      this.playSound("kick");
    }
  }

  /**
   * Procesa el resultado de un tiro
   * @param {boolean} saved - true si fue atajado
   * @param {boolean} goal - true si fue gol
   */
  /**
   * Procesa el resultado de un tiro
   * @param {boolean} saved - true si fue atajado
   * @param {boolean} goal - true si fue gol
   */
  processShotResult(saved, goal) {
    // Verificar que no procesemos el mismo tiro múltiples veces
    if (this.ball.isProcessed) return;
    this.ball.isProcessed = true;

    // Actualizar contadores
    if (saved) {
      this.state.saves++;
      this.state.scores.home++;
      this.homeScore.textContent = this.state.scores.home;
      console.log("¡ATAJADA! Puntos para el portero");

      // Añadir efecto visual al marcador
      this.homeScore.classList.add("score-flash");
      setTimeout(() => {
        this.homeScore.classList.remove("score-flash");
      }, 1000);
    } else if (goal) {
      this.state.scores.away++;
      this.awayScore.textContent = this.state.scores.away;

      // Reproducir sonido de gol
      if (this.sounds && this.sounds.goalShout) {
        this.playSound("goalShout");
      }

      console.log("¡GOL! Punto para el rival");

      // Añadir efecto visual al marcador
      this.awayScore.classList.add("score-flash");
      setTimeout(() => {
        this.awayScore.classList.remove("score-flash");
      }, 1000);
    } else {
      console.log("Balón fuera - no suma puntos");
    }

    // Actualizar UI
    this.updateUI();

    // Programar siguiente tiro con un pequeño retraso
    setTimeout(() => {
      this.scheduleNextShot();
    }, 1000);
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

  checkGameState() {
    if (!this.state.isPlaying) return;

    if (!this.ball.isActive && !this.shootTimer) {
      console.log("Recuperando estado del juego - programando nuevo disparo");
      this.scheduleNextShot();
    }
  }
}
// Iniciar el juego cuando el DOM esté completamente cargado
// document.addEventListener('DOMContentLoaded', () => {
//     const game = new Game();
// });
