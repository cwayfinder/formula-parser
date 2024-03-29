import { isNumber } from './utils';

export type TokenType =
  'LPAREN' | 'RPAREN' | 'COMMA' |  // Single-character
  'LBRACKET' | 'RBRACKET' | // Single-character
  'LBRACE' | 'RBRACE' | 'COLON' | // Single-character
  'FUNCVAR' | 'VALUE' |  // Entities
  'EOF';  // Misc


export class Token {
  type: TokenType;
  value: any;
  column: number;
  line: string;

  constructor(type: TokenType, value: any = '', column: number = -1, line: string = '') {
    this.type = type;
    this.column = column;
    this.line = line;

    // Check if value is boolean
    if (value.toLowerCase() === 'true') {
      this.value = true;
    } else if (value.toLowerCase() === 'false') {
      this.value = false;
    }

    // Check if value is number
    else if (isNumber(value)) {
      this.value = Number(value);
    }

    // Otherwise save value without quotes
    else {
      this.value = value.replace(/((^'|'$)|(?:^"|"$))/g, '');
    }
  }
}
