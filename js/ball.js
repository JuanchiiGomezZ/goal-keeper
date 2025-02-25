/**
 * Ball Class
 * Controla el comportamiento y la física del balón
 */
class Ball {
  constructor(gameArea) {
    this.element = document.getElementById("ball");
    this.gameArea = gameArea;

    // Posición actual del balón
    this.position = { x: 0, y: 0, z: 0 };

    // Velocidad del balón (pixeles por frame)
    this.velocity = { x: 0, y: 0, z: 0 };

    // Estado del balón
    this.isActive = false;
    this.isSaved = false;
    this.isGoal = false;

    // Tamaño del balón
    this.radius = this.element.offsetWidth / 2;

    // Posición inicial (desde donde se lanza el balón)
    this.initialZ = -1000; // Profundidad inicial (lejos de la portería)

    // Gravedad (reducida para que el balón no caiga tan rápido)
    this.gravity = 0.05;
  }

  /**
   * Lanza el balón con una velocidad y dirección específicas
   * @param {Object} options - Opciones del lanzamiento
   */
  shoot(options = {}) {
    // Valores por defecto del lanzamiento
    const defaults = {
      speed: 25, // Velocidad base (aumentada para asegurar que llegue a la portería)
      direction: {
        // Dirección normalizada
        x: 0, // Componente horizontal (0 = centro)
        y: -0.2, // Componente vertical (negativo para contrarrestar la gravedad)
        z: 1, // Componente de profundidad (1 = hacia la portería)
      },
      spin: 0, // Efecto (curva)
      startPosition: {
        // Posición inicial
        x: this.gameArea.clientWidth / 2, // Centro horizontal
        y: this.gameArea.clientHeight / 1.2, // Más abajo para simular un lanzamiento desde el suelo
        z: this.initialZ, // Profundidad inicial
      },
    };

    // Combinar opciones por defecto con las proporcionadas
    const settings = { ...defaults, ...options };

    // Establecer posición inicial
    this.position = { ...settings.startPosition };

    // Normalizar dirección (vector unitario)
    const dirMagnitude = Math.sqrt(
      settings.direction.x ** 2 +
        settings.direction.y ** 2 +
        settings.direction.z ** 2
    );

    const normalizedDir = {
      x: settings.direction.x / dirMagnitude,
      y: settings.direction.y / dirMagnitude,
      z: settings.direction.z / dirMagnitude,
    };

    // Calcular velocidad
    this.velocity = {
      x: normalizedDir.x * settings.speed,
      y: normalizedDir.y * settings.speed,
      z: normalizedDir.z * settings.speed,
    };

    // Activar el balón
    this.isActive = true;
    this.isSaved = false;
    this.isGoal = false;

    // Mostrar el balón
    this.element.style.display = "block";

    // Actualizar visualización
    this.updateVisual();
  }

  /**
   * Actualiza la posición del balón basado en su velocidad
   * @returns {boolean} true si el balón está activo, false si ha salido de los límites
   */
  update() {
    if (!this.isActive) return false;

    // Aplicar velocidad a la posición
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.position.z += this.velocity.z;

    // Aplicar gravedad a la velocidad vertical
    this.velocity.y += this.gravity;

    // Verificar si el balón ha llegado a la portería (z = 0)
    if (this.position.z >= 0) {
      const goalPost = document.getElementById("goal-area");
      const goalRect = goalPost.getBoundingClientRect();
      const gameRect = this.gameArea.getBoundingClientRect();

      // Convertir coordenadas absolutas a relativas al juego
      const goalLeft = goalRect.left - gameRect.left;
      const goalRight = goalRect.right - gameRect.left;
      const goalTop = goalRect.top - gameRect.top;
      const goalBottom = goalRect.bottom - gameRect.top;

      // Verificar si el balón está dentro de los límites de la portería
      if (
        this.position.x >= goalLeft &&
        this.position.x <= goalRight &&
        this.position.y >= goalTop &&
        this.position.y <= goalBottom
      ) {
        // Es gol si no ha sido atajado
        if (!this.isSaved) {
          this.isGoal = true;
        }
      }

      // El balón ya no está activo una vez que cruza la línea de gol
      this.isActive = false;
      return false;
    }

    // Si el balón sale de los límites laterales o superiores/inferiores
    const gameWidth = this.gameArea.clientWidth;
    const gameHeight = this.gameArea.clientHeight;

    if (
      this.position.x < -this.radius ||
      this.position.x > gameWidth + this.radius ||
      this.position.y < -this.radius ||
      this.position.y > gameHeight + this.radius
    ) {
      this.isActive = false;
      return false;
    }

    // Actualizar visualización
    this.updateVisual();
    return true;
  }

  /**
   * Actualiza la visualización del balón según su posición
   */
  updateVisual() {
    if (!this.isActive) {
      this.element.style.display = "none";
      return;
    }

    // Mostrar el balón
    this.element.style.display = "block";

    // Calcular tamaño basado en profundidad (efecto perspectiva)
    // Cuanto más cerca, más grande
    const distance = Math.abs(this.position.z);
    const scale = 1 + (this.initialZ - distance) / this.initialZ;
    const size = 40 * scale; // 40px es el tamaño base

    // Actualizar posición y tamaño
    this.element.style.left = `${this.position.x}px`;
    this.element.style.top = `${this.position.y}px`;
    this.element.style.width = `${size}px`;
    this.element.style.height = `${size}px`;

    // Actualizar radio para colisiones
    this.radius = size / 2;
  }

  /**
   * Marca el balón como atajado y modifica su trayectoria
   * @param {Object} contactPoint - Punto de contacto con la mano
   */
  save(contactPoint) {
    if (!this.isActive || this.isSaved) return;

    // Marcar como atajado
    this.isSaved = true;

    // Invertir dirección Z (rebote)
    this.velocity.z *= -0.5;

    // Modificar dirección X e Y según punto de contacto
    // Esto simula el efecto de desvío según dónde impacta en la mano
    this.velocity.x = (Math.random() - 0.5) * 10;
    this.velocity.y = -5 - Math.random() * 5; // Impulso hacia arriba
  }

  /**
   * Obtiene información del balón para detección de colisiones
   * @returns {Object} Información de posición y tamaño
   */
  getBallInfo() {
    return {
      x: this.position.x,
      y: this.position.y,
      radius: this.radius,
      isActive: this.isActive,
    };
  }

  /**
   * Verifica si el balón ha entrado en la portería
   * @returns {boolean} true si es gol, false en caso contrario
   */
  isScored() {
    return this.isGoal;
  }

  /**
   * Verifica si el balón ha sido atajado
   * @returns {boolean} true si fue atajado, false en caso contrario
   */
  isStopped() {
    return this.isSaved;
  }

  /**
   * Reinicia el estado del balón
   */
  reset() {
    this.isActive = false;
    this.isSaved = false;
    this.isGoal = false;
    this.element.style.display = "none";
  }
}

// Exportar para uso en otros archivos
window.Ball = Ball;
