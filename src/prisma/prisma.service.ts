import { Injectable } from '@nestjs/common';
import { db } from './db';

@Injectable()
export class PrismaService {
  client = db;
}