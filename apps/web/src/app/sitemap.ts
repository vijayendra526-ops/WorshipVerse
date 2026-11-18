import type { MetadataRoute } from 'next';

const baseUrl = 'https://worshipverse-silk.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/songs`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/download`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
