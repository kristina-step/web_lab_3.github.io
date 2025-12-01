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
        
        // Выполняем движение
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
            
            // Добавляем в историю
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
        let previous = null;
        let skip = false;
        
        // Собираем все ненулевые значения
        for (let col = 0; col < this.gridSize; col++) {
            if (this.grid[row][col] !== 0) {
                newRow.push(this.grid[row][col]);
            }
        }
        
        // Объединяем соседние одинаковые значения
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
        
        // Заполняем нулями до нужной длины
        while (newRow.length < this.gridSize) {
            newRow.push(0);
        }
        
        // Обновляем строку
        this.grid[row] = newRow;
        return points;
    }
    
    processRowRight(row) {
        let points = 0;
        const newRow = [];
        let previous = null;
        let skip = false;
        
        // Собираем все ненулевые значения справа налево
        for (let col = this.gridSize - 1; col >= 0; col--) {
            if (this.grid[row][col] !== 0) {
                newRow.push(this.grid[row][col]);
            }
        }
        
        // Объединяем соседние одинаковые значения
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
        
        // Заполняем нулями до нужной длины
        while (newRow.length < this.gridSize) {
            newRow.push(0);
        }
        
        // Разворачиваем и обновляем строку
        newRow.reverse();
        this.grid[row] = newRow;
        return points;
    }
    
    processColumnUp(col) {
        let points = 0;
        const newColumn = [];
        let skip = false;
        
        // Собираем все ненулевые значения сверху вниз
        for (let row = 0; row < this.gridSize; row++) {
            if (this.grid[row][col] !== 0) {
                newColumn.push(this.grid[row][col]);
            }
        }
        
        // Объединяем соседние одинаковые значения
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
        
        // Заполняем нулями до нужной длины
        while (newColumn.length < this.gridSize) {
            newColumn.push(0);
        }
        
        // Обновляем столбец
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row][col] = newColumn[row];
        }
        
        return points;
    }
    
    processColumnDown(col) {
        let points = 0;
        const newColumn = [];
        let skip = false;
        
        // Собираем все ненулевые значения снизу вверх
        for (let row = this.gridSize - 1; row >= 0; row--) {
            if (this.grid[row][col] !== 0) {
                newColumn.push(this.grid[row][col]);
            }
        }
        
        // Объединяем соседние одинаковые значения
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
        
        // Заполняем нулями до нужной длины
        while (newColumn.length < this.gridSize) {
            newColumn.push(0);
        }
        
        // Разворачиваем и обновляем столбец
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
        // Проверяем, есть ли пустые клетки
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    return false;
                }
            }
        }
        
        // Проверяем, есть ли возможные слияния
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const current = this.grid[row][col];
                
                // Проверка правого соседа
                if (col < this.gridSize - 1 && this.grid[row][col + 1] === current) {
                    return false;
                }
                // Проверка нижнего соседа
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
            alert('Нет ходов для отмены!');
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
        
        // Сортируем по убыванию очков
        this.leaderboard.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
        
        // Оставляем только топ-10
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
        
        // Если таблица пуста
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
    

window.gameInstance = gameInstance;
