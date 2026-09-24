import { render, screen } from '@testing-library/react'
import Header from '../Header'

describe('Header', () => {
  it('renders the username and BalanceDisplay', () => {
    render(<Header username="Player1" balance={10500} />)
    
    expect(screen.getByText('Player1')).toBeInTheDocument()
    expect(screen.getByText('Balance')).toBeInTheDocument()
    expect(screen.getByText('10500.00')).toBeInTheDocument()
  })
})
