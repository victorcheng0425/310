import Log from "../Util";
import {orderID, extractColumn, readID, dir, orderIsObject, orderIsString,
    orderList} from "./checkQuery_Options";
import {applyID, groupID, applyKey, extractGroup} from "./checkQuery_Transformation";
import {sortingOrder, filterDataColumn} from "./parseQuery_Option";
import {parseTransformation} from "./parseQuery_Transform";
import {tranExist} from "./checkQuery_Body";
import {InsightError, ResultTooLargeError} from "./IInsightFacade";

let mainKeylist: string[] = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
let mfieldlist: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
let sfieldlist: string[] = ["dept", "title", "instructor", "uuid", "id", "fullname", "shortname", "number", "name",
    "dept", "address", "type", "furniture", "href"];
let optionlist: string[] = ["COLUMNS", "ORDER"];
let logiclist: string[] = ["AND", "OR"];
let mcomparator: string[] = ["LT", "GT", "EQ"];
let scomparison: string[] = ["IS"];
let negation: string[] = ["NOT"];
let direction: string[] = ["UP", "DOWN"];
let transformations: string[] = ["GROUP", "APPLY"];
let applytoken: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
let sortkey: string[] = ["dir", "keys"];


export function parseQuery(query: any, stringread: any, sorting: any, extractCol: any, readid: any): any[] {
    // let fetchParentKeys: any [] = query["WHERE"];
    let result: any [] = [];
    // let tempresult: any [] = [];
    let whereValue: any = query["WHERE"];
    let orderFlag: boolean = false; // check if order exist
    let sort: string = "";
    let extractColList: any = [];
    let readColID: string = "";
    Log.trace("query[WHERE]: ");
    Log.trace(whereValue);
    if ("ORDER" in query["OPTIONS"]) {
        sort = sorting;
        extractColList = extractCol;
        readColID = readid;
        orderFlag = true;
    }
    // let filter: any = Object.keys(whereValue);
    // Log.trace(stringread);
    result = loopThrough(stringread, whereValue);
    // Log.trace("check if result is array: " + Array.isArray(result));
    Log.trace("Finish Loop Through");
    // Log.trace(result);
    if (tranExist === true) {
        Log.trace("start parse tranformation");
        result = parseTransformation(result, query["TRANSFORMATIONS"]);
    }
    let afterColumn: any = [];
    let columnset: any = extractColumn;
    Log.trace("result in parseQuery (length): " + result.length);
    Log.trace("sort: " + sort + " ,extractColList: " + extractColList + " ,readColID: " + readColID);
    // Log.trace(result);
    // if (result.length > 5000) {
    //     Log.trace("throw error!");
    //     throw new ResultTooLargeError("There are > 5000 results");
    // }
    afterColumn = filterDataColumn(afterColumn, result, columnset);
    Log.trace("finish column matching");
    Log.trace("Start ordering");
    afterColumn = sortingOrder(orderFlag, afterColumn);
    // Log.trace(afterColumn);
    // Log.trace(afterColumn);
    Log.trace("check if afterColumn is array: " + Array.isArray(afterColumn));
    return afterColumn;
}


function loopThrough(stringread: any, whereValue: any): any {
    // filter contains list of value of where
    Log.trace("Start looping through data");
    // Log.trace(stringread);
    let localResult: any = [];
    Log.trace("whereValue in LoopThrough: ");
    Log.trace(whereValue);
    let filterlist: any = Object.keys(whereValue);
    Log.trace(filterlist);
    if (filterlist.length === 0) {
        Log.trace("No filter, no where...");
        return stringread;
    }
    let firstKey: string = filterlist[0];
    let content: any = whereValue[firstKey];
    Log.trace("First Key: " + firstKey + ", type of firstkey: " + typeof firstKey);
    // Log.trace("filterlist[firstkey] = content " + whereValue[firstKey]);
    // Log.trace("Content: " + content);
    // Log.trace("filterlist: " + filterlist);
    if (firstKey === "AND") {
        localResult = andFunc(stringread, content);
    }
    if (firstKey === "OR") {
        localResult = orFunc(stringread, content);
    }
    if (firstKey === "GT") {
        localResult = gtFunc(stringread, content);
        Log.trace("Done GT in loopThrough");
    }
    if (firstKey === "LT") {
        localResult = ltFunc(stringread, content);
    }
    if (firstKey === "EQ") {
        localResult = eqFun(stringread, content);
    }
    if (firstKey === "NOT") {
        localResult = notFun(stringread, content);
        Log.trace("Finished: notFun in loopThrough");
    }
    if (firstKey === "IS") {
        localResult = isFun(stringread, content);
        Log.trace("Finished: isFUN in loopThrough");
    }
    return localResult;
}


function andFunc(stringread: any, content: any): any {
    Log.trace("Start And function");
    let localResult: any = stringread;
    let keys: any = Object.keys(content);
    if (keys.length === 1) {
        content = content[0];
        return loopThrough(stringread, content);
    }
    for (let eachAnd of content) {
        localResult = loopThrough(localResult, eachAnd); // go through the tree
    }
    return localResult;
}

