import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Attendance() {
  const stats = [
    { name: 'Present Days', value: 20, icon: CheckCircle, color: 'text-success' },
    { name: 'Absent Days', value: 2, icon: XCircle, color: 'text-destructive' },
    { name: 'Late Arrivals', value: 3, icon: AlertCircle, color: 'text-warning' },
    { name: 'Working Hours', value: '160h', icon: Clock, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1">
            Track your attendance and working hours
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Clock In
          </Button>
          <Button variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Clock Out
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
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
          <CardTitle>Attendance Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Calendar view coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
