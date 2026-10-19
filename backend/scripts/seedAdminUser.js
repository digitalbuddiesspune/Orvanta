/**
 * Seed Admin Users Script
 * Run: node backend/scripts/seedAdminUser.js
 * Ensures super_admin accounts exist without overwriting other admins.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

import connectDB from '../config/databaseConnection.js';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';

const ADMIN_ACCOUNTS = [
  {
    email: 'adminorvanta@gmail.com',
    password: 'Gamotech@2026',
    name: 'Orvanta Admin',
    phone: '9999999998',
  },
  {
    email: 'admin@fashioncart.com',
    password: 'Admin@123',
    name: 'Super Admin',
    phone: '9999999999',
  },
];

const seedAdminUser = async () => {
  try {
    await connectDB();

    for (const acc of ADMIN_ACCOUNTS) {
      const hashedPassword = await bcrypt.hash(acc.password, 10);
      let admin = await User.findOne({ email: acc.email });

      if (admin) {
        admin.password = hashedPassword;
        admin.role = 'super_admin';
        await admin.save();
        console.log(`Admin ${acc.email} updated/verified.`);
      } else {
        await User.create({
          name: acc.name,
          email: acc.email,
          phone: acc.phone,
          password: hashedPassword,
          role: 'super_admin',
        });
        console.log(`Admin ${acc.email} created.`);
      }
    }

    const currentAdmins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
    console.log('\nAll Active Admins:');
    currentAdmins.forEach((a) => console.log(`- ${a.email} (${a.role})`));
  } catch (error) {
    console.error('Error seeding admins:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

seedAdminUser();
