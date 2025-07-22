import { redirect } from 'next/navigation';

export default function FreeStreamPage({ searchParams }) {
  const urlParam = searchParams.url;

  if (urlParam) {
    redirect(`/stream?url=${urlParam}`);
  }else{
    redirect("/stream")
  }
}