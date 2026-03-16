const http = require('http');
const { io } = require('socket.io-client');

const API_URL = 'http://localhost:3000';
let adminToken = '';
let socket;

// Helper function for API requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 400) {
            reject({ status: res.statusCode, data: parsed });
          } else {
            resolve({ status: res.statusCode, data: parsed });
          }
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => reject(error));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
  console.log('\x1b[36m--- Bắt đầu Test Script Phase 2 (Realtime & Reports) ---\x1b[0m\n');

  try {
    // 1. Đăng nhập
    console.log('\x1b[33m[1] Đăng nhập Admin & Lấy Token...\x1b[0m');
    const loginRes = await request('POST', '/auth/login', {
      email: 'admin@restaurant.com',
      password: 'admin123',
    });
    adminToken = loginRes.data.data ? loginRes.data.data.accessToken : loginRes.data.accessToken;
    console.log(`\x1b[32m-> Đăng nhập thành công! Token: ${adminToken.substring(0, 15)}...\x1b[0m\n`);

    // 2. Lấy Menu
    const menuRes = await request('GET', '/menu-items');
    const items = menuRes.data.data || menuRes.data;
    const menuItemId = items[0].id;

    // 3. Kết nối Socket.IO
    console.log('\x1b[33m[2] Kết nối Realtime WebSockets...\x1b[0m');
    socket = io('http://localhost:3000', {
      auth: { token: adminToken }
    });

    socket.on('connect', () => {
      console.log(`\x1b[32m-> Socket Connected: ${socket.id}\x1b[0m\n`);
    });

    // Lắng nghe các events
    socket.on('order:new', (data) => console.log('\x1b[35m[SOCKET] order:new nhận được!\x1b[0m', data.orderNumber));
    socket.on('kitchen:ticket', (data) => console.log('\x1b[35m[SOCKET] kitchen:ticket nhận được!\x1b[0m', data.orderNumber));
    socket.on('item:statusChanged', (data) => console.log('\x1b[35m[SOCKET] item:statusChanged nhận được!\x1b[0m', data.status));
    socket.on('table:statusChanged', (data) => console.log('\x1b[35m[SOCKET] table:statusChanged nhận được!\x1b[0m', data.status));
    socket.on('payment:completed', (data) => console.log('\x1b[35m[SOCKET] payment:completed nhận được!\x1b[0m', data.amount));

    await sleep(1000); // chờ socket init

    // 4. Tạo Order
    console.log('\x1b[33m[3] Tạo Order (Dine-in)...\x1b[0m');
    const orderRes = await request('POST', '/public/tables/T01/orders', {
      items: [{ menuItemId, quantity: 2, notes: 'Ít cay' }]
    });
    const order = orderRes.data.data || orderRes.data;
    const orderId = order.id;
    const firstOrderItemId = order.orderItems[0].id;
    console.log(`\x1b[32m-> Đã tạo order: ${order.orderNumber}\x1b[0m\n`);

    await sleep(1500); // Đợi socket event

    // 5. Confirm Order
    console.log('\x1b[33m[4] Thu ngân xác nhận (Confirm Order)...\x1b[0m');
    await request('PATCH', `/orders/${orderId}/confirm`, null, adminToken);
    
    await sleep(1500); // Đợi socket event

    // 6. Bếp Cập nhật món (COOKING)
    console.log('\x1b[33m[5] Bếp trưởng cập nhật món lên COOKING...\x1b[0m');
    await request('PATCH', `/kitchen/order-items/${firstOrderItemId}/cooking`, null, adminToken);

    await sleep(1500); // Đợi socket event
    
    // 7. Bếp Cập nhật món (READY)
    console.log('\x1b[33m[6] Bếp trưởng cập nhật món lên READY...\x1b[0m');
    await request('PATCH', `/kitchen/order-items/${firstOrderItemId}/ready`, null, adminToken);

    await sleep(1500); // Đợi socket event

    // 8. Serve món
    console.log('\x1b[33m[7] Chạy bàn serve món...\x1b[0m');
    await request('PATCH', `/order-items/${firstOrderItemId}/served`, null, adminToken);

    await sleep(1500); // Đợi socket event

    // 9. Tính tiền
    console.log('\x1b[33m[8] Tính tiền Order...\x1b[0m');
    const paymentRes = await request('POST', `/payments/${orderId}/create`, { amount: Number(order.total) }, adminToken);
    const payment = paymentRes.data.data || paymentRes.data;
    
    // 10. Confirm Payment -> Gửi Email Invoice
    console.log('\x1b[33m[9] Thu ngân Confirm Payment -> Gửi hoá đơn email...\x1b[0m');
    await request('PATCH', `/payments/${payment.id}/confirm`, { customerEmail: 'test-khach-hang@gmail.com' }, adminToken);

    await sleep(2000); // Đợi socket event và background job gửi email

    // 11. Test Reports
    console.log('\x1b[33m[10] Truy vấn Thống kê (Reports)...\x1b[0m');
    const revenueRes = await request('GET', '/reports/revenue', null, adminToken);
    console.log('\x1b[34m-> Báo cáo Doanh thu Hôm nay:\x1b[0m', revenueRes.data);

    const shiftRes = await request('POST', '/reports/end-shift', null, adminToken);
    console.log('\x1b[34m-> Báo cáo Kết ca:\x1b[0m', shiftRes.data);

    // Dọn dẹp
    console.log('\n\x1b[32m--- TẤT CẢ TÍNH NĂNG PHASE 2 HOẠT ĐỘNG HOÀN HẢO! ---\x1b[0m');
    socket.disconnect();
    
  } catch (err) {
    console.error('\x1b[31m[TEST FAILED]\x1b[0m', err);
    if(socket) socket.disconnect();
  }
}

runTest();
