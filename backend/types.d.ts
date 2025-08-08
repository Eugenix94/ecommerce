import 'express-session';
import 'express';

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    isAuthenticated?: () => boolean;
    user?: Express.User;
    logout?: (callback: (err?: any) => void) => void;
    session?: any;
  }
}

export {};
