import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Payslip {
    month: string;
    payslipId: bigint;
    year: string;
    payslipDocument: ExternalBlob;
    employeeId: string;
}
export interface Letter {
    created: Time;
    createdBy: Principal;
    letterType: string;
    employeeId: string;
    document: ExternalBlob;
    letterId: bigint;
}
export type Time = bigint;
export interface Address {
    street: string;
    country: string;
    city: string;
    zipCode: string;
    state: string;
}
export interface Contact {
    relationship: string;
    name: string;
    phone: string;
}
export interface LeaveRequest {
    status: string;
    requestId: bigint;
    endDate: Time;
    employeeId: string;
    leaveType: string;
    startDate: Time;
}
export interface EmployeeRecord {
    internalId: bigint;
    status: string;
    leaveBalance: LeaveBalance;
    personalEmail?: string;
    designation: string;
    role: EmployeeRole;
    joiningDate: Time;
    businessEmail: string;
    employmentType: string;
    employeeId: string;
    department: string;
    phoneNumber: string;
}
export interface EmployeeProfile {
    internalId: bigint;
    status: string;
    personalEmail?: string;
    role: EmployeeRole;
    joiningDate: Time;
    businessEmail: string;
    department: string;
    phoneNumber: string;
}
export interface EmployeeDetails {
    designation: string;
    joiningDate: Time;
    businessEmail: string;
    emergencyContacts: Array<Contact>;
    employmentType: string;
    address: Address;
    department: string;
    phoneNumber: string;
}
export interface LeaveBalance {
    sick: bigint;
    annual: bigint;
    unpaid: bigint;
    casual: bigint;
}
export interface UserProfile {
    name: string;
    role: EmployeeRole;
    employeeId?: string;
}
export enum EmployeeRole {
    hrManager = "hrManager",
    manager = "manager",
    superAdmin = "superAdmin",
    employee = "employee",
    hrStaff = "hrStaff"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    approveLeaveRequest(employeeId: string, requestId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createEmployee(details: EmployeeDetails): Promise<string>;
    generateLetter(employeeId: string, letterType: string, blobReference: ExternalBlob): Promise<void>;
    getAllEmployees(): Promise<Array<EmployeeProfile>>;
    getAllEmployeesByJoiningDate(): Promise<Array<EmployeeProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEmployee(employeeId: string): Promise<EmployeeProfile>;
    getEmployeeRecords(): Promise<Array<EmployeeRecord>>;
    getLeaveBalance(employeeId: string): Promise<LeaveBalance>;
    getLeaveRequests(employeeId: string): Promise<Array<LeaveRequest>>;
    getLetters(employeeId: string): Promise<Array<Letter>>;
    getPayslips(employeeId: string): Promise<Array<Payslip>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    registerNewEmployee(profile: EmployeeProfile): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitLeaveRequest(employeeId: string, leaveType: string, startDate: Time, endDate: Time): Promise<bigint>;
    uploadPayslip(employeeId: string, month: string, year: string, blobReference: ExternalBlob): Promise<bigint>;
}
