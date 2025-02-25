/**
 * Goalkeeper Class
 * Maneja la lógica del portero y el control de las manos con el ratón
 */
class Goalkeeper {
  constructor() {
    // Referencias a los elementos DOM
    this.leftHand = document.getElementById("left-hand");
    this.rightHand = document.getElementById("right-hand");
    this.gameArea = document.getElementById("game-area");

    // Posiciones actuales de las manos
    this.leftHandPos = { x: 0, y: 0 };
    this.rightHandPos = { x: 0, y: 0 };

    // Posiciones objetivo (donde debería ir el cursor)
    this.targetPos = { x: 0, y: 0 };

    // Factor de velocidad (valor menor = movimiento más lento)
    this.movementSpeed = 0.08;

    // Límites de movimiento (porcentaje del área de juego)
    this.limits = {
      minX: 0.15,
      maxX: 0.85,
      minY: 0.05,
      maxY: 0.45,
    };

    // Inicializar eventos
    this.initEvents();

    // Establecer posiciones iniciales
    const initialX = this.gameArea.clientWidth / 2;
    const initialY = this.gameArea.clientHeight / 2;
    this.targetPos = { x: initialX, y: initialY };

    // Iniciar bucle de actualización
    this.updateInterval = setInterval(() => this.updateHandPositions(), 16);
  }

  /**
   * Inicializa los eventos del ratón
   */
  initEvents() {
    // Actualizar posición objetivo con el movimiento del ratón
    this.gameArea.addEventListener("mousemove", (e) => {
      // Obtener posición relativa al área de juego
      const rect = this.gameArea.getBoundingClientRect();
      this.targetPos.x = e.clientX - rect.left;
      this.targetPos.y = e.clientY - rect.top;
    });

    // Ocultar cursor original
    this.gameArea.style.cursor = "none";
  }

  /**
   * Actualiza la posición de las manos con movimiento suavizado
   */
  updateHandPositions() {
    const gameWidth = this.gameArea.clientWidth;
    const gameHeight = this.gameArea.clientHeight;

    // Dimensiones de las manos
    const handWidth = 100;
    const handHeight = 120;

    // Limitar posición objetivo dentro de los límites de la pantalla
    const minX = handWidth / 2;
    const maxX = gameWidth - handWidth / 2;
    const minY = handHeight / 2;
    const maxY = gameHeight - handHeight / 2;

    const limitedX = Math.max(minX, Math.min(maxX, this.targetPos.x));
    const limitedY = Math.max(minY, Math.min(maxY, this.targetPos.y));

    // Calcular nueva posición con movimiento suavizado
    const currentX = limitedX;
    const currentY = limitedY;

    // Suavizado de movimiento con interpolación lineal
    this.leftHandPos.x +=
      (currentX - 120 - (this.leftHandPos.x - handWidth / 2)) *
      this.movementSpeed;
    this.leftHandPos.y +=
      (currentY - 60 - (this.leftHandPos.y - handHeight / 2)) *
      this.movementSpeed;

    this.rightHandPos.x +=
      (currentX + 20 - (this.rightHandPos.x - handWidth / 2)) *
      this.movementSpeed;
    this.rightHandPos.y +=
      (currentY - 60 - (this.rightHandPos.y - handHeight / 2)) *
      this.movementSpeed;

    // Actualizar posición visual de las manos
    this.leftHand.style.left = `${this.leftHandPos.x}px`;
    this.leftHand.style.top = `${this.leftHandPos.y}px`;

    this.rightHand.style.left = `${this.rightHandPos.x}px`;
    this.rightHand.style.top = `${this.rightHandPos.y}px`;
  }

  /**
   * Detiene el bucle de actualización (para pausas)
   */
  stopUpdateLoop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Reanuda el bucle de actualización
   */
  resumeUpdateLoop() {
    if (!this.updateInterval) {
      this.updateInterval = setInterval(() => this.updateHandPositions(), 16);
    }
  }

  /**
   * Obtiene las posiciones y dimensiones de las manos para detección de colisiones
   * @returns {Object} Objetos con información de posición y tamaño de ambas manos
   */
  getHandsInfo() {
    return {
      leftHand: {
        x: this.leftHandPos.x + 50, // Centrar para colisiones
        y: this.leftHandPos.y + 60, // Centrar para colisiones
        width: this.leftHand.offsetWidth,
        height: this.leftHand.offsetHeight,
      },
      rightHand: {
        x: this.rightHandPos.x + 50, // Centrar para colisiones
        y: this.rightHandPos.y + 60, // Centrar para colisiones
        width: this.rightHand.offsetWidth,
        height: this.rightHand.offsetHeight,
      },
    };
  }
}

// Exportar para uso en otros archivos
window.Goalkeeper = Goalkeeper;
