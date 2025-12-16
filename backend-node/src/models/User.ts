import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Diagnosis } from './Diagnosis';
import { Prescription } from './Prescription';
import { Reminder } from './Reminder';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar' })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar' })
  fullName!: string;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ name: 'date_of_birth', type: 'varchar', nullable: true })
  dateOfBirth!: string | null;

  @Column({ type: 'varchar', nullable: true })
  gender!: string | null;

  @Column({ name: 'skin_type', type: 'varchar', default: 'normal' })
  skinType!: string;

  @Column('jsonb', { default: {} })
  preferences!: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Diagnosis, (diagnosis) => diagnosis.user, { cascade: true })
  diagnoses!: Diagnosis[];

  @OneToMany(() => Prescription, (prescription) => prescription.user, { cascade: true })
  prescriptions!: Prescription[];

  @OneToMany(() => Reminder, (reminder) => reminder.user, { cascade: true })
  reminders!: Reminder[];
}

