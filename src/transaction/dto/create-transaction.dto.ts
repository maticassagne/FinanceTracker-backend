import {
  IsNumber,
  IsString,
  IsDateString,
  IsInt,
  IsNotEmpty,
} from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  description: string;

  @IsNumber()
  amount: number;

  @IsInt()
  categoryId: number;

  @IsNotEmpty()
  @IsDateString(
    {},
    { message: 'El campo "date" debe tener formato YYYY-MM-DD' },
  )
  date: string;
}
