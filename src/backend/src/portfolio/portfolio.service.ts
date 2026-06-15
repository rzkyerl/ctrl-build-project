import { Injectable } from '@nestjs/common';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  create(createPortfolioDto: CreatePortfolioDto) {
    return this.prisma.portfolio.create({
      data: {
        ...createPortfolioDto,
        techStack: {
          connect: createPortfolioDto.techStack.map(id => ({ id })),
        },
      },
      include: {
        techStack: true,
      },
    });
  }

  findAll() {
    return this.prisma.portfolio.findMany({
      include: {
        techStack: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.portfolio.findUnique({
      where: { id },
      include: {
        techStack: true,
      },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.portfolio.findUnique({
      where: { slug },
      include: {
        techStack: true,
      },
    });
  }

  update(id: number, updatePortfolioDto: UpdatePortfolioDto) {
    const { techStack, ...data } = updatePortfolioDto;
    return this.prisma.portfolio.update({
      where: { id },
      data: {
        ...data,
        techStack: techStack ? {
          set: techStack.map(id => ({ id })),
        } : undefined,
      },
      include: {
        techStack: true,
      },
    });
  }

  remove(id: number) {
    return this.prisma.portfolio.delete({
      where: { id },
    });
  }
}
