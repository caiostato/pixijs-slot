import { AudioManager } from '../AudioManager'
import { useGameStore } from '../../store/gameStore'
import { GameState } from '../../types/game'

// Mock Howler's Howl class
jest.mock('howler', () => {
  return {
    Howl: jest.fn().mockImplementation(() => ({
      play: jest.fn(),
      stop: jest.fn(),
      volume: jest.fn(),
      unload: jest.fn(),
    }))
  }
})

describe('AudioManager', () => {
  let audioManager: AudioManager

  beforeEach(() => {
    // Reset store before each test
    useGameStore.setState({ currentState: GameState.IDLE })
    // Clear mocks
    jest.clearAllMocks()
    audioManager = new AudioManager()
  })

  afterEach(() => {
    audioManager.destroy()
  })

  it('plays spin sound and stops idle sound when transitioning to SPINNING', () => {
    // Spy on the mocked howls
    const playSpinSpy = jest.spyOn(audioManager.sounds.spin, 'play')
    const stopIdleSpy = jest.spyOn(audioManager.sounds.idle, 'stop')

    // Simulate Zustand transition
    useGameStore.setState({ currentState: GameState.SPINNING })

    expect(playSpinSpy).toHaveBeenCalled()
    expect(stopIdleSpy).toHaveBeenCalled()
  })

  it('plays win sound when transitioning to PAYOUT_ANIMATION', () => {
    const playWinSpy = jest.spyOn(audioManager.sounds.win, 'play')

    useGameStore.setState({ currentState: GameState.PAYOUT_ANIMATION })

    expect(playWinSpy).toHaveBeenCalled()
  })

  it('plays reel stop sound when transitioning to RESULT_RECEIVED', () => {
    const playStopSpy = jest.spyOn(audioManager.sounds.stop, 'play')

    useGameStore.setState({ currentState: GameState.RESULT_RECEIVED })

    expect(playStopSpy).toHaveBeenCalled()
  })
})
