import { Shield, Users, Settings, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsCallerAdmin } from '../hooks/useQueries';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AdminPanel() {
  const { data: isAdmin, isLoading } = useIsCallerAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading admin panel..." />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the admin panel
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminStats = [
    { name: 'Total Users', value: 0, icon: Users, color: 'text-primary' },
    { name: 'Active Sessions', value: 0, icon: Activity, color: 'text-success' },
    { name: 'System Health', value: '100%', icon: Settings, color: 'text-chart-2' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">
          Manage system settings and user permissions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {adminStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <div className="rounded-lg bg-muted p-2">
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Admin configuration options will be available here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
