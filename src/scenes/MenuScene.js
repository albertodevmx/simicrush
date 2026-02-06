import Phaser from "phaser";
import { getPlayerRecordsCount } from "../services/firebase.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  async create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const isMobile = this.cameras.main.width < 500;

    // Track if modal is open
    this.isModalOpen = false;

    // Fondo con imagen o color
    if (this.textures.exists("menu-bg")) {
      this.add.image(centerX, centerY, "menu-bg").setDisplaySize(
        this.cameras.main.width,
        this.cameras.main.height
      );
    } else {
      // Fallback: rectángulos de color
      this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x120018);
      this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x2a0033, 0.35);
    }

    // Título
    const titleFontSize = isMobile ? "48px" : "64px";
    const title = this.add
      .text(centerX, centerY * 0.5, "Match Love 💘", {
        fontFamily: "Arial",
        fontSize: titleFontSize,
        color: "#ff5aa5",
        stroke: "#ffffff",
        strokeThickness: isMobile ? 4 : 6,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: centerY * 0.5 - 10,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    // Título con imagen
    const titleImg = this.add
      .image(centerX, centerY * 0.4, "menu-title")
      .setOrigin(0.5);

    // Scale title to 80% of screen width
    titleImg.setDisplayWidth(this.cameras.main.width * 0.8);
    titleImg.setDisplayHeight(undefined);

    // Animate title
    this.tweens.add({
      targets: titleImg,
      y: titleImg.y - 10,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    // Subtítulo
    const subtitleFontSize = isMobile ? "12px" : "16px";
    this.add
      .text(centerX, centerY * 0.65, "Haz matches de 3 o más y consigue un cupido especial con 5+", {
        fontFamily: "Arial",
        fontSize: subtitleFontSize,
        color: "#ffd1e8",
        align: "center",
        wordWrap: { width: isMobile ? 250 : 400 }
      })
      .setOrigin(0.5);

    // Botón ENTRAR con imagen
    const btn = this.add
      .image(centerX, centerY + 80, "btn-enter")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Scale button to 40% of screen width
    btn.setDisplayWidth(this.cameras.main.width * 0.4);
    btn.setDisplayHeight(undefined);

    // Botón Puntajes con imagen
    const scoresBtn = this.add
      .image(centerX, centerY + 140, "btn-scores")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Scale button to 40% of screen width
    scoresBtn.setDisplayWidth(this.cameras.main.width * 0.4);
    scoresBtn.setDisplayHeight(undefined);

    // Botón Instrucciones con imagen
    const instructionsBtn = this.add
      .image(centerX, this.cameras.main.height - 40, "btn-instructions")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Scale button to 40% of screen width
    instructionsBtn.setDisplayWidth(this.cameras.main.width * 0.4);
    instructionsBtn.setDisplayHeight(undefined);

    // Store button references for enable/disable
    this.enterBtn = btn;
    this.scoresBtn = scoresBtn;

    // Button effects
    this.setupButtonEffects(btn);
    this.setupButtonEffects(scoresBtn);

    // Button interactions
    btn.on("pointerdown", () => {
      if (this.isModalOpen) return;
      this.showPlayerForm();
    });

    scoresBtn.on("pointerdown", () => {
      if (this.isModalOpen) return;
      this.scene.start("scores");
    });

    instructionsBtn.on("pointerdown", () => {
      if (this.isModalOpen) return;
      this.scene.start("instructions");
    });

    // Floating hearts
    const heartCount = isMobile ? 6 : 14;
    for (let i = 0; i < heartCount; i++) {
      const h = this.add
        .text(
          Phaser.Math.Between(40, this.cameras.main.width - 40),
          Phaser.Math.Between(this.cameras.main.height + 20, this.cameras.main.height + 100),
          "❤",
          {
            fontFamily: "Arial",
            fontSize: Phaser.Math.Between(18, 34) + "px",
            color: Phaser.Math.RND.pick(["#ff5aa5", "#ffd1e8", "#ff2d85"]),
          }
        )
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

  setupButtonEffects(btn) {
    btn.on("pointerover", () => {
      btn.setStyle({ backgroundColor: "#ff5aa5" });
      this.tweens.add({ targets: btn, scale: 1.06, duration: 120, ease: "Sine.out" });
    });

    btn.on("pointerout", () => {
      btn.setStyle({ backgroundColor: btn.getData("originalBg") || "#ff2d85" });
      this.tweens.add({ targets: btn, scale: 1.0, duration: 120, ease: "Sine.out" });
    });
  }

  showPlayerForm() {
    const modal = document.getElementById("playerFormModal");
    const form = document.getElementById("playerForm");
    const employeeInput = document.getElementById("employeeNumber");
    const nameInput = document.getElementById("playerName");

    // Mark modal as open
    this.isModalOpen = true;

    // Reset form
    form.reset();
    document.getElementById("employeeError").classList.remove("show");
    document.getElementById("nameError").classList.remove("show");
    document.getElementById("formMessage").classList.remove("show");

    modal.classList.add("active");
    employeeInput.focus();

    // Remove previous listener
    form.onsubmit = null;

    form.onsubmit = async (e) => {
      e.preventDefault();
      await this.validateAndSubmitForm();
    };
  }

  validateAndSubmitForm() {
    return new Promise(async (resolve) => {
      const employeeNumber = document.getElementById("employeeNumber").value.trim();
      const playerName = document.getElementById("playerName").value.trim();

      const employeeError = document.getElementById("employeeError");
      const nameError = document.getElementById("nameError");
      const formMessage = document.getElementById("formMessage");

      let isValid = true;

      // Reset errors
      employeeError.classList.remove("show");
      nameError.classList.remove("show");
      formMessage.classList.remove("show");

      // Validate employee number
      if (!employeeNumber) {
        employeeError.textContent = "El número de empleado es requerido";
        employeeError.classList.add("show");
        isValid = false;
      } else if (!/^\d{5}$/.test(employeeNumber)) {
        employeeError.textContent = "Debe ser un número de 5 dígitos";
        employeeError.classList.add("show");
        isValid = false;
      }

      // Validate name
      if (!playerName) {
        nameError.textContent = "El nombre es requerido";
        nameError.classList.add("show");
        isValid = false;
      } else if (!/^[a-zA-ZáéíóúàèìòùñÑÁÉÍÓÚÀÈÌÒÙ\s'-]+$/.test(playerName)) {
        nameError.textContent = "El nombre solo puede contener letras, espacios, apóstrofes y guiones";
        nameError.classList.add("show");
        isValid = false;
      } else if (playerName.length < 2) {
        nameError.textContent = "El nombre debe tener al menos 2 caracteres";
        nameError.classList.add("show");
        isValid = false;
      }

      if (!isValid) {
        resolve();
        return;
      }

      try {
        // Disable submit button
        document.getElementById("submitBtn").disabled = true;
        formMessage.textContent = "Verificando...";
        formMessage.classList.add("show");

        // Check records count
        const recordsCount = await getPlayerRecordsCount(employeeNumber);

        if (recordsCount >= 3) {
          formMessage.textContent = "❌ Has completado tus 3 intentos";
          formMessage.style.color = "#ff2d85";
          document.getElementById("submitBtn").disabled = false;
          resolve();
          return;
        }

        // Show message about remaining attempts
        const remaining = 3 - recordsCount;
        if (recordsCount === 0) {
          formMessage.textContent = "🎮 Eres nuevo en el juego, tienes 3 oportunidades";
          formMessage.style.color = "#ffd1e8";
        } else {
          formMessage.textContent = `⚡ Te restan ${remaining} oportunidad${remaining > 1 ? "es" : ""}`;
          formMessage.style.color = "#ffd1e8";
        }
        formMessage.classList.add("show");

        // Delay before starting game
        setTimeout(() => {
          // Store player data and navigate to game
          sessionStorage.setItem("playerData", JSON.stringify({
            employeeNumber,
            playerName,
            recordsCount,
          }));

          // Hide modal and start game
          document.getElementById("playerFormModal").classList.remove("active");
          document.getElementById("submitBtn").disabled = false;
          this.isModalOpen = false;

          // Store in registry and sessionStorage for persistence
          this.sys.game.registry.set('playerData', { employeeNumber, playerName, recordsCount });
          this.scene.start("game");
          resolve();
        }, 1500);
      } catch (error) {
        console.error("Error validating form:", error);
        formMessage.textContent = "Error en la validación. Intenta de nuevo.";
        formMessage.style.color = "#ff2d85";
        formMessage.classList.add("show");
        document.getElementById("submitBtn").disabled = false;
        resolve();
      }
    });
  }
}
