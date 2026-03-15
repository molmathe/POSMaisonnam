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

export type PrintPaperWidth = "58mm" | "80mm";

export function printKitchenTicket(
  order: KitchenOrder,
  items: KitchenItem[],
  servedBy?: string | null,
  paperWidth?: PrintPaperWidth | string | null
) {
  const win = window.open("", "_blank", "width=360,height=600");
  if (!win) return;
  const width = paperWidth === "58mm" ? "58mm" : "80mm";
  const is58 = width === "58mm";
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
  @page{size:${width} auto;margin:2mm}
  body{font-family:'TH Sarabun New',Sarabun,sans-serif;padding:6px;margin:0;width:100%;max-width:${width};box-sizing:border-box}
  body{font-size:${is58 ? "14px" : "16px"}}
  h2{font-size:${is58 ? "18px" : "20px"};margin:0 0 4px;text-align:center}
  .meta{font-size:${is58 ? "12px" : "13px"};margin:2px 0}
  hr{border:none;border-top:1px solid #000;margin:4px 0}
  hr.dash{border-top:1px dashed #999;margin:4px 0}
  .item{margin:4px 0}
  .qty{font-size:${is58 ? "18px" : "20px"};font-weight:bold}
  .name{font-size:${is58 ? "15px" : "17px"};font-weight:bold}
  .sub{font-size:${is58 ? "11px" : "13px"};color:#333;margin-left:4px}
  @media print{body{max-width:100%}}
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
  /** Full URL for order QR (e.g. https://yoursite.com/order/qr/TOKEN) to show on receipt */
  orderQrUrl?: string | null;
  items: { quantity: number; price: number; note: string | null; toppings?: unknown; requests?: unknown; menu: { nameTh: string } }[];
};

export function printReceipt(order: ReceiptOrder, paperWidth?: PrintPaperWidth | string | null) {
  const win = window.open("", "_blank", "width=360,height=700");
  if (!win) return;
  const width = paperWidth === "58mm" ? "58mm" : "80mm";
  const is58 = width === "58mm";
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

  const sep = "<hr>";
  const qrSize = is58 ? 90 : 120;
  const qrImg = order.orderQrUrl
    ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(order.orderQrUrl)}" alt="QR" width="${qrSize}" height="${qrSize}" style="display:block;margin:6px auto" />`
    : "";

  const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>ใบเสร็จ #${displayId}</title>
<style>
  @page{size:${width} auto;margin:2mm}
  body{font-family:'TH Sarabun New',Sarabun,sans-serif;padding:8px;margin:0;width:100%;max-width:${width};box-sizing:border-box}
  body{font-size:${is58 ? "13px" : "15px"}}
  .receipt-header{text-align:center;margin-bottom:4px}
  .receipt-header h2{font-size:${is58 ? "18px" : "20px"};margin:0 0 2px}
  .receipt-header .tagline{font-size:${is58 ? "12px" : "14px"};margin:0;color:#333}
  .receipt-header .place{font-size:${is58 ? "11px" : "13px"};margin:0;color:#555}
  .center{text-align:center}
  .meta{font-size:${is58 ? "11px" : "13px"};margin:2px 0}
  hr{border:none;border-top:1px dashed #000;margin:4px 0}
  .row{display:flex;justify-content:space-between;font-size:${is58 ? "12px" : "14px"};margin:2px 0}
  .total{font-size:${is58 ? "16px" : "18px"};font-weight:bold}
  .note{font-size:${is58 ? "10px" : "12px"};color:#666;margin-left:6px}
  .receipt-footer{text-align:center;margin-top:6px;font-size:${is58 ? "11px" : "13px"};color:#555}
  .receipt-footer .brand{font-weight:bold;margin-top:4px}
  @media print{body{max-width:100%}}
</style></head><body>
<div class="receipt-header">
<h2>ไม้ซ่อนน้ำ</h2>
<p class="tagline">Lamphu the Riverside Cafe</p>
<p class="place">แม่กลอง สมุทรสงคราม</p>
</div>
${sep}
<div class="meta">บิล #${displayId} · โต๊ะ ${order.table?.name ?? "-"}</div>
${order.customer?.name ? `<div class="meta">ลูกค้า: ${order.customer.name}</div>` : ""}
<div class="meta">เวลา: ${paidAt}</div>
${order.servedBy ? `<div class="meta">พนักงาน: ${order.servedBy}</div>` : ""}
${sep}
${rows}
${sep}
<div class="row"><span>ราคารวม</span><span>฿${subtotal.toFixed(0)}</span></div>
${order.discount > 0 ? `<div class="row"><span>ส่วนลด</span><span>-฿${order.discount.toFixed(0)}</span></div>` : ""}
<div class="row total"><span>ยอดสุทธิ</span><span>฿${order.totalPrice.toFixed(0)}</span></div>
<div class="row meta"><span>วิธีชำระ</span><span>${payTh}</span></div>
${order.cashReceived && order.cashReceived > 0 ? `<div class="row meta"><span>รับเงินมา</span><span>฿${order.cashReceived.toFixed(0)}</span></div><div class="row" style="font-weight:bold;color:#1d4ed8"><span>เงินทอน</span><span>฿${(order.cashReceived - order.totalPrice).toFixed(0)}</span></div>` : ""}
${sep}
<div class="receipt-footer">
<p class="center meta">ขอบคุณที่ใช้บริการ</p>
<p class="center meta" style="margin-top:4px">สามารถสแกนดูรายละเอียดรายการได้จาก QR code ด้านล่างนี้ภายใน 24 ชั่วโมง</p>
${qrImg}
<p class="brand">ไม้ซ่อนน้ำ</p>
<p class="meta" style="margin:0">POS System</p>
</div>
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script>
</body></html>`;
  win.document.write(html);
  win.document.close();
}
