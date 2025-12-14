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
        
        switch (direction) {
            case 'left':
                pointsEarned = this.processMove('left');
                moved = pointsEarned > 0 || this.checkIfGridChanged(oldState.grid);
                break;
            case 'right':
                pointsEarned = this.processMove('right');
                moved = pointsEarned > 0 || this.checkIfGridChanged(oldState.grid);
                break;
            case 'up':
                pointsEarned = this.processMove('up');
                moved = pointsEarned > 0 || this.checkIfGridChanged(oldState.grid);
                break;
            case 'down':
                pointsEarned = this.processMove('down');
                moved = pointsEarned > 0 || this.checkIfGridChanged(oldState.grid);
                break;
        }
        
        if (moved) {
            this.score += pointsEarned;
            
            this.history.push(oldState);
            if (this.history.length > 10) {
                this.history.shift();
            }
            
            this.addRandomTile();
            this.saveState();
            this.updateView();
        }
        
        this.isMoving = false;
        return moved;
    }
    
    processMove(direction) {
        let points = 0;
        
        switch (direction) {
            case 'left':
                for (let row = 0; row < this.gridSize; row++) {
                    points += this.processRowLeft(row);
                }
                break;
            case 'right':
                for (let row = 0; row < this.gridSize; row++) {
                    points += this.processRowRight(row);
                }
                break;
            case 'up':
                for (let col = 0; col < this.gridSize; col++) {
                    points += this.processColumnUp(col);
                }
                break;
            case 'down':
                for (let col = 0; col < this.gridSize; col++) {
                    points += this.processColumnDown(col);
                }
                break;
        }
        
        return points;
    }
    
    processRowLeft(row) {
        let points = 0;
        const newRow = [];
        let skip = false;
        
        for (let col = 0; col < this.gridSize; col++) {
            if (this.grid[row][col] !== 0) {
                newRow.push(this.grid[row][col]);
            }
        }
        
        for (let i = 0; i < newRow.length; i++) {
            if (!skip && i < newRow.length - 1 && newRow[i] === newRow[i + 1]) {
                newRow[i] *= 2;
                points += newRow[i];
                newRow.splice(i + 1, 1);
                skip = true;
            } else {
                skip = false;
            }
        }
        
        while (newRow.length < this.gridSize) {
            newRow.push(0);
        }
        
        this.grid[row] = newRow;
        return points;
    }
    
    processRowRight(row) {
        let points = 0;
        const newRow = [];
        let skip = false;
        
        for (let col = this.gridSize - 1; col >= 0; col--) {
            if (this.grid[row][col] !== 0) {
                newRow.push(this.grid[row][col]);
            }
        }
        
        for (let i = 0; i < newRow.length; i++) {
            if (!skip && i < newRow.length - 1 && newRow[i] === newRow[i + 1]) {
                newRow[i] *= 2;
                points += newRow[i];
                newRow.splice(i + 1, 1);
                skip = true;
            } else {
                skip = false;
            }
        }
        
        while (newRow.length < this.gridSize) {
            newRow.push(0);
        }
        
        newRow.reverse();
        this.grid[row] = newRow;
        return points;
    }
    
    processColumnUp(col) {
        let points = 0;
        const newColumn = [];
        let skip = false;
        
        for (let row = 0; row < this.gridSize; row++) {
            if (this.grid[row][col] !== 0) {
                newColumn.push(this.grid[row][col]);
            }
        }

        for (let i = 0; i < newColumn.length; i++) {
            if (!skip && i < newColumn.length - 1 && newColumn[i] === newColumn[i + 1]) {
                newColumn[i] *= 2;
                points += newColumn[i];
                newColumn.splice(i + 1, 1);
                skip = true;
            } else {
                skip = false;
            }
        }

        while (newColumn.length < this.gridSize) {
            newColumn.push(0);
        }

        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row][col] = newColumn[row];
        }
        
        return points;
    }
    
    processColumnDown(col) {
        let points = 0;
        const newColumn = [];
        let skip = false;

        for (let row = this.gridSize - 1; row >= 0; row--) {
            if (this.grid[row][col] !== 0) {
                newColumn.push(this.grid[row][col]);
            }
        }

        for (let i = 0; i < newColumn.length; i++) {
            if (!skip && i < newColumn.length - 1 && newColumn[i] === newColumn[i + 1]) {
                newColumn[i] *= 2;
                points += newColumn[i];
                newColumn.splice(i + 1, 1);
                skip = true;
            } else {
                skip = false;
            }
        }

        while (newColumn.length < this.gridSize) {
            newColumn.push(0);
        }

        newColumn.reverse();
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row][col] = newColumn[row];
        }
        
        return points;
    }
    
    checkIfGridChanged(oldGrid) {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] !== oldGrid[row][col]) {
                    return true;
                }
            }
        }
        return false;
    }
    
    isGameOver() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    return false;
                }
            }
        }
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const current = this.grid[row][col];

                if (col < this.gridSize - 1 && this.grid[row][col + 1] === current) {
                    return false;
                }
                if (row < this.gridSize - 1 && this.grid[row + 1][col] === current) {
                    return false;
                }
            }
        }
        
        this.gameOver = true;
        return true;
    }
    
    undo() {
        if (this.history.length === 0) {
            return;
        }
        
        const lastState = this.history.pop();
        this.grid = lastState.grid;
        this.score = lastState.score;
        
        this.saveState();
        this.updateView();
    }
    
    saveScoreToLeaderboard(name) {
        const playerName = name.trim() || 'Аноним';
        const scoreData = {
            name: playerName,
            score: this.score,
            date: new Date().toLocaleDateString('ru-RU'),
            timestamp: Date.now()
        };
        
        this.leaderboard.push(scoreData);
        
        this.leaderboard.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
        
        if (this.leaderboard.length > 10) {
            this.leaderboard = this.leaderboard.slice(0, 10);
        }
        
        localStorage.setItem('game2048_leaderboard', JSON.stringify(this.leaderboard));
        this.updateLeaderboard();
        
        return playerName;
    }
    
    updateLeaderboard() {
        const tbody = document.getElementById('leaderboard-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.leaderboard.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            const placeCell = document.createElement('td');
            placeCell.textContent = index + 1;
            
            const nameCell = document.createElement('td');
            nameCell.textContent = entry.name;
            
            const scoreCell = document.createElement('td');
            scoreCell.textContent = entry.score;
            
            const dateCell = document.createElement('td');
            dateCell.textContent = entry.date;
            
            row.appendChild(placeCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(dateCell);
            
            tbody.appendChild(row);
        });
        
        if (this.leaderboard.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.textContent = 'Пока нет рекордов';
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
            cell.style.color = '#ffd700';
            row.appendChild(cell);
            tbody.appendChild(row);
        }
    }

    showGameOver() {
        const gameOverElement = document.getElementById('game-over');
        const finalScoreElement = document.getElementById('final-score');
        
        if (gameOverElement && finalScoreElement) {
            finalScoreElement.textContent = this.score;
            gameOverElement.classList.add('show');
            
            const savedMessage = document.getElementById('saved-message');
            const playerNameInput = document.getElementById('player-name');
            const saveButton = document.getElementById('save-score');
            
            if (savedMessage) savedMessage.textContent = '';
            if (playerNameInput) {
                playerNameInput.value = '';
                playerNameInput.style.display = 'block';
            }
            if (saveButton) saveButton.style.display = 'flex';
        }
    }
    
    hideGameOver() {
        const gameOverElement = document.getElementById('game-over');
        if (gameOverElement) {
            gameOverElement.classList.remove('show');
        }
    }
    
    showLeaderboard() {
        this.updateLeaderboard();
        const modal = document.getElementById('leaderboard-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }
    
    hideLeaderboard() {
        const modal = document.getElementById('leaderboard-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    clearLeaderboard() {
        this.leaderboard = [];
        localStorage.removeItem('game2048_leaderboard');
        this.updateLeaderboard();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.move('right');
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.move('down');
                    break;
                case 'z':
                case 'Z':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.undo();
                    }
                    break;
            }
        });
        
        const gridElement = document.getElementById('grid');
        if (gridElement) {
            gridElement.addEventListener('touchstart', (e) => {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            }, { passive: true });
            
            gridElement.addEventListener('touchend', (e) => {
                if (!this.touchStartX || !this.touchStartY) return;
                
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                
                const diffX = this.touchStartX - touchEndX;
                const diffY = this.touchStartY - touchEndY;
                
                const minSwipeDistance = 30;
                
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    if (Math.abs(diffX) > minSwipeDistance) {
                        if (diffX > 0) {
                            this.move('left');
                        } else {
                            this.move('right');
                        }
                    }
                } else {
                    if (Math.abs(diffY) > minSwipeDistance) {
                        if (diffY > 0) {
                            this.move('up');
                        } else {
                            this.move('down');
                        }
                    }
                }
                
                this.touchStartX = 0;
                this.touchStartY = 0;
            }, { passive: true });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    gameInstance = new Game2048();
    setupGlobalEventListeners();
});

