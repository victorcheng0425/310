"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const checkQuery_Options_1 = require("./checkQuery_Options");
const parseQuery_Option_1 = require("./parseQuery_Option");
const parseQuery_Transform_1 = require("./parseQuery_Transform");
const checkQuery_Body_1 = require("./checkQuery_Body");
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
function parseQuery(query, stringread, sorting, extractCol, readid) {
    let result = [];
    let whereValue = query["WHERE"];
    let orderFlag = false;
    let sort = "";
    let extractColList = [];
    let readColID = "";
    Util_1.default.trace("query[WHERE]: ");
    Util_1.default.trace(whereValue);
    if ("ORDER" in query["OPTIONS"]) {
        sort = sorting;
        extractColList = extractCol;
        readColID = readid;
        orderFlag = true;
    }
    result = loopThrough(stringread, whereValue);
    Util_1.default.trace("Finish Loop Through");
    if (checkQuery_Body_1.tranExist === true) {
        Util_1.default.trace("start parse tranformation");
        result = parseQuery_Transform_1.parseTransformation(result, query["TRANSFORMATIONS"]);
    }
    let afterColumn = [];
    let columnset = checkQuery_Options_1.extractColumn;
    Util_1.default.trace("result in parseQuery (length): " + result.length);
    Util_1.default.trace("sort: " + sort + " ,extractColList: " + extractColList + " ,readColID: " + readColID);
    afterColumn = parseQuery_Option_1.filterDataColumn(afterColumn, result, columnset);
    Util_1.default.trace("finish column matching");
    Util_1.default.trace("Start ordering");
    afterColumn = parseQuery_Option_1.sortingOrder(orderFlag, afterColumn);
    Util_1.default.trace("check if afterColumn is array: " + Array.isArray(afterColumn));
    return afterColumn;
}
exports.parseQuery = parseQuery;
function loopThrough(stringread, whereValue) {
    Util_1.default.trace("Start looping through data");
    let localResult = [];
    Util_1.default.trace("whereValue in LoopThrough: ");
    Util_1.default.trace(whereValue);
    let filterlist = Object.keys(whereValue);
    Util_1.default.trace(filterlist);
    if (filterlist.length === 0) {
        Util_1.default.trace("No filter, no where...");
        return stringread;
    }
    let firstKey = filterlist[0];
    let content = whereValue[firstKey];
    Util_1.default.trace("First Key: " + firstKey + ", type of firstkey: " + typeof firstKey);
    if (firstKey === "AND") {
        localResult = andFunc(stringread, content);
    }
    if (firstKey === "OR") {
        localResult = orFunc(stringread, content);
    }
    if (firstKey === "GT") {
        localResult = gtFunc(stringread, content);
        Util_1.default.trace("Done GT in loopThrough");
    }
    if (firstKey === "LT") {
        localResult = ltFunc(stringread, content);
    }
    if (firstKey === "EQ") {
        localResult = eqFun(stringread, content);
    }
    if (firstKey === "NOT") {
        localResult = notFun(stringread, content);
        Util_1.default.trace("Finished: notFun in loopThrough");
    }
    if (firstKey === "IS") {
        localResult = isFun(stringread, content);
        Util_1.default.trace("Finished: isFUN in loopThrough");
    }
    return localResult;
}
function andFunc(stringread, content) {
    Util_1.default.trace("Start And function");
    let localResult = stringread;
    let keys = Object.keys(content);
    if (keys.length === 1) {
        content = content[0];
        return loopThrough(stringread, content);
    }
    for (let eachAnd of content) {
        localResult = loopThrough(localResult, eachAnd);
    }
    return localResult;
}
function orFunc(stringread, content) {
    Util_1.default.trace("Start Or function");
    let localResult = [];
    let keys = Object.keys(content);
    Util_1.default.trace(content);
    if (keys.length === 1) {
        content = content[0];
        return loopThrough(stringread, content);
    }
    Util_1.default.trace("orFunc, loop thro content");
    for (let eachOr of content) {
        let loopResult = loopThrough(stringread, eachOr);
        for (let eachLoopResult of loopResult) {
            if (!(localResult.includes(eachLoopResult))) {
                localResult.push(eachLoopResult);
            }
        }
    }
    return localResult;
}
function gtFunc(stringread, content) {
    Util_1.default.trace("Start GT function");
    let localResult = [];
    let keys = Object.keys(content);
    let onlyKey = keys[0];
    let onlyValue = content[onlyKey];
    Util_1.default.trace("GT Key: " + onlyKey + ", Value: " + onlyValue);
    for (let numValue of stringread) {
        if (numValue[onlyKey] > onlyValue) {
            localResult.push(numValue);
        }
    }
    Util_1.default.trace("Finish GT Func");
    return localResult;
}
function ltFunc(stringread, content) {
    Util_1.default.trace("Start LT function");
    let localResult = [];
    let keys = Object.keys(content);
    let onlyKey = keys[0];
    let onlyValue = content[onlyKey];
    for (let numValue of stringread) {
        if (numValue[onlyKey] < onlyValue) {
            localResult.push(numValue);
        }
    }
    return localResult;
}
function eqFun(stringread, content) {
    Util_1.default.trace("Start EQ function");
    let localResult = [];
    let keys = Object.keys(content);
    let firstKey = keys[0];
    let num = content[firstKey];
    Util_1.default.trace("EQ: " + firstKey + ", number is: " + num);
    for (let eachMainJson of stringread) {
        if (eachMainJson[firstKey] === num) {
            localResult.push(eachMainJson);
        }
    }
    return localResult;
}
function notFun(stringread, content) {
    Util_1.default.trace("Start NOT function");
    let localResult = [];
    let keys = Object.keys(content);
    let loopResult = loopThrough(stringread, content);
    Util_1.default.trace("Come Back to NotFun");
    for (let eachMainJson of stringread) {
        if (!(loopResult.includes(eachMainJson))) {
            localResult.push(eachMainJson);
        }
    }
    return localResult;
}
function checkWildcat(value, stringread, firstKey, localResult) {
    if (value.indexOf("*") === -1) {
        Util_1.default.trace("IS no * ");
        for (let eachStat of stringread) {
            if (eachStat[firstKey] === value) {
                localResult.push(eachStat);
            }
        }
        return localResult;
    }
    if ((value === "*") || (value === "**")) {
        Util_1.default.trace("IS contains ** or *");
        for (let eachMainJson of stringread) {
            localResult.push(eachMainJson);
        }
        return localResult;
    }
    if (value[0] === "*" && value[value.length - 1] === "*") {
        Util_1.default.trace("IS contains *string*");
        value = value.substring(1, value.length - 1);
        for (let eachMainJson of stringread) {
            if (eachMainJson[firstKey].includes(value)) {
                localResult.push(eachMainJson);
            }
        }
        return localResult;
    }
    if (value[0] !== "*" && value[value.length - 1] === "*") {
        Util_1.default.trace("IS contains string*");
        value = value.substring(0, value.length - 1);
        for (let eachMainJson of stringread) {
            let temp = eachMainJson[firstKey];
            if (temp.substring(0, value.length) === value) {
                localResult.push(eachMainJson);
            }
        }
        return localResult;
    }
    if (value[0] === "*" && value[value.length - 1] !== "*") {
        Util_1.default.trace("IS contains *string");
        value = value.substring(1, value.length);
        for (let eachMainJson of stringread) {
            let temp = eachMainJson[firstKey];
            if (temp.substring(temp.length - value.length, temp.length) === value) {
                localResult.push(eachMainJson);
            }
        }
    }
    return localResult;
}
function isFun(stringread, content) {
    Util_1.default.trace("Start IS function");
    let localResult = [];
    let keys = Object.keys(content);
    let firstKey = keys[0];
    let value = content[firstKey];
    return checkWildcat(value, stringread, firstKey, localResult);
}
//# sourceMappingURL=parseQuery.js.map