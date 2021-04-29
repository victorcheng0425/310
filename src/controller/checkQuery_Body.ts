import Log from "../Util";
import {checkOption, basicCheckOption, readID} from "./checkQuery_Options";
import {checkTransformations, groupID} from "./checkQuery_Transformation";

let mainKeylist: string[] = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
let mfieldlist: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
let sfieldlist: string[] = ["dept", "title", "instructor", "uuid", "id", "fullname", "shortname", "number", "name",
    "dept", "address", "type", "furniture", "href"];
let logiclist: string[] = ["AND", "OR"];
let mcomparator: string[] = ["LT", "GT", "EQ"];
let scomparison: string[] = ["IS"];
let negation: string[] = ["NOT"];
export let extractIDinWhere: string;
export let tranExist: boolean = false;
let coursesField: string[] = ["avg", "pass", "fail", "audit", "year", "dept", "title", "instructor", "uuid", "id"];
let roomsField: string[] = ["lat", "lon", "seats", "fullname", "shortname", "number", "name",
    "address", "type", "furniture", "href"]; // "href"
let flag = 0; // flag == 1 means courses, == 2 means rooms


// check basic where, make sure it is an object
export function basicCheckWhere(valueOfWhere: any) {
    if (valueOfWhere === null || valueOfWhere === undefined
        || Array.isArray(valueOfWhere) || typeof valueOfWhere === "string") {
        // Log.trace("WHERE cannot be array or string");
        return false;
    }
    if (typeof valueOfWhere !== "object") {
        // Log.trace("WHERE is not an Object");
        return false;
    }
    return true;
}

export function checkQuery(query: any): boolean {
    extractIDinWhere = ""; // reset everytime!
    tranExist = false; // reset tranExist everytime
    let fetchMainKey: any [] = Object.keys(query);
    // Log.trace("Main query keys list: " + fetchMainKey);
    for (let mainkey of fetchMainKey) {
        if (!(mainKeylist.includes(mainkey))) {
            // Log.trace("The Main key is not WHERE or OPTIONS");
            return false;
        }
    }
    if (!(fetchMainKey.length === 2 || fetchMainKey.length === 3)) {
        // Log.trace("The Main key should contain WHERE or OPTIONS or TRANSFORMATIONS, length:2/3");
        return false;
    }
    // check where
    if (!("WHERE" in query)) {
        // Log.trace("no WHERE");
        return false;
    }
    let valueOfWhere: any = query["WHERE"];
    if (!basicCheckWhere(valueOfWhere)) {
        return false;
    }
    if (!checkWhere(valueOfWhere)) {
        return false;
    }
    // check transformation
    if ("TRANSFORMATIONS" in query) {
        // Log.trace("check transformations in body");
        let valueOfTransformations: any = query["TRANSFORMATIONS"];
        if (!checkTransformations(valueOfTransformations)) {
            return false;
        }
        tranExist = true; // transformation exist
    }
    // check option
    // Log.trace("Start options");
    if (!("OPTIONS" in query)) {
        // Log.trace("no OPTIONS");
        return false;
    }
    let valueOfOption: any = query["OPTIONS"];
    if (!basicCheckOption(valueOfOption)) {
        return false;
    }
    Log.trace("basicCheckOption done");
    if (!checkOption(valueOfOption)) {
        // Log.trace("checkOption fail");
        return false;
    }
    // Log.trace("checkOption done");
    if (tranExist && groupID !== readID && readID !== null) {
        // Log.trace(readID + groupID);
        Log.trace("groupID !== readID");
        return false;
    }
    return true;
}
export function checkLogic(logicValue: any): boolean {
    Log.trace("Start Check Logic");
    if (!Array.isArray(logicValue)) {
        Log.trace("Logic Value is not array");
        return false;
    }
    if (logicValue.length === 0) {
        Log.trace("No filter, return false");
        return false;
    }
    if (logicValue.includes("") || logicValue.includes(" ") || Object.keys(logicValue[0]).length === 0) {
        Log.trace("logic value can't be '' or ' '");
        return false;
    }
    for (let eachLogic of logicValue) {
        // Log.trace(eachLogic);
        if (Object.keys(eachLogic) === null || Object.keys(eachLogic) === undefined
            || Object.keys(eachLogic).length === 0) {
            Log.trace("Logic value -> key  === null");
            return false;
        }
        if (!checkWhere(eachLogic)) { // tree structure, check where(filter) again
            Log.trace("check where fail in check login");
            return false;
        }
    }
    return true;
}

