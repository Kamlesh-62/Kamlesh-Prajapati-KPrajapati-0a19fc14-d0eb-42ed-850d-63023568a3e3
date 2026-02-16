import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { TaskCategory, TaskPriority, TaskStatus } from '@kprajapati/data';

export class CreateTaskRequestDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskCategory)
  category!: TaskCategory;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
