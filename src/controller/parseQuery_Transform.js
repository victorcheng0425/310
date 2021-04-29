"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const checkQuery_Transformation_1 = require("./checkQuery_Transformation");
const decimal_js_1 = require("decimal.js");
let mainKeylist = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
let mfieldlist = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
let sfieldlist = ["dept", "title", "instructor", "uuid", "id", "fullname", "shortname", "number", "name",
    "dept", "address", "type", "furniture", "href"];
let optionlist = ["COLUMNS", "ORDER"];
let logiclist = ["AND", "OR"];
let mcomparator = ["LT", "GT", "EQ"];
let scomparison = ["IS"];
let negation = ["NOT"];
let direction = ["UP", "DOWN"];
let transformations = ["GROUP", "APPLY"];
let applytoken = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
let sortkey = ["dir", "keys"];
function parseTransformation(result, transform) {
    Util_1.default.trace("parseTransformation");
    let applyrule = transform["APPLY"];
    let hashmap = [];
    let grouplist = checkQuery_Transformation_1.extractGroup;
    for (let section of result) {
        let hashkey = "";
        let exist = false;
        for (let groupVal of grouplist) {
            hashkey += section[groupVal];
        }
        let i = 0;
        for (i = 0; i < hashmap.length; i++) {
            if (hashmap[i]["key"] === hashkey) {
                exist = true;
            }
        }
        if (exist) {
            for (i = 0; i < hashmap.length; i++) {
                if (hashmap[i]["key"] === hashkey) {
                    hashmap[i]["content"].push(section);
                }
            }
        }
        else {
            let set = {};
            set["key"] = hashkey;
            set["content"] = [section];
            for (let groupVal of grouplist) {
                set[groupVal] = section[groupVal];
            }
            hashmap.push(set);
        }
    }
    Util_1.default.trace("Done first half in parseTransform");
    Util_1.default.trace(applyrule);
    for (let element of hashmap) {
        for (let rule of applyrule) {
            parseApply(rule, element);
        }
    }
    Util_1.default.trace("Done parseTransform");
    return hashmap;
}
exports.parseTransformation = parseTransformation;
function parseApply(applyrule, element) {
    let content = element["content"];
    let applykey = Object.keys(applyrule)[0];
    let applyVal = applyrule[applykey];
    let token = Object.keys(applyVal)[0];
    let tokenVal = applyVal[token];
    if (token === "MIN") {
        element[applykey] = parseMin(content, tokenVal);
    }
    else if (token === "MAX") {
        element[applykey] = parseMax(content, tokenVal);
    }
    else if (token === "AVG") {
        element[applykey] = parseAvg(content, tokenVal);
    }
    else if (token === "COUNT") {
        element[applykey] = parseCount(content, tokenVal);
    }
    else if (token === "SUM") {
        element[applykey] = parseSum(content, tokenVal);
    }
}
exports.parseApply = parseApply;
function parseMin(content, tokenVal) {
    let min = content[0][tokenVal];
    for (let temp of content) {
        if (temp[tokenVal] < min) {
            min = temp[tokenVal];
        }
    }
    return min;
}
exports.parseMin = parseMin;
function parseMax(content, tokenVal) {
    let max = content[0][tokenVal];
    for (let temp of content) {
        if (temp[tokenVal] > max) {
            max = temp[tokenVal];
        }
    }
    return max;
}
exports.parseMax = parseMax;
function parseCount(content, tokenVal) {
    let count = 0;
    let templist = [];
    for (let temp of content) {
        if (!templist.includes(temp[tokenVal])) {
            templist.push(temp[tokenVal]);
            count++;
        }
    }
    return count;
}
exports.parseCount = parseCount;
function parseAvg(content, tokenVal) {
    let total = new decimal_js_1.Decimal(0);
    let i = 0;
    for (let temp of content) {
        let val = new decimal_js_1.Decimal(temp[tokenVal]);
        total = decimal_js_1.Decimal.add(total, val);
        i++;
    }
    let avg = total.toNumber() / i;
    avg = Number(avg.toFixed(2));
    return avg;
}
exports.parseAvg = parseAvg;
function parseSum(content, tokenVal) {
    let total = new decimal_js_1.Decimal(0);
    let i = 0;
    for (let temp of content) {
        total = decimal_js_1.Decimal.add(total, temp[tokenVal]);
    }
    let tot = Number(total.toFixed(2));
    return tot;
}
exports.parseSum = parseSum;
//# sourceMappingURL=parseQuery_Transform.js.map