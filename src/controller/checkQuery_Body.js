"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const checkQuery_Options_1 = require("./checkQuery_Options");
const checkQuery_Transformation_1 = require("./checkQuery_Transformation");
let mainKeylist = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
let mfieldlist = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
let sfieldlist = ["dept", "title", "instructor", "uuid", "id", "fullname", "shortname", "number", "name",
    "dept", "address", "type", "furniture", "href"];
let logiclist = ["AND", "OR"];
let mcomparator = ["LT", "GT", "EQ"];
let scomparison = ["IS"];
let negation = ["NOT"];
exports.tranExist = false;
let coursesField = ["avg", "pass", "fail", "audit", "year", "dept", "title", "instructor", "uuid", "id"];
let roomsField = ["lat", "lon", "seats", "fullname", "shortname", "number", "name",
    "address", "type", "furniture", "href"];
let flag = 0;
function basicCheckWhere(valueOfWhere) {
    if (valueOfWhere === null || valueOfWhere === undefined
        || Array.isArray(valueOfWhere) || typeof valueOfWhere === "string") {
        return false;
    }
    if (typeof valueOfWhere !== "object") {
        return false;
    }
    return true;
}
exports.basicCheckWhere = basicCheckWhere;
function checkQuery(query) {
    exports.extractIDinWhere = "";
    exports.tranExist = false;
    let fetchMainKey = Object.keys(query);
    for (let mainkey of fetchMainKey) {
        if (!(mainKeylist.includes(mainkey))) {
            return false;
        }
    }
    if (!(fetchMainKey.length === 2 || fetchMainKey.length === 3)) {
        return false;
    }
    if (!("WHERE" in query)) {
        return false;
    }
    let valueOfWhere = query["WHERE"];
    if (!basicCheckWhere(valueOfWhere)) {
        return false;
    }
    if (!checkWhere(valueOfWhere)) {
        return false;
    }
    if ("TRANSFORMATIONS" in query) {
        let valueOfTransformations = query["TRANSFORMATIONS"];
        if (!checkQuery_Transformation_1.checkTransformations(valueOfTransformations)) {
            return false;
        }
        exports.tranExist = true;
    }
    if (!("OPTIONS" in query)) {
        return false;
    }
    let valueOfOption = query["OPTIONS"];
    if (!checkQuery_Options_1.basicCheckOption(valueOfOption)) {
        return false;
    }
    Util_1.default.trace("basicCheckOption done");
    if (!checkQuery_Options_1.checkOption(valueOfOption)) {
        return false;
    }
    if (exports.tranExist && checkQuery_Transformation_1.groupID !== checkQuery_Options_1.readID && checkQuery_Options_1.readID !== null) {
        Util_1.default.trace("groupID !== readID");
        return false;
    }
    return true;
}
exports.checkQuery = checkQuery;
function checkLogic(logicValue) {
    Util_1.default.trace("Start Check Logic");
    if (!Array.isArray(logicValue)) {
        Util_1.default.trace("Logic Value is not array");
        return false;
    }
    if (logicValue.length === 0) {
        Util_1.default.trace("No filter, return false");
        return false;
    }
    if (logicValue.includes("") || logicValue.includes(" ") || Object.keys(logicValue[0]).length === 0) {
        Util_1.default.trace("logic value can't be '' or ' '");
        return false;
    }
    for (let eachLogic of logicValue) {
        if (Object.keys(eachLogic) === null || Object.keys(eachLogic) === undefined
            || Object.keys(eachLogic).length === 0) {
            Util_1.default.trace("Logic value -> key  === null");
            return false;
        }
        if (!checkWhere(eachLogic)) {
            Util_1.default.trace("check where fail in check login");
            return false;
        }
    }
    return true;
}
exports.checkLogic = checkLogic;
function checkMcomparator(mcomparatorValue) {
    Util_1.default.trace("Start checking Mcomparator");
    if (mcomparatorValue === null || mcomparatorValue === undefined || Array.isArray(mcomparatorValue)) {
        Util_1.default.trace("Mcomparator can't be null or undefined or array");
        return false;
    }
    if (typeof mcomparatorValue !== "object") {
        Util_1.default.trace("mcomparatorValue is not an object");
        return false;
    }
    let mKeylist = Object.keys(mcomparatorValue);
    if (mKeylist.length !== 1) {
        Util_1.default.trace("mcomparatorValue only have one key");
        return false;
    }
    let mKey = mKeylist[0];
    let idstring = mKey.split("_")[0];
    if (!checkidString(idstring)) {
        return false;
    }
    let mfield = mKey.split("_")[1];
    if (!(mfieldlist.includes(mfield))) {
        Util_1.default.trace("Not a valid mfield");
        return false;
    }
    if (typeof mcomparatorValue[mKey] !== "number") {
        Util_1.default.trace("the value of mkey should be number");
        return false;
    }
    return true;
}
exports.checkMcomparator = checkMcomparator;
function checkScomparison(scomparisonValue) {
    Util_1.default.trace("Start scomparison check");
    if (scomparisonValue === null || scomparisonValue === undefined || Array.isArray(scomparisonValue)) {
        Util_1.default.trace("scomparisonValue can't be null or undefined or array");
        return false;
    }
    if (typeof scomparisonValue !== "object") {
        Util_1.default.trace("scomparisonValue (IS) is not an object");
        return false;
    }
    let sKeylist = Object.keys(scomparisonValue);
    if (sKeylist.length !== 1) {
        Util_1.default.trace("IS should only have one sKey");
        return false;
    }
    let sKey = sKeylist[0];
    let idstring = sKey.split("_")[0];
    if (!checkidString(idstring)) {
        return false;
    }
    let sfield = sKey.split("_")[1];
    if (!(sfieldlist.includes(sfield))) {
        Util_1.default.trace("Not a valid sfield");
        return false;
    }
    let sKeyValue = scomparisonValue[sKey];
    if (typeof sKeyValue !== "string") {
        Util_1.default.trace(sKeyValue + ": " + typeof sKeyValue);
        Util_1.default.trace("key of Skey is not a string");
        return false;
    }
    if (sKeyValue.length === 0) {
        Util_1.default.trace("sKeyValue : \"\"");
        return true;
    }
    let temp = sKeyValue;
    if (sKeyValue[0] === "*") {
        temp = temp.substring(1);
    }
    if (sKeyValue[sKeyValue.length - 1] === "*") {
        temp = temp.substring(0, temp.length - 1);
    }
    if (temp.indexOf("*") >= 0) {
        Util_1.default.trace("There are * in the middle of the string");
        return false;
    }
    return true;
}
exports.checkScomparison = checkScomparison;
function checkWhere(where) {
    let keys = Object.keys(where);
    if (keys.length === 0) {
        Util_1.default.trace("Where = {}");
        return true;
    }
    else if (keys.length > 1) {
        Util_1.default.trace("More than one key in WHERE, fail!");
        return false;
    }
    let firstKey = keys[0];
    if (logiclist.includes(firstKey)) {
        Util_1.default.trace("First key is in logic list, AND/OR");
        let logicValue = where[firstKey];
        if (!checkLogic(logicValue)) {
            return false;
        }
    }
    else if (mcomparator.includes(firstKey)) {
        Util_1.default.trace("First key is in mcomparator, LT/GT/EQ");
        let mcomparatorValue = where[firstKey];
        if (!checkMcomparator(mcomparatorValue)) {
            return false;
        }
    }
    else if (scomparison.includes(firstKey)) {
        Util_1.default.trace("First key is in scomparison, IS");
        let scomparisonValue = where[firstKey];
        if (!checkScomparison(scomparisonValue)) {
            return false;
        }
    }
    else if (negation.includes(firstKey)) {
        Util_1.default.trace("First key is in negation, NOT");
        let negationValue = where[firstKey];
        if (!checkNegation(negationValue)) {
            return false;
        }
    }
    else {
        Util_1.default.trace("Not a valid key in Filter");
        return false;
    }
    return true;
}
exports.checkWhere = checkWhere;
function checkidString(idstring) {
    Util_1.default.trace("Enter check idString");
    if (idstring.length === 0) {
        return false;
    }
    if (idstring.includes("_")) {
        Util_1.default.trace("idstring should not have _");
        return false;
    }
    if (exports.extractIDinWhere === "") {
        exports.extractIDinWhere = idstring;
    }
    if (exports.extractIDinWhere !== idstring) {
        Util_1.default.trace("Can not query more than one data set in Where!");
        return false;
    }
    return true;
}
exports.checkidString = checkidString;
function checkNegation(negationValue) {
    if (negationValue === null || negationValue === undefined || Array.isArray(negationValue)) {
        Util_1.default.trace("negationValue can't be null or undefined or array");
        return false;
    }
    if (typeof negationValue !== "object") {
        Util_1.default.trace("NOT is not a object");
        return false;
    }
    let notlist = Object.keys(negationValue);
    if (notlist.length === 0) {
        Util_1.default.trace("empty filter in negation");
        return false;
    }
    if (!checkWhere(negationValue)) {
        Util_1.default.trace("invalid filter in negation");
        return false;
    }
    return true;
}
exports.checkNegation = checkNegation;
//# sourceMappingURL=checkQuery_Body.js.map