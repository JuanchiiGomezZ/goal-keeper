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

    // Ocultar cursor original
    this.gameArea.style.cursor = "none";

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

    // Límites para que las manos no salgan de la pantalla
    const handWidth = 100; // Ancho aproximado de la mano
    const handHeight = 120; // Altura aproximada de la mano

    // Limitar el movimiento horizontal
    const minX = handWidth / 2;
    const maxX = gameWidth - handWidth / 2;
    const limitedX = Math.max(minX, Math.min(maxX, mousePos.x));

    // Limitar el movimiento vertical (permitir casi toda la pantalla)
    const minY = handHeight / 2; // Permitir subir casi hasta el borde superior
    const maxY = gameHeight - handHeight / 2;
    const limitedY = Math.max(minY, Math.min(maxY, mousePos.y));

    // Calcular posición de ambas manos juntas (centradas en el cursor)
    const handsCenter = limitedX;

    // Actualizar posición del elemento DOM directamente (sin transform)
    this.leftHand.style.left = `${handsCenter - 120}px`; // Desplazamiento para la mano izquierda
    this.leftHand.style.top = `${limitedY - 60}px`;

    this.rightHand.style.left = `${handsCenter + 20}px`; // Desplazamiento para la mano derecha
    this.rightHand.style.top = `${limitedY - 60}px`;

    // Actualizar posiciones almacenadas (para colisiones)
    this.leftHandPos = {
      x: handsCenter - 120 + handWidth / 2,
      y: limitedY - 60 + handHeight / 2,
    };

    this.rightHandPos = {
      x: handsCenter + 20 + handWidth / 2,
      y: limitedY - 60 + handHeight / 2,
    };
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
