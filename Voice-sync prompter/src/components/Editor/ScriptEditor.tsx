import { useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useScriptStore } from '@/store'

export const ScriptEditor = () => {
  const { text, setText } = useScriptStore()

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
  }, [setText])

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // 일반 텍스트만 붙여넣기
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text/plain')
    const target = e.target as HTMLTextAreaElement
    const start = target.selectionStart
    const end = target.selectionEnd
    const newText = text.substring(0, start) + pastedText + text.substring(end)
    setText(newText)

    // 커서 위치 조정
    setTimeout(() => {
      target.selectionStart = target.selectionEnd = start + pastedText.length
    }, 0)
  }, [text, setText])

  const charCount = text.length
  const lineCount = text.split('\n').length

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4">
        <Textarea
          value={text}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder="대본을 입력하거나 붙여넣으세요..."
          className="h-full resize-none text-base leading-relaxed font-sans"
          spellCheck={false}
        />
      </div>
      <div className="px-4 pb-4 text-sm text-muted-foreground flex justify-between">
        <span>{charCount.toLocaleString()}자</span>
        <span>{lineCount.toLocaleString()}줄</span>
      </div>
    </div>
  )
}
