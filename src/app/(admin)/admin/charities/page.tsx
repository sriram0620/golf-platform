'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatPounds } from '@/lib/utils'
import { Heart, Plus, Pencil, Trash2, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Charity } from '@/types'

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const emptyForm = {
  name: '', slug: '', description: '', short_description: '',
  logo_url: '', cover_image_url: '', website_url: '', category: '', is_featured: false,
}

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Charity | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/charities')
    const json = await res.json()
    setCharities(json.data?.charities ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (c: Charity) => {
    setEditing(c)
    setForm({
      name: c.name, slug: c.slug, description: c.description,
      short_description: c.short_description ?? '', logo_url: c.logo_url ?? '',
      cover_image_url: c.cover_image_url ?? '', website_url: c.website_url ?? '',
      category: c.category ?? '', is_featured: c.is_featured,
    })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.name || !form.description) { toast.error('Name and description required'); return }
    setSaving(true)
    const body = {
      ...form,
      slug: form.slug || slugify(form.name),
      short_description: form.short_description || undefined,
      logo_url: form.logo_url || undefined,
      cover_image_url: form.cover_image_url || undefined,
      website_url: form.website_url || undefined,
      category: form.category || undefined,
    }
    try {
      const url = editing ? `/api/admin/charities/${editing.id}` : '/api/admin/charities'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success(editing ? 'Charity updated' : 'Charity added')
      setModalOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Deactivate this charity? It will be hidden from public view.')) return
    const res = await fetch(`/api/admin/charities/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Charity deactivated'); load() }
    else toast.error('Failed to deactivate charity')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Charities</h1>
          <p className="text-slate-400 text-sm mt-0.5">{charities.length} charities</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Charity
        </Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-36 shimmer" />)}
        </div>
      ) : charities.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Heart className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No charities yet</p>
          <Button onClick={openCreate} className="mt-4">Add first charity</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {charities.map((charity) => (
            <div key={charity.id} className={`glass rounded-2xl p-5 ${!charity.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-emerald-400 shrink-0" />
                  <h3 className="font-semibold text-white text-sm">{charity.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  {charity.is_featured && (
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  )}
                  <Badge status={charity.is_active ? 'active' : 'inactive'}>
                    {charity.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                {charity.short_description ?? charity.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-500 font-medium">
                  {formatPounds(charity.total_received)} raised
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(charity)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {charity.is_active && (
                    <button
                      onClick={() => remove(charity.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Charity' : 'Add Charity'}>
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="auto-generated from name"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Description</label>
            <textarea
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[80px] resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Input
            label="Short description"
            value={form.short_description}
            onChange={(e) => setForm({ ...form, short_description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Health"
            />
            <Input
              label="Website URL"
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              className="rounded accent-emerald-500 h-4 w-4"
            />
            <span className="text-sm text-slate-300">Featured charity</span>
          </label>
          <div className="flex gap-3">
            <Button onClick={save} loading={saving} className="flex-1">
              {editing ? 'Update' : 'Add charity'}
            </Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
