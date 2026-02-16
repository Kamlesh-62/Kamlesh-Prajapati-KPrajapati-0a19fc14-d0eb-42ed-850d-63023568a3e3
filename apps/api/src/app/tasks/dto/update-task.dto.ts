import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { TaskCategory, TaskPriority, TaskStatus } from '@kprajapati/data';

export class UpdateTaskRequestDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskCategory)
  @IsOptional()
  category?: TaskCategory;

  @IsInt()
  @IsOptional()
  position?: number;

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
