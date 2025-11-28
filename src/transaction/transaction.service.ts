import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CategoryService } from '../category/category.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly categoryService: CategoryService,
  ) {}

  async create(dto: CreateTransactionDto) {
    const categories = await this.categoryService.findAll();
    const found = categories.find((cate) => cate.id === dto.categoryId);

    if (!found) throw new NotFoundException('Categoría no encontrada');

    // 🔧 Normalizamos la fecha recibida del frontend
    // El frontend envía "YYYY-MM-DD"
    let parsedDate: Date;
    if (typeof dto.date === 'string') {
      const [year, month, day] = dto.date.split('-').map(Number);
      parsedDate = new Date(year, month - 1, day); // fecha local
    } else {
      parsedDate = new Date(dto.date);
    }

    // Removemos horas/minutos/segundos por las dudas
    parsedDate.setHours(0, 0, 0, 0);

    const transaction = this.transactionRepo.create({
      description: dto.description,
      amount: dto.amount,
      category: found,
      date: parsedDate,
    });

    return this.transactionRepo.save(transaction);
  }

  findAll() {
    return this.transactionRepo.find({
      order: { date: 'DESC' },
      relations: ['category'],
    });
  }
}
