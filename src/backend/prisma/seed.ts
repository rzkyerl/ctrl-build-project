import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('ctrladminbuild123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ctrlbuild.my.id' },
    update: { role: 'admin' },
    create: {
      email: 'admin@ctrlbuild.my.id',
      name: 'Admin CtrlBuild',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log('Admin user created:', admin);

  const defaultStacks = [
    { name: 'Laravel', slug: 'laravel', icon: 'https://cdn.simpleicons.org/laravel/000000' },
    { name: 'React', slug: 'react', icon: 'https://cdn.simpleicons.org/react/000000' },
    { name: 'Next.js', slug: 'nextdotjs', icon: 'https://cdn.simpleicons.org/nextdotjs/000000' },
    { name: 'SvelteKit', slug: 'svelte', icon: 'https://cdn.simpleicons.org/svelte/000000' },
    { name: 'Docker', slug: 'docker', icon: 'https://cdn.simpleicons.org/docker/000000' },
    { name: 'HTML5', slug: 'html5', icon: 'https://cdn.simpleicons.org/html5/000000' },
    { name: 'CSS3', slug: 'css', icon: 'https://cdn.simpleicons.org/css/000000' },
    { name: 'JavaScript', slug: 'javascript', icon: 'https://cdn.simpleicons.org/javascript/000000' },
    { name: 'Tailwind CSS', slug: 'tailwindcss', icon: 'https://cdn.simpleicons.org/tailwindcss/000000' },
    { name: 'Figma', slug: 'figma', icon: 'https://cdn.simpleicons.org/figma/000000' },
    { name: 'Node.js', slug: 'nodedotjs', icon: 'https://cdn.simpleicons.org/nodedotjs/000000' },
    { name: 'Python', slug: 'python', icon: 'https://cdn.simpleicons.org/python/000000' },
    { name: 'PostgreSQL', slug: 'postgresql', icon: 'https://cdn.simpleicons.org/postgresql/000000' },
    { name: 'Sanity', slug: 'sanity', icon: 'https://cdn.simpleicons.org/sanity/000000' },
    { name: 'Vercel', slug: 'vercel', icon: 'https://cdn.simpleicons.org/vercel/000000' },
    { name: 'GitHub', slug: 'github', icon: 'https://cdn.simpleicons.org/github/000000' },
    { name: 'Git', slug: 'git', icon: 'https://cdn.simpleicons.org/git/000000' },
    { name: 'Postman', slug: 'postman', icon: 'https://cdn.simpleicons.org/postman/000000' },
    { name: 'NestJS', slug: 'nestjs', icon: 'https://cdn.simpleicons.org/nestjs/000000' },
    { name: 'MySQL', slug: 'mysql', icon: 'https://cdn.simpleicons.org/mysql/000000' },
    { name: 'PHP', slug: 'php', icon: 'https://cdn.simpleicons.org/php/000000' },
    { name: 'TurboRepo', slug: 'turborepo', icon: 'https://cdn.simpleicons.org/turborepo/000000' },
    { name: 'Vite', slug: 'vite', icon: 'https://cdn.simpleicons.org/vite/000000' },
    { name: 'Bootstrap', slug: 'bootstrap', icon: 'https://cdn.simpleicons.org/bootstrap/000000' },
  ];

  for (const stack of defaultStacks) {
    await prisma.stack.upsert({
      where: { slug: stack.slug },
      update: stack,
      create: stack,
    });
  }

  console.log('Default stacks seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
