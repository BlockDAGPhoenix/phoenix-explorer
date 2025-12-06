import { Request, Response } from 'express';

/**
 * Search Controller Interface (ISP: HTTP operations only)
 */
export interface ISearchController {
  search(req: Request, res: Response): Promise<void>;
}

