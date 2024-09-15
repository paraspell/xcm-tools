export interface RequestWithUser extends Request {
  user?: {
    id: string;
    requestLimit: number;
  };
}
