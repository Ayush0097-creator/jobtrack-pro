import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '../api/client'
import { PageHeader } from '../components/ui/Primitives'
import { errorMessage } from '../lib/utils'
import toast from 'react-hot-toast'

export default function Coach() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi — I am your JobTrack Pro career coach. Ask about resumes, interviews, DSA prep, or placement strategy.',
    },
  ])

  const mut = useMutation({
    mutationFn: (message) => api.post('/ai/career-coach/', { message }),
    onSuccess: (res, message) => {
      setMessages((m) => [...m, { role: 'user', content: message }, { role: 'assistant', content: res.data.reply }])
      setInput('')
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  return (
    <div>
      <PageHeader title="Career coach" subtitle="Placement guidance powered by AI (with smart offline fallback)" />
      <div className="glass-card flex h-[70vh] flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'ml-auto bg-accent text-ink-950'
                  : 'bg-white/5 text-mist-100'
              }`}
            >
              {m.content}
            </motion.div>
          ))}
        </div>
        <form
          className="flex gap-2 border-t border-white/10 p-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!input.trim()) return
            mut.mutate(input.trim())
          }}
        >
          <input
            className="input"
            placeholder="Ask about resume bullets, OA prep, HR rounds…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn-primary" disabled={mut.isPending}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
