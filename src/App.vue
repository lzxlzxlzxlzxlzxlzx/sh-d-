<template>
  <div class="app">
    <header class="header">
      <h1>数独求解器</h1>
      <p class="subtitle">在下方网格中填写已知数字，点击「求解」获取答案</p>
      <div class="mode-switch">
        <button
          class="btn-mode"
          :class="{ active: mode === '6x6' }"
          @click="setMode('6x6')"
        >
          6×6
        </button>
        <button
          class="btn-mode"
          :class="{ active: mode === '9x9' }"
          @click="setMode('9x9')"
        >
          9×9
        </button>
      </div>
    </header>

    <div class="sudoku-container" :class="`size-${mode}`">
      <div class="sudoku-grid" :class="{ solved: isSolved }">
        <div
          v-for="(row, rowIndex) in grid"
          :key="rowIndex"
          class="sudoku-row"
          :class="getRowBorderClass(rowIndex)"
        >
          <div
            v-for="(cell, colIndex) in row"
            :key="colIndex"
            class="sudoku-cell"
            :class="{
              ...getColBorderClass(colIndex),
              'given': cell.isGiven,
              'error': cell.error,
            }"
          >
            <input
              :value="cell.value"
              type="text"
              inputmode="numeric"
              maxlength="1"
              :readonly="cell.isGiven && isSolved"
              :class="{ filled: cell.value }"
              :data-row="rowIndex"
              :data-col="colIndex"
              @input="onCellInput($event, rowIndex, colIndex)"
              @keydown="onKeydown($event, rowIndex, colIndex)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="controls">
      <button class="btn btn-solve" @click="solve" :disabled="solving">
        {{ solving ? '求解中...' : '求解' }}
      </button>
      <button class="btn btn-clear" @click="clear">清空</button>
    </div>

    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const mode = ref('9x9')

// 6×6: 宫为 2×3；9×9: 宫为 3×3
const config = computed(() => ({
  '6x6': { size: 6, maxDigit: 6, boxRows: 2, boxCols: 3 },
  '9x9': { size: 9, maxDigit: 9, boxRows: 3, boxCols: 3 },
}))

const cfg = computed(() => config.value[mode.value])

// 创建空数独网格
function createEmptyGrid(size) {
  const n = size || cfg.value.size
  return Array.from({ length: n }, () =>
    Array.from({ length: n }, () => ({
      value: '',
      isGiven: false,
      error: false,
    }))
  )
}

const grid = ref(createEmptyGrid(9))
const isSolved = ref(false)
const solving = ref(false)
const message = ref('')
const messageType = ref('info')

// 6×6: 宫边框在第 1,3,5 行后；9×9: 宫边框在第 2,5,8 行后
function getRowBorderClass(rowIndex) {
  const { size, boxRows } = cfg.value
  const isBorder = (rowIndex + 1) % boxRows === 0 && rowIndex !== size - 1
  return { 'row-border': isBorder }
}

// 6×6: 宫边框在第 2,5 列后；9×9: 宫边框在第 2,5,8 列后
function getColBorderClass(colIndex) {
  const { size, boxCols } = cfg.value
  const isBorder = (colIndex + 1) % boxCols === 0 && colIndex !== size - 1
  return { 'col-border': isBorder }
}

function setMode(m) {
  if (mode.value === m) return
  mode.value = m
  grid.value = createEmptyGrid(cfg.value.size)
  isSolved.value = false
  message.value = ''
}

// 输入验证：6×6 允许 1-6，9×9 允许 1-9
function onCellInput(event, row, col) {
  const input = event.target.value
  if (input === '') {
    grid.value[row][col].value = ''
    grid.value[row][col].isGiven = false
    grid.value[row][col].error = false
    isSolved.value = false
    message.value = ''
    return
  }
  const num = parseInt(input, 10)
  const maxDigit = cfg.value.maxDigit
  if (!isNaN(num) && num >= 1 && num <= maxDigit) {
    grid.value[row][col].value = num
    grid.value[row][col].isGiven = true
    grid.value[row][col].error = false
  } else {
    const prev = grid.value[row][col].value
    event.target.value = prev === '' ? '' : String(prev)
  }
  isSolved.value = false
  message.value = ''
}

// 键盘导航
function onKeydown(event, row, col) {
  const maxIdx = cfg.value.size - 1
  const key = event.key
  let target = null
  if (key === 'ArrowUp' && row > 0) {
    event.preventDefault()
    target = document.querySelector(`input[data-row="${row - 1}"][data-col="${col}"]`)
  } else if (key === 'ArrowDown' && row < maxIdx) {
    event.preventDefault()
    target = document.querySelector(`input[data-row="${row + 1}"][data-col="${col}"]`)
  } else if (key === 'ArrowLeft' && col > 0) {
    event.preventDefault()
    target = document.querySelector(`input[data-row="${row}"][data-col="${col - 1}"]`)
  } else if (key === 'ArrowRight' && col < maxIdx) {
    event.preventDefault()
    target = document.querySelector(`input[data-row="${row}"][data-col="${col + 1}"]`)
  } else if (key === 'Backspace' && !grid.value[row][col].value && col > 0) {
    event.preventDefault()
    target = document.querySelector(`input[data-row="${row}"][data-col="${col - 1}"]`)
  }
  target?.focus()
}

