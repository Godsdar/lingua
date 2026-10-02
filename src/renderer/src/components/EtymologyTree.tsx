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
const MARGIN_TOP = 44
const MARGIN_BOTTOM = 86
const LABEL_PAD = 220

const MAX_WIDTH = 15
const WIDTH_DECAY = 0.62
const SEGMENTS = 6

const LEAF_PATH = 'M0,0 C5,-5 14,-4 20,0 C14,4 5,5 0,0 Z'
const LEAF_ID = 'lingua-leaf'

interface Point { x: number, y: number }

function fnv1a (value: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function mulberry32 (seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const widthAt = (depth: number): number => MAX_WIDTH * Math.pow(WIDTH_DECAY, Math.max(0, depth - 1))

interface Props {
  source: EtymologyNode[]
  target: EtymologyNode[]
  sourceName: string
  targetName: string
}

function radiusOf (node: EtyTreeNode): number {
  if (node.isDivergence) return 11
  if (node.isLeaf) return 8
  return 5
}

function cubicAt (p0: Point, c1: Point, c2: Point, p1: Point, t: number): Point {
  const u = 1 - t
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y
  }
}

interface Segment { d: string, w: number }

function taperedSegments (from: Point, to: Point, w0: number, w1: number, bend: number): Segment[] {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const c1: Point = { x: from.x + dx * 0.25 + bend, y: from.y + dy * 0.45 }
  const c2: Point = { x: to.x - dx * 0.25 + bend, y: to.y - dy * 0.45 }
  return Array.from({ length: SEGMENTS }, (_, i) => {
    const a = cubicAt(from, c1, c2, to, i / SEGMENTS)
    const b = cubicAt(from, c1, c2, to, (i + 1) / SEGMENTS)
    return {
      d: `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} L ${b.x.toFixed(2)} ${b.y.toFixed(2)}`,
      w: w0 + (w1 - w0) * ((i + 0.5) / SEGMENTS)
    }
  })
}

export default function EtymologyTree ({ source, target, sourceName, targetName }: Props) {
  const theme = useTheme()
  const reduce = useReducedMotion() ?? false
  const wood = theme.palette.mode === 'dark' ? '#8a7355' : '#6b5a45'
  const leafColor = theme.palette.success.main

  const layout = useMemo(() => {
    const data = buildEtymologyTree(source, target)
    const root = tree<EtyTreeNode>().nodeSize([DX, DY])(hierarchy<EtyTreeNode>(data))

    const all = root.descendants()
    const visible = all.filter(node => node.depth > 0)

    let minX = Infinity
    let maxX = -Infinity
    let maxDepth = 1
    for (const node of visible) {
      minX = Math.min(minX, node.x)
      maxX = Math.max(maxX, node.x)
      maxDepth = Math.max(maxDepth, node.depth)
    }

    const offsetX = visible.length > 0 ? MARGIN_X - minX : 0
    const width = (visible.length > 0 ? maxX - minX : 0) + MARGIN_X * 2 + LABEL_PAD
    // Depth 1 (oldest) sits at the bottom, deepest (modern) at the top.
    const height = (maxDepth - 1) * DY + MARGIN_TOP + MARGIN_BOTTOM

    return {
      nodes: visible,
      links: root.links().filter(link => link.source.depth > 0),
      width,
      height,
      offsetX,
      maxDepth,
      shared: data.children.length === 1
    }
  }, [source, target])

  const seedKey = `${sourceName}|${targetName}|${source[source.length - 1]?.word ?? ''}|${target[target.length - 1]?.word ?? ''}`
  const base = useMemo(() => fnv1a(seedKey), [seedKey])

  const positionOf = (node: { x: number, depth: number }): Point => ({
    x: node.x + layout.offsetX,
    y: (layout.maxDepth - node.depth) * DY + MARGIN_TOP
  })

  const roots = layout.nodes.filter(node => node.data.isRoot)
  const rootBaseline = roots.length > 0
    ? Math.max(...roots.map(node => positionOf(node).y)) + 34
    : layout.height - MARGIN_BOTTOM + 20

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
          style={{ display: 'block', maxWidth: '100%', height: 'auto', shapeRendering: 'geometricPrecision' }}
        >
          <defs>
            <path id={LEAF_ID} d={LEAF_PATH} />
          </defs>

          {/* ground line */}
          <line
            x1={0}
            x2={layout.width}
            y1={rootBaseline}
            y2={rootBaseline}
            stroke={theme.palette.divider}
            strokeWidth={1.5}
            strokeDasharray="2 5"
          />

          {/* roots */}
          {roots.map(node => {
            const point = positionOf(node)
            const rng = mulberry32(base ^ fnv1a(`root-${node.data.id}`))
            const rootStrokes = [-1, 0, 1].map(direction => {
              const spread = direction * (16 + rng() * 12)
              const end: Point = { x: point.x + spread, y: point.y + 40 + rng() * 16 }
              const segments = taperedSegments(point, end, 6, 1.6, spread * 0.2)
              return segments
            })
            return (
              <g key={`root-${node.data.id}`} aria-hidden="true">
                {rootStrokes.flat().map((segment, index) => (
                  <path
                    key={index}
                    d={segment.d}
                    fill="none"
                    stroke={wood}
                    strokeWidth={segment.w}
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                ))}
              </g>
            )
          })}

          {/* branches */}
          {layout.links.map((link, index) => {
            const from = positionOf(link.source)
            const to = positionOf(link.target)
            const rng = mulberry32(base ^ fnv1a(link.target.data.id))
            const bend = (rng() - 0.5) * Math.max(26, Math.abs(to.x - from.x) * 0.3)
            const segments = taperedSegments(from, to, widthAt(link.source.depth), widthAt(link.target.depth), bend)
            const delay = reduce ? 0 : (link.target.depth - 1) * 0.12
            return segments.map((segment, segmentIndex) => (
              <motion.path
                key={`link-${index}-${segmentIndex}`}
                d={segment.d}
                fill="none"
                stroke={wood}
                strokeWidth={segment.w}
                strokeLinecap="round"
                initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: reduce ? 0 : 0.45, ease: 'easeOut', delay: delay + segmentIndex * 0.03 }}
              />
            ))
          })}

          {/* leaves (crown) */}
          {layout.nodes.filter(node => node.data.isLeaf).map(node => {
            const point = positionOf(node)
            const rng = mulberry32(base ^ fnv1a(node.data.id))
            const leaves = Array.from({ length: 5 }, () => ({
              angle: rng() * 360,
              length: 0.7 + rng() * 0.5,
              delay: rng() * 0.25
            }))
            return (
              <g key={`leaves-${node.data.id}`} transform={`translate(${point.x},${point.y})`} aria-hidden="true">
                {leaves.map((leaf, leafIndex) => (
                  <motion.g
                    key={leafIndex}
                    style={{ transformBox: 'fill-box', transformOrigin: '0% 50%' }}
                    initial={reduce ? false : { scale: 0, rotate: leaf.angle - 60 }}
                    animate={{ scale: leaf.length, rotate: leaf.angle }}
                    transition={{ type: 'spring', stiffness: 180, damping: 18, delay: leaf.delay }}
                  >
                    <use href={`#${LEAF_ID}`} fill={leafColor} opacity={0.85} transform="translate(5,0)" />
                  </motion.g>
                ))}
              </g>
            )
          })}

          {/* nodes + labels */}
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
                  <text
                    x={r + 8}
                    y={-3}
                    textAnchor="start"
                    fontSize={12}
                    fill={theme.palette.text.secondary}
                    stroke={theme.palette.background.paper}
                    strokeWidth={3}
                    style={{ paintOrder: 'stroke' }}
                  >
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
                    stroke={theme.palette.background.paper}
                    strokeWidth={3}
                    style={{ paintOrder: 'stroke' }}
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
