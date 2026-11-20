import type { Metadata } from 'next';
import AnswerPage, { answerMetadata } from '@/components/seo/AnswerPage';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  return answerMetadata(city, 'tonight');
}

export default async function Page({ params }: Props) {
  const { city } = await params;
  return <AnswerPage city={city} kind="tonight" />;
}
