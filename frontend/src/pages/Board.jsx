import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/client'
import { PageHeader, Skeleton } from '../components/ui/Primitives'
import { STATUS_COLUMNS } from '../lib/constants'
import { errorMessage } from '../lib/utils'

export default function Board() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['board'],
    queryFn: async () => (await api.get('/applications/board/')).data,
  })
  const [columns, setColumns] = useState(null)

  useEffect(() => {
    if (data) setColumns(data)
  }, [data])

  const reorderMut = useMutation({
    mutationFn: (payload) => api.post('/applications/kanban-reorder/', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board'] })
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const onDragEnd = (result) => {
    if (!result.destination || !columns) return
    const { source, destination } = result
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const next = { ...columns, [source.droppableId]: [...columns[source.droppableId]], [destination.droppableId]: [...(columns[destination.droppableId] || [])] }
    const [moved] = next[source.droppableId].splice(source.index, 1)
    moved.status = destination.droppableId
    next[destination.droppableId].splice(destination.index, 0, moved)
    setColumns(next)

    const payload = []
    Object.entries(next).forEach(([status, items]) => {
      items.forEach((item, index) => {
        payload.push({ id: item.id, status, board_order: index })
      })
    })
    reorderMut.mutate(payload)
  }

  if (isLoading || !columns) {
    return (
      <div className="flex gap-3 overflow-x-auto">
        {STATUS_COLUMNS.map((c) => (
          <Skeleton key={c.key} className="h-96 w-64 shrink-0" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Kanban board" subtitle="Drag applications across your placement pipeline" />
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((col) => (
            <div key={col.key} className="w-64 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-mist-300">{col.label}</p>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-mist-400">
                  {(columns[col.key] || []).length}
                </span>
              </div>
              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[420px] rounded-2xl border border-white/5 bg-ink-900/50 p-2 transition ${
                      snapshot.isDraggingOver ? 'border-accent/40 bg-accent/5' : ''
                    }`}
                  >
                    {(columns[col.key] || []).map((card, index) => (
                      <Draggable key={card.id} draggableId={String(card.id)} index={index}>
                        {(drag, snap) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            className={`mb-2 rounded-xl border border-white/10 bg-ink-800 p-3 ${
                              snap.isDragging ? 'shadow-glow' : ''
                            }`}
                          >
                            <Link to={`/app/applications/${card.id}`} className="font-medium text-white hover:text-accent">
                              {card.job_title}
                            </Link>
                            <p className="mt-1 text-xs text-mist-400">{card.company_name}</p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}
