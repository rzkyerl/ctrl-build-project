import { defineType, defineField } from 'sanity'
import { ProjectsIcon } from '@sanity/icons'

export const portfolioType = defineType({
  name: 'portfolio',
  title: 'Portfolio',
  type: 'document',
  icon: ProjectsIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(1).max(200),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL identifier — contoh: "3nt-studio", "bookingin"',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Web Development', value: 'Web Development' },
          { title: 'Mobile Apps', value: 'Mobile Apps' },
          { title: 'UI/UX Design', value: 'UI/UX Design' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Main Image',
      type: 'image',
      description: 'Gambar utama / mockup project',
      options: {
        hotspot: true,
        accept: 'image/*',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'overview',
      title: 'Overview',
      type: 'text',
      rows: 4,
      description: 'Deskripsi singkat project',
    }),
    defineField({
      name: 'goals',
      title: 'Goals',
      type: 'text',
      rows: 4,
      description: 'Tujuan dan target project',
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      description: 'Fitur-fitur utama project',
      of: [
        {
          type: 'object',
          name: 'feature',
          title: 'Feature',
          fields: [
            {
              name: 'title',
              title: 'Feature Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'desc',
              title: 'Description',
              type: 'text',
              rows: 2,
            },
          ],
          preview: {
            select: { title: 'title', subtitle: 'desc' },
          },
        },
      ],
    }),
    defineField({
      name: 'architecture',
      title: 'Architecture',
      type: 'text',
      rows: 3,
      description: 'Deskripsi arsitektur teknis project',
    }),
    defineField({
      name: 'techStack',
      title: 'Tech Stack',
      type: 'array',
      description: 'Teknologi yang digunakan (referensi ke dokumen Stack)',
      of: [
        {
          type: 'reference',
          to: [{ type: 'stack' }],
        },
      ],
    }),
    defineField({
      name: 'link',
      title: 'Live Project URL',
      type: 'url',
      description: 'Link ke website/app yang sudah live',
      validation: (Rule) =>
        Rule.uri({ scheme: ['http', 'https'] }).warning(
          'Pastikan URL diawali dengan https://',
        ),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category',
      media: 'image',
    },
  },
  orderings: [
    {
      title: 'Terbaru',
      name: 'createdDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
    {
      title: 'Title A–Z',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
  ],
})
