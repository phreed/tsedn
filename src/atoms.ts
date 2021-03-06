
import * as _ from "lodash";

export class Prim {
	protected val: any;

	constructor(val?: any) {
		if (!(val instanceof Array)) {
			this.val = val;
			return;
		}
		this.val = () => {
			let result = [];
			for (let ix = 0, len = val.length; ix < len; ix++) {
				let x = val[ix];
				if (!(x instanceof Discard)) {
					result.push(x);
				}
			}
			return result;
		};
	}
	value() {
		return this.val;
	};

	toString() {
		return JSON.stringify(this.val);
	};

}

export class BigInt extends Prim {
	constructor(val: any) {
		super(val);
	}
	ednEncode() { return this.val; }
	jsEncode() { return this.val; }
	jsonEncode() { return { BigInt: this.val }; }
}

export class StringObj extends Prim {

	constructor(val: string) {
		super(val);
	}
	toString(): string { return this.val; }
	is(test: string) {
		return this.val === test;
	}
}

export const charMap: { [key: string]: string } = {
	newline: "\n",
	"return": "\r",
	space: " ",
	tab: "\t",
	formfeed: "\f"
};

export class Char extends StringObj {
	constructor(val: string) {
		super(val);
		if (charMap[val] || val.length === 1) {
			this.val = val;
		} else {
			throw `Char may only be newline, return, space, tab, formfeed or a single character - you gave [${val}]`;
		}
	}
	ednEncode() {
		return `\\${this.val}`;
	}
	jsEncode() {
		return charMap[this.val] || this.val;
	}
	jsonEncode() {
		return {
			Char: this.val
		};
	};

}

export class Discard {
	constructor() {
	}
}

const validRegexSymbols = /[0-9A-Za-z.*+!\-_?$%&=:#/]+/;
const invalidFirstCharsSymbols = [":", "#", "/"];

export class Symbol extends Prim {
	private ns: null | string;
	private name: string;

	constructor(...val: any[]) {
		super(val);

		let args = (1 <= val.length) ? _.slice(val, 0) : [];
		switch (args.length) {
			case 1:
				if (args[0] === "/") {
					this.ns = null;
					this.name = "/";
				} else {
					let parts = args[0].split("/");
					if (parts.length === 1) {
						this.ns = null;
						this.name = parts[0];
						if (this.name === ":") {
							throw "can not have a symbol of only :";
						}
					} else if (parts.length === 2) {
						this.ns = parts[0];
						if (this.ns === "") {
							throw "can not have a slash at start of symbol";
						}
						if (this.ns === ":") {
							throw "can not have a namespace of :";
						}
						this.name = parts[1];
						if (this.name.length === 0) {
							throw "symbol may not end with a slash.";
						}
					} else {
						throw "Can not have more than 1 forward slash in a symbol";
					}
				}
				break;
			case 2:
				this.ns = args[0];
				this.name = args[1];
		}
		if (this.name.length === 0) {
			throw "Symbol can not be empty";
		}
		this.val = "" + (this.ns ? "" + this.ns + "/" : "") + this.name;
		this.valid(this.val);
	}

	valid(word: string) {
		let _ref0;
		if (((_ref0 = word.match(validRegexSymbols)) != null ? _ref0[0] : void 0) !== word) {
			throw "provided an invalid symbol " + word;
		}
		if (word.length === 1 && word[0] !== "/") {
			let _ref1;
			if (_ref1 = word[0], _.indexOf(invalidFirstCharsSymbols, _ref1) >= 0) {
				throw "Invalid first character in symbol " + word[0];
			}
		}
		let _ref2;
		if (((_ref2 = word[0]) === "-" || _ref2 === "+" || _ref2 === ".") && (word[1] != null) && word[1].match(/[0-9]/)) {
			throw "If first char is " + word[0] + " the second char can not be numeric. You had " + word[1];
		}
		if (word[0].match(/[0-9]/)) {
			throw "first character may not be numeric. You provided " + word[0];
		}
		return true;
	};
	toString(): string {
		return this.val;
	};
	ednEncode(): any {
		return this.val;
	}
	jsEncode(): any {
		return this.val;
	}
	jsonEncode(): any {
		return {
			Symbol: this.val
		};
	};
}


// const invalidFirstCharsKeyword = ["#", "/"];
export class Keyword extends Symbol {

	constructor(val: string) {
		super(val);
		if (this.val[0] !== ":") {
			throw "keyword must start with a :";
		}
		if ((this.val[1] != null) && this.val[1] === "/") {
			throw "keyword can not have a slash without a namespace";
		}
	}
	jsonEncode(): any {
		return {
			Keyword: this.val
		};
	};
}

export const char = _.memoize(Char);
export const kw = _.memoize(Keyword);
export const sym = _.memoize(Symbol);
export const bigInt = _.memoize(BigInt);
