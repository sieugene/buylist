import { User } from 'src/users/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column({ nullable: true })
  link: string;

  @Column('simple-array', { nullable: true })
  coordinate: string[];

  @Column()
  comment: string;

  @Column({ nullable: true })
  buyBefore: Date;

  @Column({ nullable: true })
  color: string;

  @ManyToOne((type) => User)
  @JoinColumn({ name: 'authorId' })
  author: User;
}