// main.js

// Handle Telegram Web App Initialization Safely
let tgUser = {
  id: 123456789,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
};

if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
  console.log('Telegram WebApp detected.');
  window.Telegram.WebApp.ready();
  tgUser = window.Telegram.WebApp.initDataUnsafe.user;
} else {
  console.log('Telegram WebApp not detected. Using mock user data for local testing.');
}

// Define GameScene **Before** Using It in Config
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.level = 1;
    this.score = 0;
    this.baseMoves = 30; // Base number of moves
    this.moves = this.baseMoves;
    this.gridSize = 8;
    this.tileSize = 64;
    this.gemTypes = 5;
    this.selectedGem = null; // Initialize selectedGem
    console.log('GameScene constructor initialized.');
  }

  preload() {
    console.log('Preloading assets...');
    // Load gem images
    for (let i = 1; i <= 6; i++) {
      this.load.image('gem' + i, 'assets/gem' + i + '.png');
    }
  }

  create() {
    console.log('Creating game scene...');
    // Create the game board
    this.createBoard();

    // Create UI elements
    this.createUI();

    // Input handling
    this.input.on('pointerdown', this.gemSelect, this);
  }

  resize(gameSize, baseSize, displaySize, resolution) {
    const width = gameSize.width;
    const height = gameSize.height;
    this.cameras.resize(width, height);
    console.log(`Game resized to ${width}x${height}`);
  }

  createBoard() {
    console.log('Creating game board...');
    this.board = [];
    const offsetX = (this.sys.game.config.width - this.gridSize * this.tileSize) / 2;
    const offsetY = (this.sys.game.config.height - this.gridSize * this.tileSize) / 2;

    for (let row = 0; row < this.gridSize; row++) {
      this.board[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        let gemType = Phaser.Math.Between(1, this.gemTypes);
        let gem = this.add.sprite(
          offsetX + col * this.tileSize + this.tileSize / 2,
          offsetY + row * this.tileSize + this.tileSize / 2,
          'gem' + gemType
        );
        gem.setInteractive();
        gem.gemType = gemType;
        gem.row = row;
        gem.col = col;
        this.board[row][col] = gem;
      }
    }
    console.log('Game board created.');
  }

  createUI() {
    console.log('Creating UI elements...');
    // Display Level, Score, Moves
    const style = { fontSize: '24px', fill: '#fff' };
    this.levelText = this.add.text(10, 10, 'Level: ' + this.level, style);
    this.scoreText = this.add.text(10, 40, 'Score: ' + this.score, style);
    this.movesText = this.add.text(10, 70, 'Moves: ' + this.moves, style);
    console.log('UI elements created.');
  }

  gemSelect(pointer) {
    console.log('Gem selected at pointer:', pointer.x, pointer.y);
    // Handle gem selection and swapping logic
    const offsetX = (this.sys.game.config.width - this.gridSize * this.tileSize) / 2;
    const offsetY = (this.sys.game.config.height - this.gridSize * this.tileSize) / 2;
    const x = pointer.x - offsetX;
    const y = pointer.y - offsetY;
    const col = Math.floor(x / this.tileSize);
    const row = Math.floor(y / this.tileSize);

    console.log(`Clicked on row: ${row}, col: ${col}`);

    if (col < 0 || col >= this.gridSize || row < 0 || row >= this.gridSize) {
      console.log('Click outside the board.');
      return;
    }

    if (this.selectedGem) {
      const deltaRow = Math.abs(this.selectedGem.row - row);
      const deltaCol = Math.abs(this.selectedGem.col - col);
      console.log(`Delta Row: ${deltaRow}, Delta Col: ${deltaCol}`);

      if ((deltaRow === 1 && deltaCol === 0) || (deltaRow === 0 && deltaCol === 1)) {
        // Swap gems
        this.swapGems(this.selectedGem, this.board[row][col]);
        this.checkMatches();
        this.makeMove();
        this.selectedGem.setScale(1);
        this.selectedGem = null;
      } else {
        // Deselect previous gem and select the new one
        console.log('Selecting a new gem.');
        this.selectedGem.setScale(1);
        this.selectedGem = this.board[row][col];
        this.selectedGem.setScale(1.2);
      }
    } else {
      // Select the first gem
      console.log('Selecting the first gem.');
      this.selectedGem = this.board[row][col];
      this.selectedGem.setScale(1.2);
    }
  }

  swapGems(gem1, gem2) {
    console.log(`Swapping gems: (${gem1.row}, ${gem1.col}) <-> (${gem2.row}, ${gem2.col})`);
    // Swap gem types
    const tempType = gem1.gemType;
    gem1.gemType = gem2.gemType;
    gem2.gemType = tempType;

    // Update textures to reflect the swap
    gem1.setTexture('gem' + gem1.gemType);
    gem2.setTexture('gem' + gem2.gemType);
  }

  checkMatches() {
    console.log('Checking for matches...');
    // Check for matches and remove gems
    let matches = this.findMatches();
    if (matches.length > 0) {
      console.log(`Found ${matches.length} matches.`);
      this.removeGems(matches);
      this.time.delayedCall(500, () => {
        this.fillBoard();
        this.time.delayedCall(500, () => {
          this.checkMatches();
        });
      });
    } else {
      console.log('No matches found.');
    }
  }

  findMatches() {
    let matches = [];
    // Horizontal matches
    for (let row = 0; row < this.gridSize; row++) {
      let matchLength = 1;
      for (let col = 0; col < this.gridSize; col++) {
        let checkMatch = false;
        if (col === this.gridSize - 1) {
          checkMatch = true;
        } else {
          if (this.board[row][col].gemType === this.board[row][col + 1].gemType) {
            matchLength += 1;
          } else {
            checkMatch = true;
          }
        }
        if (checkMatch) {
          if (matchLength >= 3) {
            for (let i = 0; i < matchLength; i++) {
              matches.push(this.board[row][col - i]);
            }
          }
          matchLength = 1;
        }
      }
    }
    // Vertical matches
    for (let col = 0; col < this.gridSize; col++) {
      let matchLength = 1;
      for (let row = 0; row < this.gridSize; row++) {
        let checkMatch = false;
        if (row === this.gridSize - 1) {
          checkMatch = true;
        } else {
          if (this.board[row][col].gemType === this.board[row + 1][col].gemType) {
            matchLength += 1;
          } else {
            checkMatch = true;
          }
        }
        if (checkMatch) {
          if (matchLength >= 3) {
            for (let i = 0; i < matchLength; i++) {
              matches.push(this.board[row - i][col]);
            }
          }
          matchLength = 1;
        }
      }
    }
    return matches;
  }

  removeGems(matches) {
    console.log(`Removing ${matches.length} gems.`);
    matches.forEach(gem => {
      gem.destroy();
      this.board[gem.row][gem.col] = null;
      this.updateScore(10);
    });
  }

  fillBoard() {
    const offsetX = (this.sys.game.config.width - this.gridSize * this.tileSize) / 2;
    const offsetY = (this.sys.game.config.height - this.gridSize * this.tileSize) / 2;
    console.log('Filling the board with new gems...');
    // Shift gems down and fill empty spaces
    for (let col = 0; col < this.gridSize; col++) {
      let emptySpaces = 0;
      for (let row = this.gridSize - 1; row >= 0; row--) {
        if (this.board[row][col] === null) {
          emptySpaces += 1;
        } else if (emptySpaces > 0) {
          let gem = this.board[row][col];
          gem.row += emptySpaces;
          this.board[gem.row][col] = gem;
          this.board[row][col] = null;
          this.tweens.add({
            targets: gem,
            y: offsetY + gem.row * this.tileSize + this.tileSize / 2,
            duration: 200,
          });
        }
      }
      for (let i = 0; i < emptySpaces; i++) {
        let gemType = Phaser.Math.Between(1, this.gemTypes);
        let gem = this.add.sprite(
          offsetX + col * this.tileSize + this.tileSize / 2,
          offsetY - ((i + 1) * this.tileSize) + this.tileSize / 2,
          'gem' + gemType
        );
        gem.setInteractive();
        gem.gemType = gemType;
        gem.row = i;
        gem.col = col;
        this.board[gem.row][col] = gem;
        this.tweens.add({
          targets: gem,
          y: offsetY + gem.row * this.tileSize + this.tileSize / 2,
          duration: 200,
        });
      }
    }
    console.log('Board filled.');
  }

  updateScore(points) {
    this.score += points;
    this.scoreText.setText('Score: ' + this.score);
    console.log(`Updated score: ${this.score}`);
  }

  makeMove() {
    this.moves -= 1;
    this.movesText.setText('Moves: ' + this.moves);
    console.log(`Moves left: ${this.moves}`);
    if (this.moves <= 0) {
      this.endLevel();
    }
  }

  endLevel() {
    console.log('Ending level...');
    if (this.score >= this.level * 100) {
      // Level completed
      alert('Level Completed!');
      this.increaseDifficulty();
      this.scene.restart();
    } else {
      // Game over
      alert('Game Over! Your score: ' + this.score);
      this.resetGame();
    }
  }

  increaseDifficulty() {
    this.level += 1;
    this.levelText.setText('Level: ' + this.level);
    console.log(`Increased to level ${this.level}`);
    // Increase difficulty by decreasing moves and/or increasing gem types
    this.moves = Math.floor(this.baseMoves * Math.pow(0.9, this.level - 1));
    this.movesText.setText('Moves: ' + this.moves);
    if (this.level % 5 === 0 && this.gemTypes < 6) {
      this.gemTypes += 1; // Increase gem types every 5 levels
      console.log(`Increased gem types to ${this.gemTypes}`);
    }
  }

  resetGame() {
    console.log('Resetting game...');
    this.level = 1;
    this.score = 0;
    this.moves = this.baseMoves;
    this.gemTypes = 5;
    this.levelText.setText('Level: ' + this.level);
    this.scoreText.setText('Score: ' + this.score);
    this.movesText.setText('Moves: ' + this.moves);
    this.scene.restart();
  }
}

// Game Configuration (After GameScene is Defined)
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#18216D',
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Create Game Instance
const game = new Phaser.Game(config);
