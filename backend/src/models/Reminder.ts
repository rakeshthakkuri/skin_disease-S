import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Prescription } from './Prescription';

@Entity('reminders')
export class Reminder {
  @PrimaryColumn({ length: 50 })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'prescription_id', type: 'varchar', length: 50, nullable: true })
  prescriptionId!: string | null;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ name: 'message_telugu', type: 'text', nullable: true })
  messageTelugu!: string | null;

  @Column({ type: 'varchar' })
  frequency!: string; // once_daily, twice_daily, three_times_daily

  @Column('jsonb')
  times!: string[]; // ["09:00", "21:00"]

  @Column({ type: 'varchar', default: 'active' })
  status!: string;

  @Column({ name: 'total_acknowledged', type: 'integer', default: 0 })
  totalAcknowledged!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.reminders)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Prescription, (prescription) => prescription.reminders, { nullable: true })
  @JoinColumn({ name: 'prescription_id' })
  prescription!: Prescription | null;
}

