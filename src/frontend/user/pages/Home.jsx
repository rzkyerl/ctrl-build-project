import { HeroSection } from '../sections/hero-sections'
import { ServicesSection } from '../sections/services-section'
import { ProductsSection } from '../sections/products-section'
import { FrameworkSection } from '../sections/section-framework'
import { PortfolioSection } from '../sections/portfolio-section'
import { WorkflowSection } from '../sections/workflow-section'
import { TestimonialSection } from '../sections/testimonial-section'
import { ContactSection } from '../sections/contact-section'

export const HomePage = () => {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <ProductsSection />
      <FrameworkSection />
      <PortfolioSection />
      <WorkflowSection />
      <TestimonialSection />
      <ContactSection />
    </>
  )
}
