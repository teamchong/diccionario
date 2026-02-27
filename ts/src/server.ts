import express, { Request, Response } from 'express';
import { FileWordList, WordList } from './wordlist.js';

export interface ExistsResponse {
  exists: boolean;
}

export interface MatchesResponse {
  matches: string[];
}

export interface AddRequest {
  word: string;
}

export class Server {
  readonly app = express();
  private readonly w: WordList;

  constructor(wordList?: WordList) {
    this.w = wordList ?? new FileWordList('/words.txt');

    this.app.use(express.json());

    this.app.get('/ping', (_req: Request, res: Response) => {
      res.status(200).json({ message: 'pong' });
    });

    this.app.get('/exists/:word', this.wordExists.bind(this));
    this.app.post('/add', this.add.bind(this));
    this.app.get('/matches/:prefix', this.matches.bind(this));
  }

  // Returns true if the word exists in the word list.
  // It performs case insensitive matching to the words in the wordlist.
  /*
  Expected functionality:

It returns a 200 upon success
It returns other status codes as appropriate (4XXs for input errors, 5XXs for internal server errors)
The response body is a JSON object with a single field exists of type boolean
Example: { "exists": true }
It performs case insensitive matching to the words in the wordlist
It only returns true if the word exists (exactly matches)in the wordlist
*/
  private async wordExists(req: Request, res: Response): Promise<void> {
    try {
      const word = req.params.word;

      let wordlist: string[];
      try {
        wordlist = await this.w.getWords();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown error';
        res.status(500).send(msg);
        return;
      }

      const resp: ExistsResponse = { exists: false };

      for (const w of wordlist) {
        if (w.toLowerCase() === word.toLowerCase()) {
          resp.exists = true;
        }
      }

      res.status(200).json(resp);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      res.status(500).send(msg);
      return;
    }
  }

  // Returns a list of words that matched the given prefix.
  // It performs case insensitive matching to the words in the wordlist.
  private async matches(req: Request, res: Response): Promise<void> {
    const prefix = req.params.prefix.toLowerCase();
    
    if (!prefix) {
      res.status(400).send('prefix is empty');
      return;
    }

    let wordlist: string[];
    try {
      wordlist = await this.w.getWords();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      res.status(500).send(msg);
      return;
    }

    const resp: MatchesResponse = { matches: [] };

    // for (const w of wordlist) {
    //   if (w.toLowerCase().startsWith(prefix)) {
    //     resp.matches.push(w);
    //   }
    // }
    resp.matches = wordlist.filter(w => w.startsWith(prefix));

    res.status(200).json(resp);
  }

  // Add a new word to the word list.
  private async add(req: Request, res: Response): Promise<void> {
    let body: AddRequest;
    try {
      body = req.body as AddRequest;
      if (typeof body.word !== 'string' || !body.word || !/[a-z]/i.test(body.word)) {
        res.status(400).send('bad request');
        return;
      }

      let wordlist: string[];
      try {
        wordlist = await this.w.getWords();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown error';
        res.status(500).send(msg);
        return;
      }

      if (wordlist.includes(body.word)) {
        res.status(409).send('word already exists');
        return;
      }

      await this.w.addWord(body.word);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'invalid body';
      res.status(500).send(msg);
      return;
    }

    res.status(204).json({ word: body.word });
  }
}

export function createServer(wordList?: WordList) {
  const server = new Server(wordList);
  return server.app;
}
