import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/dashboard/', '/api/', '/teacher/', '/parent/'],
            },
        ],
        sitemap: 'https://codingssok.com/sitemap.xml',
    }
}
