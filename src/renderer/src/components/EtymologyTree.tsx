import { useMemo } from 'react'
import { hierarchy, tree } from 'd3-hierarchy'
import { motion, useReducedMotion } from 'motion/react'
import { Box, Typography, useTheme } from '@mui/material'
import { buildEtymologyTree } from '../../../core/etymologyTree'
import type { EtyTreeNode } from '../../../core/etymologyTree'
import type { EtymologyNode } from '@shared/types'

const DX = 200
const DY = 92
const MARGIN_X = 56
const MARGIN_TOP = 40
const LABEL_PAD = 220

interface Props {
  source: EtymologyNode[]
  target: EtymologyNode[]
  sourceName: string
  targetName: string
}

function radiusOf (node: EtyTreeNode): number {
  if (node.isDivergence) return 11
  if (node.isLeaf) return 9
  return 6
}

export default function EtymologyTree ({ source, target, sourceName, targetName }: Props) {
  const theme = useTheme()
  const reduce = useReducedMotion() ?? false

  const layout = useMemo(() => {
    const data = buildEtymologyTree(source, target)
    const root = tree<EtyTreeNode>().nodeSize([DX, DY])(hierarchy<EtyTreeNode>(data))

    const all = root.descendants()
    const visible = all.filter(node => node.depth > 0)

    let minX = Infinity
    let maxX = -Infinity
    let maxDepth = 0
    for (const node of visible) {
      minX = Math.min(minX, node.x)
      maxX = Math.max(maxX, node.x)
      maxDepth = Math.max(maxDepth, node.depth)
    }

    const offsetX = visible.length > 0 ? MARGIN_X - minX : 0
    const width = (visible.length > 0 ? maxX - minX : 0) + MARGIN_X * 2 + LABEL_PAD
    const height = Math.max(maxDepth - 0, 1) * DY + MARGIN_TOP * 2

    return {
      nodes: visible,
      links: root.links().filter(link => link.source.depth > 0),
      width,
      height,
      offsetX,
      shared: data.children.length === 1
    }
  }, [source, target])

  const positionOf = (node: { x: number, depth: number }): { x: number, y: number } => ({
    x: node.x + layout.offsetX,
    y: (node.depth - 1) * DY + MARGIN_TOP
  })

  return (
    <Box sx={{ width: '100%' }}>
      {!layout.shared && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          No shared etymon was found between {sourceName} and {targetName} — the two lineages stay separate.
        </Typography>
      )}
      <Box sx={{ width: '100%' }}>
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Etymology tree: ${sourceName} and ${targetName}`}
          style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
        >
          {layout.links.map((link, index) => {
            const from = positionOf(link.source)
            const to = positionOf(link.target)
            const midY = (from.y + to.y) / 2
            const d = `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`
            const highlight = link.target.data.isDivergence || link.target.data.role === 'trunk'
            return (
              <motion.path
                key={`link-${index}`}
                d={d}
                fill="none"
                stroke={highlight ? theme.palette.primary.main : theme.palette.divider}
                strokeWidth={highlight ? 1.84 : 1.5}
                initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeInOut', delay: reduce ? 0 : (link.target.depth - 1) * 0.08 }}
              />
            )
          })}

          {layout.nodes.map(node => {
            const data = node.data
            const pos = positionOf(node)
            const reconstructed = data.word.startsWith('*')
            const roleColor = data.isDivergence || data.role === 'target'
              ? theme.palette.secondary.main
              : theme.palette.primary.main
            const r = radiusOf(data)

            return (
              <g key={data.id} transform={`translate(${pos.x},${pos.y})`}>
                <motion.g
                  initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22, delay: reduce ? 0 : (node.depth - 1) * 0.08 }}
                >
                  {data.isDivergence && (
                    <circle r={r + 5} fill="none" stroke={theme.palette.secondary.main} strokeWidth={1.5} opacity={0.35} />
                  )}
                  <circle
                    r={r}
                    fill={reconstructed ? theme.palette.background.paper : roleColor}
                    stroke={roleColor}
                    strokeWidth={reconstructed ? 2 : 0}
                    strokeDasharray={reconstructed ? '3 2' : undefined}
                  />
                  <text x={r + 8} y={-3} textAnchor="start" fontSize={12} fill={theme.palette.text.secondary}>
                    {data.langName}
                  </text>
                  <text
                    x={r + 8}
                    y={15}
                    textAnchor="start"
                    fontSize={15}
                    fill={theme.palette.text.primary}
                    fontStyle={reconstructed ? 'italic' : 'normal'}
                    fontWeight={data.isDivergence ? 600 : 400}
                  >
                    {data.word}
                  </text>
                </motion.g>
              </g>
            )
          })}
        </svg>
      </Box>
    </Box>
  )
}
