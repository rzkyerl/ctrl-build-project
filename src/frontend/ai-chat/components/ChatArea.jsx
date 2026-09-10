import { useRef, useEffect, useState, useCallback } from 'react'
import {
  Copy,
  RefreshCw,
  Check,
  User,
  ThumbsUp,
  ThumbsDown,
  Share2,
} from 'lucide-react'
import agentAvatarUrl from '../../../assets/images/nyx-agent/icon-agent-chat.png'
import { EmptyState } from './EmptyState'
import { MarkdownRenderer } from './MarkdownRenderer'
import { Actions, Action } from './ui/actions'
import { getFileIcon, formatFileSize } from '../constants'

/* ═══════════════════════════════════════════════════
   ChatArea — Message list with auto-scroll + empty state
═══════════════════════════════════════════════════ */

export function ChatArea({ messages, isGenerating, onSuggestionClick, onRegenerate, onCopyMessage, onLike, onDislike, onShare }) {
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
            onLike={onLike}
            onDislike={onDislike}
            onShare={onShare}
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
function Message({ message, isGenerating, isLastUser, isStreaming = false, onRegenerate, onCopyMessage, onLike, onDislike, onShare }) {
  const [copied, setCopied] = useState(false)
  const [showThinking, setShowThinking] = useState(false)
  // Like/Dislike local state — { value: 'like' | 'dislike' | null }
  const [feedback, setFeedback] = useState(null)
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

  /* ── Toggle feedback (like / dislike) ── */
  const handleLike = useCallback(() => {
    const next = feedback === 'like' ? null : 'like'
    setFeedback(next)
    onLike?.(message, next)
  }, [feedback, onLike, message])

  const handleDislike = useCallback(() => {
    const next = feedback === 'dislike' ? null : 'dislike'
    setFeedback(next)
    onDislike?.(message, next)
  }, [feedback, onDislike, message])

  /* ── Share message ── */
  const handleShare = useCallback(async () => {
    const text = message.content || ''
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shared from Nyx Agent Chat',
          text: text.slice(0, 500),
        })
        onShare?.(message, true)
      } catch {
        // User cancelled — don't treat as error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        onShare?.(message, true)
      } catch {
        onShare?.(message, false)
      }
    }
  }, [message, onShare])

  return (
    <div className={`chat-msg ${message.role}`}>
      <div className="chat-msg-avatar">
        {isUser ? (
          <User size={15} />
        ) : (
          <img
            src={agentAvatarUrl}
            alt="Nyx Agent"
            className="chat-msg-avatar-img"
          />
        )}
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
        {isAI && hasContent && !isStreaming && (
          <Actions alwaysVisible={false}>
            <Action
              label="Retry"
              onClick={() => onRegenerate?.(message)}
              disabled={!onRegenerate}
            >
              <RefreshCw size={14} />
            </Action>
            <Action
              label="Like"
              onClick={handleLike}
              active={feedback === 'like'}
            >
              <ThumbsUp size={14} />
            </Action>
            <Action
              label="Dislike"
              onClick={handleDislike}
              active={feedback === 'dislike'}
            >
              <ThumbsDown size={14} />
            </Action>
            <Action label={copied ? 'Copied!' : 'Copy'} onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Action>
            <Action label="Share" onClick={handleShare}>
              <Share2 size={14} />
            </Action>
          </Actions>
        )}

        {/* User message actions: Copy + Retry (only on last user msg) */}
        {isUser && (canCopy || (isLastUser && onRegenerate)) && (
          <Actions alwaysVisible={false}>
            {canCopy && (
              <Action label={copied ? 'Copied!' : 'Copy'} onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Action>
            )}
            {isLastUser && onRegenerate && (
              <Action label="Retry" onClick={() => onRegenerate(message)}>
                <RefreshCw size={14} />
              </Action>
            )}
          </Actions>
        )}
      </div>
    </div>
  )
}
