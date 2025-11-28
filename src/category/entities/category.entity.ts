import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Transaction } from '../../transaction/entities/transaction.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: false })
  isIncome: boolean; // true: ingreso, false: gasto

  @OneToMany(() => Transaction, (transaction) => transaction.category)
  transactions: Transaction[];
}
