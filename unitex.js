
import Parser from './src/parsec.js'

import Unicode from './src/utils/unicode.js'

import Binary from './src/macro/binary.js'
import Unary from './src/macro/unary.js'
import Fixed from './src/macro/fixed.js'
import Environment from './src/macro/environment.js'



const token = predicate => new Parser(
  source => source.length > 0
    ? predicate(source[0])
      ? [source[0], source.substring(1)]
      : undefined
    : undefined
)
const character = char => token(x => x == char)

const string = str => new Parser(
  source => source.length > 0
    ? source.startsWith(str)
      ? [str, source.substring(str.length)]
      : undefined
    : undefined
)

const digit = token(x => x.boundedIn('0', '9'))


/*
const digits = digit.plus()

const add = digits.follow(token(x => x == '+')).follow(digits)
console.log(add.parse('10+33*2'))



*/


const letter = token(Unicode.isLetter)
const letters = letter.plus()


const backslash = character('\\')

const lbrace = character('{')
const rbrace = character('}')
const braceWrap = x => lbrace.follow(x).skip(rbrace).second()

const space = character(' ')
const spacea = space.asterisk()
// const spaces = space.plus()

const loose = x => spacea.follow(x).second()
const single = digit.or(letter).or(() => fixedMacro)
const value = loose(single.or(braceWrap(() => text)))




const macroName = letters.or(lbrace).or(rbrace).or(backslash)
  .or(token(x => x == ',' || x == '.' || x == '\\'))

const macroh = backslash.follow(macroName).second()
const fixedMacro = macroh.and(x => Fixed[x]).map(x => Fixed[x]) // `\\${x}`
// [macro, value]
const unaryMacro = macroh.and(x => Unary[x])
  .follow(value)
  .map(xs => Unary[xs[0]](xs[1]))
// [[macro, value1], value2]
const binaryMacro = macroh.and(x => Binary[x])
  .follow(value)
  .follow(value)
  .map(xs => Binary[xs[0][0]](xs[0][1], xs[1]))

const special = x => x == '\\'
  || x == '{' || x == '}'
  || x == '_' || x == '^'

const envira = braceWrap(letters)
const begin = backslash.skip(string('begin')).follow(envira).second()
const end = backslash.skip(string('end')).follow(envira).second()
// [[begin, text], end]
const environ = begin.follow(() => section).follow(end)
  .and(xs => xs[0][0] == xs[1])
  .map(xs => Environment[xs[1]](xs[0][1].filter((x, i) => !(i % 2))))

const unknownMacro = macroh.map(x => '\\' + x)

const supscript = character('^').follow(value).second()
  .map(x => Unicode.supscripts[x] || '^' + x)

const subscript = character('_').follow(value).second()
  .map(x => Unicode.subscripts[x] || '_' + x)

const simplex = supscript.or(subscript)

const element = token(x => !special(x)).plus()
  .or(simplex)
  .or(fixedMacro)
  .or(unaryMacro)
  .or(binaryMacro)
  .or(environ)
  .or(unknownMacro)

const text = element.plus()
const section = element.some()


// console.log(value.parse('ab'))

// console.log(environ.some().parse(String.raw`\begin{bmatrix}
//   a & b \\
//   c & d
// \end{bmatrix}\begin{bmatrix} 0 & 1 \end{bmatrix}
// `
// ))

// 1 \rarr 2\pi\id i\cdot\Z \rarr \C \rarr \C^\times \rarr 1, 
// 1+\dfrac a{b+\frac12}



import fs from 'fs'

const read = path => fs.readFileSync(path, 'utf8')
const state = text.parse(read('./test/field.tex'))

state && console.log(state[0])
// console.log(text.parse(read('./test/abs-galois-group.tex')))



