import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('summary')
  async getSummary(@Query('from') from?: string, @Query('to') to?: string) {
    console.log('📅 Query summary:', { from, to });

    // Validar que sean strings válidas tipo YYYY-MM-DD
    const parsedFrom = from ? from.slice(0, 10) : undefined;
    const parsedTo = to ? to.slice(0, 10) : undefined;

    const stats = await this.statsService.getStats(parsedFrom, parsedTo);

    return {
      totalIncome: stats.income,
      totalExpense: stats.expense,
      balance: stats.balance,
    };
  }

  @Get('categories')
  async getByCategory(@Query('from') from?: string, @Query('to') to?: string) {
    console.log('📅 Query categories:', { from, to });

    const parsedFrom = from ? from.slice(0, 10) : undefined;
    const parsedTo = to ? to.slice(0, 10) : undefined;

    const stats = await this.statsService.getStats(parsedFrom, parsedTo);
    return stats.byCategory;
  }

  @Get('monthly')
  async getByMonth(@Query('from') from?: string, @Query('to') to?: string) {
    console.log('📅 Query monthly:', { from, to });

    const parsedFrom = from ? from.slice(0, 10) : undefined;
    const parsedTo = to ? to.slice(0, 10) : undefined;

    const stats = await this.statsService.getStats(parsedFrom, parsedTo);

    // Agrupamos por mes
    const grouped: Record<
      string,
      { income: number; expense: number; balance: number }
    > = {};

    stats.byCategory.forEach((cat) => {
      const type = cat.type; // "income" o "expense"
      const month = new Date().toISOString().slice(0, 7); // YYYY-MM

      if (!grouped[month])
        grouped[month] = { income: 0, expense: 0, balance: 0 };

      grouped[month][type === 'income' ? 'income' : 'expense'] += cat.total;
      grouped[month].balance = grouped[month].income - grouped[month].expense;
    });

    return Object.entries(grouped).map(([month, data]) => ({
      month,
      ...data,
    }));
  }
}
