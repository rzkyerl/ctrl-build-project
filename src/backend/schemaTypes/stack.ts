import { defineType, defineField } from 'sanity'
import { PackageIcon } from '@sanity/icons'

export const stackType = defineType({
  name: 'stack',
  title: 'Tech Stack',
  type: 'document',
  icon: PackageIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().min(1).max(80),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'image',
      description: 'Logo atau icon untuk tech stack ini',
      options: {
        hotspot: false,
        accept: 'image/*',
      },
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'icon',
    },
  },
  orderings: [
    {
      title: 'Name A–Z',
      name: 'nameAsc',
      by: [{ field: 'name', direction: 'asc' }],
    },
  ],
})
