export type RequestWithUser = Request & {
  user?: {
    id: string;
    requestLimit: number;
  };
};
