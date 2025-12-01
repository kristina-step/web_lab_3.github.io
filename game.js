let gameInstance = null;

class Game2048 {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = 0;
        this.gameOver = false;
        this.history = [];
        this.leaderboard = [];
        this.gridSize = 4;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isMoving = false;
        
        this.init();
    }
    
    init() {
        this.loadFromStorage();
        this.createGrid();
        this.setupEventListeners();
        this.startGame();
        this.updateView();
    }
    
    createGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                gridElement.appendChild(cell);
            }
        }
        
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
    }
    
    startGame() {
        console.log('Начало новой игры');
        
        this.score = 0;
        this.gameOver = false;
        this.history = [];
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
        
        this.addRandomTile();
        this.addRandomTile();
        
        this.saveState();
        this.updateView();
        this.hideGameOver();
        
        document.getElementById('score').textContent = '0';
        document.getElementById('best-score').textContent = this.bestScore;
        
        console.log('Новая игра начата успешно');
    }
    
    addRandomTile() {
        const emptyCells = [];
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
            return true;
        }
        return false;
    }
    
    saveState() {
        const state = {
            grid: JSON.parse(JSON.stringify(this.grid)),
            score: this.score,
            history: JSON.parse(JSON.stringify(this.history))
        };
        
        localStorage.setItem('game2048_state', JSON.stringify(state));
        localStorage.setItem('game2048_best_score', this.bestScore.toString());
    }
    
    loadFromStorage() {
        try {
            const savedState = localStorage.getItem('game2048_state');
            const savedBestScore = localStorage.getItem('game2048_best_score');
            const savedLeaderboard = localStorage.getItem('game2048_leaderboard');
            
            if (savedBestScore) {
                this.bestScore = parseInt(savedBestScore) || 0;
            }
            
            if (savedLeaderboard) {
                this.leaderboard = JSON.parse(savedLeaderboard);
            }
            
            if (savedState) {
                const state = JSON.parse(savedState);
                this.grid = state.grid || Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
                this.score = state.score || 0;
                this.history = state.history || [];
            }
        } catch (error) {
            console.error('Ошибка загрузки из localStorage:', error);
            this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
            this.score = 0;
            this.history = [];
        }
    }
    
    updateView() {
        this.updateGrid();
        this.updateScore();
        
        if (this.isGameOver()) {
            this.showGameOver();
        }
    }
    
    updateGrid() {
        const gridElement = document.getElementById('grid');
        const tiles = gridElement.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const value = this.grid[row][col];
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.className = 'tile';
                    tile.textContent = value;
                    tile.dataset.value = value;
                    tile.dataset.row = row;
                    tile.dataset.col = col;
                    
                    const colors = {
                        2: '#ff6b6b',
                        4: '#4ecdc4',
                        8: '#ffd166',
                        16: '#06d6a0',
                        32: '#118ab2',
                        64: '#ef476f',
                        128: '#9b5de5',
                        256: '#f15bb5',
                        512: '#00bbf9',
                        1024: '#00f5d4',
                        2048: '#ff9e00'
                    };
                    
                    tile.style.backgroundColor = colors[value] || '#3d348b';
                    tile.style.fontSize = this.getFontSize(value);
                    tile.style.color = value <= 4 ? '#333' : '#fff';
                    
                    const cell = gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cell.appendChild(tile);
                }
            }
        }
    }
    
    getFontSize(value) {
        if (value >= 1000) return '1.5rem';
        if (value >= 100) return '1.8rem';
        return '2rem';
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            document.getElementById('best-score').textContent = this.bestScore;
        }
    }
    
    move(direction) {
        if (this.gameOver || this.isMoving) return false;
        
        this.isMoving = true;
        
        const oldState = {
            grid: JSON.parse(JSON.stringify(this.grid)),
            score: this.score
        };
        
        let pointsEarned = 0;
        let moved = false;
        


window.gameInstance = gameInstance;
