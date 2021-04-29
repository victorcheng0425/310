import Log from "../Util";
import {checkidString, tranExist} from "./checkQuery_Body";
import {applyID, groupID, applyKey, extractGroup} from "./checkQuery_Transformation";

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
let transformationsList: string[] = ["GROUP", "APPLY"];
let applytoken: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
let sortkey: string[] = ["dir", "keys"];

export let orderID: string;
export let readID: string; // col id
export let extractColumn: string[];
export let dir: string;
export let orderFlag: boolean = false; // don't need it actually!
export let orderIsString: boolean = false;
export let orderIsObject: boolean = false;
export let orderList: string[];

// check basis optio, make sure it is an object
export function basicCheckOption(valueOfOption: any) {
    Log.trace("basicCheckOption");
    if (typeof valueOfOption !== "object") {
        Log.trace("Option is not a Object");
        return false;
    }
    if (valueOfOption === null || valueOfOption === undefined
        || Array.isArray(valueOfOption) || typeof valueOfOption === "string") {
        Log.trace("Option cannot be array or string or null or undefined");
        return false;
    }
    return true;
}
export function checkOrderObject(orderValue: any, optionValue: any): boolean {
    Log.trace("checkOrderObject");
    let sort: any = Object.keys(orderValue);
    if (sort.length !== 2) {
        return false;
    }
    for (let skey of sort) {
        if (!sortkey.includes(skey)) {
            Log.trace(skey);
            Log.trace(sortkey);
            Log.trace("Invalid sort key");
            return false;
        }
    }
    let localDir: any = orderValue["dir"];
    if (!direction.includes(localDir)) {
        Log.trace("No such direction");
        return false;
    }
    let localkeys: any = orderValue["keys"];
    if (!Array.isArray(localkeys)) {
        Log.trace("keys in sorting is not an array");
        return false;
    }
    if (localkeys.length === 0) {
        Log.trace("empty array in sorting key");
        return false;
    }
    for (let i of localkeys) {
        if (!optionValue.includes(i)) {
            Log.trace("No such sorting keys in column");
            return false;
        }
        orderList.push(i);
    }
    dir = localDir;
    orderIsObject = true;
    return true;
}
export function checkOrder(orderValue: any, optionValue: any): boolean {
    if (Array.isArray(orderValue) || typeof orderValue === "number"
        || orderValue === null || orderValue === undefined || Object.keys(orderValue).length === 0) {
        Log.trace("Order Value can only be string or object");
        return false;
    }
    if (typeof orderValue === "string") { // if orderValue is ANYKEY
        if (!optionValue.includes(orderValue)) {
            Log.trace("No order value in Column");
            return false;
        }
        Log.trace(optionValue);
        orderID = orderValue;
        orderIsString = true;
    } else if (typeof orderValue === "object") { // if orderValue is Object
        if (!checkOrderObject(orderValue, optionValue)) {
            Log.trace("checkOrderObject failed");
            return false;
        }
    }
    Log.trace("In check order - readID: " + readID + ", OrderID: ", orderID);
    if (orderID !== "" && readID !== orderID.split("_")[0] && orderID.split("_")[1] !== undefined) {
        Log.trace("Order ID is not equal to Column ID");
        return false;
    }
    orderFlag = true;
    Log.trace("Done checkOrder");
    return true;
}

export function checkColumn(optionValue: any): boolean {
    // Log.trace(optionValue);
    if (!(Array.isArray(optionValue))) {
        Log.trace("Columns should be an array!");
        return false;
    }
    if (optionValue.length === 0) {
        Log.trace("Columns should not be empty list");
        return false;
    }
    for (let colVal of optionValue) {
        if (typeof colVal !== "string") {
            Log.trace("Column value is not a String!");
            return false;
        }
        if (!(colVal.indexOf("_") === -1)) {
            let idstring = colVal.split("_")[0];
            if (!checkidString(idstring)) {
                Log.trace("idstring not valid");
                return false;
            }
            // readID = idstring;
            // Log.trace("Current working ID in Options: " + readID);
            let key = colVal.split("_")[1];
            // Log.trace(colVal);
            // Log.trace(key);
            if (colVal.split("_")[2] === "") {
                Log.trace("idstring_m/skey_ not allowed, extra underscore");
                return false;
            }
            if (!sfieldlist.includes(key) && !mfieldlist.includes(key)) {
                Log.trace("Not a valid key, not in sfield or mfield!");
                return false;
            }
            // Log.trace(colVal);
            if (tranExist === true) {
                if (!extractGroup.includes(colVal)) {
                    Log.trace("This column not in extractGroup");
                    return false;
                }
            }
        } else {
            if (tranExist === true) {
                if (!applyKey.includes(colVal)) {
                    Log.trace("This column not in applykey");
                    return false;
                }
            } else {
                // Log.trace(colVal.indexOf("_") + ": :" + colVal);
                // Log.trace("Column value do not have _ , it's invalid");
                return false;
            }
        }
    }
    extractColumn = optionValue;
    return true;
}

export function checkOption(option: any): boolean {
    orderID = ""; // reset orderID everytime
    readID = ""; // reset id everytime
    extractColumn = [];
    dir = "";
    orderFlag = false;
    orderIsObject = false;
    orderIsString = false;
    orderList = [];
    let optionKeys: any[] = Object.keys(option);
    if (optionKeys.length === 0 || optionKeys.length > 2) {
        Log.trace("Option = {} or Option has more than 2 keys");
        return false;
    }
    for (let key of optionKeys) {
        if (!(optionlist.includes(key))) {
            Log.trace("Invalid option key");
            return false;
        }
    }
    if (!("COLUMNS" in option)) {
        Log.trace("No column in OPTION");
        return false;
    }
    let optionValue: any [] = option["COLUMNS"];
    if (!checkColumn(optionValue)) {
        return false;
    }
    let tempid = getReadID(optionValue);
    // let tempid: any = optionValue[0].split("_")[0];
    // Log.trace("tempID (Col) is: " + tempid);
    if (!checkColumnIDIfDifferentID(tempid, optionValue)) {
        Log.trace("fail checkColumnID if different ID");
        return false;
    }
    // Log.trace("check1");
    readID = tempid;
    if ("ORDER" in option) { // if order exist, do the rest
        let orderValue = option["ORDER"];
        // if (orderValue === null || orderValue === undefined) {
        //     return false;
        // }
        // Log.trace("check2");
        if (!checkOrder(orderValue, optionValue)) {
            return false;
        }
    }
    Log.trace("Done Check Option");
    return true;
}
export function getReadID(optionValue: any): any {
    for (let col of optionValue) {
        if (!(col.indexOf("_") === -1)) {
            let colID = col.split("_")[0];
            return colID;
        }
    }
    return null;
}
export function checkColumnIDIfDifferentID(tempid: any, optionValue: any): boolean {
    Log.trace("checkColumnIDIfDifferentID");
    if (tempid === null && tranExist) {
        Log.trace("tempid === null && tranExist");
        return true;
    }
    // } else {
    //     Log.trace("tempid === null && not tranExist");
    //     return false;
    // }
    for (let col of optionValue) {
        if (!(col.indexOf("_") === -1)) {
            let colID = col.split("_")[0];
            if (!(colID === tempid)) {
                Log.trace("Multiple different ID in col");
                return false;
            }
        } else {
            if (!tranExist) {
                Log.trace("No tranExist, but col has no _");
                return false;
            }
            // Log.trace("No id in col");
        }
    }
    Log.trace("Done checkColumnIDIfDifferentID");
    return true;
}
