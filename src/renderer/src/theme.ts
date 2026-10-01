import { createTheme } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'

export function getTheme (mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: { main: '#3a5a8c' },
            secondary: { main: '#c2410c' },
            background: { default: '#f4f1ea', paper: '#fffdfa' },
            divider: '#e4ded2',
            text: { primary: '#241f1a', secondary: '#7a6f63' }
          }
        : {
            primary: { main: '#9db8e0' },
            secondary: { main: '#ff9e64' },
            background: { default: '#14120f', paper: '#1e1b17' },
            divider: '#332e27',
            text: { primary: '#f0ece4', secondary: '#a79c8d' }
          })
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  })
}
