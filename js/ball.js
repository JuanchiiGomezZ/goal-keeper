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
    this.initialZ = -2000; // Profundidad inicial (lejos de la portería/cámara)

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
      speed: 25, // Velocidad base
      direction: {
        // Dirección normalizada
        x: 0, // Componente horizontal (0 = centro)
        y: 0, // Componente vertical
        z: 1, // Componente de profundidad (1 = hacia la portería/cámara)
      },
      curve: {
        // Efecto de curva
        x: (Math.random() - 0.5) * 0.3, // Curva horizontal (-0.15 a 0.15)
        y: (Math.random() - 0.5) * 0.2, // Curva vertical (-0.1 a 0.1)
      },
      wobble: {
        // Bamboleo aleatorio
        x: Math.random() * 0.4, // Intensidad horizontal (0 a 0.4)
        y: Math.random() * 0.4, // Intensidad vertical (0 a 0.4)
      },
      spin: Math.random() * 2 * Math.PI, // Ángulo inicial de rotación
      startPosition: {
        // Posición inicial
        x: this.gameArea.clientWidth / 2, // Centro horizontal
        y: this.gameArea.clientHeight / 2, // Centro vertical
        z: -2000, // Lejos de la portería (negativo porque viene hacia nosotros)
      },
    };

    // Combinar opciones por defecto con las proporcionadas
    const settings = { ...defaults, ...options };

    // Asegurarse de que this.effect esté inicializado correctamente
    if (!this.effect) {
      this.effect = {
        curve: { x: 0, y: 0 },
        wobble: { x: 0, y: 0 },
        spin: 0,
        phase: 0,
      };
    }

    // Asignar los efectos
    this.effect.curve = settings.curve || { x: 0, y: 0 };
    this.effect.wobble = settings.wobble || { x: 0, y: 0 };
    this.effect.spin = settings.spin || 0;
    this.effect.phase = 0;

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

    // Incrementar fase de efecto
    this.effect.phase += 0.05;

    // Aplicar efectos de curva (aumenta con el tiempo)
    const curveFactorX =
      this.effect.curve.x * (Math.abs(this.position.z) / 1000);
    const curveFactorY =
      this.effect.curve.y * (Math.abs(this.position.z) / 1000);

    // Mayor efecto conforme se acerca
    this.velocity.x += curveFactorX;
    this.velocity.y += curveFactorY;

    // Aplicar bamboleo aleatorio (efecto sinusoidal)
    const wobbleX = Math.sin(this.effect.phase * 3) * this.effect.wobble.x;
    const wobbleY = Math.cos(this.effect.phase * 2) * this.effect.wobble.y;

    // Aplicar velocidad a la posición (incluyendo bamboleo)
    this.position.x += this.velocity.x + wobbleX;
    this.position.y += this.velocity.y + wobbleY;
    this.position.z += this.velocity.z;

    // Aplicar gravedad a la velocidad vertical (aumenta con la distancia)
    const gravityFactor =
      1 + (Math.abs(this.initialZ) - Math.abs(this.position.z)) / 2000;
    this.velocity.y += this.gravity * gravityFactor;

    // Aplicar rotación visual al balón
    this.effect.spin += 0.05;
    this.element.style.transform = `translate(-50%, -50%) rotate(${
      (this.effect.spin * 180) / Math.PI
    }deg)`;

    // Verificar si el balón ha pasado la línea de gol (z > 0)
    if (this.position.z >= 0) {
      // Si no ha sido atajado, es gol
      if (!this.isSaved) {
        this.isGoal = true;
      }

      // El balón ya no está activo
      this.isActive = false;
      return false;
    }

    // Si el balón sale completamente de los límites laterales o superiores/inferiores
    // sumando un margen para que no desaparezca demasiado pronto
    const gameWidth = this.gameArea.clientWidth;
    const gameHeight = this.gameArea.clientHeight;
    const margin = 100; // margen para que no desaparezca de inmediato

    if (
      this.position.x < -this.radius - margin ||
      this.position.x > gameWidth + this.radius + margin ||
      this.position.y < -this.radius - margin ||
      this.position.y > gameHeight + this.radius + margin
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
    // Cuanto más cerca (z más grande), más grande se ve el balón
    const maxSize = 150; // Tamaño máximo que puede tener el balón
    const minSize = 20; // Tamaño mínimo (cuando está lejos)
    const distanceRange = Math.abs(this.initialZ); // Rango total de distancia

    // Calcular tamaño según distancia - relación no lineal para efecto más dramático
    const normalizedDist = 1 - Math.abs(this.position.z) / distanceRange;
    const size =
      minSize + normalizedDist * normalizedDist * (maxSize - minSize);

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

    // Crear un efecto visual de "rebote" más marcado

    // Invertir dirección Z (rebote) y hacerlo más dramático
    this.velocity.z *= -1.2;

    // Modificar dirección X e Y según punto de contacto
    // Esto simula el efecto de desvío según dónde impacta en la mano
    const deflectionStrength = 15; // Mayor fuerza de desvío
    this.velocity.x = (Math.random() - 0.5) * deflectionStrength;
    this.velocity.y = (Math.random() - 0.5) * deflectionStrength;

    // Añadir un pequeño giro (rotación del balón) - visual únicamente
    this.element.style.transition = "transform 0.2s";
    this.element.style.transform = `translate(-50%, -50%) rotate(${
      Math.random() * 360
    }deg)`;

    // Después de un tiempo, quitar la transición
    setTimeout(() => {
      this.element.style.transition = "";
    }, 200);
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