// 将网格转换为二维数字数组（空为0）
function gridToMatrix() {
  return grid.value.map((row) =>
    row.map((cell) => (cell.value === '' ? 0 : parseInt(cell.value, 10)))
  )
}

// 检查在 (row,col) 放置 num 是否有效
function isValid(board, row, col, num) {
  const { size, boxRows, boxCols } = cfg.value
  for (let i = 0; i < size; i++) {
    if (i !== col && board[row][i] === num) return false
    if (i !== row && board[i][col] === num) return false
  }
  const boxRow = Math.floor(row / boxRows) * boxRows
  const boxCol = Math.floor(col / boxCols) * boxCols
  for (let i = 0; i < boxRows; i++) {
    for (let j = 0; j < boxCols; j++) {
      const r = boxRow + i
      const c = boxCol + j
      if ((r !== row || c !== col) && board[r][c] === num) return false
    }
  }
  return true
}

// 回溯法求解数独
function solveSudoku(board) {
  const { size, maxDigit } = cfg.value
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= maxDigit; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num
            if (solveSudoku(board)) return true
            board[row][col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

// 求解
function solve() {
  const board = gridToMatrix()
  const givenCells = grid.value.map((row) =>
    row.map((cell) => cell.isGiven)
  )
  const { size } = cfg.value

  // 验证当前输入是否合法
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      grid.value[r][c].error = false
      if (board[r][c] !== 0 && !isValid(board, r, c, board[r][c])) {
        grid.value[r][c].error = true
        message.value = '当前输入存在冲突，请检查数独是否合法'
        messageType.value = 'error'
        return
      }
    }
  }

  solving.value = true
  message.value = ''

  // 使用 setTimeout 让 UI 更新
  setTimeout(() => {
    const success = solveSudoku(board)
    solving.value = false

    if (success) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          grid.value[r][c].value = board[r][c]
          grid.value[r][c].isGiven = givenCells[r][c]  // 原题数字保持高亮
        }
      }
      isSolved.value = true
      message.value = '求解成功！'
      messageType.value = 'success'
    } else {
      message.value = '无解，请检查输入的数独是否有误'
      messageType.value = 'error'
    }
  }, 50)
}

// 清空
function clear() {
  grid.value = createEmptyGrid(cfg.value.size)
  isSolved.value = false
  message.value = ''
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  min-height: 100vh;
  color: #e8e8e8;
  display: flex;
  justify-content: center;
  align-items: center;
}

.app {
  text-align: center;
  padding: 2rem;
  max-width: 520px;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  background: linear-gradient(90deg, #e94560, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin-top: 0.5rem;
  color: #a0a0a0;
  font-size: 0.95rem;
}

.mode-switch {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-mode {
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #a0a0a0;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-mode:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.btn-mode.active {
  background: rgba(233, 69, 96, 0.3);
  border-color: rgba(233, 69, 96, 0.6);
  color: #ff6b6b;
}

.sudoku-container {
  display: inline-block;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.sudoku-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.sudoku-row {
  display: flex;
}

.sudoku-cell {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.sudoku-container.size-6x6 .sudoku-cell {
  width: 48px;
  height: 48px;
}

.sudoku-cell.col-border {
  border-right: 2px solid rgba(233, 69, 96, 0.6);
}

.sudoku-row.row-border .sudoku-cell {
  border-bottom: 2px solid rgba(233, 69, 96, 0.6);
}

.sudoku-cell input {
  width: 100%;
  height: 100%;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
  outline: none;
  transition: background 0.2s;
}

.sudoku-cell input:focus {
  background: rgba(233, 69, 96, 0.2);
}

.sudoku-cell input.filled {
  color: #ff6b6b;
}

.sudoku-cell.given input {
  color: #4ecdc4;
  font-weight: 700;
}

.sudoku-cell.error input {
  background: rgba(255, 82, 82, 0.3);
  color: #ff5252;
}

.sudoku-grid.solved .sudoku-cell.given input {
  color: #4ecdc4;
}

.sudoku-grid.solved .sudoku-cell:not(.given) input {
  color: #ffd93d;
}

.controls {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-solve {
  background: linear-gradient(135deg, #e94560, #ff6b6b);
  color: white;
}

.btn-clear {
  background: rgba(255, 255, 255, 0.15);
  color: #e8e8e8;
}

.message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 500;
}

.message.success {
  background: rgba(78, 205, 196, 0.2);
  color: #4ecdc4;
}

.message.error {
  background: rgba(255, 82, 82, 0.2);
  color: #ff5252;
}

.message.info {
  background: rgba(255, 255, 255, 0.1);
  color: #a0a0a0;
}
</style>
