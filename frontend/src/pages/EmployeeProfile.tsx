import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Mail, Phone, Calendar, Briefcase, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetEmployee } from '../hooks/useQueries';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function EmployeeProfile() {
  const { id } = useParams({ from: '/employees/$id' });
  const navigate = useNavigate();
  const { data: employee, isLoading, isError, error } = useGetEmployee(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading employee profile..." />
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Employee Not Found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isError
              ? (error as any)?.message || 'Failed to load employee details.'
              : 'This employee record does not exist.'}
          </p>
        </div>
        <Button onClick={() => navigate({ to: '/employees' })} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directory
        </Button>
      </div>
    );
  }

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getRoleBadgeLabel = (role: string) => {
    const labels: Record<string, string> = {
      employee: 'Employee',
      hrStaff: 'HR Staff',
      manager: 'Manager',
      hrManager: 'HR Manager',
      superAdmin: 'Super Admin',
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/employees' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Employee Profile</h1>
          <p className="text-muted-foreground mt-1">View employee details and information</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="/assets/generated/avatar-placeholder.dim_200x200.png" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {employee.businessEmail.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                {employee.businessEmail.split('@')[0]}
              </h2>
              <p className="text-sm text-muted-foreground mb-3">{employee.department}</p>
              <Badge
                className={
                  employee.status === 'active'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }
                variant="outline"
              >
                {employee.status}
              </Badge>
              <div className="mt-3">
                <Badge variant="secondary" className="text-xs">
                  {getRoleBadgeLabel(employee.role as unknown as string)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Business Email</p>
                  <p className="text-sm font-medium">{employee.businessEmail}</p>
                </div>
              </div>
              {employee.personalEmail && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Personal Email</p>
                    <p className="text-sm font-medium">{employee.personalEmail}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="text-sm font-medium">{employee.phoneNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="text-sm font-medium">{employee.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joining Date</p>
                  <p className="text-sm font-medium">{formatDate(employee.joiningDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="text-sm font-medium">#{employee.internalId.toString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
