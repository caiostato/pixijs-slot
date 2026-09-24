import { render, screen } from '@testing-library/react'
import BalanceDisplay from '../BalanceDisplay'

describe('BalanceDisplay', () => {
  it('renders the balance formatted to 2 decimal places', () => {
    render(<BalanceDisplay balance={10000} />)
    
    expect(screen.getByText('Balance')).toBeInTheDocument()
    expect(screen.getByText('10000.00')).toBeInTheDocument()
  })

  it('handles zero balance correctly', () => {
    render(<BalanceDisplay balance={0} />)
    expect(screen.getByText('0.00')).toBeInTheDocument()
  })
})
