export function isRichTextEmpty(html: string): boolean {
  const doc = new DOMParser().parseFromString(html || '', 'text/html')
  const text = doc.body.textContent?.replace(/\u00a0/g, ' ').trim() ?? ''
  return text.length === 0
}

