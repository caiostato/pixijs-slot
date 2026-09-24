import { requestMockSpin, evaluateWinLines, generateGrid, SYMBOLS } from '../mockRGS'
import { WinLine } from '../../types/game'

describe('Mock RGS (Remote Gaming Server)', () => {
  describe('Grid Generation', () => {
    it('generates a 3x3 grid of valid symbol IDs', () => {
      const grid = generateGrid()
      
      expect(grid.length).toBe(3) // 3 columns
      grid.forEach(column => {
        expect(column.length).toBe(3) // 3 rows
        column.forEach(symbolId => {
          const isValidSymbol = SYMBOLS.some(s => s.id === symbolId)
          expect(isValidSymbol).toBe(true)
        })
      })
    })
  })

  describe('Payline Evaluation', () => {
    it('detects a horizontal win on the middle row', () => {
      // 3x3 Grid [col][row]
      // Row 0: [2, 4, 2]
      // Row 1: [1, 1, 1] <- Win (Symbol 1)
      // Row 2: [3, 2, 4]
      const mockGrid = [
        [2, 1, 3], // Col 0
        [4, 1, 2], // Col 1
        [2, 1, 4]  // Col 2
      ]

      const betAmount = 10
      const winLines = evaluateWinLines(mockGrid, betAmount)
      
      expect(winLines.length).toBe(1)
      expect(winLines[0].symbolId).toBe(1)
      expect(winLines[0].positions).toEqual([
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 }
      ])
      
      // If symbol 1 has a multiplier of 5, payout should be 50
      const expectedMultiplier = SYMBOLS.find(s => s.id === 1)!.multiplier
      expect(winLines[0].payout).toBe(betAmount * expectedMultiplier)
    })

    it('returns empty winlines if there are no matches', () => {
      const mockGrid = [
        [1, 2, 3],
        [4, 5, 1],
        [2, 3, 4]
      ]
      
      const winLines = evaluateWinLines(mockGrid, 10)
      expect(winLines.length).toBe(0)
    })
  })

  describe('requestMockSpin (Latency & Payload)', () => {
    it('returns a valid SpinResponse payload after simulated latency', async () => {
      const betAmount = 10
      const currentBalance = 1000 // Server side balance
      
      // We expect the promise to resolve with a SpinResponse
      const response = await requestMockSpin(betAmount, currentBalance)
      
      expect(response.spinId).toBeDefined()
      expect(response.grid.length).toBe(3)
      expect(Array.isArray(response.winLines)).toBe(true)
      expect(typeof response.totalWin).toBe('number')
      expect(typeof response.newBalance).toBe('number')
      
      // newBalance should equal currentBalance - betAmount + totalWin
      expect(response.newBalance).toBe(currentBalance - betAmount + response.totalWin)
    })
  })
})
