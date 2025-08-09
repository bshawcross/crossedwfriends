import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Grid from './Grid'
import type { Cell } from '../lib/puzzle'
import { coordsToIndex } from '../lib/puzzle'

function createCells(): Cell[] {
  const cells: Cell[] = []
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      cells.push({
        row: r,
        col: c,
        isBlack: false,
        answer: '',
        clueNumber: null,
        userInput: '',
        isSelected: false,
      })
    }
  }
  return cells
}

function createNumberedCells(): Cell[] {
  const cells = createCells()
  const blackIdx = coordsToIndex(0, 2, 15)
  cells[blackIdx].isBlack = true
  cells[coordsToIndex(0, 0, 15)].clueNumber = 1
  cells[coordsToIndex(0, 3, 15)].clueNumber = 2
  return cells
}

function renderGrid() {
  function Wrapper() {
    const [cells, setCells] = React.useState(createCells())
    return <Grid cells={cells} setCells={setCells} />
  }
  return render(<Wrapper />)
}

describe('Grid focus movement', () => {
  test('typing moves focus to the right when direction is across', async () => {
    const user = userEvent.setup()
    renderGrid()
    const inputs = screen.getAllByRole('textbox')
    expect(inputs[0]).toHaveFocus()
    await user.type(inputs[0], 'A')
    await waitFor(() => expect(inputs[1]).toHaveFocus())
  })

  test('typing moves focus downward when direction is down', async () => {
    const user = userEvent.setup()
    renderGrid()
    const inputs = screen.getAllByRole('textbox')
    expect(inputs[0]).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.type(inputs[0], 'B')
    const below = inputs[15]
    await waitFor(() => expect(below).toHaveFocus())
  })

  test('completing a word advances to next across clue', async () => {
    const user = userEvent.setup()
    function Wrapper() {
      const [cells, setCells] = React.useState(createNumberedCells())
      return <Grid cells={cells} setCells={setCells} />
    }
    render(<Wrapper />)
    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'A')
    await user.type(inputs[1], 'B')
    await waitFor(() => expect(inputs[3]).toHaveFocus())
  })

  test('after last across clue, moves to first down clue', async () => {
    const user = userEvent.setup()
    function Wrapper() {
      const [cells, setCells] = React.useState(createNumberedCells())
      return <Grid cells={cells} setCells={setCells} />
    }
    render(<Wrapper />)
    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'A')
    await user.type(inputs[1], 'B')
    await user.type(inputs[3], 'C')
    await user.type(inputs[4], 'D')
    await waitFor(() => expect(inputs[0]).toHaveFocus())
    await user.type(inputs[0], 'E')
    const below = inputs[15]
    await waitFor(() => expect(below).toHaveFocus())
  })
})

