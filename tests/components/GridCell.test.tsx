import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, vi } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import GridCell from '../../components/GridCell'
import type { Cell } from '../../lib/puzzle'

expect.extend(matchers)

test('GridCell renders and handles interactions', async () => {
  const cell: Cell = { row: 0, col: 0, isBlack: false, answer: '', clueNumber: 1, userInput: '', isSelected: false }
  const onTap = vi.fn()
  const onChange = vi.fn()
  const onKeyDown = vi.fn()
  render(
    <GridCell
      cell={cell}
      isCursor={false}
      isHighlighted={false}
      onTap={onTap}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  )
  expect(screen.getByText('1')).toBeInTheDocument()
  const input = screen.getByRole('textbox')
  await userEvent.click(input)
  expect(onTap).toHaveBeenCalledWith(0, 0)
  await userEvent.type(input, 'A')
  expect(onChange).toHaveBeenCalledWith(0, 0, 'A')
  await userEvent.keyboard('{ArrowRight}')
  expect(onKeyDown).toHaveBeenCalled()
})
