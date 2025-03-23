"use client"

import React, { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  placeholder?: string
}

export function MarkdownEditor({
  value,
  onChange,
  height = "min-h-[300px]",
  placeholder = "Write your content here...",
}: MarkdownEditorProps) {
  const [content, setContent] = useState(value)

  useEffect(() => {
    if (value !== content) {
      setContent(value)
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setContent(newValue)
    onChange(newValue)
  }

  return (
    <div className="w-full border rounded-md border-slate-700 bg-slate-900 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 h-full">
        {/* Editor */}
        <div className="border-b md:border-b-0 md:border-r border-slate-700">
          <div className="px-3 py-2 bg-slate-800 border-b border-slate-700 text-sm font-medium text-slate-300">
            Write
          </div>
          <Textarea
            value={content}
            onChange={handleChange}
            placeholder={placeholder}
            className={`w-full ${height} resize-none rounded-none border-0 bg-slate-900 p-4 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-200`}
          />
        </div>

        {/* Preview */}
        <div>
          <div className="px-3 py-2 bg-slate-800 border-b border-slate-700 text-sm font-medium text-slate-300">
            Preview
          </div>
          <div className={`overflow-auto ${height} p-4 bg-slate-900 text-slate-200`}>
            {content ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-slate-100 mb-4 font-poppins" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold text-slate-100 mb-3 font-poppins" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-bold text-slate-100 mb-3 font-poppins" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4 text-slate-300" {...props} />,
                  a: ({node, ...props}) => <a className="text-sky-400 hover:underline" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  // @ts-ignore - react-markdown types are incomplete
                  code: ({inline, children, ...props}) => {
                    if (inline) {
                      return <code className="text-pink-400 bg-slate-800/70 px-1 py-0.5 rounded" {...props}>{children}</code>
                    }
                    return (
                      <pre className="bg-slate-800/70 p-3 rounded-md overflow-x-auto border border-slate-700 mb-4">
                        <code {...props}>{children}</code>
                      </pre>
                    )
                  },
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-700 pl-4 italic text-slate-400 mb-4" {...props} />,
                  img: ({node, ...props}) => <img className="max-w-full h-auto rounded-md my-4" {...props} />
                }}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                Nothing to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Keep the TiptapEditor export for backward compatibility
export { MarkdownEditor as TiptapEditor } 