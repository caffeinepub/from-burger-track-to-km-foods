import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface StaffRecord {
    staffId: string;
    role: Role;
    fullName: string;
    isActive: boolean;
}
export type Time = bigint;
export interface AttendanceRecord {
    staffId: string;
    date: Time;
    shift: Shift;
    signInTime: Time;
    signOutTime?: Time;
}
export interface FinancialRecord {
    onlineSales: bigint;
    date: Time;
    expenses: bigint;
    shift: Shift;
    cashSales: bigint;
}
export interface UserProfile {
    staffId?: string;
    name: string;
}
export enum Role {
    manager = "manager",
    staff = "staff"
}
export enum Shift {
    morning = "morning",
    evening = "evening"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addStaff(staffId: string, fullName: string, role: Role): Promise<boolean>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deactivateStaff(staffId: string): Promise<void>;
    getAllStaff(): Promise<Array<StaffRecord>>;
    getAttendanceByDate(date: Time): Promise<Array<AttendanceRecord>>;
    getAttendanceByStaff(staffId: string): Promise<Array<AttendanceRecord>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFinancialRecordsByRange(startDate: Time, endDate: Time): Promise<Array<FinancialRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    recordSignIn(staffId: string, date: Time, shift: Shift): Promise<void>;
    recordSignOut(staffId: string, date: Time): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateFinancialRecord(date: Time, shift: Shift, cashSales: bigint, onlineSales: bigint, expenses: bigint): Promise<void>;
}
