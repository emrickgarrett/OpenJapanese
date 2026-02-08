import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="text-6xl">🦊</span>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Page Not Found
        </h1>
        <p className="text-lg text-muted-foreground">
          Looks like you wandered off the path!
        </p>
      </div>

      <Button asChild size="lg" className="rounded-full px-8">
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
