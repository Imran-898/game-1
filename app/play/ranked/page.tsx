import { redirect } from 'next/navigation';

export default function RankedPage() {
  redirect('/play/room/create?mode=ranked');
}

