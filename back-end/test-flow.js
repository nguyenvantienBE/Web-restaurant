// test-flow.js
const http = require('http');

const API_URL = 'http://localhost:3000';
let adminToken = '';
let customerOrder = null;
let tableCode = 'T01';

// Helper function to make HTTP requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      const bodyString = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsedData });
          } else {
            console.error(`\x1b[31m[ERROR] ${method} ${path} failed with status ${res.statusCode}: ${data}\x1b[0m`);
            reject({ status: res.statusCode, data: parsedData });
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
             resolve({ status: res.statusCode, data: data });
          } else {
             reject({ status: res.statusCode, data: data });
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\x1b[36m--- Bắt đầu script test tự động luồng nghiệp vụ Nhà Hàng ---\x1b[0m\n');

  try {
    // 1. Login as Admin
    console.log('\x1b[33m[1] Đăng nhập tài khoản Admin...\x1b[0m');
    const loginRes = await request('POST', '/auth/login', {
      email: 'admin@restaurant.com',
      password: 'admin123',
    });
    adminToken = loginRes.data.data ? loginRes.data.data.accessToken : loginRes.data.accessToken;
    console.log(`\x1b[32m-> Đăng nhập thành công! Lấy được Token: ${adminToken.substring(0, 15)}...\x1b[0m\n`);

    const meRes = await request('GET', '/auth/me', null, adminToken);
    console.log(`\x1b[34m[DEBUG] User Claims: ${JSON.stringify(meRes.data.claims)}\x1b[0m\n`);

    // 2. Fetch Menu Items to order
    console.log('\x1b[33m[2] Lấy danh sách món ăn từ Menu...\x1b[0m');
    const menuRes = await request('GET', '/menu-items');
    const menuItems = menuRes.data.data;
    if (!menuItems || menuItems.length === 0) {
      console.log('\x1b[31m-> Không tìm thấy món ăn nào. Vui lòng check lại Database Seed.\x1b[0m\n');
      return;
    }
    const item1 = menuItems[0].id;
    console.log(`\x1b[32m-> Lấy menu thành công. Đã chọn món thay mặt khách hàng: ${menuItems[0].name}\x1b[0m\n`);

    // 3. Customer scans QR and creates an order (Dine-in)
    console.log(`\x1b[33m[3] Khách hàng quét mã QR bàn ${tableCode} và Order món...\x1b[0m`);
    const orderRes = await request('POST', `/public/tables/${tableCode}/orders`, {
      items: [
        { menuItemId: item1, quantity: 2, notes: 'Không hành' }
      ]
    });
    customerOrder = orderRes.data.data || orderRes.data;
    console.log(`\x1b[32m-> Order thành công! Mã Order: ${customerOrder.orderNumber}, Trạng thái: ${customerOrder.status}\x1b[0m\n`);

    // 4. Cashier Confirms Order
    console.log('\x1b[33m[4] Thu ngân (Cashier) xác nhận Order...\x1b[0m');
    const confirmRes = await request('PATCH', `/orders/${customerOrder.id}/confirm`, null, adminToken);
    const confirmedOrder = confirmRes.data.data || confirmRes.data;
    console.log(`\x1b[32m-> Đã xác nhận! Trạng thái đơn hiện tại: ${confirmedOrder.status}\x1b[0m\n`);

    // 5. Kitchen views tickets and starts cooking
    console.log('\x1b[33m[5] Bếp trưởng xem ticket và bắt đầu nấu món đầu tiên...\x1b[0m');
    const firstOrderItemId = confirmedOrder.orderItems[0].id;
    const cookRes = await request('PATCH', `/kitchen/order-items/${firstOrderItemId}/cooking`, null, adminToken);
    const cookedItem = cookRes.data.data || cookRes.data;
    console.log(`\x1b[32m-> Đang nấu (COOKING)! Trạng thái món: ${cookedItem.status}\x1b[0m\n`);

    // 6. Kitchen finishes cooking
    console.log('\x1b[33m[6] Bếp trưởng báo nấu xong (READY)...\x1b[0m');
    const readyRes = await request('PATCH', `/kitchen/order-items/${firstOrderItemId}/ready`, null, adminToken);
    const readyItem = readyRes.data.data || readyRes.data;
    console.log(`\x1b[32m-> Nấu xong (READY)! Trạng thái món: ${readyItem.status}\x1b[0m\n`);

    // 7. Cashier/Waiter serves the item
    console.log('\x1b[33m[7] Nhân viên phục vụ đưa món ra bàn (SERVED)...\x1b[0m');
    const serveRes = await request('PATCH', `/order-items/${firstOrderItemId}/served`, null, adminToken);
    const servedItem = serveRes.data.data || serveRes.data;
    console.log(`\x1b[32m-> Đã phục vụ (SERVED)! Trạng thái món: ${servedItem.status}\x1b[0m\n`);

    // 8. Payment Module - Let's check status of table
    console.log('\x1b[33m[8] Kiểm tra trạng thái bàn sau khi phục vụ...\x1b[0m');
    const tablesRes = await request('GET', '/tables', null, adminToken);
    const tableInfo = (tablesRes.data.data.data || tablesRes.data.data || tablesRes.data).find(t => t.tableCode === tableCode);
    console.log(`\x1b[32m-> Bàn ${tableCode} đang ở trạng thái: ${tableInfo.status}. (Kỳ vọng: NEED_PAYMENT)\x1b[0m\n`);

    // 9. Create payment
    console.log('\x1b[33m[9] Khách gọi tính tiền, tạo dữ liệu Payment PENDING...\x1b[0m');
    const createPaymentRes = await request('POST', `/payments/${customerOrder.id}/create`, { amount: parseFloat(customerOrder.total), paymentMethod: 'cash' }, adminToken);
    const createdPayment = createPaymentRes.data.data || createPaymentRes.data;
    console.log(`\x1b[32m-> Đã tạo Payment PENDING thành công! Số tiền: ${createdPayment.amount}\x1b[0m\n`);

    // 10. Cashier confirm payment
    console.log('\x1b[33m[10] Khách trả tiền mặt, Thu ngân xác nhận Payment PAID...\x1b[0m');
    const confirmPaymentRes = await request('PATCH', `/payments/${createdPayment.id}/confirm`, null, adminToken);
    const confirmedPayment = confirmPaymentRes.data.data || confirmPaymentRes.data;
    console.log(`\x1b[32m-> Đã xác nhận PAID! Hoá đơn hiện tại: ${confirmedPayment.status}\x1b[0m\n`);

    // 11. Final Validation - Verify Table is NEED_CLEAN and Session and Order closed
    console.log('\x1b[33m[11] Kiểm tra trạng thái cuối cùng của Hệ Thống...\x1b[0m');
    const finalTableRes = await request('GET', '/tables', null, adminToken);
    const finalTable = (finalTableRes.data.data.data || finalTableRes.data.data || finalTableRes.data).find(t => t.tableCode === tableCode);
    const finalOrderRes = await request('GET', `/orders/${customerOrder.id}`, null, adminToken);
    const finalOrder = finalOrderRes.data.data || finalOrderRes.data;
    
    console.log(`\x1b[32m-> Bàn ${tableCode}: ${finalTable.status} (Kỳ vọng: NEED_CLEAN)\x1b[0m`);
    console.log(`\x1b[32m-> Trạng thái Order: ${finalOrder.status} (Kỳ vọng: COMPLETED)\x1b[0m`);
    console.log(`\x1b[32m-> Phiên Bàn: ${finalOrder.session.status} (Kỳ vọng: CLOSED)\x1b[0m\n`);

    console.log('\x1b[36m--- LUỒNG NGHIỆP VỤ (END-TO-END) HOÀN HẢO! ---\x1b[0m');
  } catch (err) {
    console.error('\x1b[31m[TEST FAILED] Có lỗi xảy ra trong quá trình test:\x1b[0m', err);
  }
}

runTests();
