import Phaser from "phaser";
import { getTopScores } from "../services/firebase.js";

export default class ScoresScene extends Phaser.Scene {
  constructor() {
    super("scores");
  }

  async create() {
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
    const titleFontSize = isMobile ? "30px" : "46px";
    this.add
      .text(centerX, 40, "🏆 TOP PUNTAJES 🏆", {
        fontFamily: "Arial",
        fontSize: titleFontSize,
        fontStyle: "bold",
        color: "#ff5aa5",
        stroke: "#ffffff",
        strokeThickness: isMobile ? 3 : 4,
      })
      .setOrigin(0.5);

    // Botón volver con imagen
    const backBtn = this.add
      .image(60, 70, "btn-back-menu")
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    // Scale button to fit (60% del tamaño anterior)
    const btnTargetWidth = isMobile ? 105 : 147;
    const btnScale = btnTargetWidth / backBtn.width;
    backBtn.setScale(btnScale);

    backBtn.on("pointerdown", () => {
      this.scene.start("menu");
    });

    // Loading message
    const loadingText = this.add
      .text(centerX, centerY, "Cargando puntajes...", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffd1e8",
      })
      .setOrigin(0.5);

    try {
      // Get top scores
      const topScores = await getTopScores(50);

      // Remove loading text
      loadingText.destroy();

      if (topScores.length === 0) {
        this.add
          .text(centerX, centerY, "No hay puntajes registrados aún", {
            fontFamily: "Arial",
            fontSize: isMobile ? "16px" : "20px",
            color: "#ffd1e8",
          })
          .setOrigin(0.5);
        return;
      }

      // Display scores
      const startY = 105;
      const rowHeight = isMobile ? 35 : 42;
      const maxRows = Math.floor((this.cameras.main.height - startY - 60) / rowHeight);
      const displayScores = topScores.slice(0, maxRows);

      const fontSizeRank = isMobile ? "16px" : "19px";
      const fontSizeInfo = isMobile ? "15px" : "17px";

      displayScores.forEach((score, index) => {
        const y = startY + index * rowHeight;
        const rank = index + 1;
        const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

        // Card background (rectangle with rounded corners effect)
        const cardWidth = isMobile ? 260 : 500;
        const cardX = centerX - cardWidth / 2;
        const cardHeight = isMobile ? 25 : 30;
        this.add
          .rectangle(centerX, y, cardWidth, cardHeight, 0xffffff, 0.95)
          .setStrokeStyle(2, 0xff5aa5, 0.5);

        // Rank and medal
        this.add
          .text(cardX + 8, y, `${medal}`, {
            fontFamily: "Arial",
            fontSize: fontSizeRank,
            color: "#ff5aa5",
            fontStyle: "bold",
          })
          .setOrigin(0, 0.5);

        // Player name only
        this.add
          .text(cardX + 48, y, `${score.playerName}`, {
            fontFamily: "Arial",
            fontSize: fontSizeInfo,
            color: "#000000",
            fontStyle: "bold",
          })
          .setOrigin(0, 0.5);

        // Score
        this.add
          .text(centerX + cardWidth / 2 - 8, y, `${score.score}`, {
            fontFamily: "Arial",
            fontSize: fontSizeRank,
            color: "#ff5aa5",
            fontStyle: "bold",
            align: "right",
          })
          .setOrigin(1, 0.5);
      });

      // Info text
      if (topScores.length > maxRows) {
        this.add
          .text(centerX, this.cameras.main.height - 40, `Mostrando ${displayScores.length} de ${topScores.length} puntajes`, {
            fontFamily: "Arial",
            fontSize: "12px",
            color: "#999",
          })
          .setOrigin(0.5);
      }
    } catch (error) {
      console.error("Error loading scores:", error);
      loadingText.setText("Error al cargar puntajes");
      loadingText.setColor("#ff2d85");
    }
  }
}
