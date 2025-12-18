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
import { Prescription } from './Prescription';

@Entity('diagnoses')
export class Diagnosis {
  @PrimaryColumn({ length: 50 })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar' })
  severity!: string;

  @Column({ name: 'acne_type', type: 'varchar', nullable: true })
  acneType!: string | null;

  @Column({ type: 'integer' })
  confidence!: number;

  @Column({ name: 'severity_scores', type: 'jsonb' })
  severityScores!: Record<string, number>;

  @Column({ name: 'lesion_counts', type: 'jsonb' })
  lesionCounts!: Record<string, number>;

  @Column({ name: 'affected_areas', type: 'jsonb', default: [] })
  affectedAreas!: string[];

  @Column({ name: 'clinical_notes', type: 'text' })
  clinicalNotes!: string;

  @Column({ name: 'recommended_urgency', type: 'varchar' })
  recommendedUrgency!: string;

  @Column({ name: 'image_url', type: 'varchar' })
  imageUrl!: string;

  @Column({ name: 'clinical_metadata', type: 'jsonb', default: {} })
  clinicalMetadata!: Record<string, any>;

  @Column({ name: 'problem_summary', type: 'jsonb', nullable: true })
  problemSummary!: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.diagnoses)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => Prescription, (prescription) => prescription.diagnosis, { cascade: true })
  prescriptions!: Prescription[];
}

