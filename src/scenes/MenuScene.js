import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create() {
    // Fondo suave con gradiente “simulado” (rectángulo + overlay)
    this.add.rectangle(400, 300, 800, 600, 0x120018);
    this.add.rectangle(400, 300, 800, 600, 0x2a0033, 0.35);

    // Título
    const title = this.add
      .text(400, 190, "Match Love 💘", {
        fontFamily: "Arial",
        fontSize: "64px",
        color: "#ff5aa5",
        stroke: "#ffffff",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: 180,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    // Subtítulo
    this.add
      .text(400, 270, "Haz matches de 3 o más y llena la barra del amor", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffd1e8",
      })
      .setOrigin(0.5);

    // Botón
    const btn = this.add
      .text(400, 380, "💖 ENTRAR 💖", {
        fontFamily: "Arial",
        fontSize: "34px",
        color: "#ffffff",
        backgroundColor: "#ff2d85",
        padding: { left: 22, right: 22, top: 14, bottom: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Efectos del botón (impactante, barato)
    btn.on("pointerover", () => {
      btn.setStyle({ backgroundColor: "#ff5aa5" });
      this.tweens.add({ targets: btn, scale: 1.06, duration: 120, ease: "Sine.out" });
    });

    btn.on("pointerout", () => {
      btn.setStyle({ backgroundColor: "#ff2d85" });
      this.tweens.add({ targets: btn, scale: 1.0, duration: 120, ease: "Sine.out" });
    });

    btn.on("pointerdown", () => {
      // mini “tap”
      this.tweens.add({
        targets: btn,
        scale: 0.95,
        duration: 80,
        yoyo: true,
        onComplete: () => {
          this.scene.start("game"); // cambia a la escena principal
        },
      });
    });

    // Detallito: corazones flotando “fake particles” usando texto
    for (let i = 0; i < 14; i++) {
      const h = this.add
        .text(Phaser.Math.Between(40, 760), Phaser.Math.Between(620, 900), "❤", {
          fontFamily: "Arial",
          fontSize: Phaser.Math.Between(18, 34) + "px",
          color: Phaser.Math.RND.pick(["#ff5aa5", "#ffd1e8", "#ff2d85"]),
        })
        .setAlpha(0.55);

      this.tweens.add({
        targets: h,
        y: Phaser.Math.Between(-80, -20),
        x: h.x + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(4500, 8500),
        delay: Phaser.Math.Between(0, 1200),
        repeat: -1,
      });
    }
  }
}