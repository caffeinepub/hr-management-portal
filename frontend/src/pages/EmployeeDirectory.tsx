import { useState } from 'react';
import { Plus, Search, Filter, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useGetAllEmployees, useGetCallerUserProfile, useGetEmployeeRecords } from '../hooks/useQueries';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useNavigate } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AddEmployeeModal from '../components/employees/AddEmployeeModal';
import ImportEmployeesModal from '../components/employees/ImportEmployeesModal';
import { EmployeeRole } from '../backend';
import { generateEmployeeCSV, downloadCSV, generateExportFilename } from '../utils/csvExport';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function EmployeeDirectory() {
  const { data: employees, isLoading, isError, refetch: refetchEmployees } = useGetAllEmployees();
  const { data: employeeRecords, refetch: refetchRecords } = useGetEmployeeRecords();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check if user has permission to add/import/export employees (HR staff, HR manager, or super admin)
  const canManageEmployees = !profileLoading && isFetched && userProfile && (
    userProfile.role === EmployeeRole.hrStaff ||
    userProfile.role === EmployeeRole.hrManager ||
    userProfile.role === EmployeeRole.superAdmin
  );

  const filteredEmployees = employees?.filter((emp) =>
    emp.businessEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = async () => {
    if (!employeeRecords || employeeRecords.length === 0) {
      toast.error('No employee data to export');
      return;
    }

    setIsExporting(true);
    try {
      const csvBlob = generateEmployeeCSV(employeeRecords);
      const filename = generateExportFilename();
      downloadCSV(csvBlob, filename);
      toast.success(`Exported ${employeeRecords.length} employee records`);
    } catch (error) {
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    // Invalidate and refetch employee queries so the new employee appears
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    queryClient.invalidateQueries({ queryKey: ['employeeRecords'] });
  };

  const handleImportSuccess = () => {
    refetchEmployees();
    refetchRecords();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading employees..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Failed to load employees. You may not have permission to view this data.</p>
        <Button variant="outline" onClick={() => refetchEmployees()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Employee Directory</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all employee information
          </p>
        </div>

        {canManageEmployees && (
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              size="default"
              disabled={isExporting}
              className="font-medium"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
            <Button
              onClick={() => setIsImportModalOpen(true)}
              variant="outline"
              size="default"
              className="font-medium"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              size="default"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Employee
            </Button>
          </div>
        )}
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
              description={
                searchTerm
                  ? 'Try adjusting your search terms'
                  : canManageEmployees
                  ? 'Add your first employee to get started'
                  : 'No employees have been added yet'
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.internalId.toString()}
                  onClick={() =>
                    navigate({ to: '/employees/$id', params: { id: employee.internalId.toString() } })
                  }
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
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <ImportEmployeesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
