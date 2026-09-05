import { Injectable } from "@nestjs/common";
import { passwordRequirements } from "@clinic/types";
import * as bcrypt from "bcrypt";
import { securityError } from "../security-error";

@Injectable()
export class PasswordPolicyService {
  async hash(password: string) {
    if (!Object.values(passwordRequirements(password)).every(Boolean))
      securityError("weakPassword");
    return bcrypt.hash(password, 12);
  }
}
