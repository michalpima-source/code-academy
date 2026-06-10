"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Bot, User, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface AiTutorChatProps {
  lessonId?: string
  courseId?: string
  lessonTitle?: string
  courseTitle?: string
}

export function AiTutorChat({ lessonId, courseId, lessonTitle, courseTitle }: AiTutorChatProps) {
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { lessonId, courseId, lessonTitle, courseTitle },
    }),
  })

  const isLoading = status === "streaming" || status === "submitted"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ role: "user", parts: [{ type: "text", text: input }] })
    setInput("")
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 h-[480px]">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">AI Tutor</p>
          {lessonTitle && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{lessonTitle}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pe-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">שלום! אני ה-AI Tutor שלך 👋</p>
              <p className="text-xs text-muted-foreground mt-1">
                {lessonTitle
                  ? <>שאל אותי כל שאלה על <strong>{lessonTitle}</strong></>
                  : <>שאל אותי כל שאלה על הקורס</>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {["מה נלמד כאן?", "תסביר לי מחדש", "תן לי דוגמה"].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg: UIMessage) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-background border">
              {msg.role === "user" ? (
                <User className="h-3.5 w-3.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-background border rounded-tl-sm shadow-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-headings:text-sm prose-ul:my-1 prose-li:my-0.5 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-muted prose-pre:p-3 prose-pre:rounded-lg prose-pre:text-xs prose-strong:font-semibold">
                  <ReactMarkdown>
                    {msg.parts.map((part) => (part.type === "text" ? part.text : "")).join("")}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">
                  {msg.parts.map((part) => (part.type === "text" ? part.text : "")).join("")}
                </p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background border">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="bg-background border rounded-2xl rounded-tl-sm px-3.5 py-3 shadow-sm">
              <span className="flex gap-1.5 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="שאל שאלה..."
          className="min-h-[44px] max-h-[100px] resize-none text-sm"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e as unknown as React.FormEvent)
            }
          }}
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shrink-0 h-11 w-11">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
