import { redirect } from 'next/navigation';

export default function LobbyPage() {
  redirect('/play/room/create');
}

