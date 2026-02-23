import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useGetAllEmployees, useGetCallerUserProfile } from '../hooks/useQueries';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useNavigate } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AddEmployeeModal from '../components/employees/AddEmployeeModal';
import { EmployeeRole } from '../backend';

export default function EmployeeDirectory() {
  const { data: employees, isLoading } = useGetAllEmployees();
  const { data: userProfile, isLoading: profileLoading, isFetched, isError } = useGetCallerUserProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  // Debug logging for user profile
  useEffect(() => {
    console.log('=== EmployeeDirectory Debug ===');
    console.log('Profile Loading:', profileLoading);
    console.log('Profile Fetched:', isFetched);
    console.log('Profile Error:', isError);
    console.log('User Profile:', userProfile);
    if (userProfile) {
      console.log('User Role:', userProfile.role);
      console.log('User Name:', userProfile.name);
      console.log('User Employee ID:', userProfile.employeeId);
    }
  }, [profileLoading, isFetched, isError, userProfile]);

  // Check if user has permission to add employees (HR staff, HR manager, or super admin)
  // Only check after profile is loaded to avoid hiding button during loading
  const canAddEmployee = !profileLoading && isFetched && userProfile && (
    userProfile.role === EmployeeRole.hrStaff ||
    userProfile.role === EmployeeRole.hrManager ||
    userProfile.role === EmployeeRole.superAdmin
  );

  // Debug logging for permission check
  useEffect(() => {
    console.log('=== Permission Check ===');
    console.log('Can Add Employee:', canAddEmployee);
    console.log('Profile Loading:', profileLoading);
    console.log('Is Fetched:', isFetched);
    console.log('Has User Profile:', !!userProfile);
    if (userProfile) {
      console.log('Role Check - hrStaff:', userProfile.role === EmployeeRole.hrStaff);
      console.log('Role Check - hrManager:', userProfile.role === EmployeeRole.hrManager);
      console.log('Role Check - superAdmin:', userProfile.role === EmployeeRole.superAdmin);
    }
  }, [canAddEmployee, profileLoading, isFetched, userProfile]);

  const filteredEmployees = employees?.filter((emp) =>
    emp.businessEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading employees..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Mode: Always visible Add Employee button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => {
            console.log('Debug button clicked - opening modal');
            setIsAddModalOpen(true);
          }}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg px-6 py-3 rounded-full"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Employee (Debug Mode)
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Employee Directory</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all employee information
          </p>
        </div>
        
        {/* Original role-based button with debug logging */}
        {(() => {
          console.log('=== Button Render Check ===');
          console.log('Rendering button section, canAddEmployee:', canAddEmployee);
          
          if (canAddEmployee) {
            console.log('✓ Button SHOULD be visible');
            return (
              <Button 
                onClick={() => {
                  console.log('Role-based button clicked');
                  setIsAddModalOpen(true);
                }}
                size="default"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Employee
              </Button>
            );
          } else {
            console.log('✗ Button hidden - canAddEmployee is false');
            return null;
          }
        })()}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredEmployees || filteredEmployees.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No employees found"
              description="Try adjusting your search or add a new employee"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.internalId.toString()}
                  onClick={() => navigate({ to: '/employees/$id', params: { id: employee.internalId.toString() } })}
                  className="block cursor-pointer"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="/assets/generated/avatar-placeholder.dim_200x200.png" />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {employee.businessEmail.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {employee.businessEmail.split('@')[0]}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {employee.department}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {employee.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddEmployeeModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          console.log('Closing Add Employee modal');
          setIsAddModalOpen(false);
        }} 
      />
    </div>
  );
}
