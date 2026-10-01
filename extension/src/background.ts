declare const chrome: any

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'lingua-etymology',
    title: 'Etymology of "%s"',
    contexts: ['selection']
  })
})

chrome.contextMenus.onClicked.addListener((info: { menuItemId: string, selectionText?: string }) => {
  if (info.menuItemId !== 'lingua-etymology' || !info.selectionText) return
  const word = info.selectionText.trim().split(/\s+/)[0].slice(0, 40)
  if (!word) return
  const url = chrome.runtime.getURL(`index.html?q=${encodeURIComponent(word)}`)
  chrome.windows.create({ url, type: 'popup', width: 520, height: 700 })
})
