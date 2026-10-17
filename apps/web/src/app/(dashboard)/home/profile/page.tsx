import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

export default function PractitionerProfilePage() {
  redirect(ROUTES.PROFILE);
}
