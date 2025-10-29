import { forwardRef } from 'react'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@radix-ui/react-dropdown-menu', () => {
  return {
    Root: ({ children, open, defaultOpen, ...props }) => (
      <div data-open={open ?? defaultOpen} {...props}>
        {children}
      </div>
    ),
    Trigger: forwardRef((props, ref) => (
      <button type="button" {...props} ref={ref} />
    )),
    Content: forwardRef((props, ref) => (
      <div role="menu" {...props} ref={ref} />
    )),
    Item: forwardRef(({ onSelect, onClick, ...props }, ref) => (
      <div
        role="menuitem"
        tabIndex={0}
        {...props}
        ref={ref}
        onClick={(event) => {
          onSelect?.(event)
          onClick?.(event)
        }}
      />
    )),
    Portal: ({ children }) => <>{children}</>,
    Group: ({ children, ...props }) => <div {...props}>{children}</div>,
    Label: ({ children, ...props }) => <div {...props}>{children}</div>,
    CheckboxItem: forwardRef((props, ref) => (
      <div role="menuitemcheckbox" {...props} ref={ref} />
    )),
    RadioGroup: ({ children, ...props }) => (
      <div role="group" {...props}>
        {children}
      </div>
    ),
    RadioItem: forwardRef((props, ref) => (
      <div role="menuitemradio" {...props} ref={ref} />
    )),
    Separator: (props) => <div role="separator" {...props} />,
    Shortcut: (props) => <span {...props} />,
    Sub: ({ children, ...props }) => <div {...props}>{children}</div>,
    SubTrigger: forwardRef((props, ref) => (
      <button type="button" {...props} ref={ref} />
    )),
    SubContent: forwardRef((props, ref) => (
      <div role="menu" {...props} ref={ref} />
    )),
  }
})

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../dropdown-menu'

describe('DropdownMenu', () => {
  const renderMenu = ({ triggerProps = {}, contentProps = {}, rootProps = {} } = {}) =>
    render(
      <DropdownMenu {...rootProps}>
        <DropdownMenuTrigger {...triggerProps}>Options</DropdownMenuTrigger>
        <DropdownMenuContent {...contentProps}>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

  it('renders trigger and menu content', () => {
    renderMenu()
    expect(screen.getByRole('button', { name: /options/i })).toBeInTheDocument()
  })

  it('applies custom class names to the menu content', () => {
    renderMenu({ rootProps: { defaultOpen: true }, contentProps: { className: 'custom-menu' } })
    expect(screen.getByRole('menu')).toHaveClass('custom-menu')
  })

  it('allows selecting an item through interaction', () => {
    const handleSelect = vi.fn()

    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={handleSelect}>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    fireEvent.click(screen.getByRole('menuitem', { name: /profile/i }))
    expect(handleSelect).toHaveBeenCalledTimes(1)
  })

  it('exposes accessible menu roles', () => {
    renderMenu({ rootProps: { defaultOpen: true } })
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument()
  })
})
