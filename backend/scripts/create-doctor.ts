import 'reflect-metadata';
import { AppDataSource } from '../src/database/connection';
import { User } from '../src/models/User';
import { hashPassword } from '../src/utils/password';
import dotenv from 'dotenv';

dotenv.config();
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createDoctor() {
  try {
    console.log('='.repeat(70));
    console.log('Create Doctor Account');
    console.log('='.repeat(70));
    console.log();

    // Initialize database
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    console.log();

    const userRepository = AppDataSource.getRepository(User);

    // Get doctor details
    const email = await question('Enter doctor email: ');
    const password = await question('Enter doctor password: ');
    const fullName = await question('Enter doctor full name: ');
    const phone = await question('Enter doctor phone (optional, press Enter to skip): ');

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      console.error(`❌ User with email ${email} already exists`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create doctor user
    const doctor = userRepository.create({
      email,
      passwordHash,
      fullName,
      phone: phone || null,
      role: 'doctor',
      skinType: 'normal',
      preferences: {},
    });

    await userRepository.save(doctor);

    console.log();
    console.log('='.repeat(70));
    console.log('✅ Doctor account created successfully!');
    console.log('='.repeat(70));
    console.log();
    console.log('Doctor Details:');
    console.log(`  ID: ${doctor.id}`);
    console.log(`  Email: ${doctor.email}`);
    console.log(`  Name: ${doctor.fullName}`);
    console.log(`  Role: ${doctor.role}`);
    console.log();
    console.log('The doctor can now login and approve prescriptions.');
    console.log();

    await AppDataSource.destroy();
    rl.close();
  } catch (error) {
    console.error('❌ Error creating doctor account:', error);
    await AppDataSource.destroy();
    rl.close();
    process.exit(1);
  }
}

createDoctor();

