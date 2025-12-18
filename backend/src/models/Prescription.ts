import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Diagnosis } from './Diagnosis';
import { Reminder } from './Reminder';

@Entity('prescriptions')
export class Prescription {
  @PrimaryColumn({ length: 50 })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'diagnosis_id', type: 'varchar', length: 50, nullable: true })
  diagnosisId!: string | null;

  @Column({ type: 'varchar' })
  severity!: string;

  @Column('jsonb')
  medications!: Record<string, any>[];

  @Column({ name: 'lifestyle_recommendations', type: 'jsonb' })
  lifestyleRecommendations!: string[];

  @Column({ name: 'follow_up_instructions', type: 'text' })
  followUpInstructions!: string;

  @Column({ type: 'text' })
  reasoning!: string;

  @Column({ type: 'varchar', default: 'pending' })
  status!: string; // 'pending', 'approved', 'rejected'

  @Column({ name: 'doctor_id', type: 'uuid', nullable: true })
  doctorId!: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'doctor_notes', type: 'text', nullable: true })
  doctorNotes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.prescriptions)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User | null;

  @ManyToOne(() => Diagnosis, (diagnosis) => diagnosis.prescriptions, { nullable: true })
  @JoinColumn({ name: 'diagnosis_id' })
  diagnosis!: Diagnosis | null;

  @OneToMany(() => Reminder, (reminder) => reminder.prescription, { cascade: true })
  reminders!: Reminder[];
}

