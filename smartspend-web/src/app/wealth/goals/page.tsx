'use client';
import { redirect } from 'next/navigation';
// Wealth goals are embedded in the wealth hub page via a tab
export default function WealthGoalsPage() {
  redirect('/wealth#goals');
}
