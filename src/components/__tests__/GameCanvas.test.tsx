import { render } from '@testing-library/react'
import { GameCanvas } from '../GameCanvas'
import { GameEngine } from '../../engine/GameEngine'

// Mock the GameEngine to avoid WebGL / PixiJS errors in JSDOM
jest.mock('../../engine/GameEngine', () => {
  return {
    GameEngine: jest.fn().mockImplementation(() => ({
      init: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn()
    }))
  }
})

describe('GameCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders a container for the canvas', () => {
    const { container } = render(<GameCanvas />)
    // The component renders a div with minHeight 600px
    const div = container.querySelector('div')
    expect(div).toBeInTheDocument()
    expect(div).toHaveStyle('minHeight: 600px')
  })

  it('initializes GameEngine on mount and destroys on unmount', () => {
    const { unmount } = render(<GameCanvas />)
    
    // Check if GameEngine constructor was called
    expect(GameEngine).toHaveBeenCalledTimes(1)
    
    // Get the mocked instance
    const mockEngineInstance = (GameEngine as jest.Mock).mock.results[0].value
    expect(mockEngineInstance.init).toHaveBeenCalledTimes(1)
    
    // Unmount should trigger destroy
    unmount()
    expect(mockEngineInstance.destroy).toHaveBeenCalledTimes(1)
  })
})
