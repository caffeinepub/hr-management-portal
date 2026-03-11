// CSV export utilities for employee data

import { EmployeeRecord } from '../backend';

// Format timestamp to readable date string
function formatDate(timestamp: bigint): string {
  const milliseconds = Number(timestamp) / 1_000_000;
  const date = new Date(milliseconds);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Escape CSV field (wrap in quotes if contains comma, quote, or newline)
function escapeCSVField(field: string | undefined | null): string {
  if (field === undefined || field === null) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Generate CSV content from employee records
export function generateEmployeeCSV(employees: EmployeeRecord[]): Blob {
  const headers = [
    'employeeId',
    'businessEmail',
    'personalEmail',
    'phoneNumber',
    'department',
    'designation',
    'employmentType',
    'joiningDate',
    'status',
    'role',
    'annualLeave',
    'sickLeave',
    'casualLeave',
    'unpaidLeave',
  ];
  
  const rows = employees.map(emp => [
    escapeCSVField(emp.employeeId),
    escapeCSVField(emp.businessEmail),
    escapeCSVField(emp.personalEmail),
    escapeCSVField(emp.phoneNumber),
    escapeCSVField(emp.department),
    escapeCSVField(emp.designation),
    escapeCSVField(emp.employmentType),
    escapeCSVField(formatDate(emp.joiningDate)),
    escapeCSVField(emp.status),
    escapeCSVField(emp.role),
    escapeCSVField(emp.leaveBalance.annual.toString()),
    escapeCSVField(emp.leaveBalance.sick.toString()),
    escapeCSVField(emp.leaveBalance.casual.toString()),
    escapeCSVField(emp.leaveBalance.unpaid.toString()),
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

// Trigger download of CSV file
export function downloadCSV(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate filename with timestamp
export function generateExportFilename(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  return `employees_export_${dateStr}.csv`;
}
