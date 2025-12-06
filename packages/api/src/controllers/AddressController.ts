import { Request, Response } from 'express';
import { IAddressController } from '../interfaces/controllers/IAddressController';
import { IAddressService } from '../interfaces/services/IAddressService';

/**
 * Address Controller Implementation
 * Follows ISP: Only implements IAddressController (HTTP operations)
 */
export class AddressController implements IAddressController {
  constructor(private readonly addressService: IAddressService) {}

  async getAddress(req: Request, res: Response): Promise<void> {
    try {
      const address = req.params.address;

      // Validate address format
      if (!this.isValidAddress(address)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Invalid address format',
          },
        });
        return;
      }

      const addressData = await this.addressService.getAddress(address);

      if (!addressData) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Address not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: addressData,
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

  async getAddressBalance(req: Request, res: Response): Promise<void> {
    try {
      const address = req.params.address;

      // Validate address format
      if (!this.isValidAddress(address)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Invalid address format',
          },
        });
        return;
      }

      const balance = await this.addressService.getAddressBalance(address);

      res.status(200).json({
        success: true,
        data: { balance: balance.toString() },
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

  async getAddressTransactions(req: Request, res: Response): Promise<void> {
    try {
      const address = req.params.address;

      // Validate address format
      if (!this.isValidAddress(address)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Invalid address format',
          },
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const type = (req.query.type as 'sent' | 'received' | 'all') || 'all';

      const transactions = await this.addressService.getAddressTransactions(address, limit, type);

      res.status(200).json({
        success: true,
        data: { transactions },
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

  private isValidAddress(address: string): boolean {
    const addressRegex = /^0x[0-9a-fA-F]{40}$/;
    return addressRegex.test(address);
  }
}

