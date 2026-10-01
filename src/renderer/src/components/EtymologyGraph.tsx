import { Box, Chip, Paper, Typography } from '@mui/material'
import type { EtymologyNode } from '@shared/types'

const normalize = (value: string): string => value.trim().replace(/^\*+/, '').toLowerCase()

function indexOfNode (chain: EtymologyNode[], node: EtymologyNode): number {
  return chain.findIndex(item => item.lang === node.lang && normalize(item.word) === normalize(node.word))
}

function Node (props: { node: EtymologyNode, accent?: boolean }) {
  const { node, accent } = props
  const reconstructed = node.word.startsWith('*')
  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={{
          position: 'absolute',
          left: -21,
          top: 12,
          width: 9,
          height: 9,
          mt: '-4px',
          borderRadius: '50%',
          bgcolor: accent ? 'secondary.main' : 'primary.main'
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.1 }}>
        {node.langName}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontStyle: reconstructed ? 'italic' : 'normal', color: accent ? 'secondary.main' : 'text.primary' }}
      >
        {node.word}
      </Typography>
    </Box>
  )
}

function ChainColumn (props: { title: string, nodes: EtymologyNode[], accent?: boolean }) {
  const { title, nodes, accent } = props
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      {nodes.length === 0 ? (
        <Typography variant="body2" color="text.disabled">No etymology data.</Typography>
      ) : (
        <Box
          sx={{
            borderLeft: '2px solid',
            borderColor: accent ? 'secondary.main' : 'divider',
            pl: 2,
            mt: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25
          }}
        >
          {nodes.map((node, index) => (
            <Node key={`${node.lang}-${node.word}-${index}`} node={node} accent={accent} />
          ))}
        </Box>
      )}
    </Box>
  )
}

interface Props {
  source: EtymologyNode[]
  target: EtymologyNode[]
  shared?: EtymologyNode
  sourceName: string
  targetName: string
}

export default function EtymologyGraph ({ source, target, shared, sourceName, targetName }: Props) {
  const sharedIndexSource = shared ? indexOfNode(source, shared) : -1
  const sharedIndexTarget = shared ? indexOfNode(target, shared) : -1
  const sourcePath = shared ? source.slice(sharedIndexSource + 1) : source
  const targetPath = shared ? target.slice(sharedIndexTarget + 1) : target

  return (
    <Box>
      {shared ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, mb: 2 }}>
          <Chip label="Shared origin" color="secondary" size="small" />
          <Paper variant="outlined" sx={{ px: 2, py: 1, borderColor: 'secondary.main', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {shared.langName}
            </Typography>
            <Typography variant="body1" sx={{ fontStyle: shared.word.startsWith('*') ? 'italic' : 'normal', color: 'secondary.main' }}>
              {shared.word}
            </Typography>
          </Paper>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          No shared etymon was found between these two words.
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 3 }}>
        <ChainColumn title={`${sourceName} · source`} nodes={sourcePath} />
        <ChainColumn
          title={`${targetName} · translation`}
          nodes={targetPath}
          accent={Boolean(shared)}
        />
      </Box>
    </Box>
  )
}
