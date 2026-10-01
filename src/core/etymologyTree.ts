import type { EtymologyNode } from '@shared/types'

export type EtyRole = 'trunk' | 'source' | 'target'

export interface EtyTreeNode {
  id: string
  lang: string
  langName: string
  word: string
  role: EtyRole
  isRoot: boolean
  isDivergence: boolean
  isLeaf: boolean
  children: EtyTreeNode[]
}

export const VIRTUAL_ROOT_ID = '__root__'

let counter = 0
const nextId = (): string => `n${counter++}`

function normalize (word: string): string {
  return word.trim().replace(/^\*+/, '').toLowerCase()
}

function sameNode (a: EtymologyNode, b: EtymologyNode): boolean {
  return a.lang === b.lang && normalize(a.word) === normalize(b.word)
}

function makeNode (src: EtymologyNode, role: EtyRole): EtyTreeNode {
  return {
    id: nextId(),
    lang: src.lang,
    langName: src.langName,
    word: src.word,
    role,
    isRoot: false,
    isDivergence: false,
    isLeaf: false,
    children: []
  }
}

/** Builds a linear node chain (oldest -> newest) and returns its nodes. */
function chain (nodes: EtymologyNode[], role: EtyRole): EtyTreeNode[] {
  const built = nodes.map(node => makeNode(node, role))
  for (let i = 0; i < built.length - 1; i++) built[i].children.push(built[i + 1])
  if (built.length > 0) {
    built[0].isRoot = true
    built[built.length - 1].isLeaf = true
  }
  return built
}

/**
 * Builds a 2D etymology tree for a single word pair.
 *
 * Root (oldest) sits at the top; the two lineages merge on a shared trunk and
 * split at the divergence node into a `source` branch and a `target` branch
 * (exactly two leaves). When nothing is shared, the two chains stay separate.
 *
 * The returned value is a synthetic root whose children are rendered; the
 * synthetic root itself is never drawn.
 */
export function buildEtymologyTree (
  source: EtymologyNode[],
  target: EtymologyNode[],
  maxLevels = 6
): EtyTreeNode {
  const virtual: EtyTreeNode = {
    id: VIRTUAL_ROOT_ID,
    lang: '',
    langName: '',
    word: '',
    role: 'trunk',
    isRoot: false,
    isDivergence: false,
    isLeaf: false,
    children: []
  }

  let shared = 0
  while (shared < source.length && shared < target.length && sameNode(source[shared], target[shared])) {
    shared++
  }

  if (shared > 0) {
    const sourceBranch = source.slice(shared)
    const targetBranch = target.slice(shared)
    const maxBranch = Math.max(sourceBranch.length, targetBranch.length)
    const maxTrunk = Math.max(1, maxLevels - maxBranch)
    const trunkSource = source.slice(0, shared)
    const trunkShown = trunkSource.slice(Math.max(0, trunkSource.length - maxTrunk))

    const trunk = chain(trunkShown, 'trunk')
    const divergence = trunk[trunk.length - 1]
    divergence.isDivergence = true
    divergence.isLeaf = false

    const sourceChain = chain(sourceBranch, 'source')
    if (sourceChain.length > 0) {
      sourceChain[0].isRoot = false
      divergence.children.push(sourceChain[0])
    }

    const targetChain = chain(targetBranch, 'target')
    if (targetChain.length > 0) {
      targetChain[0].isRoot = false
      divergence.children.push(targetChain[0])
    }

    virtual.children.push(trunk[0])
  } else {
    const sourceChain = chain(source.slice(Math.max(0, source.length - maxLevels)), 'source')
    const targetChain = chain(target.slice(Math.max(0, target.length - maxLevels)), 'target')
    if (sourceChain.length > 0) virtual.children.push(sourceChain[0])
    if (targetChain.length > 0) virtual.children.push(targetChain[0])
  }

  return virtual
}
