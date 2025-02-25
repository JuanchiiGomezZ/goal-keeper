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

    // Posiciones de las manos
    this.leftHandPos = { x: 0, y: 0 };
    this.rightHandPos = { x: 0, y: 0 };

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
    this.updateHandPositions({
      x: this.gameArea.clientWidth / 2,
      y: this.gameArea.clientHeight / 2,
    });
  }

  /**
   * Inicializa los eventos del ratón
   */
  initEvents() {
    // Actualizar posición de manos con el movimiento del ratón
    this.gameArea.addEventListener("mousemove", (e) => {
      // Obtener posición relativa al área de juego
      const rect = this.gameArea.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      this.updateHandPositions({ x: mouseX, y: mouseY });
    });

    // Mantener el ratón dentro del área de juego
    document.addEventListener("mouseleave", () => {
      // Si el ratón sale del documento, mantener las manos en su última posición válida
    });
  }

  /**
   * Actualiza la posición de las manos según la posición del ratón
   * @param {Object} mousePos - Posición del ratón { x, y }
   */
  updateHandPositions(mousePos) {
    const gameWidth = this.gameArea.clientWidth;
    const gameHeight = this.gameArea.clientHeight;

    // Calcular límites absolutos
    const limitsAbs = {
      minX: gameWidth * this.limits.minX,
      maxX: gameWidth * this.limits.maxX,
      minY: gameHeight * this.limits.minY,
      maxY: gameHeight * this.limits.maxY,
    };

    // Limitar posición del ratón al área permitida
    const limitedX = Math.max(
      limitsAbs.minX,
      Math.min(limitsAbs.maxX, mousePos.x)
    );
    const limitedY = Math.max(
      limitsAbs.minY,
      Math.min(limitsAbs.maxY, mousePos.y)
    );

    // Actualizar posiciones de ambas manos juntas
    // Ambas manos siguen al ratón directamente (están unidas)
    this.leftHandPos = { x: limitedX - 30, y: limitedY }; // Ligeramente a la izquierda del cursor
    this.rightHandPos = { x: limitedX + 30, y: limitedY }; // Ligeramente a la derecha del cursor

    // Actualizar posición visual de las manos
    this.leftHand.style.left = `${this.leftHandPos.x}px`;
    this.leftHand.style.top = `${this.leftHandPos.y}px`;
    this.rightHand.style.left = `${this.rightHandPos.x}px`;
    this.rightHand.style.top = `${this.rightHandPos.y}px`;
  }

  /**
   * Obtiene las posiciones y dimensiones de las manos para detección de colisiones
   * @returns {Object} Objetos con información de posición y tamaño de ambas manos
   */
  getHandsInfo() {
    return {
      leftHand: {
        x: this.leftHandPos.x,
        y: this.leftHandPos.y,
        width: this.leftHand.offsetWidth,
        height: this.leftHand.offsetHeight,
      },
      rightHand: {
        x: this.rightHandPos.x,
        y: this.rightHandPos.y,
        width: this.rightHand.offsetWidth,
        height: this.rightHand.offsetHeight,
      },
    };
  }
}

// Exportar para uso en otros archivos
window.Goalkeeper = Goalkeeper;
