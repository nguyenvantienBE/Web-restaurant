import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Create permissions
    const permissions = [
        // User permissions
        { code: 'USER_READ', name: 'Read Users', category: 'USER' },
        { code: 'USER_CREATE', name: 'Create User', category: 'USER' },
        { code: 'USER_UPDATE', name: 'Update User', category: 'USER' },
        { code: 'USER_DISABLE', name: 'Disable User', category: 'USER' },

        // Role permissions
        { code: 'ROLE_READ', name: 'Read Roles', category: 'ROLE' },
        { code: 'ROLE_UPDATE', name: 'Update Role', category: 'ROLE' },
        { code: 'CLAIM_ASSIGN', name: 'Assign Claims', category: 'ROLE' },

        // Menu permissions
        { code: 'MENU_READ', name: 'Read Menu Items', category: 'MENU' },
        { code: 'MENU_CREATE', name: 'Create Menu Item', category: 'MENU' },
        { code: 'MENU_UPDATE', name: 'Update Menu Item', category: 'MENU' },
        { code: 'MENU_DELETE', name: 'Delete Menu Item', category: 'MENU' },

        // Category permissions
        { code: 'CATEGORY_READ', name: 'Read Categories', category: 'CATEGORY' },
        { code: 'CATEGORY_CREATE', name: 'Create Category', category: 'CATEGORY' },
        { code: 'CATEGORY_UPDATE', name: 'Update Category', category: 'CATEGORY' },
        { code: 'CATEGORY_DELETE', name: 'Delete Category', category: 'CATEGORY' },

        // Table permissions
        { code: 'TABLE_READ', name: 'Read Tables', category: 'TABLE' },
        { code: 'TABLE_CREATE', name: 'Create Table', category: 'TABLE' },
        { code: 'TABLE_UPDATE', name: 'Update Table', category: 'TABLE' },
        { code: 'TABLE_DELETE', name: 'Delete Table', category: 'TABLE' },
        { code: 'QR_GENERATE', name: 'Generate QR Code', category: 'TABLE' },

        // Order permissions
        { code: 'ORDER_READ', name: 'Read Orders', category: 'ORDER' },
        { code: 'ORDER_CONFIRM', name: 'Confirm Order', category: 'ORDER' },
        { code: 'ORDER_UPDATE', name: 'Update Order', category: 'ORDER' },
        { code: 'ORDER_CANCEL', name: 'Cancel Order', category: 'ORDER' },
        { code: 'ITEM_SERVE', name: 'Mark Item as Served', category: 'ORDER' },
        { code: 'STAFF_CALL_HANDLE', name: 'Handle Staff Calls', category: 'ORDER' },

        // Kitchen permissions
        { code: 'KITCHEN_TICKET_READ', name: 'Read Kitchen Tickets', category: 'KITCHEN' },
        { code: 'ITEM_COOK_UPDATE', name: 'Update Item Cooking Status', category: 'KITCHEN' },
        { code: 'KITCHEN_PRINT', name: 'Print Kitchen Tickets', category: 'KITCHEN' },

        // Payment permissions
        { code: 'PAYMENT_READ', name: 'Read Payments', category: 'PAYMENT' },
        { code: 'PAYMENT_CONFIRM', name: 'Confirm Payment', category: 'PAYMENT' },

        // Invoice permissions
        { code: 'INVOICE_GENERATE', name: 'Generate Invoice', category: 'INVOICE' },
        { code: 'INVOICE_SEND_EMAIL', name: 'Send Invoice Email', category: 'INVOICE' },

        // Report permissions
        { code: 'REPORT_VIEW', name: 'View Reports', category: 'REPORT' },
        { code: 'SHIFT_CLOSE', name: 'Close Shift', category: 'REPORT' },

        // Reservation permissions
        { code: 'RESERVATION_READ', name: 'Read Reservations', category: 'RESERVATION' },
        { code: 'RESERVATION_UPDATE', name: 'Update Reservation', category: 'RESERVATION' },
    ];

    console.log('Creating permissions...');
    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { code: perm.code },
            update: {},
            create: perm,
        });
    }

    // Get all permission IDs
    const allPermissions = await prisma.permission.findMany();
    const permMap = Object.fromEntries(allPermissions.map((p) => [p.code, p.id]));

    // Create roles with permissions
    console.log('Creating roles...');

    // Admin role - all permissions
    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            description: 'Full system access',
        },
    });

    await prisma.rolePermission.createMany({
        data: allPermissions.map((p) => ({
            roleId: adminRole.id,
            permissionId: p.id,
        })),
        skipDuplicates: true,
    });

    // Manager role
    const managerRole = await prisma.role.upsert({
        where: { name: 'Manager' },
        update: {},
        create: {
            name: 'Manager',
            description: 'Restaurant manager',
        },
    });

    const managerPerms = [
        'MENU_READ', 'MENU_CREATE', 'MENU_UPDATE', 'MENU_DELETE',
        'CATEGORY_READ', 'CATEGORY_CREATE', 'CATEGORY_UPDATE', 'CATEGORY_DELETE',
        'TABLE_READ', 'TABLE_CREATE', 'TABLE_UPDATE', 'TABLE_DELETE', 'QR_GENERATE',
        'ORDER_READ', 'REPORT_VIEW', 'SHIFT_CLOSE',
        'RESERVATION_READ', 'RESERVATION_UPDATE',
    ];

    await prisma.rolePermission.createMany({
        data: managerPerms.map((code) => ({
            roleId: managerRole.id,
            permissionId: permMap[code],
        })),
        skipDuplicates: true,
    });

    // Cashier role
    const cashierRole = await prisma.role.upsert({
        where: { name: 'Cashier' },
        update: {},
        create: {
            name: 'Cashier',
            description: 'Cashier/Server',
        },
    });

    const cashierPerms = [
        'ORDER_READ', 'ORDER_CONFIRM', 'ORDER_UPDATE', 'ORDER_CANCEL',
        'TABLE_READ', 'TABLE_UPDATE',
        'ITEM_SERVE', 'STAFF_CALL_HANDLE',
        'PAYMENT_READ', 'PAYMENT_CONFIRM',
        'INVOICE_GENERATE', 'INVOICE_SEND_EMAIL',
    ];

    await prisma.rolePermission.createMany({
        data: cashierPerms.map((code) => ({
            roleId: cashierRole.id,
            permissionId: permMap[code],
        })),
        skipDuplicates: true,
    });

    // Kitchen role
    const kitchenRole = await prisma.role.upsert({
        where: { name: 'Kitchen' },
        update: {},
        create: {
            name: 'Kitchen',
            description: 'Kitchen staff',
        },
    });

    const kitchenPerms = ['KITCHEN_TICKET_READ', 'ITEM_COOK_UPDATE', 'KITCHEN_PRINT'];

    await prisma.rolePermission.createMany({
        data: kitchenPerms.map((code) => ({
            roleId: kitchenRole.id,
            permissionId: permMap[code],
        })),
        skipDuplicates: true,
    });

    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@restaurant.com' },
        update: {},
        create: {
            email: 'admin@restaurant.com',
            password: hashedPassword,
            fullName: 'System Admin',
            roleId: adminRole.id,
            isActive: true,
        },
    });

    // Create sample categories
    console.log('Creating sample categories...');
    const categories = [
        { name: 'Appetizers', sortOrder: 1 },
        { name: 'Main Course', sortOrder: 2 },
        { name: 'Desserts', sortOrder: 3 },
        { name: 'Beverages', sortOrder: 4 },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { id: cat.name },
            update: {},
            create: cat,
        });
    }

    // Create sample tables
    console.log('Creating sample tables...');
    for (let i = 1; i <= 10; i++) {
        await prisma.table.upsert({
            where: { tableCode: `T${i.toString().padStart(2, '0')}` },
            update: {},
            create: {
                tableCode: `T${i.toString().padStart(2, '0')}`,
                tableName: `Table ${i}`,
                capacity: i <= 5 ? 4 : 6,
                floor: i <= 5 ? 'Ground Floor' : 'First Floor',
            },
        });
    }

    console.log('✅ Seed completed!');
    console.log('📧 Admin credentials: admin@restaurant.com / admin123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
