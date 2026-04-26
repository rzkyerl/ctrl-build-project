import { HeroSection } from '../sections/hero-sections'
import { ServicesSection } from '../sections/services-section'
import { FrameworkSection } from '../sections/section-framework'
import { PortfolioSection } from '../sections/portfolio-section'
import { WorkflowSection } from '../sections/workflow-section'
import { ContactSection } from '../sections/contact-section'

export const HomePage = () => {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <FrameworkSection />
      <PortfolioSection />
      <WorkflowSection />
      <ContactSection />
    </>
  )
}
