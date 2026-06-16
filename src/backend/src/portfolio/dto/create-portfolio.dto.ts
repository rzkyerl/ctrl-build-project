export class CreatePortfolioDto {
  slug: string;
  title: string;
  category: string;
  imgUrl?: string;
  overview?: string;
  goals?: string;
  features?: any;
  architecture?: string;
  techStack: number[];
  link?: string;
}