export function checkMcomparator (mcomparatorValue: any): boolean {
    Log.trace("Start checking Mcomparator");
    if (mcomparatorValue === null || mcomparatorValue === undefined || Array.isArray(mcomparatorValue)) {
        Log.trace("Mcomparator can't be null or undefined or array");
        return false;
    }
    if (typeof mcomparatorValue !== "object") {
        Log.trace("mcomparatorValue is not an object");
        return false;
    }
    let mKeylist: any[] = Object.keys(mcomparatorValue);
    if (mKeylist.length !== 1) {
        Log.trace("mcomparatorValue only have one key");
        return false;
    }
    let mKey = mKeylist[0];
    let idstring: string = mKey.split("_")[0]; // need to check idstring
    if (!checkidString(idstring)) {
        return false;
    }
    let mfield: string = mKey.split("_")[1];
    if (!(mfieldlist.includes(mfield))) {
        Log.trace("Not a valid mfield");
        return false;
    }
    if (typeof mcomparatorValue[mKey] !== "number") {
        Log.trace("the value of mkey should be number");
        return false;
    }
    return true;
}

export function checkScomparison(scomparisonValue: any): boolean {
    Log.trace("Start scomparison check");
    if (scomparisonValue === null || scomparisonValue === undefined || Array.isArray(scomparisonValue)) {
        Log.trace("scomparisonValue can't be null or undefined or array");
        return false;
    }
    if (typeof scomparisonValue !== "object") {
        Log.trace("scomparisonValue (IS) is not an object");
        return false;
    }
    let sKeylist: any = Object.keys(scomparisonValue);
    if (sKeylist.length !== 1) {
        Log.trace("IS should only have one sKey");
        return false;
    }
    let sKey = sKeylist[0];
    let idstring: string = sKey.split("_")[0];  // need to check idstring
    if (!checkidString(idstring)) {
        return false;
    }
    let sfield: string = sKey.split("_")[1];
    if (!(sfieldlist.includes(sfield))) {
        Log.trace("Not a valid sfield");
        return false;
    }
    let sKeyValue = scomparisonValue[sKey];
    if (typeof sKeyValue !== "string") {
        Log.trace(sKeyValue + ": " + typeof sKeyValue);
        Log.trace("key of Skey is not a string");
        return false;
    }
    if (sKeyValue.length === 0) {
        Log.trace("sKeyValue : \"\"");
        return true;
    }
    let temp = sKeyValue; // make a copy, don't modify the original data
    if (sKeyValue[0] === "*") {
        temp = temp.substring(1);
    }
    if (sKeyValue[sKeyValue.length - 1] === "*") {
        temp = temp.substring(0, temp.length - 1);
    }
    if (temp.indexOf("*") >= 0) {
        Log.trace("There are * in the middle of the string");
        return false;
    }
    return true;
}

export function checkWhere(where: any): boolean {
    let keys: any[] = Object.keys(where);
    // Log.trace(keys);
    if (keys.length === 0) {
        Log.trace("Where = {}");
        return true;
    } else if (keys.length > 1) {
        Log.trace("More than one key in WHERE, fail!");
        return false;
    }
    let firstKey = keys[0];
    if (logiclist.includes(firstKey)) { // if first key is AND/OR
        Log.trace("First key is in logic list, AND/OR");
        let logicValue = where[firstKey];
        if (!checkLogic(logicValue)) {
            return false;
        }
    } else if (mcomparator.includes(firstKey)) { // if first key is LT/GT/EQ
        Log.trace("First key is in mcomparator, LT/GT/EQ");
        let mcomparatorValue = where[firstKey];
        if (!checkMcomparator(mcomparatorValue) ) {
            return false;
        }
    } else if (scomparison.includes(firstKey)) { // if first key is "IS"
        Log.trace("First key is in scomparison, IS");
        let scomparisonValue = where[firstKey];
        if (!checkScomparison(scomparisonValue) ) {
            return false;
        }
    } else if (negation.includes(firstKey)) { // if first key is "NOT"
        Log.trace("First key is in negation, NOT");
        let negationValue = where[firstKey];
        if (!checkNegation(negationValue)) {
            return false;
        }
    } else {
        Log.trace("Not a valid key in Filter");
        return false;
    }
    return true;
}

export function checkidString(idstring: any): boolean {
    Log.trace("Enter check idString");
    if (idstring.length === 0 ) {
        return false;
    }
    if (idstring.includes("_")) {
        Log.trace("idstring should not have _");
        return false;
    }
    if (extractIDinWhere === "") {
        extractIDinWhere = idstring;
    }
    if (extractIDinWhere !== idstring) {
        Log.trace("Can not query more than one data set in Where!");
        return false;
    }
    return true;
}

export function checkNegation(negationValue: any): boolean {
    if (negationValue === null || negationValue === undefined || Array.isArray(negationValue)) {
        Log.trace("negationValue can't be null or undefined or array");
        return false;
    }
    if (typeof negationValue !== "object") {
        Log.trace("NOT is not a object");
        return false;
    }
    let notlist: any[] = Object.keys(negationValue);
    if (notlist.length === 0) {
        Log.trace("empty filter in negation");
        return false;
    }
    if (!checkWhere(negationValue)) {
        Log.trace("invalid filter in negation");
        return false;
    }
    return true;
}

