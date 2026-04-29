import { useMe } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProfilePage() {
  const me = useMe();
  if (!me.data) return null;
  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl">Profile</h1>
      <Card className="bg-surface border-default">
        <CardHeader>
          <CardTitle className="font-display text-base">{me.data.name}</CardTitle>
        </CardHeader>
        <CardContent className="text-secondary text-sm space-y-1">
          <p>{me.data.email}</p>
          <p className="font-mono text-xs">role: {me.data.role}</p>
          <p className="font-mono text-xs">id: {me.data.id}</p>
        </CardContent>
      </Card>
    </div>
  );
}
