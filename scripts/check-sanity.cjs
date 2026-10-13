const { createClient } = require('@sanity/client')
const client = createClient({
  projectId: 'mvct8d39',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function check() {
  try {
    const docs = await client.fetch('*[_type == "portfolio"]{_id, title, slug, category, _createdAt}')
    console.log('Production portfolios:', docs.length)
    docs.forEach(d => console.log(d._id, d.title, d.slug && d.slug.current, d.category))
  } catch (err) {
    console.error('Error:', err.message)
  }

  try {
    const stacks = await client.fetch('*[_type == "stack"]{_id, name, slug, _createdAt}')
    console.log('Production stacks:', stacks.length)
    stacks.forEach(s => console.log(s._id, s.name, s.slug && s.slug.current))
  } catch (err) {
    console.error('Error stacks:', err.message)
  }
}

check()
