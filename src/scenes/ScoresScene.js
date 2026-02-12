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
      const bg = this.add.image(centerX, centerY, "menu-bg")
        .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
        .setAlpha(0);

      // FadeIn animation for background (500ms)
      this.tweens.add({
        targets: bg,
        alpha: 1,
        duration: 500,
        ease: "Linear"
      });
    }

    // Título con imagen (50px down)
    const titleImg = this.add
      .image(centerX, 90, "top-scores-title")
      .setOrigin(0.5)
      .setAlpha(0);

    // Scale title to 80% of screen width
    const titleTargetWidth = this.cameras.main.width * 0.8;
    const titleScale = titleTargetWidth / titleImg.width;
    titleImg.setScale(titleScale);

    // BounceIn animation for title
    this.tweens.add({
      targets: titleImg,
      alpha: 1,
      duration: 500,
      ease: "Bounce.out"
    });

    // Botón volver con imagen (centered, 240px from bottom - 100px down)
    const backBtn = this.add
      .image(centerX, this.cameras.main.height - 240, "btn-back-menu")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    // Scale button to fit (60% + 30% increase)
    const btnTargetWidth = isMobile ? 137 : 191;
    const btnScale = btnTargetWidth / backBtn.width;
    backBtn.setScale(btnScale);

    // BounceIn animation for back button from bottom
    this.tweens.add({
      targets: backBtn,
      alpha: 1,
      duration: 500,
      ease: "Bounce.out"
    });

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

      // Display scores (80px higher)
      const startY = 165;
      const horizontalPadding = 50;
      const rowHeight = isMobile ? 35 : 42;
      const maxRows = 10;
      const displayScores = topScores.slice(0, maxRows);

      const fontSizeRank = isMobile ? "16px" : "19px";
      const fontSizeInfo = isMobile ? "15px" : "17px";

      displayScores.forEach((score, index) => {
        const y = startY + index * rowHeight;
        const rank = index + 1;
        const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

        // Card background with horizontal padding
        const cardWidth = this.cameras.main.width - (horizontalPadding * 2);
        const cardX = horizontalPadding;
        const cardHeight = isMobile ? 25 : 30;
        const cardCenterX = horizontalPadding + cardWidth / 2;
        const card = this.add
          .rectangle(cardCenterX, y, cardWidth, cardHeight, 0xffffff, 0.95)
          .setStrokeStyle(2, 0xff5aa5, 0.5)
          .setAlpha(0);

        // Rank and medal
        const medalText = this.add
          .text(cardX + 8, y, `${medal}`, {
            fontFamily: "Arial",
            fontSize: fontSizeRank,
            color: "#ff5aa5",
            fontStyle: "bold",
          })
          .setOrigin(0, 0.5)
          .setAlpha(0);

        // Player name only
        const nameText = this.add
          .text(cardX + 48, y, `${score.playerName}`, {
            fontFamily: "Arial",
            fontSize: fontSizeInfo,
            color: "#000000",
            fontStyle: "bold",
          })
          .setOrigin(0, 0.5)
          .setAlpha(0);

        // Score
        const scoreText = this.add
          .text(cardCenterX + cardWidth / 2 - 8, y, `${score.score}`, {
            fontFamily: "Arial",
            fontSize: fontSizeRank,
            color: "#ff5aa5",
            fontStyle: "bold",
            align: "right",
          })
          .setOrigin(1, 0.5)
          .setAlpha(0);

        // Staggered fadeIn animation for each row
        const delay = 100 + (index * 80);
        this.tweens.add({
          targets: [card, medalText, nameText, scoreText],
          alpha: 1,
          duration: 400,
          delay: delay,
          ease: "Linear"
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
