export type UserRole = "student" | "instructor" | "registrar";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  mustChangePassword?: boolean;
}

export interface AuthCredentialRecord extends AuthUser {
  password: string;
}
