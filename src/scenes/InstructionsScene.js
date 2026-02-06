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

    // Título
    const titleFontSize = isMobile ? "32px" : "48px";
    this.add
      .text(centerX, 40, "📖 INSTRUCCIONES", {
        fontFamily: "Arial",
        fontSize: titleFontSize,
        color: "#ff5aa5",
        stroke: "#ffffff",
        strokeThickness: isMobile ? 3 : 4,
      })
      .setOrigin(0.5);

    // Botón volver
    const backBtn = this.add
      .text(20, 50, "← Volver", {
        fontFamily: "Arial",
        fontSize: isMobile ? "12px" : "16px",
        color: "#ffd1e8",
        backgroundColor: "#2a0033",
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      })
      .setInteractive({ useHandCursor: true });

    backBtn.on("pointerdown", () => {
      this.scene.start("menu");
    });

    // Instructions content
    const instructionsFontSize = isMobile ? "11px" : "14px";
    const lineSpacing = isMobile ? 25 : 35;
    const startY = isMobile ? 110 : 120;
    const maxWidth = isMobile ? 280 : 600;

    const instructions = [
      "🎮 OBJETIVO DEL JUEGO",
      "Tienes 60 segundos para hacer el máximo de matches.",
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
      "• Tienes máximo 3 intentos por empleado",
      "• Después se guardan tus puntajes",
      "• Compite por el lugar más alto",
      "",
      "💡 ESTRATEGIA",
      "• Planifica tus movimientos",
      "• Busca hacer múltiples matches",
      "• El cupido especial es muy poderoso",
      "• ¡Maximiza tu puntuación!",
    ];

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
        ? (isMobile ? "12px" : "16px")
        : instructionsFontSize;

      this.add
        .text(centerX, yPos, line, {
          fontFamily: "Arial",
          fontSize: fontSize,
          color: color,
          align: "center",
          wordWrap: { width: maxWidth },
        })
        .setOrigin(0.5);

      yPos += lineSpacing;
    });

    // Footer
    this.add
      .text(centerX, this.cameras.main.height - 30, "¡Buena suerte! Tienes 3 intentos 🎲", {
        fontFamily: "Arial",
        fontSize: isMobile ? "11px" : "14px",
        color: "#ff5aa5",
        style: "italic",
      })
      .setOrigin(0.5);
  }
}
