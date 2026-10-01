/**
 * NEO-BLOCKS | Jogo Arcade Futurista de Blocos
 * Desenvolvido em JavaScript Puro com Canvas HTML5
 * 
 * Arquitetura Modular:
 * - SoundSystem: Efeitos sonoros sintetizados via Web Audio API (zero dependências)
 * - StorageManager: Persistência de recorde via localStorage com tratamento de exceções
 * - Board: Matriz do tabuleiro 10x20, detecção de colisão, fixação e limpeza de linhas
 * - Renderer: Renderização de alta precisão com suporte a DPI, fallback para roundRect e partículas
 * - NeoBlocksGame: Máquina de estados, loop requestAnimationFrame único, progressão contínua
 */

(() => {
  'use strict';

  /* ========================================================
     1. CONSTANTES E CONFIGURAÇÕES
     ======================================================== */
  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 30; // Resolução lógica da célula (300 x 600)
  
  // 7 Peças clássicas com identidades e cores neon vibrantes
  const PIECES = [
    {
      id: 'I',
      color: '#00f3ff', // Ciano Neon
      glow: 'rgba(0, 243, 255, 0.75)',
      matrix: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]
    },
    {
      id: 'J',
      color: '#3b82f6', // Azul Cobalto
      glow: 'rgba(59, 130, 246, 0.75)',
      matrix: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
      ]
    },
    {
      id: 'L',
      color: '#ff8c00', // Âmbar Neon
      glow: 'rgba(255, 140, 0, 0.75)',
      matrix: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
      ]
    },
    {
      id: 'O',
      color: '#ffe600', // Dourado Elétrico
      glow: 'rgba(255, 230, 0, 0.75)',
      matrix: [
        [1, 1],
        [1, 1]
      ]
    },
    {
      id: 'S',
      color: '#10b981', // Verde Esmeralda Neon
      glow: 'rgba(16, 185, 129, 0.75)',
      matrix: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
      ]
    },
    {
      id: 'T',
      color: '#b5179e', // Magenta Cyberpunk
      glow: 'rgba(181, 23, 158, 0.75)',
      matrix: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
      ]
    },
    {
      id: 'Z',
      color: '#ff0055', // Carmim / Vermelho Neon
      glow: 'rgba(255, 0, 85, 0.75)',
      matrix: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
      ]
    }
  ];

  /* ========================================================
     2. SISTEMA DE ÁUDIO SINTETIZADO (Web Audio API)
     Zero arquivos externos, totalmente autônomo e confiável
     ======================================================== */
  class SoundSystem {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }

    playMove() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    }

    playRotate() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    }

    playDrop() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    }

    playLock() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(340, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    }

    playLineClear(linesCount) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const baseNotes = linesCount >= 4 
        ? [523.25, 659.25, 783.99, 1046.50] // Dó Maior (Tetris / Neo Strike)
        : [440, 554.37, 659.25]; // Lá Maior

      baseNotes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.14, this.ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.06 + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.06);
        osc.stop(this.ctx.currentTime + idx * 0.06 + 0.22);
      });
    }

    playLevelUp() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const notes = [330, 440, 550, 660, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.05 + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.05);
        osc.stop(this.ctx.currentTime + idx * 0.05 + 0.15);
      });
    }

    playGameOver() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const notes = [440, 415, 392, 349];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.14);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.14 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.14);
        osc.stop(this.ctx.currentTime + idx * 0.14 + 0.25);
      });
    }
  }

  /* ========================================================
     3. GERENCIADOR DE RECORDE (localStorage)
     ======================================================== */
  class StorageManager {
    static STORAGE_KEY = 'neoblocks_arcade_highscore';

    static getHighScore() {
      try {
        const val = localStorage.getItem(this.STORAGE_KEY);
        return val ? parseInt(val, 10) || 0 : 0;
      } catch (err) {
        return 0;
      }
    }

    static saveHighScore(score) {
      try {
        const current = this.getHighScore();
        if (score > current) {
          localStorage.setItem(this.STORAGE_KEY, score.toString());
          return true;
        }
      } catch (err) {
        console.warn('Armazenamento local restrito:', err);
      }
      return false;
    }
  }

  /* ========================================================
     4. GERADOR DE PEÇAS (Randomizer 7-Bag)
     ======================================================== */
  class PieceBag {
    constructor() {
      this.bag = [];
    }

    refill() {
      this.bag = [0, 1, 2, 3, 4, 5, 6];
      // Fisher-Yates shuffle
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }

    getNext() {
      if (this.bag.length === 0) {
        this.refill();
      }
      const pieceIndex = this.bag.pop();
      const template = PIECES[pieceIndex];
      return {
        id: template.id,
        color: template.color,
        glow: template.glow,
        matrix: template.matrix.map(row => [...row]),
        x: 0,
        y: 0
      };
    }
  }

  /* ========================================================
     5. LÓGICA DO TABULEIRO
     ======================================================== */
  class Board {
    constructor() {
      this.grid = this.createEmptyGrid();
    }

    createEmptyGrid() {
      return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
    }

    reset() {
      this.grid = this.createEmptyGrid();
    }

    // Detecção segura de colisão
    checkCollision(pieceMatrix, offsetX, offsetY) {
      for (let r = 0; r < pieceMatrix.length; r++) {
        for (let c = 0; c < pieceMatrix[r].length; c++) {
          if (pieceMatrix[r][c] !== 0) {
            const targetX = offsetX + c;
            const targetY = offsetY + r;

            // Limite horizontal
            if (targetX < 0 || targetX >= COLS) {
              return true;
            }
            // Limite inferior
            if (targetY >= ROWS) {
              return true;
            }
            // Colisão com blocos existentes
            if (targetY >= 0 && this.grid[targetY][targetX] !== 0) {
              return true;
            }
          }
        }
      }
      return false;
    }

    // Fixa a peça no grid
    mergePiece(piece) {
      for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
          if (piece.matrix[r][c] !== 0) {
            const cellY = piece.y + r;
            const cellX = piece.x + c;
            if (cellY >= 0 && cellY < ROWS && cellX >= 0 && cellX < COLS) {
              this.grid[cellY][cellX] = {
                color: piece.color,
                glow: piece.glow
              };
            }
          }
        }
      }
    }

    // Detecta linhas preenchidas
    getFullLines() {
      const full = [];
      for (let r = 0; r < ROWS; r++) {
        if (this.grid[r].every(cell => cell !== 0)) {
          full.push(r);
        }
      }
      return full;
    }

    // Remove as linhas e empurra as superiores para baixo
    clearFullLines(lines) {
      if (!lines || lines.length === 0) return 0;
      const sortedLines = [...lines].sort((a, b) => b - a);

      sortedLines.forEach(rowIdx => {
        this.grid.splice(rowIdx, 1);
        this.grid.unshift(new Array(COLS).fill(0));
      });

      return sortedLines.length;
    }
  }

  /* ========================================================
     6. RENDERIZADOR CANVAS COM DPI SCALING E EFEITOS
     ======================================================== */
  class Renderer {
    constructor(canvas, previewCanvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.previewCanvas = previewCanvas;
      this.pCtx = previewCanvas.getContext('2d');

      this.particles = [];
      this.setupDPI();
      window.addEventListener('resize', () => this.setupDPI());
    }

    setupDPI() {
      const dpr = window.devicePixelRatio || 1;
      
      // Canvas Principal
      this.canvas.width = 300 * dpr;
      this.canvas.height = 600 * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Canvas Prévia
      this.previewCanvas.width = 120 * dpr;
      this.previewCanvas.height = 120 * dpr;
      this.pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Helper com fallback seguro para navegadores que não suportam roundRect nativo
    drawRoundedRect(ctx, x, y, width, height, radius) {
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
      } else {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
      }
    }

    drawCell(ctx, x, y, size, color, glow, isGhost = false) {
      const pad = 1.5;
      const drawX = x * size + pad;
      const drawY = y * size + pad;
      const drawSize = size - pad * 2;
      const radius = 4;

      ctx.save();

      if (isGhost) {
        // Bloco Fantasma (Traçado ciano translúcido)
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        
        this.drawRoundedRect(ctx, drawX, drawY, drawSize, drawSize, radius);
        ctx.fill();
        ctx.stroke();
      } else {
        // Bloco com Brilho Neon e Bisel Superior
        ctx.shadowColor = glow || color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = color;

        this.drawRoundedRect(ctx, drawX, drawY, drawSize, drawSize, radius);
        ctx.fill();

        // Bisel Superior Iluminado
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        this.drawRoundedRect(ctx, drawX + 2, drawY + 2, drawSize - 4, (drawSize - 4) * 0.35, 2);
        ctx.fill();

        // Borda Interna Fina
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
    }

    createLineParticles(rowY) {
      const yPos = rowY * BLOCK_SIZE + BLOCK_SIZE / 2;
      for (let i = 0; i < 28; i++) {
        this.particles.push({
          x: Math.random() * (COLS * BLOCK_SIZE),
          y: yPos + (Math.random() * 8 - 4),
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 5 - 1,
          size: Math.random() * 3 + 2,
          color: Math.random() > 0.5 ? '#00f3ff' : '#ff007f',
          alpha: 1
        });
      }
    }

    updateAndDrawParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= dt * 2.5;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        } else {
          this.ctx.save();
          this.ctx.globalAlpha = Math.max(0, p.alpha);
          this.ctx.fillStyle = p.color;
          this.ctx.shadowColor = p.color;
          this.ctx.shadowBlur = 8;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        }
      }
    }

    renderBoard(board, currentPiece, ghostY, clearingRows = [], clearProgress = 0, dt = 0.016) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, 300, 600);

      // Fundo escuro do grid
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, 300, 600);

      // Grade do tabuleiro
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, 600);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(300, y * BLOCK_SIZE);
        ctx.stroke();
      }

      // 1. Desenhar blocos fixos
      for (let r = 0; r < ROWS; r++) {
        const isClearing = clearingRows.includes(r);

        for (let c = 0; c < COLS; c++) {
          const cell = board.grid[r][c];
          if (cell !== 0) {
            if (isClearing) {
              const flashAlpha = Math.sin(clearProgress * Math.PI);
              ctx.save();
              ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + flashAlpha * 0.6})`;
              ctx.shadowColor = '#00f3ff';
              ctx.shadowBlur = 20;
              ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
              ctx.restore();
            } else {
              this.drawCell(ctx, c, r, BLOCK_SIZE, cell.color, cell.glow);
            }
          }
        }
      }

      // 2. Desenhar projeção (Peça Fantasma)
      if (currentPiece && clearingRows.length === 0 && ghostY !== null && ghostY !== currentPiece.y) {
        for (let r = 0; r < currentPiece.matrix.length; r++) {
          for (let c = 0; c < currentPiece.matrix[r].length; c++) {
            if (currentPiece.matrix[r][c] !== 0) {
              const drawY = ghostY + r;
              const drawX = currentPiece.x + c;
              if (drawY >= 0 && drawY < ROWS) {
                this.drawCell(ctx, drawX, drawY, BLOCK_SIZE, currentPiece.color, currentPiece.glow, true);
              }
            }
          }
        }
      }

      // 3. Desenhar a peça ativa controlada pelo jogador
      if (currentPiece && clearingRows.length === 0) {
        for (let r = 0; r < currentPiece.matrix.length; r++) {
          for (let c = 0; c < currentPiece.matrix[r].length; c++) {
            if (currentPiece.matrix[r][c] !== 0) {
              const drawY = currentPiece.y + r;
              const drawX = currentPiece.x + c;
              if (drawY >= 0 && drawY < ROWS) {
                this.drawCell(ctx, drawX, drawY, BLOCK_SIZE, currentPiece.color, currentPiece.glow, false);
              }
            }
          }
        }
      }

      // 4. Desenhar partículas ativas
      this.updateAndDrawParticles(dt);
    }

    renderPreview(piece) {
      const pCtx = this.pCtx;
      pCtx.clearRect(0, 0, 120, 120);

      if (!piece) return;

      const matrix = piece.matrix;
      const pieceSize = matrix.length;
      const previewBlockSize = 22;

      // Calcular limites reais para centralizar a peça no quadro
      let minX = pieceSize, maxX = -1, minY = pieceSize, maxY = -1;
      for (let r = 0; r < pieceSize; r++) {
        for (let c = 0; c < pieceSize; c++) {
          if (matrix[r][c] !== 0) {
            if (c < minX) minX = c;
            if (c > maxX) maxX = c;
            if (r < minY) minY = r;
            if (r > maxY) maxY = r;
          }
        }
      }

      const pieceWidth = (maxX - minX + 1) * previewBlockSize;
      const pieceHeight = (maxY - minY + 1) * previewBlockSize;
      const startX = (120 - pieceWidth) / 2 - minX * previewBlockSize;
      const startY = (120 - pieceHeight) / 2 - minY * previewBlockSize;

      for (let r = 0; r < pieceSize; r++) {
        for (let c = 0; c < pieceSize; c++) {
          if (matrix[r][c] !== 0) {
            const cellX = (startX + c * previewBlockSize) / previewBlockSize;
            const cellY = (startY + r * previewBlockSize) / previewBlockSize;
            this.drawCell(pCtx, cellX, cellY, previewBlockSize, piece.color, piece.glow, false);
          }
        }
      }
    }
  }

  /* ========================================================
     7. CONTROLADOR PRINCIPAL DO JOGO (NeoBlocksGame)
     ======================================================== */
  class NeoBlocksGame {
    constructor() {
      // Elementos do DOM
      this.dom = {
        canvas: document.getElementById('game-canvas'),
        previewCanvas: document.getElementById('preview-canvas'),
        valScore: document.getElementById('val-score'),
        valHighScore: document.getElementById('val-highscore'),
        valTime: document.getElementById('val-time'),
        valLevel: document.getElementById('val-level'),
        valSpeed: document.getElementById('val-speed'),
        valLines: document.getElementById('val-lines'),
        levelProgressFill: document.getElementById('level-progress-fill'),
        btnStart: document.getElementById('btn-start'),
        btnPause: document.getElementById('btn-pause'),
        btnRestart: document.getElementById('btn-restart'),
        pauseBtnText: document.getElementById('pause-btn-text'),
        btnSoundToggle: document.getElementById('btn-sound-toggle'),
        soundIcon: document.getElementById('sound-icon'),
        overlayStart: document.getElementById('overlay-start'),
        overlayPause: document.getElementById('overlay-pause'),
        overlayGameOver: document.getElementById('overlay-gameover'),
        btnStartOverlay: document.getElementById('btn-start-overlay'),
        btnResumeOverlay: document.getElementById('btn-resume-overlay'),
        btnRestartOverlay: document.getElementById('btn-restart-overlay'),
        goTime: document.getElementById('go-time'),
        goScore: document.getElementById('go-score'),
        goLevel: document.getElementById('go-level'),
        goLines: document.getElementById('go-lines'),
        newRecordAlert: document.getElementById('new-record-alert'),
        floatingBanner: document.getElementById('floating-banner')
      };

      // Módulos
      this.sound = new SoundSystem();
      this.board = new Board();
      this.renderer = new Renderer(this.dom.canvas, this.dom.previewCanvas);
      this.pieceBag = new PieceBag();

      // Estado do Jogo: 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
      this.state = 'IDLE';

      // Dados da Partida
      this.score = 0;
      this.lines = 0;
      this.level = 1;
      this.highScore = StorageManager.getHighScore();
      this.survivalTimeMs = 0;
      this.activeSeconds = 0;

      // Controle de Queda
      this.currentPiece = null;
      this.nextPiece = null;
      this.dropCounter = 0;
      this.dropInterval = 800; // ms

      // Animação de Linhas
      this.isClearingLines = false;
      this.clearingLinesList = [];
      this.clearAnimTimer = 0;
      this.clearAnimDuration = 200; // ms

      // Loop único
      this.lastTime = 0;
      this.animFrameId = null;

      this.init();
    }

    init() {
      // Exibir recorde inicial
      this.dom.valHighScore.textContent = this.formatNumber(this.highScore);
      this.dom.valScore.textContent = '0';
      this.dom.valTime.textContent = '00:00';
      this.dom.valLevel.textContent = '1';
      this.dom.valSpeed.textContent = '1.0x';
      this.dom.valLines.textContent = '0';

      // Renderizar grid inicial
      this.renderer.renderBoard(this.board, null, null);

      // Iniciar ouvintes
      this.setupEventListeners();

      // Iniciar loop único contínuo de animação
      this.lastTime = performance.now();
      this.animFrameId = requestAnimationFrame(t => this.gameLoop(t));
    }

    formatNumber(num) {
      return num.toLocaleString('pt-BR');
    }

    formatTime(totalSeconds) {
      const mins = Math.floor(totalSeconds / 60);
      const secs = Math.floor(totalSeconds % 60);
      const mStr = String(mins).padStart(2, '0');
      const sStr = String(secs).padStart(2, '0');
      return `${mStr}:${sStr}`;
    }

    // Progressão contínua baseada em sobrevivência (Requisitos 7 & 8)
    updateSurvivalProgression() {
      const currentSeconds = Math.floor(this.survivalTimeMs / 1000);
      this.activeSeconds = currentSeconds;

      // Nível aumenta a cada 30 segundos
      const calculatedLevel = 1 + Math.floor(currentSeconds / 30);
      
      if (calculatedLevel !== this.level) {
        this.level = calculatedLevel;
        this.dom.valLevel.textContent = this.level;
        this.showFloatingBanner(`NÍVEL ${this.level}!`);
        this.sound.playLevelUp();
      }

      // Velocidade suave com piso seguro em 100ms
      if (this.level === 1) {
        this.dropInterval = 800;
      } else if (this.level === 2) {
        this.dropInterval = 650;
      } else if (this.level === 3) {
        this.dropInterval = 500;
      } else if (this.level === 4) {
        this.dropInterval = 380;
      } else {
        const reduction = (this.level - 4) * 45;
        this.dropInterval = Math.max(100, 380 - reduction);
      }

      const speedMultiplier = (800 / this.dropInterval).toFixed(1);
      this.dom.valSpeed.textContent = `${speedMultiplier}x`;

      const cycleProgress = ((currentSeconds % 30) / 30) * 100;
      this.dom.levelProgressFill.style.width = `${cycleProgress}%`;
    }

    showFloatingBanner(text) {
      const banner = this.dom.floatingBanner;
      banner.textContent = text;
      banner.classList.remove('hidden');
      
      banner.style.animation = 'none';
      banner.offsetHeight; // Forçar reflow
      banner.style.animation = '';

      setTimeout(() => {
        banner.classList.add('hidden');
      }, 1200);
    }

    /* ========================================================
       8. GERAÇÃO DE PEÇAS
       ======================================================== */
    spawnPiece() {
      if (!this.nextPiece) {
        this.nextPiece = this.pieceBag.getNext();
      }

      this.currentPiece = this.nextPiece;
      this.nextPiece = this.pieceBag.getNext();

      // Posição centralizada
      this.currentPiece.x = Math.floor((COLS - this.currentPiece.matrix[0].length) / 2);
      this.currentPiece.y = 0;

      // Renderizar prévia
      this.renderer.renderPreview(this.nextPiece);

      // Game over se colidir imediatamente no topo
      if (this.board.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y)) {
        this.gameOver();
        return false;
      }

      return true;
    }

    getGhostY() {
      if (!this.currentPiece) return null;
      let ghostY = this.currentPiece.y;
      while (!this.board.checkCollision(this.currentPiece.matrix, this.currentPiece.x, ghostY + 1)) {
        ghostY++;
      }
      return ghostY;
    }

    /* ========================================================
       9. MOVIMENTAÇÃO E ROTAÇÃO
       ======================================================== */
    moveLeft() {
      if (this.state !== 'PLAYING' || !this.currentPiece || this.isClearingLines) return;
      if (!this.board.checkCollision(this.currentPiece.matrix, this.currentPiece.x - 1, this.currentPiece.y)) {
        this.currentPiece.x--;
        this.sound.playMove();
      }
    }

    moveRight() {
      if (this.state !== 'PLAYING' || !this.currentPiece || this.isClearingLines) return;
      if (!this.board.checkCollision(this.currentPiece.matrix, this.currentPiece.x + 1, this.currentPiece.y)) {
        this.currentPiece.x++;
        this.sound.playMove();
      }
    }

    softDrop() {
      if (this.state !== 'PLAYING' || !this.currentPiece || this.isClearingLines) return;
      if (!this.board.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1)) {
        this.currentPiece.y++;
        this.score += 1; // Ponto por soft drop
        this.dom.valScore.textContent = this.formatNumber(this.score);
        this.dropCounter = 0;
      } else {
        this.lockPiece();
      }
    }

    hardDrop() {
      if (this.state !== 'PLAYING' || !this.currentPiece || this.isClearingLines) return;
      
      let dropDistance = 0;
      while (!this.board.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1)) {
        this.currentPiece.y++;
        dropDistance++;
      }

      this.score += dropDistance * 2; // 2 pontos por bloco de hard drop
      this.dom.valScore.textContent = this.formatNumber(this.score);
      this.sound.playDrop();
      this.lockPiece();
    }

    rotate() {
      if (this.state !== 'PLAYING' || !this.currentPiece || this.isClearingLines) return;

      const matrix = this.currentPiece.matrix;
      // Rotação horária de 90°
      const rotated = matrix[0].map((_, index) => matrix.map(row => row[index]).reverse());

      // Offsets de teste para Wall-Kick
      const kickOffsets = [
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: -2, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: -1 }
      ];

      for (const offset of kickOffsets) {
        const testX = this.currentPiece.x + offset.x;
        const testY = this.currentPiece.y + offset.y;

        if (!this.board.checkCollision(rotated, testX, testY)) {
          this.currentPiece.matrix = rotated;
          this.currentPiece.x = testX;
          this.currentPiece.y = testY;
          this.sound.playRotate();
          return;
        }
      }
    }

    /* ========================================================
       10. FIXAÇÃO E LIMPEZA DE LINHAS
       ======================================================== */
    lockPiece() {
      if (!this.currentPiece) return;

      this.board.mergePiece(this.currentPiece);
      this.sound.playLock();

      const fullLines = this.board.getFullLines();

      if (fullLines.length > 0) {
        this.isClearingLines = true;
        this.clearingLinesList = fullLines;
        this.clearAnimTimer = 0;

        fullLines.forEach(row => this.renderer.createLineParticles(row));
        this.sound.playLineClear(fullLines.length);

        // Pontuação conforme Requisito 9
        let linePoints = 0;
        if (fullLines.length === 1) linePoints = 100;
        else if (fullLines.length === 2) linePoints = 300;
        else if (fullLines.length === 3) linePoints = 500;
        else if (fullLines.length >= 4) linePoints = 800;

        const earnedScore = linePoints * this.level;
        this.score += earnedScore;
        this.lines += fullLines.length;

        if (fullLines.length >= 4) {
          this.showFloatingBanner('NEO STRIKE! +800');
        }

        this.dom.valScore.textContent = this.formatNumber(this.score);
        this.dom.valLines.textContent = this.lines;

        if (this.score > this.highScore) {
          this.highScore = this.score;
          this.dom.valHighScore.textContent = this.formatNumber(this.highScore);
          StorageManager.saveHighScore(this.highScore);
        }
      } else {
        this.currentPiece = null;
        this.spawnPiece();
      }
    }

    finishLineClear() {
      this.board.clearFullLines(this.clearingLinesList);
      this.isClearingLines = false;
      this.clearingLinesList = [];
      this.clearAnimTimer = 0;

      this.currentPiece = null;
      this.spawnPiece();
    }

    /* ========================================================
       11. LOOP ÚNICO DE ANIMAÇÃO (requestAnimationFrame)
       ======================================================== */
    gameLoop(currentTime = 0) {
      this.animFrameId = requestAnimationFrame(t => this.gameLoop(t));

      // Limitar deltaTime para evitar saltos bruscos se o usuário trocar de aba
      const rawDelta = currentTime - this.lastTime;
      const deltaTime = Math.min(Math.max(rawDelta, 0), 100);
      this.lastTime = currentTime;

      if (this.state === 'PLAYING') {
        // Atualizar tempo de sobrevivência e nível
        this.survivalTimeMs += deltaTime;
        this.updateSurvivalProgression();
        this.dom.valTime.textContent = this.formatTime(this.activeSeconds);

        // Animação de eliminação de linhas
        if (this.isClearingLines) {
          this.clearAnimTimer += deltaTime;
          const progress = Math.min(1, this.clearAnimTimer / this.clearAnimDuration);

          this.renderer.renderBoard(
            this.board,
            null,
            null,
            this.clearingLinesList,
            progress,
            deltaTime / 1000
          );

          if (this.clearAnimTimer >= this.clearAnimDuration) {
            this.finishLineClear();
          }
          return;
        }

        // Queda automática
        this.dropCounter += deltaTime;
        if (this.dropCounter >= this.dropInterval) {
          this.dropCounter = 0;
          if (this.currentPiece) {
            if (!this.board.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1)) {
              this.currentPiece.y++;
            } else {
              this.lockPiece();
            }
          }
        }
      }

      // Renderização contínua
      const ghostY = this.getGhostY();
      this.renderer.renderBoard(
        this.board,
        this.currentPiece,
        ghostY,
        this.isClearingLines ? this.clearingLinesList : [],
        0,
        deltaTime / 1000
      );
    }

    /* ========================================================
       12. MÁQUINA DE ESTADOS
       ======================================================== */
    start() {
      if (this.state === 'PLAYING') return;

      this.sound.init();

      // Fechar overlays
      this.dom.overlayStart.classList.add('hidden');
      this.dom.overlayPause.classList.add('hidden');
      this.dom.overlayGameOver.classList.add('hidden');

      // Limpar tabuleiro e reiniciar variáveis
      this.board.reset();
      this.score = 0;
      this.lines = 0;
      this.level = 1;
      this.survivalTimeMs = 0;
      this.activeSeconds = 0;
      this.dropCounter = 0;
      this.dropInterval = 800;
      this.isClearingLines = false;
      this.clearingLinesList = [];
      this.currentPiece = null;
      this.nextPiece = null;

      // Resetar HUD
      this.dom.valScore.textContent = '0';
      this.dom.valLines.textContent = '0';
      this.dom.valLevel.textContent = '1';
      this.dom.valTime.textContent = '00:00';
      this.dom.valSpeed.textContent = '1.0x';
      this.dom.levelProgressFill.style.width = '0%';
      this.dom.btnPause.disabled = false;
      this.dom.pauseBtnText.textContent = 'PAUSAR';

      this.state = 'PLAYING';
      this.spawnPiece();
      this.lastTime = performance.now();
    }

    togglePause() {
      if (this.state !== 'PLAYING' && this.state !== 'PAUSED') return;

      if (this.state === 'PLAYING') {
        this.state = 'PAUSED';
        this.dom.overlayPause.classList.remove('hidden');
        this.dom.pauseBtnText.textContent = 'CONTINUAR';
      } else {
        this.state = 'PLAYING';
        this.dom.overlayPause.classList.add('hidden');
        this.dom.pauseBtnText.textContent = 'PAUSAR';
        this.lastTime = performance.now();
      }
    }

    restart() {
      this.start();
    }

    gameOver() {
      this.state = 'GAMEOVER';
      this.sound.playGameOver();

      const isNewRecord = StorageManager.saveHighScore(this.score);
      if (isNewRecord) {
        this.highScore = this.score;
        this.dom.valHighScore.textContent = this.formatNumber(this.highScore);
        this.dom.newRecordAlert.classList.remove('hidden');
      } else {
        this.dom.newRecordAlert.classList.add('hidden');
      }

      this.dom.goTime.textContent = this.formatTime(this.activeSeconds);
      this.dom.goScore.textContent = this.formatNumber(this.score);
      this.dom.goLevel.textContent = this.level;
      this.dom.goLines.textContent = this.lines;

      this.dom.overlayGameOver.classList.remove('hidden');
      this.dom.btnPause.disabled = true;
    }

    /* ========================================================
       13. INTERAÇÕES E CONTROLES
       ======================================================== */
    setupEventListeners() {
      // Botões de ação do HUD e overlays
      this.dom.btnStart.addEventListener('click', () => this.start());
      this.dom.btnStartOverlay.addEventListener('click', () => this.start());
      this.dom.btnPause.addEventListener('click', () => this.togglePause());
      this.dom.btnResumeOverlay.addEventListener('click', () => this.togglePause());
      this.dom.btnRestart.addEventListener('click', () => this.restart());
      this.dom.btnRestartOverlay.addEventListener('click', () => this.restart());

      // Alternância de som
      this.dom.btnSoundToggle.addEventListener('click', () => {
        const isSoundOn = this.sound.toggle();
        this.dom.soundIcon.textContent = isSoundOn ? '🔊' : '🔇';
      });

      // Teclado
      window.addEventListener('keydown', e => {
        // Bloquear rolagem da página com as setas e espaço durante a partida
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
          e.preventDefault();
        }

        if (this.state === 'IDLE' || this.state === 'GAMEOVER') {
          if (e.key === ' ' || e.key === 'Enter') {
            this.start();
            return;
          }
        }

        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          this.togglePause();
          return;
        }

        if (this.state !== 'PLAYING') return;

        switch (e.key) {
          case 'ArrowLeft':
          case 'a':
          case 'A':
            this.moveLeft();
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            this.moveRight();
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            this.softDrop();
            break;
          case 'ArrowUp':
          case 'w':
          case 'W':
            this.rotate();
            break;
          case ' ':
            if (!e.repeat) {
              this.hardDrop();
            }
            break;
        }
      });

      // Controles Virtuais Touch para Celular / Tablet
      const touchButtons = document.querySelectorAll('.touch-btn');
      touchButtons.forEach(btn => {
        const action = btn.getAttribute('data-action');
        let repeatInterval = null;
        let repeatTimeout = null;

        const triggerAction = () => {
          if (this.state !== 'PLAYING') return;
          switch (action) {
            case 'left': this.moveLeft(); break;
            case 'right': this.moveRight(); break;
            case 'down': this.softDrop(); break;
            case 'rotate': this.rotate(); break;
            case 'hardDrop': this.hardDrop(); break;
          }
        };

        const startAction = e => {
          e.preventDefault();
          this.sound.init();
          triggerAction();

          // Repetição contínua para esquerda, direita e queda acelerada
          if (['left', 'right', 'down'].includes(action)) {
            repeatTimeout = setTimeout(() => {
              repeatInterval = setInterval(triggerAction, action === 'down' ? 50 : 110);
            }, 200);
          }
        };

        const stopAction = e => {
          if (e) e.preventDefault();
          if (repeatTimeout) clearTimeout(repeatTimeout);
          if (repeatInterval) clearInterval(repeatInterval);
        };

        btn.addEventListener('touchstart', startAction, { passive: false });
        btn.addEventListener('touchend', stopAction, { passive: false });
        btn.addEventListener('touchcancel', stopAction, { passive: false });
        btn.addEventListener('mousedown', startAction);
        btn.addEventListener('mouseup', stopAction);
        btn.addEventListener('mouseleave', stopAction);
      });
    }
  }

  // Inicialização no DOM
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new NeoBlocksGame();
  });
})();
