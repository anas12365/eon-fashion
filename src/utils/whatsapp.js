export const WHATSAPP_NUMBER = '201103686261'; // 01103686261 in international format (Egypt)

export function buildOrderMessage({ customer, items, subtotal, currency }) {
  const lines = [];
  lines.push('*NEW ORDER — EON*');
  lines.push('');
  lines.push(`*Name:* ${customer.name}`);
  lines.push(`*Phone:* ${customer.phone}`);
  lines.push(`*Address:* ${customer.address}`);
  if (customer.notes) lines.push(`*Notes:* ${customer.notes}`);
  lines.push('');
  lines.push('*Items:*');
  items.forEach((item, idx) => {
    lines.push(
      `${idx + 1}. ${item.name} — ${item.color} / ${item.size} × ${item.quantity} — ${item.price * item.quantity} ${currency}`
    );
  });
  lines.push('');
  lines.push(`*Total: ${subtotal} ${currency}*`);
  lines.push('*Payment:* Cash on Delivery');

  return lines.join('\n');
}

export function openWhatsAppOrder({ customer, items, subtotal, currency }) {
  const message = buildOrderMessage({ customer, items, subtotal, currency });
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
