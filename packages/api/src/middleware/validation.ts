import { Request, Response, NextFunction } from 'express';

export function validateBlockNumber(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const blockNumber = req.params.blockNumber;

  if (!blockNumber || !/^\d+$/.test(blockNumber)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PARAMETER',
        message: 'Invalid block number format',
      },
    });
    return;
  }

  next();
}

export function validateBlockHash(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const hash = req.params.hash || req.params.blockHash;

  if (!hash || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PARAMETER',
        message: 'Invalid block hash format',
      },
    });
    return;
  }

  next();
}

export function validateTransactionHash(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const hash = req.params.hash;

  if (!hash || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PARAMETER',
        message: 'Invalid transaction hash format',
      },
    });
    return;
  }

  next();
}

export function validateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const limitStr = req.query.limit as string;

  if (limitStr) {
    const limit = parseInt(limitStr, 10);

    if (isNaN(limit) || limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Limit must be between 1 and 100',
        },
      });
      return;
    }
  }

  next();
}
