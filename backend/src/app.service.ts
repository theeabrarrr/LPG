import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'LPG Enterprise ERP + Field Operations System API';
  }
}
