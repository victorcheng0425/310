import Log from "../Util";
import {orderID, extractColumn, readID, dir, orderIsObject, orderIsString,
    orderList} from "./checkQuery_Options";
import {applyID, groupID, applyKey, extractGroup} from "./checkQuery_Transformation";
import {Decimal} from "decimal.js";

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

export function parseTransformation(result: any, transform: any): any {
    Log.trace("parseTransformation");
    // Log.trace(transform);
    let applyrule: any = transform["APPLY"];
    let hashmap: any = [];
    let grouplist = extractGroup;
    for (let section of result) {
        let hashkey: string = "";
        let exist: boolean = false;
        for (let groupVal of grouplist) {
            hashkey += section[groupVal];
        }
        let i = 0;
        for (i = 0; i < hashmap.length ; i++) {
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
        } else {
            let set: any = {};
            set["key"] = hashkey;
            set["content"] = [section];
            for (let groupVal of grouplist) {
                set[groupVal] = section[groupVal];
            }
            hashmap.push(set);
        }
    }
    Log.trace("Done first half in parseTransform");
    // Log.trace(hashmap);
    Log.trace(applyrule);
    for (let element of hashmap) {
        // Log.trace(element);
        for (let rule of applyrule) {
            parseApply(rule, element);
            // Log.trace(element);
        }
    }
    Log.trace("Done parseTransform");
    // Log.trace(hashmap);
    return hashmap;
}

export function parseApply(applyrule: any, element: any): any {
    // Log.trace("applyrule");
    let content: any = element["content"];
    let applykey: any = Object.keys(applyrule)[0];
    let applyVal: any = applyrule[applykey];
    let token: any = Object.keys(applyVal)[0];
    let tokenVal: any = applyVal[token];
    if (token === "MIN") {
        element[applykey] = parseMin(content, tokenVal);
    } else if (token === "MAX") {
        element[applykey] = parseMax(content, tokenVal);
    } else if (token === "AVG") {
        element[applykey] = parseAvg(content, tokenVal);
    } else if (token === "COUNT") {
        element[applykey] = parseCount(content, tokenVal);
    } else if (token === "SUM") {
        element[applykey] = parseSum(content, tokenVal);
    }
}

export function parseMin(content: any, tokenVal: any): any {
    // Log.trace("parseMin");
    let min: number = content[0][tokenVal];
    for (let temp of content) {
        if (temp[tokenVal] < min) {
            min = temp[tokenVal];
        }
    }
    return min;
}
export function parseMax(content: any, tokenVal: any): any {
    // Log.trace("parseMax");
    let max: number = content[0][tokenVal];
    for (let temp of content) {
        if (temp[tokenVal] > max) {
            max = temp[tokenVal];
        }
    }
    return max;
}
export function parseCount(content: any, tokenVal: any): any {
    let count: number = 0;
    let templist: any = [];
    for (let temp of content) {
        if (!templist.includes(temp[tokenVal])) {
            templist.push(temp[tokenVal]);
            count++;
        }
    }
    return count;
}
export function parseAvg(content: any, tokenVal: any): any {
    // Log.trace("parseAvg");
    let total = new Decimal(0);
    let i: number = 0;
    for (let temp of content) {
        let val = new Decimal(temp[tokenVal]);
        total = Decimal.add(total, val);
        i++;
    }
    let avg: number = total.toNumber() / i;
    avg = Number(avg.toFixed(2));
    // Log.trace("Done Avg");
    return avg;
}
export function parseSum(content: any, tokenVal: any): any {
    // Log.trace("parseSum");
    let total = new Decimal(0);
    let i: number = 0;
    for (let temp of content) {
        total = Decimal.add(total, temp[tokenVal]);
    }
    let tot: number = Number(total.toFixed(2));
    return tot;
}
