// Phase 2: Categories now come from the Django Category API
// (backend/products) instead of the Firestore `categories` collection.
// Every exported function here keeps its original name and signature —
// Categories.jsx and ProductForm.jsx both call these unchanged and don't
// know (or need to know) the backend switched.
import {
  fetchCategories,
  createCategory as apiCreateCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
} from '../../services/api';

// Firestore's onSnapshot pushed a fresh list to every open listener the
// instant anything changed, anywhere. Django's REST API has no realtime
// channel, so this keeps its own small set of active callbacks and
// re-fetches + re-notifies all of them after any write made through this
// module — the closest equivalent for a single admin session (e.g. the
// Categories page and an open ProductForm both staying in sync with each
// other in the same tab).
const listeners = new Set();

async function refreshAndNotify() {
  let categories = [];
  try {
    categories = await fetchCategories();
  } catch {
    categories = [];
  }
  listeners.forEach((callback) => callback(categories));
  return categories;
}

// Same contract as the old Firestore version: call with a callback, get
// back an unsubscribe function. The callback fires once with the current
// list (async) and again on any create/update/delete made through this
// module while still subscribed.
export function subscribeCategories(callback) {
  listeners.add(callback);
  refreshAndNotify();
  return () => {
    listeners.delete(callback);
  };
}

export async function createCategory(name) {
  const created = await apiCreateCategory(name);
  await refreshAndNotify();
  return String(created.id);
}

export async function updateCategory(id, name) {
  await apiUpdateCategory(id, name);
  await refreshAndNotify();
}

export async function deleteCategory(id) {
  await apiDeleteCategory(id);
  await refreshAndNotify();
}
