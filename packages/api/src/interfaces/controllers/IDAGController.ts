import { Request, Response } from 'express';

/**
 * DAG Controller Interface (ISP: HTTP operations only)
 */
export interface IDAGController {
  getBlockDAGInfo(req: Request, res: Response): Promise<void>;
  getBlockParents(req: Request, res: Response): Promise<void>;
  getBlockChildren(req: Request, res: Response): Promise<void>;
}

