import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ default: '' })
  description!: string;

  @Column({ default: 'todo' })
  status!: string;

  @Column({ default: 'work' })
  category!: string;

  @Column({ default: 0 })
  position!: number;

  @Column()
  assigneeId!: string;

  @Column({ nullable: true })
  priority!: string | null;

  @Column({ type: 'text', nullable: true })
  dueDate!: string | null;

  @ManyToOne(() => User, (user) => user.assignedTasks)
  @JoinColumn({ name: 'assigneeId' })
  assignee!: User;

  @Column()
  createdById!: string;

  @ManyToOne(() => User, (user) => user.createdTasks)
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @Column()
  organizationId!: string;

  @ManyToOne(() => Organization, (org) => org.tasks)
  @JoinColumn({ name: 'organizationId' })
  organization!: Organization;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
