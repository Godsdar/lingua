import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/types'
import type { AnalyzeRequest, LinguaApi, TranslateRequest } from '@shared/types'

const api: LinguaApi = {
  translate: (request: TranslateRequest) => ipcRenderer.invoke(IPC.translate, request),
  analyze: (request: AnalyzeRequest) => ipcRenderer.invoke(IPC.analyze, request)
}

contextBridge.exposeInMainWorld('lingua', api)