function setupGlobalEventListeners() {
    const newGameBtn = document.getElementById('new-game');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            if (gameInstance) {
                gameInstance.startGame();
            }
        });
    }
    
    const undoBtn = document.getElementById('undo');
    if (undoBtn) {
        undoBtn.addEventListener('click', () => {
            if (gameInstance) {
                gameInstance.undo();
            }
        });
    }
    
    const showLeadersBtn = document.getElementById('show-leaders');
    if (showLeadersBtn) {
        showLeadersBtn.addEventListener('click', () => {
            if (gameInstance) {
                gameInstance.showLeaderboard();
            }
        });
    }
    
    const closeLeaderboardBtn = document.getElementById('close-leaderboard');
    if (closeLeaderboardBtn) {
        closeLeaderboardBtn.addEventListener('click', () => {
            if (gameInstance) {
                gameInstance.hideLeaderboard();
            }
        });
    }
    
    const clearLeaderboardBtn = document.getElementById('clear-leaderboard');
    if (clearLeaderboardBtn) {
        clearLeaderboardBtn.addEventListener('click', () => {
            if (gameInstance) {
                gameInstance.clearLeaderboard();
            }
        });
    }

    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (gameInstance) {
                gameInstance.hideLeaderboard();
            }
        });
    }
    
    const restartBtn = document.getElementById('restart');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            if (gameInstance) {
                gameInstance.startGame();
            }
        });
    }
    
    const saveScoreBtn = document.getElementById('save-score');
    if (saveScoreBtn) {
        saveScoreBtn.addEventListener('click', () => {
            if (!gameInstance) return;
            
            const nameInput = document.getElementById('player-name');
            if (!nameInput) return;
            
            const playerName = nameInput.value.trim();
            if (!playerName) {
                return;
            }
            
            const savedName = gameInstance.saveScoreToLeaderboard(playerName);
            
            const savedMessage = document.getElementById('saved-message');
            if (savedMessage) {
                savedMessage.textContent = `Рекорд ${savedName} сохранен! 🎉`;
                savedMessage.style.color = '#90ee90';
            }
            
            if (nameInput) nameInput.style.display = 'none';
            if (saveScoreBtn) saveScoreBtn.style.display = 'none';
            
            setTimeout(() => {
                if (gameInstance) {
                    gameInstance.showLeaderboard();
                }
            }, 1500);
        });
    }
    
    const playerNameInput = document.getElementById('player-name');
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const saveScoreBtn = document.getElementById('save-score');
                if (saveScoreBtn) {
                    saveScoreBtn.click();
                }
            }
        });
    }
    
    const leaderboardModal = document.getElementById('leaderboard-modal');
    if (leaderboardModal) {
        leaderboardModal.addEventListener('click', (e) => {
            if (e.target === leaderboardModal && gameInstance) {
                gameInstance.hideLeaderboard();
            }
        });
    }
    
    const mobileButtons = ['up', 'down', 'left', 'right'];
    mobileButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                if (gameInstance) {
                    gameInstance.move(id);
                }
            });
        }
    });
}

window.gameInstance = gameInstance;
