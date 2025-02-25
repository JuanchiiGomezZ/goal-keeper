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
  /**
   * Lanza el balón con una velocidad y dirección específicas
   * @param {Object} options - Opciones del lanzamiento
   */
  shoot(options = {}) {
    console.log("Método shoot de Ball iniciado");

    // Valores por defecto del lanzamiento
    const defaults = {
      speed: 25,
      direction: {
        x: 0,
        y: 0,
        z: 1,
      },
      curve: {
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.2,
      },
      wobble: {
        x: Math.random() * 0.4,
        y: Math.random() * 0.4,
      },
      spin: Math.random() * 2 * Math.PI,
      startPosition: {
        x: this.gameArea.clientWidth / 2,
        y: this.gameArea.clientHeight / 2,
        z: -2000,
      },
    };

    // Combinar opciones por defecto con las proporcionadas
    // IMPORTANTE: Usamos Object.assign en lugar de spread operator para evitar recursiones
    const settings = Object.assign({}, defaults);
    if (options.speed !== undefined) settings.speed = options.speed;
    if (options.direction) {
      settings.direction = Object.assign({}, settings.direction);
      if (options.direction.x !== undefined)
        settings.direction.x = options.direction.x;
      if (options.direction.y !== undefined)
        settings.direction.y = options.direction.y;
      if (options.direction.z !== undefined)
        settings.direction.z = options.direction.z;
    }
    if (options.curve) {
      settings.curve = Object.assign({}, settings.curve);
      if (options.curve.x !== undefined) settings.curve.x = options.curve.x;
      if (options.curve.y !== undefined) settings.curve.y = options.curve.y;
    }
    if (options.wobble) {
      settings.wobble = Object.assign({}, settings.wobble);
      if (options.wobble.x !== undefined) settings.wobble.x = options.wobble.x;
      if (options.wobble.y !== undefined) settings.wobble.y = options.wobble.y;
    }
    if (options.spin !== undefined) settings.spin = options.spin;
    if (options.startPosition) {
      settings.startPosition = Object.assign({}, settings.startPosition);
      if (options.startPosition.x !== undefined)
        settings.startPosition.x = options.startPosition.x;
      if (options.startPosition.y !== undefined)
        settings.startPosition.y = options.startPosition.y;
      if (options.startPosition.z !== undefined)
        settings.startPosition.z = options.startPosition.z;
    }

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
    this.effect.curve.x = settings.curve.x;
    this.effect.curve.y = settings.curve.y;
    this.effect.wobble.x = settings.wobble.x;
    this.effect.wobble.y = settings.wobble.y;
    this.effect.spin = settings.spin;
    this.effect.phase = 0;

    // Establecer posición inicial
    this.position.x = settings.startPosition.x;
    this.position.y = settings.startPosition.y;
    this.position.z = settings.startPosition.z;

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
    this.velocity.x = normalizedDir.x * settings.speed;
    this.velocity.y = normalizedDir.y * settings.speed;
    this.velocity.z = normalizedDir.z * settings.speed;

    // Activar el balón
    this.isActive = true;
    this.isSaved = false;
    this.isGoal = false;
    this.isProcessed = false;

    // Mostrar el balón
    this.element.style.display = "block";

    // Actualizar visualización
    this.updateVisual();

    console.log(
      `Balón configurado: pos=(${this.position.x.toFixed(
        0
      )},${this.position.y.toFixed(0)},${this.position.z.toFixed(
        0
      )}), velocidad=(${this.velocity.x.toFixed(2)},${this.velocity.y.toFixed(
        2
      )},${this.velocity.z.toFixed(2)})`
    );
  }

  /**
   * Actualiza la posición del balón basado en su velocidad
   * @returns {boolean} true si el balón está activo, false si ha salido de los límites
   */
  update() {
    if (!this.isActive) {
      return false;
    }

    console.log(
      `Actualizando posición: (${this.position.x.toFixed(
        0
      )}, ${this.position.y.toFixed(0)}, ${this.position.z.toFixed(0)})`
    );

    // Incrementar fase de efecto
    this.effect.phase += 0.05;

    // Aplicar efectos de curva
    const curveFactorX =
      this.effect.curve.x * (Math.abs(this.position.z) / 1000);
    const curveFactorY =
      this.effect.curve.y * (Math.abs(this.position.z) / 1000);

    // Mayor efecto conforme se acerca
    this.velocity.x += curveFactorX;
    this.velocity.y += curveFactorY;

    // Aplicar bamboleo aleatorio
    const wobbleX = Math.sin(this.effect.phase * 3) * this.effect.wobble.x;
    const wobbleY = Math.cos(this.effect.phase * 2) * this.effect.wobble.y;

    // Aplicar velocidad a la posición
    this.position.x += this.velocity.x + wobbleX;
    this.position.y += this.velocity.y + wobbleY;
    this.position.z += this.velocity.z;

    // Aplicar gravedad
    const gravityFactor =
      1 + (Math.abs(this.initialZ) - Math.abs(this.position.z)) / 2000;
    this.velocity.y += this.gravity * gravityFactor;

    // Rotar balón
    this.effect.spin += 0.05;
    this.element.style.transform = `translate(-50%, -50%) rotate(${
      (this.effect.spin * 180) / Math.PI
    }deg)`;

    // Verificar si el balón ha pasado la línea de gol (z > 0)
    if (this.position.z >= 0) {
      console.log("Balón llegó a línea de gol, Z: " + this.position.z);

      // Si no ha sido atajado, es gol
      if (!this.isSaved) {
        this.isGoal = true;
        console.log("¡GOL CONFIRMADO!");
      }

      // El balón ya no está activo
      this.isActive = false;
      return false;
    }

    // Verificar si el balón sale de los límites (con valores más permisivos)
    const gameWidth = this.gameArea.clientWidth;
    const gameHeight = this.gameArea.clientHeight;
    const margin = 300; // Margen grande para evitar falsa detección

    if (
      this.position.x < -this.radius - margin ||
      this.position.x > gameWidth + this.radius + margin ||
      this.position.y < -this.radius - margin ||
      this.position.y > gameHeight + this.radius + margin
    ) {
      console.log(
        `Balón fuera de límites: (${this.position.x.toFixed(
          0
        )}, ${this.position.y.toFixed(0)}, ${this.position.z.toFixed(0)})`
      );
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

    // Calcular tamaño basado en profundidad
    const maxSize = 150; // Tamaño máximo (cerca)
    const minSize = 20; // Tamaño mínimo (lejos)
    const distanceRange = Math.abs(this.initialZ);

    // Calcular tamaño según distancia - relación no lineal
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

    console.log(
      `Visualización: pos=(${this.position.x.toFixed(
        0
      )},${this.position.y.toFixed(0)},${this.position.z.toFixed(
        0
      )}), tamaño=${size.toFixed(0)}px`
    );
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
