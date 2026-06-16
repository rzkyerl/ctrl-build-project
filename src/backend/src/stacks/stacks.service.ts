import { Injectable } from '@nestjs/common';
import { CreateStackDto } from './dto/create-stack.dto';
import { UpdateStackDto } from './dto/update-stack.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StacksService {
  constructor(private prisma: PrismaService) {}

  create(createStackDto: CreateStackDto) {
    return this.prisma.stack.create({
      data: createStackDto,
    });
  }

  findAll() {
    return this.prisma.stack.findMany();
  }

  findOne(id: number) {
    return this.prisma.stack.findUnique({
      where: { id },
    });
  }

  update(id: number, updateStackDto: UpdateStackDto) {
    return this.prisma.stack.update({
      where: { id },
      data: updateStackDto,
    });
  }

  remove(id: number) {
    return this.prisma.stack.delete({
      where: { id },
    });
  }
}
