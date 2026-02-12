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

    // Título con imagen
    const titleImg = this.add
      .image(centerX, centerY * 0.4 + 150, "menu-title")
      .setOrigin(0.5);

    // Scale title to 80% of screen width
    const titleTargetWidth = this.cameras.main.width * 0.8;
    const titleScale = titleTargetWidth / titleImg.width;
    titleImg.setScale(titleScale * 0.01);

    // Bounce scale animation for logo (from 1% to 100%, 1500ms)
    this.tweens.add({
      targets: titleImg,
      scaleX: titleScale,
      scaleY: titleScale,
      duration: 1500,
      ease: "Bounce.out"
    });

    // Animate title
    this.tweens.add({
      targets: titleImg,
      y: titleImg.y - 10,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    // Botón ENTRAR con imagen
    const btn = this.add
      .image(centerX, this.cameras.main.height + 100, "btn-enter")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Scale button to 40% of screen width
    const btnTargetWidth = this.cameras.main.width * 0.4;
    const btnScale = btnTargetWidth / btn.width;
    btn.setScale(btnScale);

    // BounceIn animation from bottom (1000ms)
    this.tweens.add({
      targets: btn,
      y: centerY + 20,
      duration: 1000,
      ease: "Bounce.out"
    });

    // Botón Puntajes con imagen
    const scoresBtn = this.add
      .image(centerX, this.cameras.main.height + 100, "btn-scores")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Scale button to 30% of screen width
    const scoresBtnTargetWidth = this.cameras.main.width * 0.3;
    const scoresBtnScale = scoresBtnTargetWidth / scoresBtn.width;
    scoresBtn.setScale(scoresBtnScale);

    // BounceIn animation from bottom (1000ms)
    this.tweens.add({
      targets: scoresBtn,
      y: centerY + 150,
      duration: 1000,
      ease: "Bounce.out"
    });

    // Botón Instrucciones con imagen
    const instructionsBtn = this.add
      .image(centerX, this.cameras.main.height + 100, "btn-instructions")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Scale button to 30% of screen width
    const instrBtnTargetWidth = this.cameras.main.width * 0.3;
    const instrBtnScale = instrBtnTargetWidth / instructionsBtn.width;
    instructionsBtn.setScale(instrBtnScale);

    // BounceIn animation from bottom (1000ms)
    this.tweens.add({
      targets: instructionsBtn,
      y: centerY + 210,
      duration: 1000,
      ease: "Bounce.out"
    });

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
      btn.setTint(0xffaacc);
    });

    btn.on("pointerout", () => {
      btn.clearTint();
    });
  }

  showPlayerForm() {
    const modal = document.getElementById("playerFormModal");
    const form = document.getElementById("playerForm");
    const employeeInput = document.getElementById("employeeNumber");
    const nameInput = document.getElementById("playerName");
    const closeBtn = document.getElementById("closeFormBtn");

    // Mark modal as open
    this.isModalOpen = true;

    // Reset form
    form.reset();
    document.getElementById("employeeError").classList.remove("show");
    document.getElementById("nameError").classList.remove("show");
    document.getElementById("formMessage").classList.remove("show");

    modal.classList.add("active");
    employeeInput.focus();

    // Remove previous listeners
    form.onsubmit = null;
    closeBtn.onclick = null;

    form.onsubmit = async (e) => {
      e.preventDefault();
      await this.validateAndSubmitForm();
    };

    // Close button functionality
    closeBtn.onclick = (e) => {
      e.preventDefault();
      modal.classList.remove("active");
      this.isModalOpen = false;
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
      } else if (!/^\d{6}$/.test(employeeNumber)) {
        employeeError.textContent = "Debe ser un número de 6 dígitos";
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

        if (recordsCount >= 1) {
          formMessage.textContent = "❌ Ya has agotado tu intento";
          formMessage.style.color = "#ff2d85";
          document.getElementById("submitBtn").disabled = false;
          resolve();
          return;
        }

        // Show message about attempt
        if (recordsCount === 0) {
          formMessage.textContent = "🎮 Este es tu único intento, ¡que gane el mejor!";
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
