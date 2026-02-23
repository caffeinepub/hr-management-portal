import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type EmployeeDetails = {
    businessEmail : Text;
    phoneNumber : Text;
    department : Text;
    designation : Text;
    employmentType : Text;
    joiningDate : Time.Time;
    emergencyContacts : [Contact];
    address : Address;
  };

  public type Address = {
    street : Text;
    city : Text;
    state : Text;
    zipCode : Text;
    country : Text;
  };

  public type Contact = {
    name : Text;
    relationship : Text;
    phone : Text;
  };

  public type LeaveBalance = {
    annual : Nat;
    sick : Nat;
    casual : Nat;
    unpaid : Nat;
  };

  public type EmployeeRole = {
    #employee;
    #hrStaff;
    #manager;
    #hrManager;
    #superAdmin;
  };

  public type LeaveRequest = {
    requestId : Nat;
    employeeId : Text;
    leaveType : Text;
    startDate : Time.Time;
    endDate : Time.Time;
    status : Text;
  };

  public type Payslip = {
    payslipId : Nat;
    employeeId : Text;
    month : Text;
    year : Text;
    payslipDocument : Storage.ExternalBlob;
  };

  public type Letter = {
    letterId : Nat;
    employeeId : Text;
    letterType : Text;
    created : Time.Time;
    createdBy : Principal;
    document : Storage.ExternalBlob;
  };

  public type EmployeeProfile = {
    internalId : Nat;
    status : Text;
    businessEmail : Text;
    personalEmail : ?Text;
    phoneNumber : Text;
    department : Text;
    joiningDate : Time.Time;
    role : EmployeeRole;
  };

  public type UserProfile = {
    name : Text;
    employeeId : ?Text;
    role : EmployeeRole;
  };

  public type EmployeeRecord = {
    employeeId : Text;
    internalId : Nat;
    businessEmail : Text;
    phoneNumber : Text;
    department : Text;
    designation : Text;
    employmentType : Text;
    joiningDate : Time.Time;
    status : Text;
    personalEmail : ?Text;
    role : EmployeeRole;
    leaveBalance : LeaveBalance;
  };

  var nextEmployeeId = 1;
  var nextLetterId = 1;
  var nextRequestId = 1;
  var nextPayslipId = 1;

  let employees = Map.empty<Text, EmployeeProfile>();
  let leaveBalances = Map.empty<Text, LeaveBalance>();
  let leaveRequests = Map.empty<Text, [LeaveRequest]>();
  let payslips = Map.empty<Text, [Payslip]>();
  let letters = Map.empty<Text, [Letter]>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let principalToEmployeeId = Map.empty<Principal, Text>();

  module EmployeeProfile {
    public func compare(a : EmployeeProfile, b : EmployeeProfile) : Order.Order {
      Nat.compare(a.internalId, b.internalId);
    };

    public func compareByJoiningDate(a : EmployeeProfile, b : EmployeeProfile) : Order.Order {
      Text.compare(a.businessEmail, b.businessEmail);
    };
  };

  // Helper function to check if caller is HR staff or admin
  func isHROrAdmin(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (userProfiles.get(caller)) {
      case (?profile) {
        switch (profile.role) {
          case (#hrStaff or #hrManager or #superAdmin) { true };
          case (_) { false };
        };
      };
      case (null) { false };
    };
  };

  // Helper function to check if caller is manager or above
  func isManagerOrAbove(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (userProfiles.get(caller)) {
      case (?profile) {
        switch (profile.role) {
          case (#manager or #hrManager or #superAdmin) { true };
          case (_) { false };
        };
      };
      case (null) { false };
    };
  };

  // Helper function to get employee ID for a principal
  func getEmployeeIdForPrincipal(principal : Principal) : ?Text {
    principalToEmployeeId.get(principal);
  };

  // Helper function to check if employee has registered user profile
  func hasRegisteredUserProfile(employeeId : Text) : Bool {
    var found = false;
    for ((_, profile) in userProfiles.entries()) {
      switch (profile.employeeId) {
        case (?empId) {
          if (empId == employeeId) {
            found := true;
          };
        };
        case (null) {};
      };
    };
    found;
  };

  // User Profile Management (Required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);

    // Link principal to employee ID if provided
    switch (profile.employeeId) {
      case (?empId) {
        principalToEmployeeId.add(caller, empId);
      };
      case (null) {};
    };
  };

  // Employee Management
  public shared ({ caller }) func registerNewEmployee(profile : EmployeeProfile) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register new employees");
    };
    if (not isHROrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only HR staff and admins can register new employees");
    };

    let employeeId = nextEmployeeId.toText();
    nextEmployeeId += 1;

    let newProfile = {
      profile with
      internalId = nextEmployeeId;
    };
    employees.add(employeeId, newProfile);

    let initialLeaveBalance : LeaveBalance = {
      annual = 0;
      sick = 0;
      casual = 0;
      unpaid = 0;
    };
    leaveBalances.add(employeeId, initialLeaveBalance);

    employeeId;
  };

  public shared ({ caller }) func createEmployee(details : EmployeeDetails) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create employees");
    };
    if (not isHROrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only HR staff and admins can create employees");
    };

    let employeeId = nextEmployeeId.toText();
    nextEmployeeId += 1;

    let profile : EmployeeProfile = {
      internalId = nextEmployeeId;
      status = "active";
      businessEmail = details.businessEmail;
      personalEmail = null;
      phoneNumber = details.phoneNumber;
      department = details.department;
      joiningDate = details.joiningDate;
      role = #employee;
    };

    employees.add(employeeId, profile);

    let initialLeaveBalance : LeaveBalance = {
      annual = 0;
      sick = 0;
      casual = 0;
      unpaid = 0;
    };
    leaveBalances.add(employeeId, initialLeaveBalance);

    employeeId;
  };

  public query ({ caller }) func getEmployee(employeeId : Text) : async EmployeeProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view employee data");
    };

    // Allow employees to view their own profile, or HR/admin to view any
    let callerEmployeeId = getEmployeeIdForPrincipal(caller);
    let canView = switch (callerEmployeeId) {
      case (?empId) { empId == employeeId or isHROrAdmin(caller) };
      case (null) { isHROrAdmin(caller) };
    };

    if (not canView) {
      Runtime.trap("Unauthorized: Can only view your own employee profile");
    };

    switch (employees.get(employeeId)) {
      case (null) { Runtime.trap("Employee not found") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func getAllEmployees() : async [EmployeeProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view employee data");
    };
    if (not isHROrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only HR staff and admins can view all employees");
    };
    employees.values().toArray().sort();
  };

  public query ({ caller }) func getAllEmployeesByJoiningDate() : async [EmployeeProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view employee data");
    };
    if (not isHROrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only HR staff and admins can view all employees");
    };
    employees.values().toArray().sort(EmployeeProfile.compareByJoiningDate);
  };

  public query ({ caller }) func getEmployeeRecords() : async [EmployeeRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access employee records");
    };
    if (not isHROrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only HR staff and admins can access employee records");
    };

    let currentEmployees = employees.toArray();

    currentEmployees.map(
      func((empId, profile)) {
        let defaultLeaveBalance = {
          annual = 0;
          sick = 0;
          casual = 0;
          unpaid = 0;
        };

        {
          employeeId = empId;
          internalId = profile.internalId;
          businessEmail = profile.businessEmail;
          phoneNumber = profile.phoneNumber;
          department = profile.department;
          designation = "Unknown";
          employmentType = "Unknown";
          joiningDate = profile.joiningDate;
          status = profile.status;
          personalEmail = profile.personalEmail;
          role = profile.role;
          leaveBalance = switch (leaveBalances.get(empId)) {
            case (?balance) { balance };
            case (null) { defaultLeaveBalance };
          };
        };
      }
    );
  };

  // Leave Management
  public query ({ caller }) func getLeaveBalance(employeeId : Text) : async LeaveBalance {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view leave balance");
    };

    // Allow employees to view their own balance, or HR/managers to view any
    let callerEmployeeId = getEmployeeIdForPrincipal(caller);
    let canView = switch (callerEmployeeId) {
      case (?empId) { empId == employeeId or isManagerOrAbove(caller) };
      case (null) { isManagerOrAbove(caller) };
    };

    if (not canView) {
      Runtime.trap("Unauthorized: Can only view your own leave balance");
    };

    switch (leaveBalances.get(employeeId)) {
      case (null) { Runtime.trap("Leave balance not found") };
      case (?balance) { balance };
    };
  };

  public shared ({ caller }) func submitLeaveRequest(employeeId : Text, leaveType : Text, startDate : Time.Time, endDate : Time.Time) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit leave requests");
    };

    // Verify caller is submitting for their own employee ID
    let callerEmployeeId = getEmployeeIdForPrincipal(caller);
    switch (callerEmployeeId) {
      case (?empId) {
        if (empId != employeeId) {
          Runtime.trap("Unauthorized: Can only submit leave requests for yourself");
        };
      };
      case (null) {
        Runtime.trap("Unauthorized: No employee ID associated with your account");
      };
    };

    let requestId = nextRequestId;
    nextRequestId += 1;

    let leaveRequest : LeaveRequest = {
      requestId;
      employeeId;
      leaveType;
      startDate;
      endDate;
      status = "submitted";
    };

    let existingRequests = switch (leaveRequests.get(employeeId)) {
      case (null) { [] };
      case (?requests) { requests };
    };
    leaveRequests.add(employeeId, existingRequests.concat([leaveRequest]));

    requestId;
  };

  public query ({ caller }) func getLeaveRequests(employeeId : Text) : async [LeaveRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view leave requests");
    };

    // Allow employees to view their own requests, or HR/managers to view any
    let callerEmployeeId = getEmployeeIdForPrincipal(caller);
    let canView = switch (callerEmployeeId) {
      case (?empId) { empId == employeeId or isManagerOrAbove(caller) };
      case (null) { isManagerOrAbove(caller) };
    };

    if (not canView) {
      Runtime.trap("Unauthorized: Can only view your own leave requests");
    };

    switch (leaveRequests.get(employeeId)) {
      case (?requests) { requests };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func approveLeaveRequest(employeeId : Text, requestId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can approve leave requests");
    };
    if (not isManagerOrAbove(caller)) {
      Runtime.trap("Unauthorized: Only managers and HR staff can approve leave requests");
    };

    let requests = switch (leaveRequests.get(employeeId)) {
      case (null) { Runtime.trap("No leave requests found") };
      case (?reqs) { reqs };
    };

    let updatedRequests = requests.map(
      func(request) {
        if (request.requestId == requestId) {
          { request with status = "approved" };
        } else {
          request;
        };
      }
    );
    leaveRequests.add(employeeId, updatedRequests);
  };

  // Payroll Management
  public shared ({ caller }) func uploadPayslip(employeeId : Text, month : Text, year : Text, blobReference : Storage.ExternalBlob) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload payslips");
    };
    if (not isHROrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only HR staff and admins can upload payslips");
    };

    let payslipId = nextPayslipId;
    nextPayslipId += 1;

    let payslipRecord : Payslip = {
      payslipId;
      employeeId;
      month;
      year;
      payslipDocument = blobReference;
    };

    let existingPayslips = switch (payslips.get(employeeId)) {
      case (null) { [] };
      case (?slips) { slips };
    };
    payslips.add(employeeId, existingPayslips.concat([payslipRecord]));

    payslipId;
  };

  public query ({ caller }) func getPayslips(employeeId : Text) : async [Payslip] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payslips");
    };

    // Allow employees to view their own payslips, or HR/admin to view any
    let callerEmployeeId = getEmployeeIdForPrincipal(caller);
    let canView = switch (callerEmployeeId) {
      case (?empId) { empId == employeeId or isHROrAdmin(caller) };
      case (null) { isHROrAdmin(caller) };
    };

    if (not canView) {
      Runtime.trap("Unauthorized: Can only view your own payslips");
    };

    switch (payslips.get(employeeId)) {
      case (?records) { records };
      case (null) { [] };
    };
  };

  // HR Letters Management
  public shared ({ caller }) func generateLetter(employeeId : Text, letterType : Text, blobReference : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate letters");
    };
    if (not isHROrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only HR staff and admins can generate letters");
    };

    let letterRecord : Letter = {
      letterId = nextLetterId;
      employeeId;
      letterType;
      created = Time.now();
      createdBy = caller;
      document = blobReference;
    };
    nextLetterId += 1;

    let existingLetters = switch (letters.get(employeeId)) {
      case (null) { [] };
      case (?docs) { docs };
    };
    letters.add(employeeId, existingLetters.concat([letterRecord]));
  };

  public query ({ caller }) func getLetters(employeeId : Text) : async [Letter] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view letters");
    };

    // Allow employees to view their own letters, or HR/admin to view any
    let callerEmployeeId = getEmployeeIdForPrincipal(caller);
    let canView = switch (callerEmployeeId) {
      case (?empId) { empId == employeeId or isHROrAdmin(caller) };
      case (null) { isHROrAdmin(caller) };
    };

    if (not canView) {
      Runtime.trap("Unauthorized: Can only view your own letters");
    };

    switch (letters.get(employeeId)) {
      case (?records) { records };
      case (null) { [] };
    };
  };
};
