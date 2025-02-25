/**
 * CollisionManager Class
 * Maneja la detección de colisiones entre el balón y las manos del portero
 */
class CollisionManager {
  constructor() {
    // No necesitamos propiedades para esta clase
  }

  /**
   * Detecta colisión entre un círculo (balón) y un rectángulo (mano)
   * @param {Object} ball - Información del balón {x, y, radius}
   * @param {Object} hand - Información de la mano {x, y, width, height}
   * @returns {Object|null} Punto de colisión o null si no hay colisión
   */
  detectCollision(ball, hand) {
    if (!ball.isActive) return null;

    // Convertir coordenadas del rectángulo al centro
    const handCenter = {
      x: hand.x,
      y: hand.y,
    };

    const halfWidth = hand.width / 2;
    const halfHeight = hand.height / 2;

    // Encontrar el punto más cercano del rectángulo al círculo
    const closestX = Math.max(
      handCenter.x - halfWidth,
      Math.min(ball.x, handCenter.x + halfWidth)
    );
    const closestY = Math.max(
      handCenter.y - halfHeight,
      Math.min(ball.y, handCenter.y + halfHeight)
    );

    // Calcular distancia entre el punto más cercano y el centro del círculo
    const distanceX = ball.x - closestX;
    const distanceY = ball.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

    // Si la distancia es menor que el radio del círculo, hay colisión
    if (distanceSquared < ball.radius * ball.radius) {
      return {
        x: closestX,
        y: closestY,
        distance: Math.sqrt(distanceSquared),
      };
    }

    return null;
  }

  /**
   * Verifica colisiones entre el balón y ambas manos
   * @param {Object} ball - Instancia de Ball
   * @param {Object} goalkeeper - Instancia de Goalkeeper
   * @returns {boolean} true si hay colisión, false en caso contrario
   */
  checkCollisions(ball, goalkeeper) {
    // Obtener información necesaria
    const ballInfo = ball.getBallInfo();
    const handsInfo = goalkeeper.getHandsInfo();

    // Verificar colisión con la mano izquierda
    const leftCollision = this.detectCollision(ballInfo, handsInfo.leftHand);
    if (leftCollision) {
      ball.save(leftCollision);
      return true;
    }

    // Verificar colisión con la mano derecha
    const rightCollision = this.detectCollision(ballInfo, handsInfo.rightHand);
    if (rightCollision) {
      ball.save(rightCollision);
      return true;
    }

    return false;
  }
}

// Exportar para uso en otros archivos
window.CollisionManager = CollisionManager;
