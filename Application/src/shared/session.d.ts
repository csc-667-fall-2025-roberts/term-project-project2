import "express-session";
import { User } from "../types/types.d";

declare module "express-session" {
  interface SessionData {
    user?: User;
  }
}
