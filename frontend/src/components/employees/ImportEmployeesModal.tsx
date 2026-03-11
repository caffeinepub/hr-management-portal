import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { parseCSV, validateAllRows, ValidatedEmployeeRow } from '../../utils/csvParser';
import { downloadTemplate } from '../../utils/csvTemplate';
import { useBulkCreateEmployees } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { BulkEmployeeRecord } from '../../backend';

interface ImportEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportEmployeesModal({ isOpen, onClose, onSuccess }: ImportEmployeesModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validatedRows, setValidatedRows] = useState<ValidatedEmployeeRow[]>([]);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: Array<{ employeeId: string; message: string }> } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const bulkCreateMutation = useBulkCreateEmployees();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setValidatedRows([]);
    setImportResults(null);
    setIsProcessing(true);

    try {
      const parsedData = await parseCSV(selectedFile);
      const validated = validateAllRows(parsedData);
      setValidatedRows(validated);
      
      const validCount = validated.filter(r => r.isValid).length;
      const invalidCount = validated.filter(r => !r.isValid).length;
      
      toast.success(`Parsed ${validated.length} rows: ${validCount} valid, ${invalidCount} invalid`);
    } catch (error) {
      toast.error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    const validRows = validatedRows.filter(r => r.isValid);
    
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare bulk employee records
      const bulkRecords: BulkEmployeeRecord[] = validRows.map(row => ({
        employeeId: row.data.employeeId,
        internalId: BigInt(0), // Backend will assign
        status: row.data.status,
        businessEmail: row.data.businessEmail,
        personalEmail: row.data.personalEmail,
        phoneNumber: row.data.phoneNumber,
        department: row.data.department,
        joiningDate: row.data.joiningDate,
        role: row.data.role,
        annualLeave: row.data.annualLeave,
        sickLeave: row.data.sickLeave,
        casualLeave: row.data.casualLeave,
        unpaidLeave: row.data.unpaidLeave,
      }));

      const results = await bulkCreateMutation.mutateAsync(bulkRecords);
      
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      const errors = results.filter(r => !r.success).map(r => ({
        employeeId: r.employeeId,
        message: r.message,
      }));

      setImportResults({
        success: successCount,
        failed: failedCount,
        errors,
      });

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} employee(s)`);
        onSuccess();
      }
      
      if (failedCount > 0) {
        toast.error(`Failed to import ${failedCount} employee(s)`);
      }
    } catch (error) {
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadErrorReport = () => {
    if (!importResults || importResults.errors.length === 0) return;

    const csvContent = [
      'employeeId,error',
      ...importResults.errors.map(e => `${e.employeeId},"${e.message}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `import_errors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setValidatedRows([]);
    setImportResults(null);
    setIsProcessing(false);
    onClose();
  };

  const validCount = validatedRows.filter(r => r.isValid).length;
  const invalidCount = validatedRows.filter(r => !r.isValid).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Import Employees</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple employees at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download Section */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium mb-1">Need a template?</p>
                  <p className="text-sm text-muted-foreground">
                    Download our CSV template with sample data and required column headers.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Required fields:</strong> employeeId, fullName, businessEmail, department, designation, employmentType, joiningDate, role
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="ml-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* File Upload Section */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!file ? (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Upload CSV File</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click to browse or drag and drop your file here
                  </p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Select File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <FileText className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <p className="text-lg font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {validatedRows.length} rows parsed
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setValidatedRows([]);
                    setImportResults(null);
                  }}
                >
                  Change File
                </Button>
              </div>
            )}
          </div>

          {/* Processing Indicator */}
          {isProcessing && !importResults && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">Processing...</p>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {/* Validation Results */}
          {validatedRows.length > 0 && !importResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Validation Results</h3>
                <div className="flex gap-4">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {validCount} Valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <XCircle className="h-3 w-3 mr-1" />
                      {invalidCount} Invalid
                    </Badge>
                  )}
                </div>
              </div>

              <div className="border rounded-lg max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Row</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validatedRows.map((row) => (
                      <TableRow key={row.rowIndex} className={!row.isValid ? 'bg-red-50' : ''}>
                        <TableCell>{row.rowIndex}</TableCell>
                        <TableCell>{row.data.employeeId}</TableCell>
                        <TableCell>{row.data.fullName}</TableCell>
                        <TableCell>{row.data.businessEmail}</TableCell>
                        <TableCell>{row.data.department}</TableCell>
                        <TableCell>
                          {row.isValid ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Invalid
                              </Badge>
                              {row.errors.map((error, idx) => (
                                <p key={idx} className="text-xs text-red-600">
                                  {error.field}: {error.message}
                                </p>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Import Complete</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">✓ {importResults.success} succeeded</span>
                      {importResults.failed > 0 && (
                        <span className="text-red-600">✗ {importResults.failed} failed</span>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {importResults.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Failed Imports</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadErrorReport}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Error Report
                    </Button>
                  </div>
                  <div className="border rounded-lg max-h-48 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee ID</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResults.errors.map((error, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{error.employeeId}</TableCell>
                            <TableCell className="text-red-600">{error.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              {importResults ? 'Close' : 'Cancel'}
            </Button>
            {validatedRows.length > 0 && !importResults && (
              <Button
                onClick={handleImport}
                disabled={validCount === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {validCount} Employee{validCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
