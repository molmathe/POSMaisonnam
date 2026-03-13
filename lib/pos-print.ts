// Browser-only print utilities — call only in client components

/** Returns human-readable order ID: DDMMYYHHMM (e.g. 1303261523) */
export function orderDisplayId(createdAt: string | Date): string {
  const d = new Date(createdAt);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}${mm}${yy}${hh}${min}`;
}

type KitchenItem = {
  quantity: number;
  note: string | null;
  toppings: unknown;
  requests: unknown;
  menu: { nameTh: string };
};

type KitchenOrder = {
  table?: { name: string } | null;
  customer?: { name: string } | null;
};

export function printKitchenTicket(order: KitchenOrder, items: KitchenItem[], servedBy?: string | null) {
  const win = window.open("", "_blank", "width=360,height=600");
  if (!win) return;
  const tableName = order.table?.name ?? "-";
  const now = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  const rows = items
    .map((item) => {
      const tops = Array.isArray(item.toppings) && item.toppings.length
        ? `<div class="sub">Topping: ${(item.toppings as { name?: string }[]).map((t) => t.name ?? t).join(", ")}</div>`
        : "";
      const reqs = Array.isArray(item.requests) && item.requests.length
        ? `<div class="sub">คำขอ: ${(item.requests as string[]).join(", ")}</div>`
        : "";
      const note = item.note ? `<div class="sub">หมายเหตุ: ${item.note}</div>` : "";
      return `<div class="item"><span class="qty">x${item.quantity}</span> <span class="name">${item.menu.nameTh}</span>${tops}${reqs}${note}</div>`;
    })
    .join('<hr class="dash">');

  const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>ใบสั่งครัว</title>
<style>
  body{font-family:'TH Sarabun New',Sarabun,sans-serif;font-size:16px;padding:8px;margin:0}
  h2{font-size:20px;margin:0 0 4px;text-align:center}
  .meta{font-size:13px;margin:2px 0}
  hr{border:none;border-top:1px solid #000;margin:6px 0}
  hr.dash{border-top:1px dashed #999;margin:6px 0}
  .item{margin:6px 0}
  .qty{font-size:20px;font-weight:bold}
  .name{font-size:17px;font-weight:bold}
  .sub{font-size:13px;color:#333;margin-left:4px}
</style></head><body>
<h2>ใบสั่งครัว</h2>
<div class="meta">โต๊ะ: <strong>${tableName}</strong>${order.customer?.name ? ` · ${order.customer.name}` : ""}</div>
<div class="meta">เวลา: ${now}</div>
${servedBy ? `<div class="meta">พนักงาน: ${servedBy}</div>` : ""}
<hr>
${rows}
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script>
</body></html>`;
  win.document.write(html);
  win.document.close();
}

export type ReceiptOrder = {
  id: number;
  createdAt?: string | null;
  totalPrice: number;
  discount: number;
  payMethod: "CASH" | "QR" | null;
  paidAt: string | null;
  table: { name: string } | null;
  customer: { name: string } | null;
  servedBy?: string | null;
  cashReceived?: number;
  items: { quantity: number; price: number; note: string | null; toppings?: unknown; requests?: unknown; menu: { nameTh: string } }[];
};

export function printReceipt(order: ReceiptOrder) {
  const win = window.open("", "_blank", "width=360,height=700");
  if (!win) return;
  const displayId = order.createdAt ? orderDisplayId(order.createdAt) : String(order.id);
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const paidAt = order.paidAt
    ? new Date(order.paidAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })
    : new Date().toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
  const payTh = order.payMethod === "CASH" ? "เงินสด" : order.payMethod === "QR" ? "โอนชำระ" : "-";
  const rows = order.items
    .map((i) => {
      const tops = Array.isArray(i.toppings) && i.toppings.length
        ? `<div class="note">+ ${(i.toppings as { name?: string }[]).map((t) => t.name ?? t).join(", ")}</div>`
        : "";
      const reqs = Array.isArray(i.requests) && i.requests.length
        ? `<div class="note">★ ${(i.requests as string[]).join(", ")}</div>`
        : "";
      const note = i.note ? `<div class="note">หมายเหตุ: ${i.note}</div>` : "";
      return `<div class="row"><span>${i.menu.nameTh} x${i.quantity}</span><span>฿${(i.price * i.quantity).toFixed(0)}</span></div>${tops}${reqs}${note}`;
    })
    .join("");

  const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>ใบเสร็จ #${displayId}</title>
<style>
  body{font-family:'TH Sarabun New',Sarabun,sans-serif;font-size:15px;padding:10px;margin:0;max-width:300px}
  h2{font-size:20px;margin:0;text-align:center}
  .center{text-align:center}
  .meta{font-size:13px;margin:2px 0}
  hr{border:none;border-top:1px dashed #000;margin:6px 0}
  .row{display:flex;justify-content:space-between;font-size:14px;margin:3px 0}
  .total{font-size:18px;font-weight:bold}
  .note{font-size:12px;color:#666;margin-left:8px}
</style></head><body>
<h2>ไม้ซ่อนน้ำ</h2>
<p class="center meta">ใบเสร็จรับเงิน</p>
<hr>
<div class="meta">บิล #${displayId} · โต๊ะ ${order.table?.name ?? "-"}</div>
${order.customer?.name ? `<div class="meta">ลูกค้า: ${order.customer.name}</div>` : ""}
<div class="meta">เวลา: ${paidAt}</div>
${order.servedBy ? `<div class="meta">พนักงาน: ${order.servedBy}</div>` : ""}
<hr>
${rows}
<hr>
<div class="row"><span>ราคารวม</span><span>฿${subtotal.toFixed(0)}</span></div>
${order.discount > 0 ? `<div class="row"><span>ส่วนลด</span><span>-฿${order.discount.toFixed(0)}</span></div>` : ""}
<div class="row total"><span>ยอดสุทธิ</span><span>฿${order.totalPrice.toFixed(0)}</span></div>
<div class="row meta"><span>วิธีชำระ</span><span>${payTh}</span></div>
${order.cashReceived && order.cashReceived > 0 ? `<div class="row meta"><span>รับเงินมา</span><span>฿${order.cashReceived.toFixed(0)}</span></div><div class="row" style="font-weight:bold;color:#1d4ed8"><span>เงินทอน</span><span>฿${(order.cashReceived - order.totalPrice).toFixed(0)}</span></div>` : ""}
<hr>
<p class="center meta">ขอบคุณที่ใช้บริการ</p>
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script>
</body></html>`;
  win.document.write(html);
  win.document.close();
}
