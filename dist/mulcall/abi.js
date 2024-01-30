"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Abi = void 0;
const ethers_1 = require("ethers");
const service_1 = require("../service");
class Abi {
    static encode(name, inputs, params) {
        try {
            const functionSignature = getFunctionSignature(name, inputs);
            const functionHash = (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(functionSignature));
            const functionData = functionHash.substring(2, 10);
            const abiCoder = new ethers_1.AbiCoder();
            const argumentString = abiCoder.encode(inputs, params);
            const argumentData = argumentString.substring(2);
            const inputData = `0x${functionData}${argumentData}`;
            return inputData;
        }
        catch (e) {
            service_1.Trace.error('Abi encode error', name, inputs, params, e);
            throw e;
        }
    }
    static decode(outputs, data) {
        try {
            const abiCoder = ethers_1.ethers.AbiCoder.defaultAbiCoder();
            let params = abiCoder.decode(outputs, data);
            const newParams = [];
            for (let i = 0; i < outputs.length; i++) {
                newParams[i] = params[i];
                const output = outputs[i];
                if (typeof output !== 'string') {
                    newParams[i] = decodeResult(output, params[i]);
                    if (output.name !== '') {
                        newParams[output.name] = newParams[i];
                    }
                }
            }
            params = outputs.length === 1 ? newParams[0] : newParams;
            params = dataToString(params);
            return params;
        }
        catch (e) {
            service_1.Trace.error('Abi decode error', outputs, data, e);
            return undefined;
        }
    }
}
exports.Abi = Abi;
// function decodeResult(param: ParamType,datas:any): any {
//   const paramTypeBytes = new RegExp(/^bytes([0-9]*)$/);
//   const paramTypeNumber = new RegExp(/^(u?int)([0-9]*)$/);
//
//   if (param.isArray()) {
//     return decodeResult(param.arrayChildren, datas);
//   }
//
//   if (param.isTuple()) {
//     return param.components.map((it,index)=>{
//       let result = {}
//       result[it.name] = decodeResult(it, datas[it.name])
//       return result
//     })
//   }
//
//   switch (param.baseType) {
//     case "address":
//       return dataToString(datas)
//     case "bool":
//       return dataToString(datas)
//     case "string":
//       return dataToString(datas)
//     case "bytes":
//       return dataToString(datas)
//     case "":
//       return dataToString(undefined)
//   }
//
//   // u?int[0-9]*
//   let match = param.type.match(paramTypeNumber);
//   if (match) {
//     return dataToString(datas)
//   }
//
//   // bytes[0-9]+
//   match = param.type.match(paramTypeBytes);
//   if (match) {
//     return dataToString(datas)
//   }
//   throw new Error("invalid type")
// }
const decodeResult = (paramType, params) => {
    if (paramType.type === 'tuple') {
        if (paramType.components) {
            const result = {};
            for (const key in paramType.components) {
                if (Object.prototype.hasOwnProperty.call(paramType.components, key)) {
                    result[paramType.components[key].name] = decodeResult(paramType.components[key], params[key]);
                    result[key] = decodeResult(paramType.components[key], params[key]);
                }
            }
            return result;
        }
    }
    if (paramType.type === 'tuple[]') {
        if (paramType.arrayChildren) {
            const result = [];
            for (const key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key)) {
                    result[key] = decodeResult(paramType.arrayChildren, params[key]);
                }
            }
            return result;
        }
    }
    return params;
};
const dataToString = (data) => {
    if (Array.isArray(data) || typeof data === 'object') {
        const result = [];
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key))
                result[key] = dataToString(data[key]);
        }
        return result;
    }
    else {
        if ((0, service_1.isNullOrUndefined)(data))
            data = undefined;
        if (typeof data === "boolean") {
            return data;
        }
        if (typeof data === "bigint") {
            return data.toString();
        }
        if (typeof data === "number") {
            return data.toString();
        }
    }
    return data;
};
function getFunctionSignature(name, inputs) {
    const types = [];
    for (const input of inputs) {
        if (input.type === 'tuple') {
            const tupleString = getFunctionSignature('', input.components);
            types.push(tupleString);
            continue;
        }
        if (input.type === 'tuple[]') {
            const tupleString = getFunctionSignature('', input.components);
            const arrayString = `${tupleString}[]`;
            types.push(arrayString);
            continue;
        }
        types.push(input.type);
    }
    const typeString = types.join(',');
    const functionSignature = `${name}(${typeString})`;
    return functionSignature;
}
