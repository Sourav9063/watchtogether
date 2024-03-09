const config = {
  iframe: {
    url1: process.env.NEXT_PUBLIC_PERSONAL_url1,
    url2: process.env.NEXT_PUBLIC_PERSONAL_url2,
    url3: process.env.NEXT_PUBLIC_PERSONAL_url3,
    url5: process.env.NEXT_PUBLIC_PERSONAL_url5,
    urls: [
      process.env.NEXT_PUBLIC_PERSONAL_url1,
      process.env.NEXT_PUBLIC_PERSONAL_url2,
      process.env.NEXT_PUBLIC_PERSONAL_url3,
      process.env.NEXT_PUBLIC_PERSONAL_url5,
    ],
  },
  tmdbApiKey: process.env.NEXT_PUBLIC_PERSONAL_tmdb_api_key,
};

export default config;
