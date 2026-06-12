import { Injectable } from '@nestjs/common';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  create(createPortfolioDto: CreatePortfolioDto) {
    return this.prisma.portfolio.create({
      data: createPortfolioDto,
    });
  }

  findAll() {
    return this.prisma.portfolio.findMany();
  }

  findOne(id: number) {
    return this.prisma.portfolio.findUnique({
      where: { id },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.portfolio.findUnique({
      where: { slug },
    });
  }

  update(id: number, updatePortfolioDto: UpdatePortfolioDto) {
    return this.prisma.portfolio.update({
      where: { id },
      data: updatePortfolioDto,
    });
  }

  remove(id: number) {
    return this.prisma.portfolio.delete({
      where: { id },
    });
  }
}