function orFunc(stringread: any, content: any): any {
    Log.trace("Start Or function");
    // Log.trace(content);
    // Log.trace(stringread);
    let localResult: any = [];
    let keys: any = Object.keys(content);
    Log.trace(content);
    if (keys.length === 1) {
        content = content[0];
        return loopThrough(stringread, content);
    }
    Log.trace("orFunc, loop thro content");
    for (let eachOr of content) {
        let loopResult: any = loopThrough(stringread, eachOr);
        for (let eachLoopResult of loopResult) { // go through the session in loopResult
            if (!(localResult.includes(eachLoopResult))) {
                localResult.push(eachLoopResult);
            }
        }
    }
    return localResult;
}

function gtFunc(stringread: any, content: any) {
    Log.trace("Start GT function");
    let localResult: any = [];
    let keys: any = Object.keys(content);
    let onlyKey: any = keys[0];
    let onlyValue: number = content[onlyKey];
    Log.trace("GT Key: " + onlyKey + ", Value: " + onlyValue);
    for (let numValue of stringread) {
        if (numValue[onlyKey] > onlyValue) {
            // Log.trace("Value: " + onlyValue + ", numValue[onlyKey]: "
            //     + numValue[onlyKey] + ", type: " + typeof numValue[onlyKey] + " , " + );
            // localResult = loopThrough(localResult, numValue);
            localResult.push(numValue);
        }
    }
    // Log.trace(Array.isArray(localResult));
    Log.trace("Finish GT Func");
    return localResult;
}

function ltFunc(stringread: any, content: any) {
    Log.trace("Start LT function");
    let localResult: any = [];
    let keys: any = Object.keys(content);
    let onlyKey: any = keys[0];
    let onlyValue: number = content[onlyKey];
    for (let numValue of stringread) {
        if (numValue[onlyKey] < onlyValue) {
            // localResult = loopThrough(localResult, numValue);
            localResult.push(numValue);
        }
    }
    return localResult;
}

function eqFun(stringread: any, content: any): any {
    Log.trace("Start EQ function");
    let localResult: any = [];
    let keys: any = Object.keys(content);
    let firstKey: any = keys[0];
    let num: number = content[firstKey];
    Log.trace("EQ: " + firstKey + ", number is: " + num);
    for (let eachMainJson of stringread) {
        if (eachMainJson[firstKey] === num) {
            localResult.push(eachMainJson);
        }
    }
    return localResult;
}

function notFun(stringread: any, content: any): any {
    Log.trace("Start NOT function");
    let localResult: any = [];
    let keys: any = Object.keys(content);
    let loopResult: any = loopThrough(stringread, content);
    Log.trace("Come Back to NotFun");
    for (let eachMainJson of stringread) {
        // Add to the localResult if loopResult don't have certain session in Json(stringread)
        if (!(loopResult.includes(eachMainJson))) {
            localResult.push(eachMainJson);
        }
    }
    // Log.trace(localResult);
    return localResult;
}

function checkWildcat(value: string, stringread: any, firstKey: any, localResult: any) {
    if (value.indexOf("*") === -1) {
        Log.trace("IS no * ");
        // Log.trace("value: " + value);
        // Log.trace(stringread);
        for (let eachStat of stringread) {
            if (eachStat[firstKey] === value) {
                // Log.trace("eachStat[firstKey]: " + eachStat[firstKey]);
                localResult.push(eachStat);
            }
        }
        // Log.trace("end for loop" + value);
        return localResult;
    }
    if ((value === "*") || (value === "**")) {
        Log.trace("IS contains ** or *");
        for (let eachMainJson of stringread) {
            localResult.push(eachMainJson);
        }
        return localResult;
    }
    if (value[0] === "*" && value[value.length - 1] === "*") {
        Log.trace("IS contains *string*");
        value = value.substring(1, value.length - 1);
        for (let eachMainJson of stringread) {
            // Log.trace(eachMainJson[firstKey]);
            if (eachMainJson[firstKey].includes(value)) {
                localResult.push(eachMainJson);
            }
        }
        // Log.trace("Done IS *string*");
        return localResult;
    }
    if (value[0] !== "*" && value[value.length - 1] === "*") {
        Log.trace("IS contains string*");
        value = value.substring(0, value.length - 1);
        // Log.trace("Now searching for value: " + value);
        for (let eachMainJson of stringread) {
            let temp: string = eachMainJson[firstKey];
            if (temp.substring(0, value.length) === value) {
                localResult.push(eachMainJson);
            }
        }
        return localResult;
    }
    if (value[0] === "*" && value[value.length - 1] !== "*") {
        Log.trace("IS contains *string");
        value = value.substring(1, value.length);
        for (let eachMainJson of stringread) {
            let temp: string = eachMainJson[firstKey];
            if (temp.substring(temp.length - value.length, temp.length) === value) {
                localResult.push(eachMainJson);
            }
        }
    }
    return localResult;
}

function isFun(stringread: any, content: any): any {
    Log.trace("Start IS function");
    let localResult: any = [];
    let keys: any = Object.keys(content);
    let firstKey: any = keys[0];
    let value: string = content[firstKey];
    // Log.trace("IS: firstKey: " + firstKey + ", string is: " + value);
    // no *
    return checkWildcat(value, stringread, firstKey, localResult);
}
