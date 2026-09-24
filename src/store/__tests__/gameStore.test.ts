import { useGameStore } from '../gameStore'
import { GameState } from '../../types/game'

describe('gameStore FSM', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
      currentState: GameState.IDLE,
      balance: 10000,
      currentBet: 10,
      lastResult: null,
    })
  })

  it('starts with correct initial state', () => {
    const state = useGameStore.getState()
    expect(state.currentState).toBe(GameState.IDLE)
    expect(state.balance).toBe(10000)
    expect(state.currentBet).toBe(10)
  })

  it('deducts bet and transitions to SPINNING when requestSpin is called from IDLE', () => {
    const { requestSpin } = useGameStore.getState()
    requestSpin()
    
    const state = useGameStore.getState()
    expect(state.currentState).toBe(GameState.SPINNING)
    expect(state.balance).toBe(9990) // 10000 - 10
  })

  it('does not spin if balance is insufficient', () => {
    useGameStore.setState({ balance: 5, currentBet: 10 })
    const { requestSpin } = useGameStore.getState()
    requestSpin()
    
    const state = useGameStore.getState()
    expect(state.currentState).toBe(GameState.IDLE)
    expect(state.balance).toBe(5)
  })

  it('transitions to RESULT_RECEIVED when receiveResult is called during SPINNING', () => {
    useGameStore.setState({ currentState: GameState.SPINNING })
    const { receiveResult } = useGameStore.getState()
    
    const mockPayload = {
      spinId: '123',
      grid: [[1,1,1],[2,2,2],[3,3,3]],
      winLines: [],
      totalWin: 0,
      newBalance: 9990
    }
    
    receiveResult(mockPayload)
    
    const state = useGameStore.getState()
    expect(state.currentState).toBe(GameState.RESULT_RECEIVED)
    expect(state.lastResult).toEqual(mockPayload)
  })

  it('transitions to PAYOUT_ANIMATION if there is a win', () => {
    useGameStore.setState({ 
      currentState: GameState.RESULT_RECEIVED,
      lastResult: { totalWin: 50, spinId: '1', grid: [], winLines: [], newBalance: 10050 }
    })
    
    const { startPayoutAnimation } = useGameStore.getState()
    startPayoutAnimation()
    
    expect(useGameStore.getState().currentState).toBe(GameState.PAYOUT_ANIMATION)
  })

  it('skips to IDLE if there is no win when startPayoutAnimation is called', () => {
    useGameStore.setState({ 
      currentState: GameState.RESULT_RECEIVED,
      lastResult: { totalWin: 0, spinId: '1', grid: [], winLines: [], newBalance: 9990 }
    })
    
    const { startPayoutAnimation } = useGameStore.getState()
    startPayoutAnimation()
    
    expect(useGameStore.getState().currentState).toBe(GameState.IDLE)
    expect(useGameStore.getState().balance).toBe(9990)
  })
})
