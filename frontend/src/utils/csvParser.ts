// CSV parsing and validation utilities for employee bulk import

import { EmployeeRole } from '../backend';

export interface ParsedCSVData {
  headers: string[];
  rows: string[][];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidatedEmployeeRow {
  rowIndex: number;
  data: {
    employeeId: string;
    fullName: string;
    businessEmail: string;
    personalEmail?: string;
    phoneNumber: string;
    department: string;
    designation: string;
    employmentType: string;
    joiningDate: bigint;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    emergencyContact1Name: string;
    emergencyContact1Phone: string;
    emergencyContact1Relationship: string;
    emergencyContact2Name?: string;
    emergencyContact2Phone?: string;
    emergencyContact2Relationship?: string;
    role: EmployeeRole;
    status: string;
    annualLeave: bigint;
    sickLeave: bigint;
    casualLeave: bigint;
    unpaidLeave: bigint;
  };
  errors: ValidationError[];
  isValid: boolean;
}

// Parse CSV file
export async function parseCSV(file: File): Promise<ParsedCSVData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }
        
        const headers = parseCSVLine(lines[0]);
        const rows = lines.slice(1).map(line => parseCSVLine(line));
        
        resolve({ headers, rows });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Parse a single CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate date format and convert to nanoseconds
function parseDate(dateString: string): { valid: boolean; timestamp?: bigint; error?: string } {
  if (!dateString || !dateString.trim()) {
    return { valid: false, error: 'Date is required' };
  }
  
  // Try parsing YYYY-MM-DD format
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateString.match(dateRegex);
  
  if (!match) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format' };
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date' };
  }
  
  // Convert to nanoseconds (milliseconds * 1,000,000)
  const timestamp = BigInt(date.getTime()) * BigInt(1_000_000);
  return { valid: true, timestamp };
}

// Validate employee role
function parseEmployeeRole(roleString: string): { valid: boolean; role?: EmployeeRole; error?: string } {
  const roleLower = roleString.toLowerCase().trim();
  
  const roleMap: { [key: string]: EmployeeRole } = {
    'employee': EmployeeRole.employee,
    'hrstaff': EmployeeRole.hrStaff,
    'hr staff': EmployeeRole.hrStaff,
    'manager': EmployeeRole.manager,
    'hrmanager': EmployeeRole.hrManager,
    'hr manager': EmployeeRole.hrManager,
    'superadmin': EmployeeRole.superAdmin,
    'super admin': EmployeeRole.superAdmin,
  };
  
  const role = roleMap[roleLower];
  if (!role) {
    return { valid: false, error: 'Invalid role. Must be: employee, hrStaff, manager, hrManager, or superAdmin' };
  }
  
  return { valid: true, role };
}

// Get value from row by header name
function getValueByHeader(headers: string[], row: string[], headerName: string): string {
  const index = headers.findIndex(h => h.toLowerCase().trim() === headerName.toLowerCase().trim());
  return index >= 0 ? row[index]?.trim() || '' : '';
}

