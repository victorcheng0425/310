import Log from "../Util";
import {checkColumn, checkOption, extractColumn, readID} from "./checkQuery_Options";
import {checkidString} from "./checkQuery_Body";

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
let numerictoken: string[] = ["MAX", "MIN", "AVG", "SUM"];
let sortkey: string[] = ["dir", "keys"];

export let extractGroup: string[];
export let groupID: string;
export let applyKey: string[];
export let applyID: string;

export function basicCheckTransformation(transform: any) {
    Log.trace("Basic Check Transformation");
    if (typeof transform !== "object") {
        Log.trace("Transformation is not a Object");
        return false;
    }
    if (transform === null || transform === undefined
        || Array.isArray(transform) || typeof transform === "string") {
        Log.trace("Transformation cannot be array or string or null or undefined");
        return false;
    }
    return true;
}

export function checkTransformations(transform: any): boolean {
    groupID = "";
    applyID = "";
    extractGroup = [];
    applyKey = [];
    Log.trace("checkTransformations!");
    if (!basicCheckTransformation(transform)) {
        Log.trace("transformation basic check failed");
        return false;
    }
    let tranKeys: any[] = Object.keys(transform);
    if (tranKeys.length !== 2) {
        Log.trace("Transformation keys length should be 2");
        return false;
    }
    for (let key of tranKeys) {
        if (!(transformationsList.includes(key))) {
            Log.trace("Invalid Transformation key, should be either GROUP/APPLY");
            return false;
        }
    }
    if (!("GROUP" in transform)) {
        Log.trace("No GROUP in Transformation");
        return false;
    }
    let groupValue: any [] = transform["GROUP"];
    Log.trace("Checkgroup in checkquery");
    if (!checkGroup(groupValue)) {
        return false;
    }
    if (!("APPLY" in transform)) {
        Log.trace("No Apply in Transformation");
        return false;
    }
    Log.trace("Checkgroup in checkApply");
    let applyValue: any [] = transform["APPLY"];
    if (!checkApply(applyValue)) {
        return false;
    }
    return true;
}

export function checkGroup(groupValue: any): boolean {
    Log.trace(groupValue);
    if (!(Array.isArray(groupValue)) || groupValue === null || groupValue === undefined) {
        // Log.trace("Group should be an array!");
        return false;
    }
    if (groupValue.length === 0) {
        Log.trace("Group should not be empty list");
        return false;
    }
    for (let gpval of groupValue) {
        if (typeof gpval !== "string") {
            Log.trace("Group value is not a String!");
            return false;
        }
        if (!(gpval.indexOf("_") === -1)) {
            let idstring = gpval.split("_")[0];
            if (!checkidStringOrApplyKey(idstring)) {
                Log.trace("idstring not valid");
                return false;
            }
            let key = gpval.split("_")[1];
            if (gpval.split("_")[2] !== undefined && gpval.split("_")[2].length >= 0) {
                Log.trace("idstring_m/skey_ not allowed, extra underscore");
                return false;
            }
            if (!sfieldlist.includes(key) && !mfieldlist.includes(key)) {
                Log.trace("Not a valid key, not in sfield or mfield!");
                return false;
            }
        } else {
            Log.trace("Group value do not have _ , it's invalid");
            return false;
        }
    }
    let tempid: any = groupValue[0].split("_")[0];
    // Log.trace("tempID (Col) is: " + tempid);
    for (let gp of groupValue) {
        if (!(gp.indexOf("_") === -1)) {
            let gpID = gp.split("_")[0];
            if (!(gpID === tempid)) {
                Log.trace("Multiple different ID in group");
                return false;
            }
        } else {
            // Log.trace("No id in col");
            return false;
        }
    }
    extractGroup = groupValue;
    groupID = tempid;
    return true;
}

export function checkApply(applyValue: any): boolean {
    if (!(Array.isArray(applyValue)) || applyValue === null || applyValue === undefined) {
        Log.trace("Apply should be an array!");
        return false;
    }
    // if (applyValue.length === 0) {
    //     Log.trace("Apply should not be empty list, no APPLYRULE");
    //     return false;
    // }
    for (let applyrule of applyValue) {
        if (typeof applyrule !== "object") {
            Log.trace("APPLYRULE is not a Object");
            return false;
        }
        if (applyrule === null || applyrule === undefined
            || Array.isArray(applyrule) || typeof applyrule === "string") {
            Log.trace("APPLYRULE is null");
            return false;
        }
        if (!checkApplyRule(applyrule)) {
            Log.trace("Invalid APPLYRULE");
            return false;
        }
    }
    Log.trace("Done checkApply");
    return true;
}

