const config = {
  iframe: {
    url1: process.env.NEXT_PUBLIC_PERSONAL_url1,
    url2: process.env.NEXT_PUBLIC_PERSONAL_url2,
    url3: process.env.NEXT_PUBLIC_PERSONAL_url3,
    url4: process.env.NEXT_PUBLIC_PERSONAL_url4,
    url5: process.env.NEXT_PUBLIC_PERSONAL_url5,
    url6: process.env.NEXT_PUBLIC_PERSONAL_url6,
    urls: [
      process.env.NEXT_PUBLIC_PERSONAL_url1,
      process.env.NEXT_PUBLIC_PERSONAL_url2,
      process.env.NEXT_PUBLIC_PERSONAL_url3,
      process.env.NEXT_PUBLIC_PERSONAL_url4,
      process.env.NEXT_PUBLIC_PERSONAL_url5,
      process.env.NEXT_PUBLIC_PERSONAL_url6,
    ],
  },
  tmdbApiKey: process.env.NEXT_PUBLIC_PERSONAL_tmdb_api_key,
};

export default config;
