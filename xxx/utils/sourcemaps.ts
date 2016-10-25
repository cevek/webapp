const charToInteger = {};
const integerToChar = {};

'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split('').forEach(function (char, i) {
    charToInteger[char/*.codePointAt(0)*/] = i;
    integerToChar[i] = char/*.codePointAt(0)*/;
});

export function sourcemapDiffCalc(str: string) {
    const len = str.length;
    let shift = 0;
    let value = 0;
    let fieldN = 0;
    let genLine = 0;
    let genCol = 0;
    let filePos = 0;
    let line = 0;
    let col = 0;
    let named = 0;
    let segments = 1;
    let integer: number;
    let hasContinuationBit: number;
    let sym: string;
    let shouldNegate: number;
    
    
    for (let i = 0; i < len; i++) {
        sym = str[i];
        if (sym === ';' || sym === ',') {
            segments++;
            shift = 0;
            value = 0;
            fieldN = 0;
            if (sym === ';') {
                genLine++;
                genCol = 0;
            }
            continue;
        }
        integer = charToInteger[str[i]];
        
        hasContinuationBit = integer & 32;
        
        integer &= 31;
        value += integer << shift;
        
        if (hasContinuationBit) {
            shift += 5;
        } else {
            shouldNegate = value & 1;
            value >>= 1;
            value = shouldNegate ? -value : value;
            switch (fieldN) {
                case 0:
                    genCol += value;
                    break;
                case 1:
                    filePos += value;
                    break;
                case 2:
                    line += value;
                    break;
                case 3:
                    col += value;
                    break;
                case 4:
                    named += value;
                    break;
            }
            
            fieldN++;
            // reset
            value = shift = 0;
        }
    }
    return {genLine, genCol, filePos, line, col, named, segments};
}


export function encode(value: number | number[]) {
    let result: string;
    let i: number;
    
    if (typeof value === 'number') {
        result = encodeInteger(value);
    } else {
        result = '';
        for (i = 0; i < value.length; i += 1) {
            result += encodeInteger(value[i]);
        }
    }
    
    return result;
}

function encodeInteger(num: number) {
    let result = '';
    let clamped: number;
    
    if (num < 0) {
        num = ( -num << 1 ) | 1;
    } else {
        num <<= 1;
    }
    do {
        clamped = num & 31;
        num >>= 5;
        
        if (num > 0) {
            clamped |= 32;
        }
        
        result += integerToChar[clamped];
    } while (num > 0);
    
    return result;
}
