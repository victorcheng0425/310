"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const checkQuery_Body_1 = require("./checkQuery_Body");
const checkQuery_Transformation_1 = require("./checkQuery_Transformation");
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
let sortkey = ["dir", "keys"];
exports.orderFlag = false;
exports.orderIsString = false;
exports.orderIsObject = false;
function basicCheckOption(valueOfOption) {
    Util_1.default.trace("basicCheckOption");
    if (typeof valueOfOption !== "object") {
        Util_1.default.trace("Option is not a Object");
        return false;
    }
    if (valueOfOption === null || valueOfOption === undefined
        || Array.isArray(valueOfOption) || typeof valueOfOption === "string") {
        Util_1.default.trace("Option cannot be array or string or null or undefined");
        return false;
    }
    return true;
}
exports.basicCheckOption = basicCheckOption;
function checkOrderObject(orderValue, optionValue) {
    Util_1.default.trace("checkOrderObject");
    let sort = Object.keys(orderValue);
    if (sort.length !== 2) {
        return false;
    }
    for (let skey of sort) {
        if (!sortkey.includes(skey)) {
            Util_1.default.trace(skey);
            Util_1.default.trace(sortkey);
            Util_1.default.trace("Invalid sort key");
            return false;
        }
    }
    let localDir = orderValue["dir"];
    if (!direction.includes(localDir)) {
        Util_1.default.trace("No such direction");
        return false;
    }
    let localkeys = orderValue["keys"];
    if (!Array.isArray(localkeys)) {
        Util_1.default.trace("keys in sorting is not an array");
        return false;
    }
    if (localkeys.length === 0) {
        Util_1.default.trace("empty array in sorting key");
        return false;
    }
    for (let i of localkeys) {
        if (!optionValue.includes(i)) {
            Util_1.default.trace("No such sorting keys in column");
            return false;
        }
        exports.orderList.push(i);
    }
    exports.dir = localDir;
    exports.orderIsObject = true;
    return true;
}
exports.checkOrderObject = checkOrderObject;
function checkOrder(orderValue, optionValue) {
    if (Array.isArray(orderValue) || typeof orderValue === "number"
        || orderValue === null || orderValue === undefined || Object.keys(orderValue).length === 0) {
        Util_1.default.trace("Order Value can only be string or object");
        return false;
    }
    if (typeof orderValue === "string") {
        if (!optionValue.includes(orderValue)) {
            Util_1.default.trace("No order value in Column");
            return false;
        }
        Util_1.default.trace(optionValue);
        exports.orderID = orderValue;
        exports.orderIsString = true;
    }
    else if (typeof orderValue === "object") {
        if (!checkOrderObject(orderValue, optionValue)) {
            Util_1.default.trace("checkOrderObject failed");
            return false;
        }
    }
    Util_1.default.trace("In check order - readID: " + exports.readID + ", OrderID: ", exports.orderID);
    if (exports.orderID !== "" && exports.readID !== exports.orderID.split("_")[0] && exports.orderID.split("_")[1] !== undefined) {
        Util_1.default.trace("Order ID is not equal to Column ID");
        return false;
    }
    exports.orderFlag = true;
    Util_1.default.trace("Done checkOrder");
    return true;
}
exports.checkOrder = checkOrder;
function checkColumn(optionValue) {
    if (!(Array.isArray(optionValue))) {
        Util_1.default.trace("Columns should be an array!");
        return false;
    }
    if (optionValue.length === 0) {
        Util_1.default.trace("Columns should not be empty list");
        return false;
    }
    for (let colVal of optionValue) {
        if (typeof colVal !== "string") {
            Util_1.default.trace("Column value is not a String!");
            return false;
        }
        if (!(colVal.indexOf("_") === -1)) {
            let idstring = colVal.split("_")[0];
            if (!checkQuery_Body_1.checkidString(idstring)) {
                Util_1.default.trace("idstring not valid");
                return false;
            }
            let key = colVal.split("_")[1];
            if (colVal.split("_")[2] === "") {
                Util_1.default.trace("idstring_m/skey_ not allowed, extra underscore");
                return false;
            }
            if (!sfieldlist.includes(key) && !mfieldlist.includes(key)) {
                Util_1.default.trace("Not a valid key, not in sfield or mfield!");
                return false;
            }
            if (checkQuery_Body_1.tranExist === true) {
                if (!checkQuery_Transformation_1.extractGroup.includes(colVal)) {
                    Util_1.default.trace("This column not in extractGroup");
                    return false;
                }
            }
        }
        else {
            if (checkQuery_Body_1.tranExist === true) {
                if (!checkQuery_Transformation_1.applyKey.includes(colVal)) {
                    Util_1.default.trace("This column not in applykey");
                    return false;
                }
            }
            else {
                return false;
            }
        }
    }
    exports.extractColumn = optionValue;
    return true;
}
exports.checkColumn = checkColumn;
function checkOption(option) {
    exports.orderID = "";
    exports.readID = "";
    exports.extractColumn = [];
    exports.dir = "";
    exports.orderFlag = false;
    exports.orderIsObject = false;
    exports.orderIsString = false;
    exports.orderList = [];
    let optionKeys = Object.keys(option);
    if (optionKeys.length === 0 || optionKeys.length > 2) {
        Util_1.default.trace("Option = {} or Option has more than 2 keys");
        return false;
    }
    for (let key of optionKeys) {
        if (!(optionlist.includes(key))) {
            Util_1.default.trace("Invalid option key");
            return false;
        }
    }
    if (!("COLUMNS" in option)) {
        Util_1.default.trace("No column in OPTION");
        return false;
    }
    let optionValue = option["COLUMNS"];
    if (!checkColumn(optionValue)) {
        return false;
    }
    let tempid = getReadID(optionValue);
    if (!checkColumnIDIfDifferentID(tempid, optionValue)) {
        Util_1.default.trace("fail checkColumnID if different ID");
        return false;
    }
    exports.readID = tempid;
    if ("ORDER" in option) {
        let orderValue = option["ORDER"];
        if (!checkOrder(orderValue, optionValue)) {
            return false;
        }
    }
    Util_1.default.trace("Done Check Option");
    return true;
}
exports.checkOption = checkOption;
function getReadID(optionValue) {
    for (let col of optionValue) {
        if (!(col.indexOf("_") === -1)) {
            let colID = col.split("_")[0];
            return colID;
        }
    }
    return null;
}
exports.getReadID = getReadID;
function checkColumnIDIfDifferentID(tempid, optionValue) {
    Util_1.default.trace("checkColumnIDIfDifferentID");
    if (tempid === null && checkQuery_Body_1.tranExist) {
        Util_1.default.trace("tempid === null && tranExist");
        return true;
    }
    for (let col of optionValue) {
        if (!(col.indexOf("_") === -1)) {
            let colID = col.split("_")[0];
            if (!(colID === tempid)) {
                Util_1.default.trace("Multiple different ID in col");
                return false;
            }
        }
        else {
            if (!checkQuery_Body_1.tranExist) {
                Util_1.default.trace("No tranExist, but col has no _");
                return false;
            }
        }
    }
    Util_1.default.trace("Done checkColumnIDIfDifferentID");
    return true;
}
exports.checkColumnIDIfDifferentID = checkColumnIDIfDifferentID;
//# sourceMappingURL=checkQuery_Options.js.map