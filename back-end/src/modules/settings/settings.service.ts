import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

const DEFAULT_PLAIN = `Kính gửi {{customer_name}},

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
🌐 {{website}}`;

const DEFAULT_PDF_MAIL = `Kính gửi {{customer_name}},

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
📍 {{address}}`;

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getRestaurantSettings() {
    let row = await this.prisma.restaurantSettings.findUnique({ where: { id: 'default' } });
    if (!row) {
      row = await this.prisma.restaurantSettings.create({
        data: {
          id: 'default',
          restaurantName: 'The Albion',
          emailTemplatePlain: DEFAULT_PLAIN,
          emailTemplatePdf: DEFAULT_PDF_MAIL,
        },
      });
    }
    return row;
  }

  async updateRestaurantSettings(data: Prisma.RestaurantSettingsUpdateInput) {
    await this.getRestaurantSettings();
    return this.prisma.restaurantSettings.update({
      where: { id: 'default' },
      data,
    });
  }
}
