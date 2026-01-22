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

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      categoryId?: number;
      startDate?: string;
      endDate?: string;
      type?: 'income' | 'expense';
      search?: string;
    },
  ) {
    const query = this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.category', 'category')
      .orderBy('transaction.date', 'DESC');

    // Filtro por búsqueda de descripción
    if (filters?.search) {
      query.andWhere('LOWER(transaction.description) LIKE LOWER(:search)', {
        search: `%${filters.search}%`,
      });
    }

    // Filtro por categoría
    if (filters?.categoryId) {
      query.andWhere('transaction.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    // Filtro por rango de fechas
    if (filters?.startDate) {
      query.andWhere('transaction.date >= :startDate', {
        startDate: filters.startDate,
      });
    }
    if (filters?.endDate) {
      query.andWhere('transaction.date <= :endDate', {
        endDate: filters.endDate,
      });
    }

    // Filtro por tipo (ingreso/gasto)
    if (filters?.type) {
      const isIncome = filters.type === 'income';
      query.andWhere('category.isIncome = :isIncome', { isIncome });
    }

    const skip = (page - 1) * limit;
    const [data, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async remove(id: number) {
    const transaction = await this.transactionRepo.findOne({ where: { id } });
    if (!transaction)
      throw new NotFoundException(`Transacción con ID ${id} no encontrada`);
    return this.transactionRepo.remove(transaction);
  }
}
