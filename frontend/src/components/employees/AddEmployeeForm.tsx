import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAddEmployee } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AddEmployeeFormData {
  businessEmail: string;
  phoneNumber: string;
  designation: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

interface AddEmployeeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddEmployeeForm({ onSuccess, onCancel }: AddEmployeeFormProps) {
  const [joiningDate, setJoiningDate] = useState<Date>();
  const [department, setDepartment] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<AddEmployeeFormData>();
  const addEmployee = useAddEmployee();

  const onSubmit = async (data: AddEmployeeFormData) => {
    if (!joiningDate) {
      toast.error('Please select a joining date');
      return;
    }

    if (!department) {
      toast.error('Please select a department');
      return;
    }

    if (!employmentType) {
      toast.error('Please select an employment type');
      return;
    }

    try {
      // Convert date to nanoseconds (Time.Time in Motoko)
      const joiningDateNanos = BigInt(joiningDate.getTime()) * BigInt(1_000_000);

      await addEmployee.mutateAsync({
        businessEmail: data.businessEmail,
        phoneNumber: data.phoneNumber,
        department,
        designation: data.designation,
        employmentType,
        joiningDate: joiningDateNanos,
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        },
        emergencyContacts: data.emergencyContactName
          ? [
              {
                name: data.emergencyContactName,
                phone: data.emergencyContactPhone,
                relationship: data.emergencyContactRelationship,
              },
            ]
          : [],
      });

      toast.success('Employee added successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error adding employee:', error);
      const message = error?.message || 'Failed to add employee. Please try again.';
      toast.error(message);
    }
  };

  const isLoading = addEmployee.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
      {/* Personal Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Personal Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessEmail">Business Email *</Label>
            <Input
              id="businessEmail"
              type="email"
              placeholder="employee@company.com"
              {...register('businessEmail', {
                required: 'Business email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              disabled={isLoading}
            />
            {errors.businessEmail && (
              <p className="text-sm text-destructive">{errors.businessEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1 (555) 000-0000"
              {...register('phoneNumber', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[\d\s\-\+\(\)]+$/,
                  message: 'Invalid phone number',
                },
              })}
              disabled={isLoading}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Job Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Job Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select value={department} onValueChange={setDepartment} disabled={isLoading}>
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Human Resources">Human Resources</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="designation">Designation *</Label>
            <Input
              id="designation"
              placeholder="e.g., Software Engineer"
              {...register('designation', { required: 'Designation is required' })}
              disabled={isLoading}
            />
            {errors.designation && (
              <p className="text-sm text-destructive">{errors.designation.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="employmentType">Employment Type *</Label>
            <Select value={employmentType} onValueChange={setEmploymentType} disabled={isLoading}>
              <SelectTrigger id="employmentType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Intern">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Joining Date *</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !joiningDate && 'text-muted-foreground'
                  )}
                  disabled={isLoading}
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {joiningDate ? format(joiningDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={joiningDate}
                  onSelect={(date) => {
                    setJoiningDate(date);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Address</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street Address *</Label>
            <Input
              id="street"
              placeholder="123 Main Street"
              {...register('street', { required: 'Street address is required' })}
              disabled={isLoading}
            />
            {errors.street && (
              <p className="text-sm text-destructive">{errors.street.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="New York"
                {...register('city', { required: 'City is required' })}
                disabled={isLoading}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                placeholder="NY"
                {...register('state', { required: 'State is required' })}
                disabled={isLoading}
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code *</Label>
              <Input
                id="zipCode"
                placeholder="10001"
                {...register('zipCode', { required: 'Zip code is required' })}
                disabled={isLoading}
              />
              {errors.zipCode && (
                <p className="text-sm text-destructive">{errors.zipCode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                placeholder="United States"
                {...register('country', { required: 'Country is required' })}
                disabled={isLoading}
              />
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Emergency Contact</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Contact Name</Label>
            <Input
              id="emergencyContactName"
              placeholder="Jane Doe"
              {...register('emergencyContactName')}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactRelationship">Relationship</Label>
            <Input
              id="emergencyContactRelationship"
              placeholder="Spouse, Parent, etc."
              {...register('emergencyContactRelationship')}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
            <Input
              id="emergencyContactPhone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              {...register('emergencyContactPhone')}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            'Add Employee'
          )}
        </Button>
      </div>
    </form>
  );
}
