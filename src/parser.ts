import { Token, TokenType } from './token';
import {
  ASTArrayNode,
  ASTFunctionNode,
  ASTNode,
  ASTObjectNode,
  ASTValueNode,
  ASTVariableNode
} from './node';

export class Parser {
  tokens: Token[] = [];
  index = 0;
  flexible = false;

  parse(tokens: Token[], flexible = false): ASTNode {
    /* Set global class states */
    this.tokens = tokens;
    this.index = 0;
    this.flexible = flexible;

    return this.buildFormula();
  }

  private getCurrentToken(): Token {
    return this.tokens[this.index];
  }

  // Return next token
  private peekToken(): Token | undefined {
    const advancedIndex: number = this.index + 1;
    return (advancedIndex < this.tokens.length) ? this.tokens[advancedIndex] : undefined;
  }

  private unexpectedTokenMessage(): string {
    throw new SyntaxError((
      `Unexpected "${this.getCurrentToken().value}"\n` +
      `formula ${this.getCurrentToken().line}\n` +
      `       ${' '.repeat(this.getCurrentToken().column)}^`
    ));
  }

  // Compare current token type with a TYPE, if matchs, advance to next token, otherwise raise exception
  private eat(type: TokenType): void {
    if (this.getCurrentToken().type === type) {
      this.index += 1;
    } else {
      throw new SyntaxError(this.unexpectedTokenMessage());
    }
  }

  // Same as eat() but optionally flexible with token TYPE
  // also returns bool if current token was eaten or not
  private flexibleEat(type: TokenType): boolean {
    let wasEaten: boolean;

    if (this.flexible) {
      try {
        this.eat(type);
        wasEaten = true;
      } catch {
        wasEaten = false;
      }
    } else {
      this.eat(type);
      wasEaten = true;
    }

    return wasEaten;
  }

  // Build Formula AST node formula : EQUAL entity EOF
  private buildFormula(): ASTNode {
    const entity = this.buildEntity();
    this.eat('EOF');
    return entity;
  }

  // Build ASTFunctionNode AST node function : FUNCTION LPAREN (entity COMMA?)+ RPAREN
  private buildFunction(): ASTFunctionNode {
    const functionName: string = this.getCurrentToken().value;

    this.eat('FUNCVAR');
    this.eat('LPAREN');

    const args: ASTNode[] = [];
    do {
      if (this.getCurrentToken().type === 'COMMA') {
        this.eat('COMMA');
      }
      if (this.flexible && this.getCurrentToken().type === 'EOF') {
        break;
      }
      if (this.getCurrentToken().type === 'RPAREN') {
        break;
      }
      args.push(this.buildEntity());
    } while (this.getCurrentToken().type === 'COMMA');

    const closed: boolean = this.flexibleEat('RPAREN');

    return { type: 'function', name: functionName, args, closed };
  }

  // Build ASTFunctionNode AST node entity : (function|variable|value)
  private buildEntity(): ASTNode {
    switch (this.getCurrentToken().type) {
      case 'FUNCVAR':
        return (this.peekToken()?.type == 'LPAREN') ? this.buildFunction() : this.buildVariable();
      case 'VALUE':
        return this.buildValue();
      case 'LBRACKET':
        return this.buildArray();
      case 'LBRACE':
        return this.buildObject();
      default:
        throw new SyntaxError(this.unexpectedTokenMessage());
    }
  }

  private buildVariable(): ASTVariableNode {
    const variable = this.getCurrentToken().value;
    this.eat('FUNCVAR');
    return { type: 'variable', name: variable };
  }

  private buildValue(): ASTValueNode {
    const value = this.getCurrentToken().value;
    this.eat('VALUE');
    return { type: 'value', value };
  }

  private buildArray(): ASTArrayNode {
    this.eat('LBRACKET');

    const items: ASTNode[] = [];
    do {
      if (this.getCurrentToken().type === 'COMMA') {
        this.eat('COMMA');
      }
      if (this.flexible && this.getCurrentToken().type === 'EOF') {
        break;
      }
      if (this.getCurrentToken().type === 'RBRACKET') {
        break;
      }
      items.push(this.buildEntity());
    } while (this.getCurrentToken().type === 'COMMA');

    const closed: boolean = this.flexibleEat('RBRACKET');

    return { type: 'array', items: items, closed: closed };
  }

  protected buildObject(): ASTObjectNode {
    this.eat('LBRACE');

    const properties: { key: ASTNode; value: ASTNode }[] = [];
    do {
      if (this.getCurrentToken().type === 'COMMA') {
        this.eat('COMMA');
      }
      if (this.flexible && this.getCurrentToken().type === 'EOF') {
        break;
      }
      if (this.getCurrentToken().type === 'RBRACKET') {
        break;
      }
      const key: ASTNode = this.buildEntity();
      this.eat('COLON');
      const value: ASTNode = this.buildEntity();
      properties.push({ key: key, value: value});
    } while (this.getCurrentToken().type === 'COMMA');

    const closed: boolean = this.flexibleEat('RBRACE');

    return { type: 'object', properties: properties, closed: closed }
  }
}
