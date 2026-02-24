import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Type Definitions
  type Role = { #staff; #manager };

  type Shift = { #morning; #evening };

  type StaffRecord = {
    staffId : Text;
    fullName : Text;
    role : Role;
    isActive : Bool;
  };

  type AttendanceRecord = {
    staffId : Text;
    date : Time.Time;
    shift : Shift;
    signInTime : Time.Time;
    signOutTime : ?Time.Time;
  };

  type FinancialRecord = {
    date : Time.Time;
    shift : Shift;
    cashSales : Nat;
    onlineSales : Nat;
    expenses : Nat;
  };

  type UserProfile = {
    name : Text;
    staffId : ?Text;
  };

  module AttendanceRecord {
    public func compare(a : AttendanceRecord, b : AttendanceRecord) : Order.Order {
      switch (Int.compare(a.date, b.date)) {
        case (#equal) { Text.compare(a.staffId, b.staffId) };
        case (other) { other };
      };
    };
  };

  // Persistent Data
  let staffMap = Map.empty<Text, StaffRecord>();
  let attendanceMap = Map.empty<Text, AttendanceRecord>();
  let financialMap = Map.empty<Text, FinancialRecord>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
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
  };

  // Staff Management Functions (admin-only: only managers should add/deactivate staff)
  public shared ({ caller }) func addStaff(staffId : Text, fullName : Text, role : Role) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can manage staff");
    };
    let record : StaffRecord = {
      staffId;
      fullName;
      role;
      isActive = true;
    };
    staffMap.add(staffId, record);
    true;
  };

  public shared ({ caller }) func deactivateStaff(staffId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can deactivate staff");
    };
    switch (staffMap.get(staffId)) {
      case (null) { Runtime.trap("Staff not found") };
      case (?record) {
        let updated : StaffRecord = { record with isActive = false };
        staffMap.add(staffId, updated);
      };
    };
  };

  public query ({ caller }) func getAllStaff() : async [StaffRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view staff");
    };
    staffMap.values().toArray();
  };

  // Attendance Functions (user-level: authenticated staff record their own attendance)
  public shared ({ caller }) func recordSignIn(
    staffId : Text,
    date : Time.Time,
    shift : Shift,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record attendance");
    };
    let record : AttendanceRecord = {
      staffId;
      date;
      shift;
      signInTime = Time.now();
      signOutTime = null;
    };
    let key = staffId.concat(date.toText());
    attendanceMap.add(key, record);
  };

  public shared ({ caller }) func recordSignOut(staffId : Text, date : Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record attendance");
    };
    let key = staffId.concat(date.toText());
    switch (attendanceMap.get(key)) {
      case (null) { Runtime.trap("Attendance record not found") };
      case (?record) {
        let updated : AttendanceRecord = { record with signOutTime = ?Time.now() };
        attendanceMap.add(key, updated);
      };
    };
  };

  public query ({ caller }) func getAttendanceByStaff(staffId : Text) : async [AttendanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance");
    };
    let filtered = List.empty<AttendanceRecord>();
    for (record in attendanceMap.values()) {
      if (record.staffId == staffId) {
        filtered.add(record);
      };
    };
    filtered.toArray().sort();
  };

  public query ({ caller }) func getAttendanceByDate(date : Time.Time) : async [AttendanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance");
    };
    let filtered = List.empty<AttendanceRecord>();
    for (record in attendanceMap.values()) {
      if (record.date == date) {
        filtered.add(record);
      };
    };
    filtered.toArray().sort();
  };

  // Financial Records Functions (admin-only: only managers should update financial data)
  public shared ({ caller }) func updateFinancialRecord(
    date : Time.Time,
    shift : Shift,
    cashSales : Nat,
    onlineSales : Nat,
    expenses : Nat,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update financial records");
    };
    let record : FinancialRecord = {
      date;
      shift;
      cashSales;
      onlineSales;
      expenses;
    };
    let shiftText = switch (shift) {
      case (#morning) { "morning" };
      case (#evening) { "evening" };
    };
    let key = date.toText().concat(shiftText);
    financialMap.add(key, record);
  };

  public query ({ caller }) func getFinancialRecordsByRange(
    startDate : Time.Time,
    endDate : Time.Time,
  ) : async [FinancialRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view financial records");
    };
    let filtered = List.empty<FinancialRecord>();
    for (record in financialMap.values()) {
      if (record.date >= startDate and record.date <= endDate) {
        filtered.add(record);
      };
    };
    filtered.toArray();
  };
};
