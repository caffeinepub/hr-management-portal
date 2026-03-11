// CSV template generation for employee import

// Generate template CSV with sample data
export function generateTemplateCSV(): Blob {
  const headers = [
    'employeeId',
    'fullName',
    'businessEmail',
    'personalEmail',
    'phoneNumber',
    'department',
    'designation',
    'employmentType',
    'joiningDate',
    'street',
    'city',
    'state',
    'zipCode',
    'country',
    'emergencyContact1Name',
    'emergencyContact1Phone',
    'emergencyContact1Relationship',
    'emergencyContact2Name',
    'emergencyContact2Phone',
    'emergencyContact2Relationship',
    'role',
    'status',
    'annualLeave',
    'sickLeave',
    'casualLeave',
    'unpaidLeave',
  ];
  
  const sampleRows = [
    [
      'EMP001',
      'John Doe',
      'john.doe@company.com',
      'john.personal@email.com',
      '+1-555-0100',
      'Engineering',
      'Software Engineer',
      'Permanent',
      '2024-01-15',
      '123 Main St',
      'San Francisco',
      'CA',
      '94102',
      'USA',
      'Jane Doe',
      '+1-555-0101',
      'Spouse',
      'Bob Smith',
      '+1-555-0102',
      'Friend',
      'employee',
      'active',
      '20',
      '10',
      '5',
      '0',
    ],
    [
      'EMP002',
      'Sarah Johnson',
      'sarah.johnson@company.com',
      '',
      '+1-555-0200',
      'Human Resources',
      'HR Manager',
      'Permanent',
      '2023-06-01',
      '456 Oak Ave',
      'Los Angeles',
      'CA',
      '90001',
      'USA',
      'Mike Johnson',
      '+1-555-0201',
      'Sibling',
      '',
      '',
      '',
      'hrManager',
      'active',
      '25',
      '12',
      '8',
      '0',
    ],
  ];
  
  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => row.map(field => {
      // Escape fields containing commas
      if (field.includes(',')) {
        return `"${field}"`;
      }
      return field;
    }).join(','))
  ].join('\n');
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

// Download template CSV
export function downloadTemplate(): void {
  const blob = generateTemplateCSV();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'employee_import_template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
