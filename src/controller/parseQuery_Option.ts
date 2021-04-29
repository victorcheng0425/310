import Log from "../Util";
import {orderID, extractColumn, readID, dir, orderIsObject, orderIsString,
    orderList} from "./checkQuery_Options";
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
let transformations: string[] = ["GROUP", "APPLY"];
let applytoken: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
let sortkey: string[] = ["dir", "keys"];

export function sortingOrder(orderFlag: any, afterColumn: any): any {
    if (orderFlag && orderIsString) {
        Log.trace("orderID: " + orderID);
        afterColumn.sort((a: any, b: any) => (a[orderID] > b[orderID] ? 1 : ((b[orderID] > a[orderID]) ? -1 : 0)));
    } else if (orderFlag && orderIsObject) {
        Log.trace("orderIsObject in parseQuery");
        if (dir === "UP") {
            afterColumn.sort(function (a: any, b: any) {
                for (let i of orderList) {
                    if (a[i] > b[i]) {
                        return 1;
                    } else if (a[i] < b[i]) {
                        return -1;
                    } else {
                        continue;
                    }
                }
            });
        } else if (dir === "DOWN") {
            afterColumn.sort(function (a: any, b: any) {
                for (let i of orderList) {
                    if (a[i] < b[i]) {
                        return 1;
                    } else if (a[i] > b[i]) {
                        return -1;
                    } else {
                        continue;
                    }
                }
            });
        }

    }
    return afterColumn;
}

export function filterDataColumn(afterColumn: any, result: any, columnset: any): any {
    for (let i of result) {
        let temp: any = {};
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