// Validate and parse a single employee row
export function validateEmployeeRow(
  headers: string[],
  row: string[],
  rowIndex: number
): ValidatedEmployeeRow {
  const errors: ValidationError[] = [];
  
  // Extract values
  const employeeId = getValueByHeader(headers, row, 'employeeId');
  const fullName = getValueByHeader(headers, row, 'fullName');
  const businessEmail = getValueByHeader(headers, row, 'businessEmail');
  const personalEmail = getValueByHeader(headers, row, 'personalEmail');
  const phoneNumber = getValueByHeader(headers, row, 'phoneNumber');
  const department = getValueByHeader(headers, row, 'department');
  const designation = getValueByHeader(headers, row, 'designation');
  const employmentType = getValueByHeader(headers, row, 'employmentType');
  const joiningDateStr = getValueByHeader(headers, row, 'joiningDate');
  const street = getValueByHeader(headers, row, 'street');
  const city = getValueByHeader(headers, row, 'city');
  const state = getValueByHeader(headers, row, 'state');
  const zipCode = getValueByHeader(headers, row, 'zipCode');
  const country = getValueByHeader(headers, row, 'country');
  const emergencyContact1Name = getValueByHeader(headers, row, 'emergencyContact1Name');
  const emergencyContact1Phone = getValueByHeader(headers, row, 'emergencyContact1Phone');
  const emergencyContact1Relationship = getValueByHeader(headers, row, 'emergencyContact1Relationship');
  const emergencyContact2Name = getValueByHeader(headers, row, 'emergencyContact2Name');
  const emergencyContact2Phone = getValueByHeader(headers, row, 'emergencyContact2Phone');
  const emergencyContact2Relationship = getValueByHeader(headers, row, 'emergencyContact2Relationship');
  const roleStr = getValueByHeader(headers, row, 'role');
  const status = getValueByHeader(headers, row, 'status') || 'active';
  const annualLeaveStr = getValueByHeader(headers, row, 'annualLeave') || '0';
  const sickLeaveStr = getValueByHeader(headers, row, 'sickLeave') || '0';
  const casualLeaveStr = getValueByHeader(headers, row, 'casualLeave') || '0';
  const unpaidLeaveStr = getValueByHeader(headers, row, 'unpaidLeave') || '0';
  
  // Validate required fields
  if (!employeeId) errors.push({ field: 'employeeId', message: 'Employee ID is required' });
  if (!fullName) errors.push({ field: 'fullName', message: 'Full name is required' });
  if (!businessEmail) errors.push({ field: 'businessEmail', message: 'Business email is required' });
  if (!department) errors.push({ field: 'department', message: 'Department is required' });
  if (!designation) errors.push({ field: 'designation', message: 'Designation is required' });
  if (!employmentType) errors.push({ field: 'employmentType', message: 'Employment type is required' });
  if (!joiningDateStr) errors.push({ field: 'joiningDate', message: 'Joining date is required' });
  if (!roleStr) errors.push({ field: 'role', message: 'Role is required' });
  
  // Validate email format
  if (businessEmail && !isValidEmail(businessEmail)) {
    errors.push({ field: 'businessEmail', message: 'Invalid email format' });
  }
  
  if (personalEmail && !isValidEmail(personalEmail)) {
    errors.push({ field: 'personalEmail', message: 'Invalid email format' });
  }
  
  // Validate and parse date
  let joiningDate = BigInt(0);
  if (joiningDateStr) {
    const dateResult = parseDate(joiningDateStr);
    if (!dateResult.valid) {
      errors.push({ field: 'joiningDate', message: dateResult.error || 'Invalid date' });
    } else {
      joiningDate = dateResult.timestamp!;
    }
  }
  
  // Validate and parse role
  let role = EmployeeRole.employee;
  if (roleStr) {
    const roleResult = parseEmployeeRole(roleStr);
    if (!roleResult.valid) {
      errors.push({ field: 'role', message: roleResult.error || 'Invalid role' });
    } else {
      role = roleResult.role!;
    }
  }
  
  // Parse leave balances
  const annualLeave = BigInt(parseInt(annualLeaveStr) || 0);
  const sickLeave = BigInt(parseInt(sickLeaveStr) || 0);
  const casualLeave = BigInt(parseInt(casualLeaveStr) || 0);
  const unpaidLeave = BigInt(parseInt(unpaidLeaveStr) || 0);
  
  return {
    rowIndex,
    data: {
      employeeId,
      fullName,
      businessEmail,
      personalEmail: personalEmail || undefined,
      phoneNumber,
      department,
      designation,
      employmentType,
      joiningDate,
      street,
      city,
      state,
      zipCode,
      country,
      emergencyContact1Name,
      emergencyContact1Phone,
      emergencyContact1Relationship,
      emergencyContact2Name: emergencyContact2Name || undefined,
      emergencyContact2Phone: emergencyContact2Phone || undefined,
      emergencyContact2Relationship: emergencyContact2Relationship || undefined,
      role,
      status,
      annualLeave,
      sickLeave,
      casualLeave,
      unpaidLeave,
    },
    errors,
    isValid: errors.length === 0,
  };
}

// Validate all rows
export function validateAllRows(parsedData: ParsedCSVData): ValidatedEmployeeRow[] {
  return parsedData.rows.map((row, index) => 
    validateEmployeeRow(parsedData.headers, row, index + 1)
  );
}
