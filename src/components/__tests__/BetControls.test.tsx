import { render, screen, fireEvent } from '@testing-library/react'
import BetControls from '../BetControls'

describe('BetControls', () => {
  it('renders current bet', () => {
    render(<BetControls currentBet={10} disabled={false} onIncrease={() => {}} onDecrease={() => {}} />)
    expect(screen.getByText('Total Bet')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('calls onDecrease when minus is clicked', () => {
    const onDecrease = jest.fn()
    render(<BetControls currentBet={10} disabled={false} onIncrease={() => {}} onDecrease={onDecrease} />)
    
    fireEvent.click(screen.getByRole('button', { name: '-' }))
    expect(onDecrease).toHaveBeenCalledTimes(1)
  })

  it('calls onIncrease when plus is clicked', () => {
    const onIncrease = jest.fn()
    render(<BetControls currentBet={10} disabled={false} onIncrease={onIncrease} onDecrease={() => {}} />)
    
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    expect(onIncrease).toHaveBeenCalledTimes(1)
  })

  it('disables buttons when disabled prop is true', () => {
    render(<BetControls currentBet={10} disabled={true} onIncrease={() => {}} onDecrease={() => {}} />)
    
    const decreaseBtn = screen.getByRole('button', { name: '-' })
    const increaseBtn = screen.getByRole('button', { name: '+' })
    
    expect(decreaseBtn).toBeDisabled()
    expect(increaseBtn).toBeDisabled()
  })
})
