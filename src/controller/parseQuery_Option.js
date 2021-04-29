"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const checkQuery_Options_1 = require("./checkQuery_Options");
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
function sortingOrder(orderFlag, afterColumn) {
    if (orderFlag && checkQuery_Options_1.orderIsString) {
        Util_1.default.trace("orderID: " + checkQuery_Options_1.orderID);
        afterColumn.sort((a, b) => (a[checkQuery_Options_1.orderID] > b[checkQuery_Options_1.orderID] ? 1 : ((b[checkQuery_Options_1.orderID] > a[checkQuery_Options_1.orderID]) ? -1 : 0)));
    }
    else if (orderFlag && checkQuery_Options_1.orderIsObject) {
        Util_1.default.trace("orderIsObject in parseQuery");
        if (checkQuery_Options_1.dir === "UP") {
            afterColumn.sort(function (a, b) {
                for (let i of checkQuery_Options_1.orderList) {
                    if (a[i] > b[i]) {
                        return 1;
                    }
                    else if (a[i] < b[i]) {
                        return -1;
                    }
                    else {
                        continue;
                    }
                }
            });
        }
        else if (checkQuery_Options_1.dir === "DOWN") {
            afterColumn.sort(function (a, b) {
                for (let i of checkQuery_Options_1.orderList) {
                    if (a[i] < b[i]) {
                        return 1;
                    }
                    else if (a[i] > b[i]) {
                        return -1;
                    }
                    else {
                        continue;
                    }
                }
            });
        }
    }
    return afterColumn;
}
exports.sortingOrder = sortingOrder;
function filterDataColumn(afterColumn, result, columnset) {
    for (let i of result) {
        let temp = {};
        if (i["courses_numRows"]) {
            break;
        }
        for (let eachColumn of columnset) {
            temp[eachColumn] = i[eachColumn];
        }
        afterColumn.push(temp);
    }
    return afterColumn;
}
exports.filterDataColumn = filterDataColumn;
//# sourceMappingURL=parseQuery_Option.js.map