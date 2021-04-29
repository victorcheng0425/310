"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
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
let transformationsList = ["GROUP", "APPLY"];
let applytoken = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
let numerictoken = ["MAX", "MIN", "AVG", "SUM"];
let sortkey = ["dir", "keys"];
function basicCheckTransformation(transform) {
    Util_1.default.trace("Basic Check Transformation");
    if (typeof transform !== "object") {
        Util_1.default.trace("Transformation is not a Object");
        return false;
    }
    if (transform === null || transform === undefined
        || Array.isArray(transform) || typeof transform === "string") {
        Util_1.default.trace("Transformation cannot be array or string or null or undefined");
        return false;
    }
    return true;
}
exports.basicCheckTransformation = basicCheckTransformation;
function checkTransformations(transform) {
    exports.groupID = "";
    exports.applyID = "";
    exports.extractGroup = [];
    exports.applyKey = [];
    Util_1.default.trace("checkTransformations!");
    if (!basicCheckTransformation(transform)) {
        Util_1.default.trace("transformation basic check failed");
        return false;
    }
    let tranKeys = Object.keys(transform);
    if (tranKeys.length !== 2) {
        Util_1.default.trace("Transformation keys length should be 2");
        return false;
    }
    for (let key of tranKeys) {
        if (!(transformationsList.includes(key))) {
            Util_1.default.trace("Invalid Transformation key, should be either GROUP/APPLY");
            return false;
        }
    }
    if (!("GROUP" in transform)) {
        Util_1.default.trace("No GROUP in Transformation");
        return false;
    }
    let groupValue = transform["GROUP"];
    Util_1.default.trace("Checkgroup in checkquery");
    if (!checkGroup(groupValue)) {
        return false;
    }
    if (!("APPLY" in transform)) {
        Util_1.default.trace("No Apply in Transformation");
        return false;
    }
    Util_1.default.trace("Checkgroup in checkApply");
    let applyValue = transform["APPLY"];
    if (!checkApply(applyValue)) {
        return false;
    }
    return true;
}
exports.checkTransformations = checkTransformations;
function checkGroup(groupValue) {
    Util_1.default.trace(groupValue);
    if (!(Array.isArray(groupValue)) || groupValue === null || groupValue === undefined) {
        return false;
    }
    if (groupValue.length === 0) {
        Util_1.default.trace("Group should not be empty list");
        return false;
    }
    for (let gpval of groupValue) {
        if (typeof gpval !== "string") {
            Util_1.default.trace("Group value is not a String!");
            return false;
        }
        if (!(gpval.indexOf("_") === -1)) {
            let idstring = gpval.split("_")[0];
            if (!checkidStringOrApplyKey(idstring)) {
                Util_1.default.trace("idstring not valid");
                return false;
            }
            let key = gpval.split("_")[1];
            if (gpval.split("_")[2] !== undefined && gpval.split("_")[2].length >= 0) {
                Util_1.default.trace("idstring_m/skey_ not allowed, extra underscore");
                return false;
            }
            if (!sfieldlist.includes(key) && !mfieldlist.includes(key)) {
                Util_1.default.trace("Not a valid key, not in sfield or mfield!");
                return false;
            }
        }
        else {
            Util_1.default.trace("Group value do not have _ , it's invalid");
            return false;
        }
    }
    let tempid = groupValue[0].split("_")[0];
    for (let gp of groupValue) {
        if (!(gp.indexOf("_") === -1)) {
            let gpID = gp.split("_")[0];
            if (!(gpID === tempid)) {
                Util_1.default.trace("Multiple different ID in group");
                return false;
            }
        }
        else {
            return false;
        }
    }
    exports.extractGroup = groupValue;
    exports.groupID = tempid;
    return true;
}
exports.checkGroup = checkGroup;
function checkApply(applyValue) {
    if (!(Array.isArray(applyValue)) || applyValue === null || applyValue === undefined) {
        Util_1.default.trace("Apply should be an array!");
        return false;
    }
    for (let applyrule of applyValue) {
        if (typeof applyrule !== "object") {
            Util_1.default.trace("APPLYRULE is not a Object");
            return false;
        }
        if (applyrule === null || applyrule === undefined
            || Array.isArray(applyrule) || typeof applyrule === "string") {
            Util_1.default.trace("APPLYRULE is null");
            return false;
        }
        if (!checkApplyRule(applyrule)) {
            Util_1.default.trace("Invalid APPLYRULE");
            return false;
        }
    }
    Util_1.default.trace("Done checkApply");
    return true;
}
exports.checkApply = checkApply;
function checkApplyRule(applyrule) {
    let key = Object.keys(applyrule);
    if (key.length !== 1) {
        Util_1.default.trace("More than one key in ApplyRule is not allowed");
        return false;
    }
    key = key[0];
    if (!checkidStringOrApplyKey(key)) {
        Util_1.default.trace("invalid apply key.");
        return false;
    }
    if (exports.applyKey.includes(key)) {
        Util_1.default.trace("applykey existed.");
        return false;
    }
    let applykeyVal = applyrule[key];
    if (!checkApplyToken(applykeyVal)) {
        Util_1.default.trace("checkApplyToken Failed");
        return false;
    }
    exports.applyKey.push(key);
    Util_1.default.trace("Done checkApply Rule");
    return true;
}
exports.checkApplyRule = checkApplyRule;
function basicCheckApplyToken(applykeyVal) {
    Util_1.default.trace("basicCheckApplyToken");
    if (typeof applykeyVal !== "object" || applykeyVal === null || applykeyVal === undefined) {
        Util_1.default.trace("applykey value is not an Object");
        return false;
    }
    if (typeof applykeyVal === null || applykeyVal === undefined
        || Array.isArray(applykeyVal) || typeof applykeyVal === "string") {
        Util_1.default.trace("applykey value is null");
        return false;
    }
    return true;
}
exports.basicCheckApplyToken = basicCheckApplyToken;
function checkApplyToken(applykeyVal) {
    if (!basicCheckApplyToken(applykeyVal)) {
        Util_1.default.trace("basicCheckApplyToken failed");
        return false;
    }
    let token = Object.keys(applykeyVal);
    if (token.length !== 1) {
        Util_1.default.trace("More than one key in ApplyToken is not allowed");
        return false;
    }
    token = token[0];
    if (!applytoken.includes(token)) {
        Util_1.default.trace("Invalid applytoken");
        return false;
    }
    let applytokenVal = applykeyVal[token];
    if (typeof applytokenVal !== "string") {
        Util_1.default.trace("applytoken value is not a string");
        return false;
    }
    if (applytokenVal.indexOf("_") === -1) {
        Util_1.default.trace("apply token value should have _");
        return false;
    }
    let idstring = applytokenVal.split("_")[0];
    let field = applytokenVal.split("_")[1];
    if (!sfieldlist.includes(field) && !mfieldlist.includes(field)) {
        Util_1.default.trace("Not a valid field, not in sfield or mfield!");
        return false;
    }
    if (!checkidStringOrApplyKey(idstring)) {
        Util_1.default.trace("idstring not valid, (checkidStringOrApplyKey)");
        return false;
    }
    if (!checkGroupIDandApplyID(idstring)) {
        Util_1.default.trace("CheckGroupIDandApplyID failed");
        return false;
    }
    if (numerictoken.includes(token)) {
        if (!mfieldlist.includes(field)) {
            Util_1.default.trace("MAX/MIN/SUM/AVG applied on non numeric fields");
            return false;
        }
    }
    Util_1.default.trace("Done check Apply Token");
    return true;
}
exports.checkApplyToken = checkApplyToken;
function checkGroupIDandApplyID(idstring) {
    Util_1.default.trace("CheckGroupIDandApplyID");
    if (idstring !== exports.groupID) {
        Util_1.default.trace("Different groupID and applyID");
        return false;
    }
    if (exports.applyID === "") {
        exports.applyID = idstring;
    }
    if (exports.applyID !== idstring) {
        Util_1.default.trace("applyID !== idstring");
        return false;
    }
    Util_1.default.trace("Done CheckGroupIDandApplyID");
    return true;
}
exports.checkGroupIDandApplyID = checkGroupIDandApplyID;
function checkidStringOrApplyKey(idstring) {
    Util_1.default.trace("Enter check idString");
    Util_1.default.trace(idstring);
    if (idstring.length === 0) {
        Util_1.default.trace("idstring should have at least one char");
        return false;
    }
    if (idstring.includes("_")) {
        Util_1.default.trace("idstring should not have _");
        return false;
    }
    Util_1.default.trace("finish checkidStringOrApplyKey");
    return true;
}
exports.checkidStringOrApplyKey = checkidStringOrApplyKey;
//# sourceMappingURL=checkQuery_Transformation.js.map