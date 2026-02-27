import { promises as fs } from 'fs';
import * as path from 'path';

export interface WordList {
  addWord(word: string): Promise<void>;
  getWords(): Promise<string[]>;
}

export class FileWordList implements WordList {
  private readonly filename: string;

  constructor(filename: string) {
    this.filename = filename;
  }

  async addWord(word: string): Promise<void> {
    await fs.appendFile(this.filename, word, { encoding: 'utf8' });
  }

  async getWords(): Promise<string[]> {
    const abs = path.resolve(this.filename);
    const data = await fs.readFile(abs, { encoding: 'utf8' });
    return data.toLowerCase().split('\n'); //.slice(0, 100000);
  }
}
