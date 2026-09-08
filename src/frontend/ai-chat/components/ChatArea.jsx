import { useRef, useEffect, useState, useCallback } from 'react'
import { Sparkles, Copy, RefreshCw, Check, User } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { MarkdownRenderer } from './MarkdownRenderer'
import { getFileIcon, formatFileSize } from '../constants'

/* ═══════════════════════════════════════════════════
   ChatArea — Message list with auto-scroll + empty state
═══════════════════════════════════════════════════ */

export function ChatArea({ messages, isGenerating, onSuggestionClick, onRegenerate, onCopyMessage }) {
  const scrollRef = useRef(null)
  const bottomRef  = useRef(null)

  // Auto-scroll to bottom when messages change or during streaming
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, isGenerating])

  if (!messages || messages.length === 0) {
    return (
      <div className="chat-area">
        <EmptyState onSuggestionClick={onSuggestionClick} />
      </div>
    )
  }

  // Find the last user message index for "regenerate" button
  let lastUserMsgIndex = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') { lastUserMsgIndex = i; break }
  }

  // Find the last AI message index (the one that streams when generating)
  let lastAiMsgIndex = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') { lastAiMsgIndex = i; break }
  }

  return (
    <div className="chat-area" ref={scrollRef}>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <Message
            key={msg.id}
            message={msg}
            isGenerating={isGenerating}
            isLastUser={i === lastUserMsgIndex && !isGenerating}
            isStreaming={isGenerating && i === lastAiMsgIndex}
            onRegenerate={onRegenerate}
            onCopyMessage={onCopyMessage}
          />
        ))}
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>
    </div>
  )
}

/* ── File attachments display ── */
function FileAttachments({ files }) {
  if (!files || files.length === 0) return null

  return (
    <div className="chat-msg-files">
      {files.map((file) => (
        <div key={file.id} className="chat-msg-file">
          {file.type === 'image' && file.dataUrl ? (
            <img
              src={file.dataUrl}
              alt={file.name}
              className="chat-msg-file-img"
              onClick={() => window.open(file.dataUrl, '_blank')}
            />
          ) : (
            <div className="chat-msg-file-doc">
              <span className="chat-msg-file-doc-icon">
                {getFileIcon(file.type)}
              </span>
              <div className="chat-msg-file-doc-info">
                <span className="chat-msg-file-doc-name">{file.name}</span>
                <span className="chat-msg-file-doc-size">{formatFileSize(file.size)}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Single Message ── */
function Message({ message, isGenerating, isLastUser, isStreaming = false, onRegenerate, onCopyMessage }) {
  const [copied, setCopied] = useState(false)
  const [showThinking, setShowThinking] = useState(false)
  const isUser  = message.role === 'user'
  const isAI    = message.role === 'assistant'
  const hasContent = (message.content || '').length > 0
  const hasFiles = message.files && message.files.length > 0
  const canCopy = hasContent

  /* ── Show thinking overlay when AI starts generating (no content yet) ── */
  useEffect(() => {
    if (isStreaming && !hasContent) {
      setShowThinking(true)
    } else {
      setShowThinking(false)
    }
  }, [isStreaming, hasContent])

  /* ── Auto-hide thinking overlay once content arrives ── */
  useEffect(() => {
    if (hasContent && showThinking) {
      const t = setTimeout(() => setShowThinking(false), 300)
      return () => clearTimeout(t)
    }
  }, [hasContent, showThinking])

  /* ── Copy message ── */
  const handleCopy = useCallback(() => {
    if (!message.content) return
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = message.content
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [message.content])

  return (
    <div className={`chat-msg ${message.role}`}>
      <div className="chat-msg-avatar">
        {isUser ? <User size={15} /> : <Sparkles size={14} />}
      </div>
      <div className="chat-msg-body">
        {/* File attachments (shown above text for user, below for AI) */}
        {isUser && hasFiles && <FileAttachments files={message.files} />}

        {/* Thinking overlay — shows briefly then fades out */}
        {showThinking && (
          <div className="chat-msg-thinking-overlay">
            <div className="chat-msg-thinking">
              <span>Thinking</span>
              <div className="chat-msg-thinking-dots">
                <span className="chat-msg-thinking-dot" />
                <span className="chat-msg-thinking-dot" />
                <span className="chat-msg-thinking-dot" />
              </div>
            </div>
          </div>
        )}

        {(message.content || !hasFiles) && (
          <div className={`chat-msg-content${isAI ? ' md-content' : ''}`}>
            {isAI ? (
              <>
                <MarkdownRenderer content={message.content} />
                {isStreaming && hasContent && <span className="chat-stream-cursor" />}
              </>
            ) : (
              message.content
            )}
          </div>
        )}

        {/* File attachments for AI (rare, but supported) */}
        {isAI && hasFiles && <FileAttachments files={message.files} />}

        {/* Message actions */}
        {(canCopy || (isLastUser && onRegenerate)) && (
          <div className="chat-msg-actions">
            {canCopy && (
              <button
                className="chat-msg-action-btn"
                onClick={handleCopy}
                title="Copy message"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            )}
            {isLastUser && onRegenerate && (
              <button
                className="chat-msg-action-btn"
                onClick={() => onRegenerate(message)}
                title="Regenerate response"
              >
                <RefreshCw size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
