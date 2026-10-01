import { Box, Card, IconButton, Stack, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import type { SavedRoot } from '../lib/roots'

interface Props {
  roots: SavedRoot[]
  onRemove: (id: string) => void
}

export default function MyRoots ({ roots, onRemove }: Props) {
  if (roots.length === 0) {
    return (
      <Box sx={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary" align="center" sx={{ maxWidth: 420 }}>
          Nothing saved yet. Find a connection in the Translator and press “Save root”.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', width: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {roots.length} {roots.length === 1 ? 'root' : 'roots'} discovered
      </Typography>
      {roots.map(root => (
        <Card key={root.id} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 600 }}>{root.word}</Typography>
              <Typography variant="caption" color="text.secondary">{root.from} → {root.to}</Typography>
              {root.gloss && <Typography variant="body2" color="text.secondary">→ {root.gloss}</Typography>}
            </Stack>
            {root.ancestorWord && (
              <Typography variant="caption" color="secondary.main">
                shared ancestor: {root.ancestorLang} {root.ancestorWord}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => onRemove(root.id)} aria-label={`Remove ${root.word}`}>
            <DeleteIcon />
          </IconButton>
        </Card>
      ))}
    </Box>
  )
}
