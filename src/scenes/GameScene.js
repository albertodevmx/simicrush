import Phaser from "phaser";
import { startGame, endGame } from "../services/firebase.js";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super("game");
        this.gameId = null;
        this.employeeNumber = null;
        this.playerName = null;
        this.swipeStart = null;
        this.lastSwipeTime = 0;
        this.hintTimer = null;
        this.hintGraphics = null;
        this.isFirstMatchInCascade = false;
        this.centerTaps = []; // Easter egg: track rapid center taps
    }

    init() {
        // Get game dimensions dynamically
        this.gameWidth = this.sys.game.config.width || 800;
        this.gameHeight = this.sys.game.config.height || 600;

        // Detect if mobile (portrait orientation)
        const isMobile = this.gameWidth < 500;

        // Config tablero - MISMO GRID para mobile y desktop (6x10)
        // Solo cambia el fondo, no el tablero, así nadie tiene ventaja
        this.cols = 6;
        this.rows = 10;

        // Calculate cell size to occupy max width with 50px total padding (25px each side)
        const sidePadding = 25;
        const maxCellWidth = (this.gameWidth - sidePadding * 2) / this.cols;
        const maxCellHeight = (this.gameHeight - (isMobile ? 170 : 200)) / this.rows;
        this.cell = Math.floor(Math.min(maxCellWidth, maxCellHeight, 60));
        this.boardPx = this.cols * this.cell;

        // Posición del tablero (centrado dinámicamente)
        this.boardX = (this.gameWidth - this.boardPx) / 2;
        this.boardY = isMobile ? 105 : 140; // subido 80px

        // Tipos de piezas (0..N-1) -> KEYS de tus sprites (cargados en PreloadScene)
        this.types = [
            "tile_heart_s",
            "tile_syringe",
            "tile_dog",
            "tile_coffee",
            "tile_plush",
            "tile_rocket",
        ];

        // Special tile types (not in normal types)
        this.SUPER_COMBO_TYPE = "superCombo";
        this.CUPIDO_TYPE = "tile_cupido";

        // Estado
        this.grid = []; // [row][col] = { type, sprite }
        this.selected = null;
        this.isBusy = false;

        // Score + tiempo
        this.score = 0;
        this.timeLeft = 90; // 90 segundos (minuto y medio)
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

        // Fondo con imagen
        if (this.textures.exists("game-bg")) {
            this.add.image(centerX, centerY, "game-bg").setDisplaySize(
                this.gameWidth,
                this.gameHeight
            ).setDepth(0);
        }

        // Detectar mobile antes de usarlo
        const isMobile = this.gameWidth < 500;

        // Define HUD height
        const hudHeight = isMobile ? 110 : 140;

        // Fondo negro para área HUD (marcadores)
        this.add
            .rectangle(centerX, hudHeight / 2, this.gameWidth, hudHeight, 0x000000, 0.6)
            .setDepth(0);

        // Fondo azul claro para área de juego
        this.add
            .rectangle(centerX, hudHeight + (this.gameHeight - hudHeight) / 2, this.gameWidth, this.gameHeight - hudHeight, 0x3399ff, 0.3)
            .setDepth(0);

        // HUD
        const fontSize = isMobile ? "19px" : "27px";
        const hudPadding = isMobile ? 12 : 20;
        const hudY = isMobile ? 10 : 15;

        this.scoreText = this.add
            .text(hudPadding, hudY, `Cuadros destruidos: 0`, {
                fontFamily: "Arial",
                fontSize: fontSize,
                fontStyle: "bold",
                color: "#ffd1e8",
                backgroundColor: "#000000",
                padding: { left: 10, right: 10, top: 5, bottom: 5 },
            })
            .setDepth(10);

        this.timeText = this.add
            .text(this.gameWidth - hudPadding, hudY, `02:00`, {
                fontFamily: "Arial",
                fontSize: fontSize,
                fontStyle: "bold",
                color: "#ffffff",
                backgroundColor: "#000000",
                padding: { left: 10, right: 10, top: 5, bottom: 5 },
            })
            .setOrigin(1, 0)
            .setDepth(10);

        // Botón menú con imagen
        const backY = isMobile ? 65 : 85;
        this.menuBtn = this.add
            .image(hudPadding + 20, backY, "btn-back-menu")
            .setOrigin(0, 0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(10);

        // Scale button to fit (65% del tamaño anterior)
        const btnTargetWidth = isMobile ? 114 : 159;
        const btnScale = btnTargetWidth / this.menuBtn.width;
        this.menuBtn.setScale(btnScale);

        this.menuBtn.on("pointerdown", (pointer) => {
            if (this.isBusy) return;
            pointer.event.stopPropagation();
            this.scene.start("menu");
        });

        // Marco tablero (6x10 grid)
        const boardHeight = this.rows * this.cell;
        this.add
            .rectangle(
                this.boardX + this.boardPx / 2,
                this.boardY + boardHeight / 2,
                this.boardPx + 18,
                boardHeight + 18,
                0x000000,
                0.3
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

        // Input - Swipe gesture detection
        this.input.on("pointerdown", (pointer) => {
            this.onSwipeStart(pointer);
            this.detectCenterTap(pointer); // Easter egg detection
        });
        this.input.on("pointerup", (pointer) => this.onSwipeEnd(pointer));

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
        sprite.setData("clickCount", 0); // Easter egg: track clicks on this icon

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

    // ---------- Input / Swipe System ----------

    onSwipeStart(pointer) {
        if (this.isBusy || this.gameOver) return;

        // Check if pointer is on the board area (not on HUD buttons)
        const { r, c } = this.pointerToCell(pointer.x, pointer.y);
        if (!this.inBounds(r, c)) return;

        // Verify pointer is actually on a tile (extra safety check)
        const tile = this.grid[r] && this.grid[r][c];
        if (!tile) return;

        // Store swipe start data
        this.swipeStart = {
            x: pointer.x,
            y: pointer.y,
            r: r,
            c: c,
            time: this.time.now,
        };
    }

    onSwipeEnd(pointer) {
        if (!this.swipeStart || this.isBusy || this.gameOver) {
            this.swipeStart = null;
            return;
        }

        const dx = pointer.x - this.swipeStart.x;
        const dy = pointer.y - this.swipeStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Minimum swipe distance (in pixels)
        const minSwipeDistance = 30;

        if (distance < minSwipeDistance) {
            // Detect tap on icon (easter egg: 7 taps to destroy)
            const tile = this.grid[this.swipeStart.r] && this.grid[this.swipeStart.r][this.swipeStart.c];
            if (tile && tile.sprite) {
                this.detectIconTap(tile.sprite);
            }
            this.swipeStart = null;
            return;
        }

        // Double-check that swipe started and ended on valid board tiles
        const startTile = this.grid[this.swipeStart.r] && this.grid[this.swipeStart.r][this.swipeStart.c];
        if (!startTile) {
            this.swipeStart = null;
            return;
        }

        // Determine swipe direction
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        let targetR = this.swipeStart.r;
        let targetC = this.swipeStart.c;

        // If horizontal swipe is dominant
        if (absDx > absDy) {
            if (dx > 0) {
                // Swipe right
                targetC = this.swipeStart.c + 1;
            } else {
                // Swipe left
                targetC = this.swipeStart.c - 1;
            }
        } else {
            // Vertical swipe is dominant
            if (dy > 0) {
                // Swipe down
                targetR = this.swipeStart.r + 1;
            } else {
                // Swipe up
                targetR = this.swipeStart.r - 1;
            }
        }

        // Check if target is in bounds
        if (!this.inBounds(targetR, targetC)) {
            this.swipeStart = null;
            return;
        }

        // Check if target tile exists
        const targetTile = this.grid[targetR][targetC];
        if (!targetTile) {
            this.swipeStart = null;
            return;
        }

        // Perform swap
        this.isBusy = true;
        this.trySwap(this.swipeStart.r, this.swipeStart.c, targetR, targetC);
        this.swipeStart = null;
    }

    async trySwap(r1, c1, r2, c2) {
        if (this.sfx?.swipe) this.sfx.swipe.play(); // ✅ swap intento

        // Check if either tile is a super combo
        const tile1 = this.grid[r1][c1];
        const tile2 = this.grid[r2][c2];
        const isSuperComboSwap = tile1?.isSuperCombo || tile2?.isSuperCombo;

        await this.swapTilesAnimated(r1, c1, r2, c2);

        // Handle super combo activation
        if (isSuperComboSwap) {
            let targetType;
            if (tile1?.isSuperCombo) {
                // Super combo is at r1,c1, so after swap it's at r2,c2
                targetType = tile2?.type; // Get type of tile that was at r2,c2 before swap
            } else {
                // Super combo is at r2,c2, so after swap it's at r1,c1
                targetType = tile1?.type; // Get type of tile that was at r1,c1 before swap
            }

            if (targetType && targetType !== this.SUPER_COMBO_TYPE) {
                // Destroy all tiles matching the type
                await this.destroyAllOfType(targetType);
                this.isBusy = false;
                this.lastSwipeTime = this.time.now;
                this.startHintTimer();
                return;
            }
        }

        const matches = this.findAllMatches();
        if (matches.length === 0) {
            // ❌ no hubo match, se regresa:
            if (this.sfx?.slack) this.sfx.slack.play(); // ✅ slack cuando se regresa

            await this.swapTilesAnimated(r1, c1, r2, c2);
            this.isBusy = false;
            this.lastSwipeTime = this.time.now;
            this.startHintTimer();
            return;
        }

        // ✅ hubo match, lo resolverá removeMatches() (ahí pondremos pop)
        this.clearHint();
        await this.resolveMatchesLoop();
        this.isBusy = false;
        this.lastSwipeTime = this.time.now;
        this.startHintTimer();
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
        let isFirstMatch = true;
        while (true) {
            const matches = this.findAllMatches();
            if (matches.length === 0) break;

            await this.removeMatches(matches, isFirstMatch);
            await this.dropAndRefill();
            isFirstMatch = false;
        }
    }


    removeMatches(matches, isFirstMatch = false) {
        return new Promise((resolve) => {
            // Evitar duplicados
            const keySet = new Set(matches.map((m) => `${m.r},${m.c}`));
            const unique = Array.from(keySet).map((k) => {
                const [r, c] = k.split(",").map(Number);
                return { r, c };
            });

            // Detect big match (5+ blocks in a straight line) - only on first match in cascade
            const isBigMatch = isFirstMatch && unique.length >= 5;
            const isStraightLine = isBigMatch && this.isStraightLineMatch(unique);

            if (isBigMatch && isStraightLine) {
                this.handleBigMatch();
                this.lastBigMatchPosition = unique[Math.floor(unique.length / 2)]; // Store center position for super combo
            }

            // Score = número de cuadros destruidos
            this.score += unique.length;
            this.scoreText.setText(`Cuadros destruidos: ${this.score}`);

            // Tamaño del "burst" según el tamaño del match (se ve más épico en matches grandes)
            const burst = Phaser.Math.Clamp(6 + unique.length, 10, 26);

            // Check if there's a cupido in the match and get the type it's matching with
            let cupidoMatchType = null;
            unique.forEach(({ r, c }) => {
                const tile = this.grid[r][c];
                if (tile && tile.type === this.CUPIDO_TYPE) {
                    // Find the type of the other tiles in this match
                    const typeCounts = {};
                    unique.forEach(({ r: mr, c: mc }) => {
                        const t = this.grid[mr][mc];
                        if (t && t.type !== this.CUPIDO_TYPE) {
                            typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
                        }
                    });
                    // Get the most common type (or any type if multiple)
                    cupidoMatchType = Object.keys(typeCounts)[0] || null;
                }
            });

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

                // If cupido was in the match, destroy all tiles of that type
                if (cupidoMatchType) {
                    this.destroyAllOfCupidoType(cupidoMatchType).then(() => resolve());
                } else {
                    resolve();
                }
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

            if (dropTweens.length === 0) {
                // Check for available moves after drop
                setTimeout(async () => {
                    // Spawn super combo if there was a big match
                    if (this.lastBigMatchPosition) {
                        this.spawnSuperCombo(this.lastBigMatchPosition.r, this.lastBigMatchPosition.c);
                        this.lastBigMatchPosition = null;
                    }
                    if (!this.hasAvailableMoves()) {
                        await this.reshuffleBoard();
                    }
                    resolve();
                }, 100);
            } else {
                this.time.delayedCall(240, async () => {
                    // Spawn super combo if there was a big match
                    if (this.lastBigMatchPosition) {
                        this.spawnSuperCombo(this.lastBigMatchPosition.r, this.lastBigMatchPosition.c);
                        this.lastBigMatchPosition = null;
                    }
                    // Check for available moves after drop
                    if (!this.hasAvailableMoves()) {
                        await this.reshuffleBoard();
                    }
                    resolve();
                });
            }
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

        // Overlay - must be interactive to block clicks to game board
        const overlay = this.add.rectangle(centerX, centerY, this.gameWidth, this.gameHeight, 0x000000, 0.55).setDepth(100);
        overlay.setInteractive();
        // Prevent overlay from triggering any events
        overlay.on("pointerdown", () => {});
        overlay.on("pointerup", () => {});

        // Panel dimensions (responsive) - compact fixed height
        const panelWidth = this.gameWidth * 0.7;
        const panelHeight = isMobile ? 300 : 320;  // Fixed compact height

        const panel = this.add
            .rectangle(centerX, centerY, panelWidth, panelHeight, 0x2a0033, 0.6)
            .setStrokeStyle(4, 0xff5aa5, 0.9)
            .setDepth(101);

        // Font sizes (responsive)
        const titleFontSize = isMobile ? "32px" : "52px";
        const scoreFontSize = isMobile ? "20px" : "34px";
        const buttonFontSize = isMobile ? "12px" : "22px";
        const smallButtonFontSize = isMobile ? "11px" : "16px";

        // Positions inside panel - sequential top-to-bottom with fixed spacing
        const panelTop = centerY - (panelHeight / 2);
        const titleY = panelTop + 40;
        const scoreY = titleY + 65;
        const button1Y = scoreY + 75;
        const button2Y = button1Y + 60;

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
            .text(centerX, scoreY, `Puntos obtenidos:\n${this.score}`, {
                fontFamily: "Arial",
                fontSize: scoreFontSize,
                color: "#ffd1e8",
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(102);

        this.saveLocalScore(this.score);

        const scores = this.add
            .image(centerX, button1Y, "btn-scores")
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(102);

        // Scale scores button (30% of screen width)
        const scoresBtnTargetWidth = this.gameWidth * 0.3;
        const scoresBtnScale = scoresBtnTargetWidth / scores.width;
        scores.setScale(scoresBtnScale);

        scores.on("pointerdown", (pointer) => {
            pointer.event.stopPropagation();
            this.scene.start("scores");
        });

        const menu = this.add
            .image(centerX, button2Y, "btn-back-menu")
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(102);

        // Scale menu button
        const menuBtnTargetWidth = isMobile ? 160 : 224;
        const menuBtnScale = menuBtnTargetWidth / menu.width;
        menu.setScale(menuBtnScale);

        menu.on("pointerdown", (pointer) => {
            pointer.event.stopPropagation();
            this.scene.start("menu");
        });

        panel.scale = 0.9;
        this.tweens.add({
            targets: panel,
            scale: 1.0,
            duration: 220,
            ease: "Back.out",
        });
        this.tweens.add({
            targets: [scores, menu],
            alpha: { from: 0, to: 1 },
            duration: 250,
            delay: 120,
        });
    }

    // ---------- Hint System (3 seconds idle) ----------

    startHintTimer() {
        if (this.hintTimer) this.time.removeEvent(this.hintTimer);

        this.hintTimer = this.time.addEvent({
            delay: 3000,
            callback: () => {
                if (!this.isBusy && !this.gameOver) {
                    this.showHint();
                }
            },
        });
    }

    showHint() {
        const hint = this.findPossibleMatches();
        if (!hint) return;

        // Clear old hint
        this.clearHint();

        // Create graphics for hint box
        this.hintGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        this.hintGraphics.setDepth(5);

        // Draw boxes around the 3 tiles
        hint.matches.forEach((pos) => {
            const x = this.cellCenterX(pos.c);
            const y = this.cellCenterY(pos.r);
            const size = this.cell / 2;

            this.hintGraphics.lineStyle(3, 0xffd1e8, 0.8);
            this.hintGraphics.strokeRect(x - size, y - size, this.cell, this.cell);
        });

        this.add.existing(this.hintGraphics);

        // Animate the hint box (pulse effect)
        this.tweens.add({
            targets: this.hintGraphics,
            alpha: { from: 0.8, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: 2,
        });
    }

    clearHint() {
        if (this.hintTimer) {
            this.time.removeEvent(this.hintTimer);
            this.hintTimer = null;
        }
        if (this.hintGraphics) {
            this.hintGraphics.destroy();
            this.hintGraphics = null;
        }
    }

    findPossibleMatches() {
        // Try to find a possible swap that would result in a match
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                // Try swap with right neighbor
                if (c < this.cols - 1) {
                    this.swapTilesData(r, c, r, c + 1);
                    const matches = this.findAllMatches();
                    this.swapTilesData(r, c, r, c + 1); // Swap back

                    if (matches.length > 0) {
                        return { matches };
                    }
                }

                // Try swap with bottom neighbor
                if (r < this.rows - 1) {
                    this.swapTilesData(r, c, r + 1, c);
                    const matches = this.findAllMatches();
                    this.swapTilesData(r, c, r + 1, c); // Swap back

                    if (matches.length > 0) {
                        return { matches };
                    }
                }
            }
        }
        return null;
    }

    // ---------- Straight Line Detection ----------

    isStraightLineMatch(positions) {
        if (positions.length < 5) return false;

        // Check if all tiles are in the same row (horizontal line)
        const rows = new Set(positions.map(p => p.r));
        if (rows.size === 1) return true;

        // Check if all tiles are in the same column (vertical line)
        const cols = new Set(positions.map(p => p.c));
        if (cols.size === 1) return true;

        return false;
    }

    // ---------- Big Match Bonus (5+ blocks in straight line = hearts) ----------

    handleBigMatch() {
        // Spawn floating hearts from bottom to top
        const heartCount = 10;
        for (let i = 0; i < heartCount; i++) {
            const heart = this.add
                .text(
                    Phaser.Math.Between(50, this.gameWidth - 50),
                    this.gameHeight + 30,
                    "❤",
                    {
                        fontFamily: "Arial",
                        fontSize: Phaser.Math.Between(24, 48) + "px",
                        color: Phaser.Math.RND.pick(["#ff5aa5", "#ffd1e8", "#ff2d85"]),
                    }
                )
                .setDepth(30)
                .setAlpha(0.9);

            // Floating animation
            this.tweens.add({
                targets: heart,
                y: -50,
                alpha: 0,
                duration: 2000,
                delay: Phaser.Math.Between(0, 300),
                ease: "Sine.inOut",
                onComplete: () => {
                    heart.destroy();
                },
            });
        }

        // Play bonus visual effect on score text
        this.tweens.add({
            targets: this.scoreText,
            scale: 1.2,
            duration: 300,
            yoyo: true,
        });
    }

    // ---------- Super Combo Tile ----------

    destroyAllOfType(type) {
        return new Promise((resolve) => {
            const tilesToDestroy = [];
            let superComboPos = null;

            // Find all tiles of this type AND the super combo
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const tile = this.grid[r][c];
                    if (tile && tile.type === type && !tile.isSuperCombo) {
                        tilesToDestroy.push({ r, c, tile });
                    }
                    // Also mark super combo for destruction
                    if (tile && tile.isSuperCombo) {
                        superComboPos = { r, c, tile };
                    }
                }
            }

            if (tilesToDestroy.length === 0) {
                resolve();
                return;
            }

            // Add points for destroyed tiles
            this.score += tilesToDestroy.length;
            this.scoreText.setText(`Cuadros destruidos: ${this.score}`);

            // Animate and destroy
            tilesToDestroy.forEach(({ r, c, tile }) => {
                const sprite = tile.sprite;
                const glow = tile.glow || sprite.getData("glow");

                // Particles at each destroyed tile position
                const burst = 20;
                if (this.matchEmitter) {
                    this.matchEmitter.explode(burst, sprite.x, sprite.y);
                }

                // Pop animation
                this.tweens.add({
                    targets: [sprite, glow].filter(Boolean),
                    scale: 0,
                    alpha: 0,
                    duration: 140,
                    ease: "Back.in",
                });

                // Remove from grid
                this.time.delayedCall(160, () => {
                    if (glow) glow.destroy();
                    sprite.destroy();
                    this.grid[r][c] = null;
                });
            });

            // Destroy super combo also
            if (superComboPos) {
                const { r, c, tile } = superComboPos;
                const sprite = tile.sprite;

                // Particles at super combo position
                const burst = 25;
                if (this.matchEmitter) {
                    this.matchEmitter.explode(burst, sprite.x, sprite.y);
                }

                // Pop animation
                this.tweens.add({
                    targets: sprite,
                    scale: 0,
                    alpha: 0,
                    duration: 140,
                    ease: "Back.in",
                });

                // Remove from grid
                this.time.delayedCall(160, () => {
                    sprite.destroy();
                    this.grid[r][c] = null;
                });
            }

            // Play sound
            if (this.sfx?.pop) this.sfx.pop.play();

            // After animations, drop and refill
            this.time.delayedCall(200, async () => {
                await this.dropAndRefill();
                await this.resolveMatchesLoop();
                resolve();
            });
        });
    }

    destroyAllOfCupidoType(type) {
        return new Promise((resolve) => {
            const tilesToDestroy = [];

            // Find all tiles of this type (when cupido matched with them)
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const tile = this.grid[r][c];
                    if (tile && tile.type === type) {
                        tilesToDestroy.push({ r, c, tile });
                    }
                }
            }

            if (tilesToDestroy.length === 0) {
                resolve();
                return;
            }

            // Add points for destroyed tiles
            this.score += tilesToDestroy.length;
            this.scoreText.setText(`Cuadros destruidos: ${this.score}`);

            // Animate and destroy
            tilesToDestroy.forEach(({ r, c, tile }) => {
                const sprite = tile.sprite;
                const glow = tile.glow || sprite.getData("glow");

                // Particles at each destroyed tile position
                const burst = 20;
                if (this.matchEmitter) {
                    this.matchEmitter.explode(burst, sprite.x, sprite.y);
                }

                // Pop animation
                this.tweens.add({
                    targets: [sprite, glow].filter(Boolean),
                    scale: 0,
                    alpha: 0,
                    duration: 140,
                    ease: "Back.in",
                });

                // Remove from grid
                this.time.delayedCall(160, () => {
                    if (glow) glow.destroy();
                    sprite.destroy();
                    this.grid[r][c] = null;
                });
            });

            // Play sound
            if (this.sfx?.pop) this.sfx.pop.play();

            // After animations, drop and refill
            this.time.delayedCall(200, async () => {
                await this.dropAndRefill();
                await this.resolveMatchesLoop();
                resolve();
            });
        });
    }

    spawnSuperCombo(r, c) {
        // Check if position is valid
        if (!this.inBounds(r, c)) return;

        // Remove existing tile
        const existingTile = this.grid[r][c];
        if (existingTile?.sprite) {
            const glow = existingTile.sprite.getData("glow");
            if (glow) glow.destroy();
            existingTile.sprite.destroy();
        }

        // Create super combo tile with cupido image
        const x = this.cellCenterX(c);
        const y = this.cellCenterY(r);

        // Create sprite from cupido image
        const sprite = this.add.image(x, y, "tile_cupido").setOrigin(0.5);
        sprite.setDisplaySize(this.cell - 10, this.cell - 10);

        // Add glow effect
        const glow = this.make.graphics({ x, y, add: false });
        glow.lineStyle(2, 0xffd1e8, 0.6);
        glow.strokeCircle(0, 0, this.cell / 2);
        this.add.existing(glow);
        sprite.setData("glow", glow);

        sprite.setDepth(2);

        // Store super combo data
        const tile = {
            type: this.SUPER_COMBO_TYPE,
            sprite,
            isSuperCombo: true
        };
        this.grid[r][c] = tile;
    }

    // ---------- Deadlock Detection and Reshuffle ----------

    hasAvailableMoves() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                // Try swap with right neighbor
                if (c < this.cols - 1) {
                    this.swapTilesData(r, c, r, c + 1);
                    const matches = this.findAllMatches();
                    this.swapTilesData(r, c, r, c + 1);

                    if (matches.length > 0) return true;
                }

                // Try swap with bottom neighbor
                if (r < this.rows - 1) {
                    this.swapTilesData(r, c, r + 1, c);
                    const matches = this.findAllMatches();
                    this.swapTilesData(r, c, r + 1, c);

                    if (matches.length > 0) return true;
                }
            }
        }
        return false;
    }

    async reshuffleBoard() {
        // Animate tiles blinking
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                if (tile?.sprite) {
                    this.tweens.add({
                        targets: tile.sprite,
                        alpha: 0.3,
                        duration: 150,
                        yoyo: true,
                        repeat: 2,
                    });
                }
            }
        }

        // Wait for animation
        await new Promise(resolve => this.time.delayedCall(600, resolve));

        // Reshuffle: pick new types avoiding immediate matches
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                if (tile) {
                    const newType = this.randomTypeAvoidingMatch(r, c);
                    tile.type = newType;
                    tile.sprite.setTexture(this.types[newType]);
                }
            }
        }

        this.isBusy = false;
        this.lastSwipeTime = this.time.now;
        this.startHintTimer();
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

    // Easter egg: Detect 7 taps on same icon
    async detectIconTap(sprite) {
        if (!sprite) return;

        // Get current click count
        let clickCount = sprite.getData("clickCount") || 0;
        clickCount++;
        sprite.setData("clickCount", clickCount);

        // If 7 clicks on this icon, destroy it
        if (clickCount >= 7) {
            // Prevent interaction while processing
            this.isBusy = true;

            const x = sprite.x;
            const y = sprite.y;

            // Create explosion particles
            if (this.matchEmitter) {
                this.matchEmitter.explode(20, x, y);
            }

            // Destroy the glow
            const glow = sprite.getData("glow");
            if (glow) {
                glow.destroy();
            }

            // Destroy the sprite
            const r = sprite.getData("r");
            const c = sprite.getData("c");
            sprite.destroy();

            // Remove from grid
            if (this.grid[r] && this.grid[r][c]) {
                this.grid[r][c] = null;
            }

            // Play sound effect
            if (this.sfx && this.sfx.pop) {
                this.sfx.pop.play();
            }

            // Wait a moment for particles
            await this.time.delayedCall(300, () => {});

            // Drop and refill the board
            await this.dropAndRefill();

            // Check for new matches that might have been created
            await this.resolveMatchesLoop();

            // Allow interaction again
            this.isBusy = false;
        }
    }

    // Easter egg: Detect rapid center taps
    detectCenterTap(pointer) {
        const centerX = this.gameWidth / 2;
        const centerY = this.gameHeight / 2;
        const tapRadius = 120; // Radius of center tap detection zone

        // Check if tap is in center area
        const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, centerX, centerY);
        if (distance > tapRadius) return;

        // Add tap with timestamp
        const now = this.time.now;
        this.centerTaps.push(now);

        // Remove taps older than 3 seconds (3000ms)
        this.centerTaps = this.centerTaps.filter(tapTime => now - tapTime < 3000);

        // If 5 taps within 3 seconds, trigger easter egg
        if (this.centerTaps.length >= 5) {
            this.triggerEasterEgg();
            this.centerTaps = []; // Reset after triggering
        }
    }

    // Easter egg: Explode all blocks
    async triggerEasterEgg() {
        const centerX = this.gameWidth / 2;
        const centerY = this.gameHeight / 2;

        // Prevent interaction while easter egg is happening
        this.isBusy = true;

        // Destroy all tiles and create particles
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] && this.grid[r][c].sprite) {
                    const sprite = this.grid[r][c].sprite;
                    const x = this.cellCenterX(c);
                    const y = this.cellCenterY(r);

                    // Create explosion particles
                    if (this.matchEmitter) {
                        this.matchEmitter.explode(15, x, y);
                    }

                    // Destroy the glow first
                    const glow = sprite.getData("glow");
                    if (glow) {
                        glow.destroy();
                    }

                    // Destroy the sprite
                    sprite.destroy();
                    this.grid[r][c] = null;

                    // Add score for the destroyed tile (1 point per block)
                    this.score += 1;
                }
            }
        }

        // Update score display
        this.scoreText.setText(`Cuadros destruidos: ${this.score}`);

        // Play sound effect
        if (this.sfx && this.sfx.pop) {
            this.sfx.pop.play();
        }

        // Wait a moment before dropping new tiles
        await this.time.delayedCall(500, () => {});

        // Drop and refill the board with new tiles
        await this.dropAndRefill();

        // Allow interaction again
        this.isBusy = false;
    }
}