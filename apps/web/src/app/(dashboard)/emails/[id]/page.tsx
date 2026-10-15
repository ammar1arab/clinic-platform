import { EmailDetail } from '@/components/blocks/emails/email-detail';

export default async function EmailMessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmailDetail key={id} id={id} />;
}
