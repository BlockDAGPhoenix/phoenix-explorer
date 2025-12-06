import { Request, Response } from 'express';
import { ISearchController } from '../interfaces/controllers/ISearchController';
import { ISearchService } from '../interfaces/services/ISearchService';

/**
 * Search Controller Implementation
 * Follows ISP: Only implements ISearchController (HTTP operations)
 */
export class SearchController implements ISearchController {
  constructor(private readonly searchService: ISearchService) {}

  async search(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;

      if (!query) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Query parameter "q" is required',
          },
        });
        return;
      }

      const results = await this.searchService.search(query);

      res.status(200).json({
        success: true,
        data: { results },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error',
        },
      });
    }
  }
}

