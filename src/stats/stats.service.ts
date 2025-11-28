import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Transaction } from '../transaction/entities/transaction.entity';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Convierte fechas (YYYY-MM-DD) a Date locales (zona horaria Argentina UTC-3)
   * desde 00:00:00 hasta 23:59:59.
   */
  private getLocalRange(from: string, to: string) {
    const [fy, fm, fd] = from.split('-').map(Number);
    const [ty, tm, td] = to.split('-').map(Number);

    // Creamos fechas base en hora local Argentina
    const fromDate = new Date(Date.UTC(fy, fm - 1, fd, 3, 0, 0)); // 00:00 Argentina = 03:00 UTC
    const toDate = new Date(Date.UTC(ty, tm - 1, td, 26, 59, 59, 999)); // 23:59 Argentina = 26:59 UTC

    return { fromDate, toDate };
  }

  async getStats(from?: string, to?: string) {
    const where: any = {};

    if (from && to) {
      const { fromDate, toDate } = this.getLocalRange(from, to);
      console.log('🕒 Filtro ajustado (ARG UTC-3):', { fromDate, toDate });
      where.date = Between(fromDate, toDate);
    }

    const transactions = await this.transactionRepository.find({
      where,
      relations: ['category'],
    });

    console.log('📊 Transacciones encontradas:', transactions.length);

    const income = transactions
      .filter((t) => t.category?.isIncome)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => !t.category?.isIncome)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const balance = income - expense;

    // Agrupamos por categoría
    const byCategory = transactions.reduce(
      (acc, t) => {
        const name = t.category?.name || 'Sin categoría';
        const type = t.category?.isIncome ? 'income' : 'expense';
        const key = `${type}-${name}`;

        if (!acc[key]) {
          acc[key] = {
            category: name,
            total: 0,
            type,
          };
        }

        acc[key].total += Number(t.amount);
        return acc;
      },
      {} as Record<string, { category: string; total: number; type: string }>,
    );

    return {
      income,
      expense,
      balance,
      byCategory: Object.values(byCategory),
    };
  }
}
