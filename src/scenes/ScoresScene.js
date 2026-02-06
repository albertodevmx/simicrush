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
    const titleFontSize = isMobile ? "40px" : "56px";
    this.add
      .text(centerX, 40, "🏆 TOP PUNTAJES 🏆", {
        fontFamily: "Arial",
        fontSize: titleFontSize,
        color: "#ff5aa5",
        stroke: "#ffffff",
        strokeThickness: isMobile ? 3 : 4,
      })
      .setOrigin(0.5);

    // Botón volver
    const backBtnFontSize = isMobile ? "14px" : "18px";
    const backPadding = isMobile ? { left: 10, right: 10, top: 6, bottom: 6 } : { left: 12, right: 12, top: 8, bottom: 8 };
    const backBtn = this.add
      .text(20, 50, "← Volver", {
        fontFamily: "Arial",
        fontSize: backBtnFontSize,
        color: "#ffd1e8",
        backgroundColor: "#2a0033",
        padding: backPadding,
      })
      .setInteractive({ useHandCursor: true });

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
      const startY = 120;
      const rowHeight = isMobile ? 35 : 45;
      const maxRows = Math.floor((this.cameras.main.height - startY - 60) / rowHeight);
      const displayScores = topScores.slice(0, maxRows);

      const fontSizeRank = isMobile ? "13px" : "16px";
      const fontSizeInfo = isMobile ? "12px" : "14px";

      displayScores.forEach((score, index) => {
        const y = startY + index * rowHeight;
        const rank = index + 1;
        const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

        // Rank and score
        this.add
          .text(30, y, `${medal}`, {
            fontFamily: "Arial",
            fontSize: fontSizeRank,
            color: "#ff5aa5",
          });

        // Employee number and name
        this.add
          .text(80, y, `${score.employeeNumber} - ${score.playerName}`, {
            fontFamily: "Arial",
            fontSize: fontSizeInfo,
            color: "#ffd1e8",
          });

        // Score
        this.add
          .text(centerX - 60, y, `${score.score}`, {
            fontFamily: "Arial",
            fontSize: fontSizeRank,
            color: "#ff5aa5",
            align: "right",
          });

        // Date
        const date = new Date(score.endTime);
        const dateStr = date.toLocaleDateString("es-MX");
        this.add
          .text(centerX + 40, y, dateStr, {
            fontFamily: "Arial",
            fontSize: fontSizeInfo,
            color: "#999",
          });
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
