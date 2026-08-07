// Products now come exclusively from the Django API (backend/products) —
// see MIGRATION.md. Every exported function here keeps its original name
// and signature so admin/ProductForm.jsx and admin/Products.jsx (both
// unchanged) don't know or care that the backend switched.
import {
  createProduct as apiCreateProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
} from '../../services/api';

export async function createProduct(data) {
  const created = await apiCreateProduct(data);
  return String(created.id);
}

export async function updateProduct(id, data) {
  await apiUpdateProduct(id, data);
}

export async function deleteProduct(id) {
  await apiDeleteProduct(id);
}

export async function setProductVisibility(id, visible) {
  await updateProduct(id, { visible });
}
