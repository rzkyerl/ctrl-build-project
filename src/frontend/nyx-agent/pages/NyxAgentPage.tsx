import { useEffect } from 'react'
import { NyxHero }     from '../sections/NyxHero'
import { NyxFeatures } from '../sections/NyxFeatures'
import { NyxTerminal } from '../sections/NyxTerminal'
import '../styles/css/nyx-agent.css'

export default function NyxAgentPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="nyx-root">
      <main>
        <NyxHero />
        <NyxTerminal />
        <NyxFeatures />
      </main>
    </div>
  )
}
