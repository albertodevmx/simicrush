import Phaser from "phaser";

export default class InstructionsScene extends Phaser.Scene {
  constructor() {
    super("instructions");
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const isMobile = this.cameras.main.width < 500;

    // Add menu background as placeholder
    if (this.textures.exists("menu-bg")) {
      this.add.image(centerX, centerY, "menu-bg").setDisplaySize(
        this.cameras.main.width,
        this.cameras.main.height
      );
    }

    // Instructions text
    this.add
      .text(centerX, centerY - 80, "INSTRUCCIONES", {
        fontFamily: "Arial",
        fontSize: isMobile ? "32px" : "48px",
        fontStyle: "bold",
        color: "#ff5aa5",
        align: "center",
      })
      .setOrigin(0.5);

    const instructions = [
      "🎮 Haz swipe para intercambiar fichas adyacentes",
      "💫 Crea líneas de 3 o más fichas iguales",
      "🏆 5 fichas = Cupido Especial",
      "⏱️ Tienes 120 segundos",
      "❌ Solo 1 intento por empleado",
    ];

    let yPos = centerY - 20;
    instructions.forEach((line) => {
      this.add
        .text(centerX, yPos, line, {
          fontFamily: "Arial",
          fontSize: isMobile ? "14px" : "18px",
          color: "#ffd1e8",
          align: "center",
          wordWrap: { width: isMobile ? 280 : 600 },
        })
        .setOrigin(0.5);
      yPos += 45;
    });

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
  }
}
