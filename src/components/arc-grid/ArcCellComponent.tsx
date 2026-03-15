import { useState, useRef, useEffect } from 'react'

interface Props {
  content: string
  threadColor: string
  onSave: (content: string) => Promise<void>
}

export default function ArcCellComponent({ content, threadColor, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setValue(content)
  }, [content])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editing])

  const handleBlur = () => {
    setEditing(false)
    if (value !== content) {
      onSave(value)
    }
  }

  const handleChange = (newValue: string) => {
    setValue(newValue)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (newValue !== content) {
        onSave(newValue)
      }
    }, 300)
  }

  if (editing) {
    return (
      <td className="border-b border-border p-0" style={{ borderLeft: `3px solid ${threadColor}` }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full min-h-[100px] p-3 bg-surface-alt text-text-primary text-sm font-body resize-none focus:outline-none"
          placeholder="Arc summary..."
        />
      </td>
    )
  }

  return (
    <td
      className="border-b border-border p-3 cursor-pointer hover:bg-surface transition-colors"
      style={{ borderLeft: `3px solid ${threadColor}` }}
      onClick={() => setEditing(true)}
    >
      {value ? (
        <p className="text-sm text-text-primary font-body line-clamp-4 whitespace-pre-wrap">
          {value}
        </p>
      ) : (
        <p className="text-sm text-text-muted italic">
          Tap to add...
        </p>
      )}
    </td>
  )
}
