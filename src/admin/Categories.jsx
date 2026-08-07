import { useEffect, useState } from 'react';
import {
  subscribeCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../lib/db/categories';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => subscribeCategories(setCategories), []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createCategory(name.trim());
    setName('');
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditingName(c.name);
  };

  const saveEdit = async (id) => {
    if (editingName.trim()) await updateCategory(id, editingName.trim());
    setEditingId(null);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-medium">Categories</h1>
      <p className="mt-1 text-sm text-black/50">
        Used to group products in the admin — organize however fits your catalogue.
      </p>

      <form onSubmit={handleAdd} className="mt-6 flex max-w-md gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-md border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black"
        />
        <button
          type="submit"
          className="rounded-md bg-black px-5 py-2.5 text-sm text-white hover:opacity-90"
        >
          Add
        </button>
      </form>

      <ul className="mt-8 max-w-md divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
            {editingId === c.id ? (
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => saveEdit(c.id)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit(c.id)}
                autoFocus
                className="flex-1 border-b border-black/20 text-sm outline-none focus:border-black"
              />
            ) : (
              <span className="text-sm">{c.name}</span>
            )}
            <div className="flex gap-3 text-xs">
              <button onClick={() => startEdit(c)} className="text-black/50 hover:text-black">
                Edit
              </button>
              <button
                onClick={() => deleteCategory(c.id)}
                className="text-red-500/70 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {categories.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-black/40">No categories yet.</li>
        )}
      </ul>
    </div>
  );
}
