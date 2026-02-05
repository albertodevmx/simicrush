import Phaser from "phaser";
import { startGame, endGame } from "../services/firebase.js";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super("game");
        this.gameId = null;
        this.employeeNumber = null;
        this.playerName = null;
    }

    init() {
        // Get game dimensions dynamically
        this.gameWidth = this.sys.game.config.width || 800;
        this.gameHeight = this.sys.game.config.height || 600;

        // Detect if mobile (portrait orientation)
        const isMobile = this.gameWidth < 500;

        // Config tablero - MISMO GRID para mobile y desktop (7x9)
        // Solo cambia el fondo, no el tablero, así nadie tiene ventaja
        this.cols = 7;
        this.rows = 9;

        // Calculate cell size to occupy max width with 50px total padding (25px each side)
        const sidePadding = 25;
        const maxCellWidth = (this.gameWidth - sidePadding * 2) / this.cols;
        const maxCellHeight = (this.gameHeight - (isMobile ? 170 : 200)) / this.rows;
        this.cell = Math.floor(Math.min(maxCellWidth, maxCellHeight, 60));
        this.boardPx = this.cols * this.cell;

        // Posición del tablero (centrado dinámicamente)
        this.boardX = (this.gameWidth - this.boardPx) / 2;
        this.boardY = isMobile ? 65 : 100; // menos espacio en mobile

        // Tipos de piezas (0..N-1) -> KEYS de tus sprites (cargados en PreloadScene)
        this.types = [
            "tile_heart_s",
            "tile_syringe",
            "tile_dog",
            "tile_coffee",
            "tile_plush",
            "tile_rocket",
        ];

        // Estado
        this.grid = []; // [row][col] = { type, sprite }
        this.selected = null;
        this.isBusy = false;

        // Score + tiempo
        this.score = 0;
        this.timeLeft = 60; // 60 segundos
        this.gameOver = false;
    }

    async create() {
        const centerX = this.gameWidth / 2;
        const centerY = this.gameHeight / 2;

        // Get player data from params or sessionStorage
        const playerData = this.sys.game.registry.get('playerData') ||
                          JSON.parse(sessionStorage.getItem("playerData") || "{}");

        if (playerData.employeeNumber && playerData.playerName) {
            this.employeeNumber = playerData.employeeNumber;
            this.playerName = playerData.playerName;

            try {
                // Register game start in Firebase
                this.gameId = await startGame(this.employeeNumber, this.playerName);
            } catch (error) {
                console.error("Error starting game in Firebase:", error);
            }
        }

        // Fondo
        this.add.rectangle(centerX, centerY, this.gameWidth, this.gameHeight, 0x13001c);
        this.add.rectangle(centerX, centerY, this.gameWidth, this.gameHeight, 0x2a0033, 0.25);

        // HUD
        const isMobile = this.gameWidth < 500;
        const fontSize = isMobile ? "14px" : "22px";
        const hudPadding = isMobile ? 12 : 20;
        const hudY = isMobile ? 10 : 15;

        this.scoreText = this.add
            .text(hudPadding, hudY, `Cuadros destruidos: 0`, {
                fontFamily: "Arial",
                fontSize: fontSize,
                color: "#ffd1e8",
            })
            .setDepth(10);

        this.timeText = this.add
            .text(this.gameWidth - hudPadding, hudY, `01:00`, {
                fontFamily: "Arial",
                fontSize: fontSize,
                color: "#ffffff",
            })
            .setOrigin(1, 0)
            .setDepth(10);

        // Botón menú
        const backFontSize = isMobile ? "12px" : "18px";
        const backY = isMobile ? 38 : 55;
        const back = this.add
            .text(hudPadding, backY, "← Menú", {
                fontFamily: "Arial",
                fontSize: backFontSize,
                color: "#ffd1e8",
                backgroundColor: "#2a0033",
                padding: { left: 10, right: 10, top: 6, bottom: 6 },
            })
            .setInteractive({ useHandCursor: true })
            .setDepth(10);

        back.on("pointerdown", () => {
            if (this.isBusy) return;
            this.scene.start("menu");
        });

        // Marco tablero
        this.add
            .rectangle(
                this.boardX + this.boardPx / 2,
                this.boardY + this.boardPx / 2,
                this.boardPx + 18,
                this.boardPx + 18,
                0x2a0033
            )
            .setStrokeStyle(4, 0xff5aa5, 0.7);

        // Crea tablero
        this.createBoard();

        // --- AUDIO: música de fondo (arranca tras primer interacción) ---
        this.bgm = this.sound.add("bgm_fondo", { loop: true, volume: 0.18 });

        // --- AUDIO: SFX (se instancian 1 sola vez) ---
        this.sfx = {
            swipe: this.sound.add("sfx_swipe", { volume: 0.35 }),
            slack: this.sound.add("sfx_slack", { volume: 0.40 }),
            pop: this.sound.add("sfx_pop", { volume: 0.45 }),
        };


        // Para no pelear con autoplay: la iniciamos en el primer click/tap del jugador
        this.input.once("pointerdown", () => {
            if (!this.bgm.isPlaying) this.bgm.play();
        });


        // Detener música si sales de la escena (para que no se duplique)
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (this.bgm) this.bgm.stop();
        });


        // ✅ Partículas (Phaser 3.90+): se crea UN SOLO emitter y se reutiliza
        // En Phaser 3.60+ ya NO existe createEmitter(). [1](https://github.com/phaserjs/phaser/issues/6476)[2](https://github-wiki-see.page/m/samme/phaser3-faq/wiki/Particles)
        if (this.textures.exists("fx_heart")) {
            this.matchEmitter = this.add.particles(0, 0, "fx_heart", {
                speed: { min: 80, max: 220 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.45, end: 0 },
                alpha: { start: 0.9, end: 0 },
                lifespan: { min: 350, max: 650 },
                gravityY: 250,
                blendMode: "ADD",
                emitting: false, // clave: no emite continuo, solo cuando llamemos explode()
            }).setDepth(50);
        } else {
            // Si por algo no cargó la textura, no tronamos el juego:
            this.matchEmitter = null;
        }

        // Input
        this.input.on("pointerdown", (pointer) => this.onPointerDown(pointer));

        // Timer (cada 1 segundo)
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.gameOver) return;
                this.timeLeft--;
                this.updateTimeText();
                if (this.timeLeft <= 0) this.endGame();
            },
        });

        this.updateTimeText();
    }


    // ---------- Board creation ----------

    createBoard() {
        // Inicializa grid sin matches iniciales
        this.grid = Array.from({ length: this.rows }, () =>
            Array.from({ length: this.cols }, () => null)
        );

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const type = this.randomTypeAvoidingMatch(r, c);
                const sprite = this.createTileSprite(r, c, type);

                this.grid[r][c] = { type, sprite };
            }
        }
    }




    createTileSprite(r, c, typeIndex, startY = null) {
        const x = this.cellCenterX(c);
        const y = startY ?? this.cellCenterY(r);

        const key = this.types[typeIndex];

        const sprite = this.add.image(x, y, key).setDepth(2);

        // Ajuste para encajar dentro de la celda
        const targetSize = this.cell - 10;
        const scale = targetSize / Math.max(sprite.width, sprite.height);
        sprite.setScale(scale);

        // Glow barato: duplicado detrás, ligeramente más grande
        const glow = this.add
            .image(x, y, key)
            .setDepth(1)
            .setTint(0xffffff)
            .setAlpha(0.18)
            .setScale(scale * 1.12);

        sprite.setData("r", r);
        sprite.setData("c", c);
        sprite.setData("glow", glow);
        sprite.setData("baseScale", scale);

        return sprite;
    }

    randomTypeAvoidingMatch(r, c) {
        // Evita formar match de 3 inmediato al generar
        let tries = 0;
        while (tries < 30) {
            const t = Phaser.Math.Between(0, this.types.length - 1);

            // Checa izquierda
            const left1 = c - 1 >= 0 ? this.grid[r][c - 1]?.type : null;
            const left2 = c - 2 >= 0 ? this.grid[r][c - 2]?.type : null;
            if (left1 === t && left2 === t) {
                tries++;
                continue;
            }

            // Checa arriba
            const up1 = r - 1 >= 0 ? this.grid[r - 1][c]?.type : null;
            const up2 = r - 2 >= 0 ? this.grid[r - 2][c]?.type : null;
            if (up1 === t && up2 === t) {
                tries++;
                continue;
            }

            return t;
        }
        return Phaser.Math.Between(0, this.types.length - 1);
    }

    // ---------- Input / Swap ----------

    onPointerDown(pointer) {
        if (this.isBusy || this.gameOver) return;

        const { r, c } = this.pointerToCell(pointer.x, pointer.y);
        if (!this.inBounds(r, c)) return;

        const tile = this.grid[r][c];
        if (!tile) return;

        if (!this.selected) {
            this.selectTile(r, c);
            return;
        }

        const { r: sr, c: sc } = this.selected;

        // Si toca la misma: deselecciona
        if (sr === r && sc === c) {
            this.clearSelection();
            return;
        }

        // Si no es adyacente, cambia selección
        if (!this.areAdjacent(sr, sc, r, c)) {
            this.clearSelection();
            this.selectTile(r, c);
            return;
        }

        // Intentar swap
        this.isBusy = true;
        this.clearSelection();
        this.trySwap(sr, sc, r, c);
    }

    selectTile(r, c) {
        this.selected = { r, c };

        const sprite = this.grid[r][c].sprite;
        const glow = sprite.getData("glow");
        if (glow) glow.setAlpha(0.55);

        this.tweens.add({
            targets: sprite,
            scale: sprite.getData("baseScale") * 1.12,
            duration: 110,
            yoyo: true,
            ease: "Sine.out",
        });
    }

    clearSelection() {
        if (!this.selected) return;
        const { r, c } = this.selected;
        const tile = this.grid[r][c];
        if (tile?.sprite) {
            const glow = tile.sprite.getData("glow");
            if (glow) glow.setAlpha(0.18);
        }
        this.selected = null;
    }

    async trySwap(r1, c1, r2, c2) {
        if (this.sfx?.swipe) this.sfx.swipe.play(); // ✅ swap intento

        await this.swapTilesAnimated(r1, c1, r2, c2);

        const matches = this.findAllMatches();
        if (matches.length === 0) {
            // ❌ no hubo match, se regresa:
            if (this.sfx?.slack) this.sfx.slack.play(); // ✅ slack cuando se regresa

            await this.swapTilesAnimated(r1, c1, r2, c2);
            this.isBusy = false;
            return;
        }

        // ✅ hubo match, lo resolverá removeMatches() (ahí pondremos pop)
        await this.resolveMatchesLoop();
        this.isBusy = false;
    }

    swapTilesData(r1, c1, r2, c2) {
        const a = this.grid[r1][c1];
        const b = this.grid[r2][c2];
        this.grid[r1][c1] = b;
        this.grid[r2][c2] = a;

        // Actualiza data (por si lo ocupas después)
        if (this.grid[r1][c1]?.sprite) {
            this.grid[r1][c1].sprite.setData("r", r1);
            this.grid[r1][c1].sprite.setData("c", c1);
        }
        if (this.grid[r2][c2]?.sprite) {
            this.grid[r2][c2].sprite.setData("r", r2);
            this.grid[r2][c2].sprite.setData("c", c2);
        }
    }

    swapTilesAnimated(r1, c1, r2, c2) {
        return new Promise((resolve) => {
            const t1 = this.grid[r1][c1];
            const t2 = this.grid[r2][c2];

            const x1 = this.cellCenterX(c1);
            const y1 = this.cellCenterY(r1);
            const x2 = this.cellCenterX(c2);
            const y2 = this.cellCenterY(r2);

            this.swapTilesData(r1, c1, r2, c2);

            const tween1 = this.tweens.add({
                targets: t1.sprite,
                x: x2,
                y: y2,
                duration: 130,
                ease: "Sine.inOut",
            });

            this.tweens.add({
                targets: t2.sprite,
                x: x1,
                y: y1,
                duration: 130,
                ease: "Sine.inOut",
            });

            // Glow acompaña
            const g1 = t1.sprite.getData("glow");
            const g2 = t2.sprite.getData("glow");
            if (g1) this.tweens.add({ targets: g1, x: x2, y: y2, duration: 130, ease: "Sine.inOut" });
            if (g2) this.tweens.add({ targets: g2, x: x1, y: y1, duration: 130, ease: "Sine.inOut" });

            tween1.on("complete", () => resolve());
        });
    }

    // ---------- Match finding ----------

    findAllMatches() {
        const matches = [];
        const marked = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));

        // Horizontal
        for (let r = 0; r < this.rows; r++) {
            let streak = 1;
            for (let c = 1; c <= this.cols; c++) {
                const prev = this.grid[r][c - 1];
                const curr = c < this.cols ? this.grid[r][c] : null;

                if (curr && prev && curr.type === prev.type) streak++;
                else {
                    if (streak >= 3) {
                        for (let k = 0; k < streak; k++) marked[r][c - 1 - k] = true;
                    }
                    streak = 1;
                }
            }
        }

        // Vertical
        for (let c = 0; c < this.cols; c++) {
            let streak = 1;
            for (let r = 1; r <= this.rows; r++) {
                const prev = this.grid[r - 1][c];
                const curr = r < this.rows ? this.grid[r][c] : null;

                if (curr && prev && curr.type === prev.type) streak++;
                else {
                    if (streak >= 3) {
                        for (let k = 0; k < streak; k++) marked[r - 1 - k][c] = true;
                    }
                    streak = 1;
                }
            }
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (marked[r][c]) matches.push({ r, c });
            }
        }

        return matches;
    }

    // ---------- Resolve loop (cascadas) ----------

    async resolveMatchesLoop() {
        while (true) {
            const matches = this.findAllMatches();
            if (matches.length === 0) break;

            await this.removeMatches(matches);
            await this.dropAndRefill();
        }
    }


    removeMatches(matches) {
        return new Promise((resolve) => {
            // Evitar duplicados
            const keySet = new Set(matches.map((m) => `${m.r},${m.c}`));
            const unique = Array.from(keySet).map((k) => {
                const [r, c] = k.split(",").map(Number);
                return { r, c };
            });

            // Score = número de cuadros destruidos
            this.score += unique.length;
            this.scoreText.setText(`Cuadros destruidos: ${this.score}`);

            // Tamaño del “burst” según el tamaño del match (se ve más épico en matches grandes)
            const burst = Phaser.Math.Clamp(6 + unique.length, 10, 26);

            unique.forEach(({ r, c }) => {
                const tile = this.grid[r][c];
                if (!tile) return;

                const sprite = tile.sprite;
                const glow = sprite.getData("glow");

                // ✅ Partículas (si el emitter existe)
                // explode(count, x, y) dispara un burst inmediato. [3](https://phaser.io/examples-show/567)[2](https://github-wiki-see.page/m/samme/phaser3-faq/wiki/Particles)
                if (this.matchEmitter) {
                    this.matchEmitter.explode(burst, sprite.x, sprite.y);
                }

                // Animación pop
                this.tweens.add({
                    targets: [sprite, glow].filter(Boolean),
                    scale: 0,
                    alpha: 0,
                    duration: 140,
                    ease: "Back.in",
                });
            });


            // ✅ Pop al eliminar (una vez por match/cascada)
            if (this.sfx?.pop) this.sfx.pop.play();


            // Después de animar, elimina del grid y destruye objetos
            this.time.delayedCall(160, () => {
                unique.forEach(({ r, c }) => {
                    const tile = this.grid[r][c];
                    if (!tile) return;

                    const sprite = tile.sprite;
                    const glow = sprite.getData("glow");
                    if (glow) glow.destroy();
                    sprite.destroy();

                    this.grid[r][c] = null;
                });

                resolve();
            });
        });
    }



    dropAndRefill() {
        return new Promise((resolve) => {
            const dropTweens = [];

            for (let c = 0; c < this.cols; c++) {
                let writeRow = this.rows - 1;

                // Compactar: bajar lo existente
                for (let r = this.rows - 1; r >= 0; r--) {
                    const tile = this.grid[r][c];
                    if (tile) {
                        if (r !== writeRow) {
                            this.grid[writeRow][c] = tile;
                            this.grid[r][c] = null;

                            const newY = this.cellCenterY(writeRow);
                            const sprite = tile.sprite;
                            const glow = sprite.getData("glow");

                            dropTweens.push(
                                this.tweens.add({
                                    targets: [sprite, glow].filter(Boolean),
                                    y: newY,
                                    duration: 160,
                                    ease: "Sine.in",
                                })
                            );
                        }
                        writeRow--;
                    }
                }

                // Refill: crear nuevos arriba para caer
                for (let r = writeRow; r >= 0; r--) {
                    const type = Phaser.Math.Between(0, this.types.length - 1);

                    const spawnY = this.cellCenterY(r) - this.cell * (writeRow - r + 1);
                    const sprite = this.createTileSprite(r, c, type, spawnY);

                    const tile = { type, sprite };
                    this.grid[r][c] = tile;

                    const glow = sprite.getData("glow");

                    dropTweens.push(
                        this.tweens.add({
                            targets: [sprite, glow].filter(Boolean),
                            y: this.cellCenterY(r),
                            duration: 220,
                            ease: "Bounce.out",
                        })
                    );
                }
            }

            if (dropTweens.length === 0) return resolve();
            this.time.delayedCall(240, () => resolve());
        });
    }

    // ---------- End game ----------

    async endGame() {
        this.gameOver = true;
        this.isBusy = true;

        if (this.timerEvent) this.timerEvent.remove(false);

        const centerX = this.gameWidth / 2;
        const centerY = this.gameHeight / 2;
        const isMobile = this.gameWidth < 500;

        // Register game end in Firebase
        if (this.gameId && this.employeeNumber) {
            try {
                await endGame(this.employeeNumber, this.gameId, this.score);
            } catch (error) {
                console.error("Error ending game in Firebase:", error);
            }
        }

        // Overlay
        this.add.rectangle(centerX, centerY, this.gameWidth, this.gameHeight, 0x000000, 0.55).setDepth(100);

        // Panel dimensions (responsive)
        const panelWidth = isMobile ? this.gameWidth - 20 : Math.min(this.gameWidth - 40, 520);
        const panelHeight = isMobile ? this.gameHeight - 80 : Math.min(this.gameHeight - 100, 350);

        const panel = this.add
            .rectangle(centerX, centerY, panelWidth, panelHeight, 0x2a0033, 0.95)
            .setStrokeStyle(4, 0xff5aa5, 0.9)
            .setDepth(101);

        // Font sizes (responsive)
        const titleFontSize = isMobile ? "32px" : "52px";
        const scoreFontSize = isMobile ? "20px" : "34px";
        const buttonFontSize = isMobile ? "12px" : "22px";
        const smallButtonFontSize = isMobile ? "11px" : "16px";

        // Positions inside panel
        const titleY = centerY - (panelHeight / 3.5);
        const scoreY = centerY - (panelHeight / 12);
        const button1Y = centerY + (panelHeight / 6);
        const button2Y = centerY + (panelHeight / 3);
        const button3Y = centerY + (panelHeight / 2.2);

        this.add
            .text(centerX, titleY, "⏰ ¡Tiempo!", {
                fontFamily: "Arial",
                fontSize: titleFontSize,
                color: "#ffffff",
                stroke: "#ff2d85",
                strokeThickness: isMobile ? 4 : 8,
            })
            .setOrigin(0.5)
            .setDepth(102);

        this.add
            .text(centerX, scoreY, `Cuadros destruidos:\n${this.score}`, {
                fontFamily: "Arial",
                fontSize: scoreFontSize,
                color: "#ffd1e8",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(102);

        this.saveLocalScore(this.score);

        const again = this.add
            .text(centerX, button1Y, "Jugar otra vez", {
                fontFamily: "Arial",
                fontSize: buttonFontSize,
                color: "#ffffff",
                backgroundColor: "#ff2d85",
                padding: { left: 12, right: 12, top: 8, bottom: 8 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(102);

        again.on("pointerdown", () => this.scene.start("menu"));

        const scores = this.add
            .text(centerX, button2Y, "Ver Puntajes", {
                fontFamily: "Arial",
                fontSize: buttonFontSize,
                color: "#ffffff",
                backgroundColor: "#6b21a8",
                padding: { left: 12, right: 12, top: 8, bottom: 8 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(102);

        scores.on("pointerdown", () => this.scene.start("scores"));

        const menu = this.add
            .text(centerX, button3Y, "Volver al menú", {
                fontFamily: "Arial",
                fontSize: smallButtonFontSize,
                color: "#ffd1e8",
                backgroundColor: "#1a0022",
                padding: { left: 10, right: 10, top: 6, bottom: 6 },
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(102);

        menu.on("pointerdown", () => this.scene.start("menu"));

        panel.scale = 0.9;
        this.tweens.add({
            targets: panel,
            scale: 1.0,
            duration: 220,
            ease: "Back.out",
        });
        this.tweens.add({
            targets: [again, scores, menu],
            alpha: { from: 0, to: 1 },
            duration: 250,
            delay: 120,
        });
    }

    saveLocalScore(score) {
        const key = "matchlove_scores";
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.push({ score, at: Date.now() });
        prev.sort((a, b) => b.score - a.score);
        localStorage.setItem(key, JSON.stringify(prev.slice(0, 50)));
    }

    // ---------- Helpers ----------

    updateTimeText() {
        const t = Math.max(0, this.timeLeft);
        const m = String(Math.floor(t / 60)).padStart(2, "0");
        const s = String(t % 60).padStart(2, "0");
        this.timeText.setText(`${m}:${s}`);

        if (t <= 10) {
            this.timeText.setColor("#ff2d85");
            this.tweens.add({
                targets: this.timeText,
                scale: 1.1,
                duration: 120,
                yoyo: true,
            });
        } else {
            this.timeText.setColor("#ffffff");
        }
    }

    pointerToCell(x, y) {
        const c = Math.floor((x - this.boardX) / this.cell);
        const r = Math.floor((y - this.boardY) / this.cell);
        return { r, c };
    }

    inBounds(r, c) {
        return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
    }

    areAdjacent(r1, c1, r2, c2) {
        const dr = Math.abs(r1 - r2);
        const dc = Math.abs(c1 - c2);
        return dr + dc === 1;
    }

    cellCenterX(c) {
        return this.boardX + c * this.cell + this.cell / 2;
    }

    cellCenterY(r) {
        return this.boardY + r * this.cell + this.cell / 2;
    }
}