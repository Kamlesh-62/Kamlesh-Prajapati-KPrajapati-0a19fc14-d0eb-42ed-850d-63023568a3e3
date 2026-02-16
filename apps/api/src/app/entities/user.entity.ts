import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Task } from './task.entity';
import { AuditLog } from './audit-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column({ default: 'viewer' })
  role!: string;

  @Column()
  organizationId!: string;

  @ManyToOne(() => Organization, (org) => org.users)
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @OneToMany(() => Task, (task) => task.assignee)
  assignedTasks!: Task[];

  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks!: Task[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs!: AuditLog[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
