import { useMemo } from 'react'
import { Box, Paper, Typography, useTheme } from '@mui/material'
import { TREE } from '../data/tree'
import type { TreeNode } from '../data/tree'
import type { LangCode } from '@shared/types'

const DX = 132
const DY = 104
const PAD_X = 70
const PAD_Y = 44

interface LaidOutNode {
  name: string
  lang?: LangCode
  highlight: boolean
  x: number
  y: number
  kids: LaidOutNode[]
}

function layoutTree (root: TreeNode): { root: LaidOutNode, width: number, height: number } {
  let leaf = 0
  let maxDepth = 0

  function walk (src: TreeNode, depth: number): LaidOutNode {
    maxDepth = Math.max(maxDepth, depth)
    const kids = (src.children ?? []).map(child => walk(child, depth + 1))
    const x = kids.length === 0
      ? PAD_X + leaf++ * DX
      : kids.reduce((sum, kid) => sum + kid.x, 0) / kids.length

    return {
      name: src.name,
      lang: src.lang,
      highlight: Boolean(src.highlight),
      x,
      y: PAD_Y + depth * DY,
      kids
    }
  }

  const laidOut = walk(root, 0)
  return {
    root: laidOut,
    width: PAD_X * 2 + Math.max(leaf - 1, 0) * DX,
    height: PAD_Y * 2 + maxDepth * DY
  }
}

function flatten (root: LaidOutNode): LaidOutNode[] {
  const nodes: LaidOutNode[] = []
  ;(function collect (node: LaidOutNode) {
    nodes.push(node)
    node.kids.forEach(collect)
  })(root)
  return nodes
}

export default function LanguageTree ({ onPick }: { onPick: (code: LangCode) => void }) {
  const theme = useTheme()
  const { root, width, height } = useMemo(() => layoutTree(TREE), [])
  const nodes = useMemo(() => flatten(root), [root])

  const colors = {
    link: theme.palette.divider,
    internal: theme.palette.primary.main,
    leaf: theme.palette.text.disabled,
    highlight: theme.palette.secondary.main,
    text: theme.palette.text.primary,
    highlightText: theme.palette.secondary.main
  }

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="body2" color="text.secondary">
        The four languages of this app (English, Russian, Spanish, French) are highlighted.
        Click a highlighted node to send it to the translator.
      </Typography>

      <Paper
        variant="outlined"
        sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1.5 }}
      >
        <svg
          role="img"
          aria-label="Indo-European language tree"
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          style={{ display: 'block' }}
        >
          {nodes.flatMap(node =>
            node.kids.map(kid => {
              const mid = (node.y + kid.y) / 2
              return (
                <path
                  key={`${node.x}-${kid.x}-${kid.y}`}
                  fill="none"
                  stroke={colors.link}
                  strokeWidth={1.5}
                  d={`M ${node.x} ${node.y} C ${node.x} ${mid}, ${kid.x} ${mid}, ${kid.x} ${kid.y}`}
                />
              )
            })
          )}

          {nodes.map(node => (
            <g
              key={`${node.name}-${node.x}`}
              onClick={node.lang ? () => onPick(node.lang as LangCode) : undefined}
              style={{ cursor: node.lang ? 'pointer' : 'default' }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.highlight ? 9 : node.kids.length > 0 ? 6 : 4}
                fill={
                  node.highlight
                    ? colors.highlight
                    : node.kids.length > 0
                      ? colors.internal
                      : colors.leaf
                }
              />
              <text
                x={node.x}
                y={node.y + (node.highlight ? 27 : 21)}
                textAnchor="middle"
                fill={node.highlight ? colors.highlightText : colors.text}
                fontWeight={node.highlight ? 600 : 400}
                fontSize={12}
                fontFamily={theme.typography.fontFamily}
              >
                {node.name}
              </text>
            </g>
          ))}
        </svg>
      </Paper>
    </Box>
  )
}