export function checkApplyRule(applyrule: any): boolean {
    let key: any = Object.keys(applyrule);
    if (key.length !== 1) {
        Log.trace("More than one key in ApplyRule is not allowed");
        return false;
    }
    key = key[0]; // applykey
    if (!checkidStringOrApplyKey(key)) {
        Log.trace("invalid apply key.");
        return false;
    }
    if (applyKey.includes(key)) {
        Log.trace("applykey existed.");
        return false;
    }
    let applykeyVal: any = applyrule[key]; // {APPLYTOKEN : key}
    if (!checkApplyToken(applykeyVal)) {
        Log.trace("checkApplyToken Failed");
        return false;
    }
    applyKey.push(key);
    Log.trace("Done checkApply Rule");
    return true;
}

export function basicCheckApplyToken(applykeyVal: any): boolean {
    Log.trace("basicCheckApplyToken");
    if (typeof applykeyVal !== "object" || applykeyVal === null || applykeyVal === undefined) {
        Log.trace("applykey value is not an Object");
        return false;
    }
    if (typeof applykeyVal === null || applykeyVal === undefined
        || Array.isArray(applykeyVal) || typeof applykeyVal === "string") {
        Log.trace("applykey value is null");
        return false;
    }
    return true;
}
export function checkApplyToken(applykeyVal: any): boolean {
    if (!basicCheckApplyToken(applykeyVal)) {
        Log.trace("basicCheckApplyToken failed");
        return false;
    }
    let token: any = Object.keys(applykeyVal);
    if (token.length !== 1) {
        Log.trace("More than one key in ApplyToken is not allowed");
        return false;
    }
    token = token[0]; // applytoken
    if (!applytoken.includes(token)) {
        Log.trace("Invalid applytoken");
        return false;
    }
    let applytokenVal: any = applykeyVal[token];
    if (typeof applytokenVal !== "string") {
        Log.trace("applytoken value is not a string");
        return false;
    }
    if (applytokenVal.indexOf("_") === -1) {
        Log.trace("apply token value should have _");
        return false;
    }
    let idstring: string = applytokenVal.split("_")[0];
    let field: string = applytokenVal.split("_")[1];
    if (!sfieldlist.includes(field) && !mfieldlist.includes(field)) {
        Log.trace("Not a valid field, not in sfield or mfield!");
        return false;
    }
    if (!checkidStringOrApplyKey(idstring)) {
        Log.trace("idstring not valid, (checkidStringOrApplyKey)");
        return false;
    }
    if (!checkGroupIDandApplyID(idstring)) { // check if more than one id
        Log.trace("CheckGroupIDandApplyID failed");
        return false;
    }
    if (numerictoken.includes(token)) {
        if (!mfieldlist.includes(field)) {
            Log.trace("MAX/MIN/SUM/AVG applied on non numeric fields");
            return false;
        }
    }
    Log.trace("Done check Apply Token");
    return true;
}
export function checkGroupIDandApplyID(idstring: string): boolean {
    Log.trace("CheckGroupIDandApplyID");
    if (idstring !== groupID) {
        Log.trace("Different groupID and applyID");
        return false;
    }
    if (applyID === "") {
        applyID = idstring;
    }
    if (applyID !== idstring) {
        Log.trace("applyID !== idstring");
        return false;
    }
    Log.trace("Done CheckGroupIDandApplyID");
    return true;
}
export function checkidStringOrApplyKey(idstring: any): boolean {
    Log.trace("Enter check idString");
    Log.trace(idstring);
    if (idstring.length === 0 ) {
        Log.trace("idstring should have at least one char");
        return false;
    }
    if (idstring.includes("_")) {
        Log.trace("idstring should not have _");
        return false;
    }
    // if (extractIDinWhere === "") {
    //     extractIDinWhere = idstring;
    // }
    // if (extractIDinWhere !== idstring) {
    //     Log.trace("Can not query more than one data set in Where!");
    //     return false;
    // }
    Log.trace("finish checkidStringOrApplyKey");
    return true;
}
