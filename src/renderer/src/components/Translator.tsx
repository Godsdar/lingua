import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import HubIcon from '@mui/icons-material/Hub'
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd'
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded'
import ShareIcon from '@mui/icons-material/Share'
import { LANGS } from '../data/languages'
import EtymologyGraph from './EtymologyGraph'
import ShareCard from './ShareCard'
import { makeRootId } from '../lib/roots'
import type { SavedRoot } from '../lib/roots'
import type { LangCode, WordAnalysis } from '@shared/types'

interface Props {
  from: LangCode
  to: LangCode
  onFromChange: (code: LangCode) => void
  onToChange: (code: LangCode) => void
  onSaveRoot: (root: Omit<SavedRoot, 'id' | 'createdAt'>) => void
  savedIds: Set<string>
}

function cleanError (error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/^Error invoking remote method '[^']+':\s*/, '')
    .replace(/^Error:\s*/, '')
}

export default function Translator ({ from, to, onFromChange, onToChange, onSaveRoot, savedIds }: Props) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState('')
  const [isError, setIsError] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [tokens, setTokens] = useState<WordAnalysis[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  const tokensRef = useRef<WordAnalysis[]>([])
  const selectedRef = useRef<number | null>(null)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function selectToken (index: number | null): void {
    selectedRef.current = index
    setSelected(index)
  }

  useEffect(() => {
    const text = input.trim()
    if (!text) {
      setOutput('')
      setTokens([])
      selectToken(null)
      tokensRef.current = []
      setStatus('')
      setIsError(false)
      setTranslating(false)
      setAnalyzing(false)
      return
    }

    let cancelled = false
    setIsError(false)

    const translateTimer = setTimeout(async () => {
      setTranslating(true)
      setStatus('Translating…')
      try {
        const result = await window.lingua.translate({ text, from, to })
        if (!cancelled) {
          setOutput(result)
          setStatus('')
        }
      } catch (error) {
        if (!cancelled) {
          setIsError(true)
          setStatus(cleanError(error))
        }
      } finally {
        if (!cancelled) setTranslating(false)
      }
    }, 400)

    const analyzeTimer = setTimeout(async () => {
      setAnalyzing(true)
      try {
        const result = await window.lingua.analyze({ text, from, to })
        if (!cancelled) {
          const previousToken = selectedRef.current !== null
            ? tokensRef.current[selectedRef.current]?.token
            : undefined
          const nextIndex = previousToken
            ? result.tokens.findIndex(item => item.token === previousToken)
            : -1
          const chosen = nextIndex >= 0 ? nextIndex : (result.tokens.length > 0 ? 0 : null)
          tokensRef.current = result.tokens
          setTokens(result.tokens)
          selectToken(chosen)
        }
      } catch {
        if (!cancelled) setTokens([])
      } finally {
        if (!cancelled) setAnalyzing(false)
      }
    }, 700)

    return () => {
      cancelled = true
      clearTimeout(translateTimer)
      clearTimeout(analyzeTimer)
    }
  }, [input, from, to])

  function swap (): void {
    onFromChange(to)
    onToChange(from)
    setInput(output)
    setOutput(input)
  }

  async function copy (): Promise<void> {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
    } catch {
      setIsError(true)
      setStatus('Could not copy to clipboard')
      return
    }
    setIsError(false)
    setStatus('Copied to clipboard')
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setStatus(''), 1200)
  }

  const fromName = LANGS.find(lang => lang.code === from)?.name ?? from
  const toName = LANGS.find(lang => lang.code === to)?.name ?? to
  const active = selected !== null ? tokens[selected] : undefined
  const activeId = active
    ? makeRootId(active.token, from, to, active.sharedAncestor?.word)
    : ''
  const isSaved = Boolean(active) && savedIds.has(activeId)

  function saveActiveRoot (): void {
    if (!active || isSaved) return
    onSaveRoot({
      word: active.token,
      from,
      to,
      gloss: active.gloss,
      ancestorWord: active.sharedAncestor?.word,
      ancestorLang: active.sharedAncestor?.langName
    })
  }

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', pt: 1 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="from-label">From</InputLabel>
          <Select
            labelId="from-label"
            label="From"
            value={from}
            onChange={event => onFromChange(event.target.value as LangCode)}
          >
            {LANGS.map(lang => (
              <MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title="Swap languages">
          <IconButton onClick={swap} aria-label="Swap languages">
            <SwapHorizIcon />
          </IconButton>
        </Tooltip>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="to-label">To</InputLabel>
          <Select
            labelId="to-label"
            label="To"
            value={to}
            onChange={event => onToChange(event.target.value as LangCode)}
          >
            {LANGS.map(lang => (
              <MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(320px, 1fr) 1.15fr' },
          gap: 2
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateRows: '1.1fr 0.9fr', gap: 2, minHeight: 0 }}>
          <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <TextField
              multiline
              fullWidth
              variant="standard"
              placeholder="Start typing… translation and analysis are instant"
            value={input}
            onChange={event => setInput(event.target.value)}
            slotProps={{ htmlInput: { 'aria-label': 'Text to translate' } }}
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              '& .MuiInputBase-root': { flex: 1, alignItems: 'flex-start', px: 2, pt: 2 },
              '& .MuiInputBase-input': { height: '100% !important', overflow: 'auto' }
            }}
          />
            <Divider />
            <Box sx={{ px: 2, py: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {[...input].length} characters
              </Typography>
            </Box>
          </Card>

          <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2 }}>
              <Typography
                variant="body1"
                color={output ? 'text.primary' : 'text.disabled'}
                sx={{ whiteSpace: 'pre-wrap' }}
              >
                {output || 'Translation will appear here'}
              </Typography>
            </Box>
            <Divider />
            <Stack
              direction="row"
              spacing={1}
              sx={{ px: 2, py: 0.5, alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                {translating && <CircularProgress size={14} />}
                <Typography variant="caption" color={isError ? 'error.main' : 'text.secondary'}>
                  {status}
                </Typography>
              </Stack>
              <Button size="small" startIcon={<ContentCopyIcon />} onClick={copy} disabled={!output}>
                Copy
              </Button>
            </Stack>
          </Card>
        </Box>

        <Paper variant="outlined" sx={{ minHeight: 0, overflow: 'auto', p: 2 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: tokens.length > 0 ? 1.5 : 0 }}>
            <HubIcon fontSize="small" color="action" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
              Word-by-word analysis
            </Typography>
            {analyzing && <CircularProgress size={14} />}
          </Stack>

          {tokens.length === 0 ? (
            input.trim() === '' ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Type a word to see where it comes from — and who its relatives are.
                  Try one of these:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {['water', 'mother', 'night', 'three'].map(example => (
                    <Chip
                      key={example}
                      label={example}
                      variant="outlined"
                      color="secondary"
                      onClick={() => setInput(example)}
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {analyzing ? 'Analyzing…' : 'No words to analyse.'}
              </Typography>
            )
          ) : (
            <>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {tokens.map((token, index) => {
                  const isSelected = selected === index
                  const color = token.sharedAncestor ? 'secondary' : isSelected ? 'primary' : 'default'
                  return (
                    <Chip
                      key={`${token.token}-${index}`}
                      label={token.token}
                      color={color}
                      variant={isSelected ? 'filled' : 'outlined'}
                      onClick={() => selectToken(index)}
                    />
                  )
                })}
              </Box>

              {active && (
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 1.5 }}>
                    <Typography variant="h6" component="span">{active.token}</Typography>
                    {active.pos && <Chip size="small" label={active.pos} />}
                    {active.gloss && (
                      <Typography variant="body2" color="text.secondary">
                        → {active.gloss}
                      </Typography>
                    )}
                    {active.alternatives.length > 0 && (
                      <Typography variant="caption" color="text.disabled">
                        also: {active.alternatives.join(', ')}
                      </Typography>
                    )}
                  </Stack>

                  <EtymologyGraph
                    source={active.etymology}
                    target={active.targetEtymology}
                    shared={active.sharedAncestor}
                    sourceName={fromName}
                    targetName={toName}
                  />

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      variant={isSaved ? 'outlined' : 'contained'}
                      startIcon={isSaved ? <BookmarkAddedIcon /> : <BookmarkAddIcon />}
                      onClick={saveActiveRoot}
                      disabled={isSaved || active.etymology.length <= 1}
                    >
                      {isSaved ? 'Saved' : 'Save root'}
                    </Button>
                    <Button size="small" startIcon={<ShareIcon />} onClick={() => setShareOpen(true)}>
                      Share
                    </Button>
                  </Stack>
                </Box>
              )}

              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
                Translations, etymology &amp; POS from Wiktionary (CC BY-SA). MyMemory, DeepL or LibreTranslate as
                fallback. Analysis covers the first 8 unique words.
              </Typography>
            </>
          )}
        </Paper>
      </Box>

      <ShareCard
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        word={active?.token ?? ''}
        gloss={active?.gloss}
        fromName={fromName}
        toName={toName}
        ancestor={
          active?.sharedAncestor
            ? { word: active.sharedAncestor.word, langName: active.sharedAncestor.langName }
            : undefined
        }
      />
    </Box>
  )
}
