-- CreateTable
CREATE TABLE "RestaurantSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "restaurantName" TEXT NOT NULL DEFAULT 'Nhà hàng',
    "hotline" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "emailFrom" TEXT,
    "emailTemplatePlain" TEXT NOT NULL,
    "emailTemplatePdf" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "RestaurantSettings" ("id", "restaurantName", "hotline", "address", "website", "emailTemplatePlain", "emailTemplatePdf", "updatedAt")
VALUES (
    'default',
    'The Albion',
    '',
    '',
    '',
    $PLAIN$Kính gửi {{customer_name}},

Cảm ơn bạn đã ghé thăm và sử dụng dịch vụ tại {{restaurant_name}}.

Dưới đây là chi tiết hóa đơn của bạn:

━━━━━━━━━━━━━━━━━━━━━━
📄 Mã hóa đơn: {{invoice_number}}
📅 Ngày: {{date}}
👤 Khách hàng: {{customer_name}}
🍽️ Số khách: {{guest_count}}
━━━━━━━━━━━━━━━━━━━━━━

🍴 Chi tiết món đã dùng:

{{#each items}}
* {{name}} × {{quantity}}
  → {{price}}
{{/each}}

━━━━━━━━━━━━━━━━━━━━━━

💰 Tạm tính: {{subtotal}}
🎁 Giảm giá: {{discount}}
🧾 Thuế / phí: {{tax}}

💳 Tổng thanh toán: {{total_amount}}
💰 Phương thức thanh toán: {{payment_method}}

━━━━━━━━━━━━━━━━━━━━━━

Nếu bạn cần hỗ trợ hoặc có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.

Trân trọng,
{{restaurant_name}}
📞 {{hotline}}
📍 {{address}}
🌐 {{website}}$PLAIN$,
    $PDF$Kính gửi {{customer_name}},

Cảm ơn bạn đã sử dụng dịch vụ tại {{restaurant_name}}.

Chúng tôi đã đính kèm hóa đơn điện tử (PDF) trong email này.

📄 Thông tin nhanh:

* Mã hóa đơn: {{invoice_number}}
* Ngày: {{date}}
* Tổng tiền: {{total_amount}}

🍴 Một số món bạn đã dùng:

{{#each items}}
* {{name}} × {{quantity}}
{{/each}}

📎 Vui lòng xem file đính kèm để xem đầy đủ chi tiết hóa đơn.

Nếu bạn cần hỗ trợ thêm, đừng ngần ngại liên hệ với chúng tôi.

Trân trọng,
{{restaurant_name}}
📞 {{hotline}}
📍 {{address}}$PDF$,
    CURRENT_TIMESTAMP
);
