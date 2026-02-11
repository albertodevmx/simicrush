import Phaser from "phaser";

export default class InstructionsScene extends Phaser.Scene {
  constructor() {
    super("instructions");
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const isMobile = this.cameras.main.width < 500;

    // Fondo con imagen
    if (this.textures.exists("menu-bg")) {
      this.add.image(centerX, centerY, "menu-bg").setDisplaySize(
        this.cameras.main.width,
        this.cameras.main.height
      );
    }

    // Botón volver con imagen
    const backBtn = this.add
      .image(15, 40, "btn-back-menu")
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    // Scale button to fit (80% del tamaño anterior)
    const btnTargetWidth = isMobile ? 160 : 224;
    const btnScale = btnTargetWidth / backBtn.width;
    backBtn.setScale(btnScale);

    backBtn.on("pointerdown", () => {
      this.scene.start("menu");
    });

    // Instructions content
    const instructionsFontSize = isMobile ? "13px" : "17px";
    const lineSpacing = isMobile ? 50 : 70;
    const startY = isMobile ? 100 : 110;
    const maxWidth = isMobile ? 280 : 600;
    const contentPadding = isMobile ? 20 : 30;

    const instructions = [
      "🎮 OBJETIVO DEL JUEGO",
      "Tienes 120 segundos para hacer el máximo de matches.",
      "",
      "💫 CÓMO JUGAR",
      "• Desliza (swipe) dos fichas adyacentes",
      "• Crea líneas de 3 o más fichas iguales",
      "• Las fichas se destruyen y suben nuevas",
      "• Gana puntos por cada ficha destruida",
      "",
      "🏆 BONIFICACIONES",
      "• Match de 5 fichas en línea recta",
      "  → Obtienes un ❤️ CUPIDO ESPECIAL",
      "  → Se generan corazones flotantes",
      "",
      "⚡ CUPIDO ESPECIAL (❤️)",
      "• Crea una línea de 5 en horizontal o vertical",
      "• Haz swipe: Cupido + cualquier ficha",
      "• Resultado: Destruye TODOS los de ese tipo",
      "• Particulas de explosión en cada ficha",
      "",
      "❌ LÍMITE DE INTENTOS",
      "• Tienes máximo 1 intento por empleado",
      "• Después se guardan tus puntajes",
      "• Compite por el lugar más alto",
      "",
      "💡 ESTRATEGIA",
      "• Planifica tus movimientos",
      "• Busca hacer múltiples matches",
      "• El cupido especial es muy poderoso",
      "• ¡Maximiza tu puntuación!",
    ];

    // Calculate the height of all instructions
    const contentHeight = (instructions.length - 1) * lineSpacing + contentPadding * 2;
    const contentCenterY = startY + contentHeight / 2 - contentPadding;

    // Draw white background box for all instructions
    const boxWidth = maxWidth + contentPadding * 2;
    this.add
      .rectangle(centerX, contentCenterY, boxWidth, contentHeight, 0xffffff, 0.95)
      .setStrokeStyle(2, 0xff5aa5, 0.5);

    let yPos = startY;
    instructions.forEach((line) => {
      const color = line.startsWith("🎮") || line.startsWith("💫") ||
                   line.startsWith("🏆") || line.startsWith("⚡") ||
                   line.startsWith("❌") || line.startsWith("💡")
        ? "#ff5aa5"
        : "#ffd1e8";

      const fontSize = line.startsWith("🎮") || line.startsWith("💫") ||
                      line.startsWith("🏆") || line.startsWith("⚡") ||
                      line.startsWith("❌") || line.startsWith("💡")
        ? (isMobile ? "14px" : "19px")
        : instructionsFontSize;

      this.add
        .text(centerX, yPos, line, {
          fontFamily: "Arial",
          fontSize: fontSize,
          fontStyle: "bold",
          color: color,
          align: "center",
          wordWrap: { width: maxWidth },
        })
        .setOrigin(0.5);

      yPos += lineSpacing;
    });

    // Footer
    this.add
      .text(centerX, this.cameras.main.height - 30, "¡Buena suerte! Tienes 1 intento 🎲", {
        fontFamily: "Arial",
        fontSize: isMobile ? "13px" : "17px",
        fontStyle: "bold",
        color: "#ff5aa5",
        backgroundColor: "#ffffff",
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
      })
      .setOrigin(0.5);
  }
}
