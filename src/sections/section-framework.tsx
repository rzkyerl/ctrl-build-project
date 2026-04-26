import '../styles/css/section-framework.css'

const frameworks = [
  { name: 'Laravel', slug: 'laravel' },
  { name: 'React', slug: 'react' },
  { name: 'Next.js', slug: 'nextdotjs' },
  { name: 'SvelteKit', slug: 'svelte' },
  { name: 'Docker', slug: 'docker' },
  { name: 'HTML5', slug: 'html5' },
  { name: 'CSS3', slug: 'css' },
  { name: 'JavaScript', slug: 'javascript' },
  { name: 'Tailwind CSS', slug: 'tailwindcss' },
]

export const FrameworkSection = () => {
  // Duplicate the array for a seamless infinite marquee effect
  const track = [...frameworks, ...frameworks, ...frameworks]

  return (
    <section className="framework-section" id="frameworks">
      <h3 className="framework-title">Teknologi yang Kami Gunakan</h3>
      <div className="framework-marquee-row">
        {track.map((tech, i) => (
          <div className="framework-icon" key={`${tech.slug}-${i}`} title={tech.name}>
            {/* Requesting the icon in black from SimpleIcons */}
            <img 
              src={`https://cdn.simpleicons.org/${tech.slug}/black`} 
              alt={tech.name} 
              loading="lazy" 
              draggable="false" 
            />
          </div>
        ))}
      </div>
    </section>
  )
}
