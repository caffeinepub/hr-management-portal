import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function LeaveManagement() {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading leave information..." />
      </div>
    );
  }

  const leaveTypes = [
    { name: 'Annual Leave', balance: 15, icon: Calendar, color: 'text-primary' },
    { name: 'Sick Leave', balance: 10, icon: Clock, color: 'text-warning' },
    { name: 'Casual Leave', balance: 5, icon: CheckCircle, color: 'text-success' },
    { name: 'Unpaid Leave', balance: 0, icon: XCircle, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground mt-1">
            View your leave balance and request time off
          </p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Request Leave
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {leaveTypes.map((leave) => {
          const Icon = leave.icon;
          return (
            <Card key={leave.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {leave.name}
                </CardTitle>
                <div className="rounded-lg bg-muted p-2">
                  <Icon className={`h-4 w-4 ${leave.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leave.balance} days</div>
                <p className="text-xs text-muted-foreground mt-1">Available</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No leave requests found
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
